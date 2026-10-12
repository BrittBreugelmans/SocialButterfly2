# Research: F10 — Settings & Data

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

All paths are relative to `app/src/` unless stated otherwise.

## R1 — CSV format

**Decision**:

- Separator `;` (B39). Rows end with CRLF (`\r\n`), as in RFC 4180.
- The file starts with a UTF-8 byte order mark (`﻿`).
- A cell is wrapped in double quotes when it contains `;`, `"`, `\r` or `\n`, or has a space at
  the start or end. A `"` inside becomes `""`. Line breaks in notes stay inside the quoted cell.
- **Formula guard (FR-006)**: a cell that starts with `=`, `+`, `-`, `@`, a tab or `\r` gets a
  leading apostrophe (`'`) and is quoted.
- Header row, in this order (FR-004): `name;company;profileUrl;searchUrl;connectionStatus;encounterDate;eventName;eventStartDate;eventEndDate;note`.
- Dates as `YYYY-MM-DD`. Connection status as `connected` / `notConnected` (spec Assumptions).
- Row order: encounter date newest first, then Person name (`localeCompare`, accents count), then
  `createdAt`. After that, one row per Event without Encounters (only the event columns), newest
  start date first.
- File name: `sociale-vlinder-<today local>.csv` (FR-007). It is the same in both languages.

**Rationale**:

- Without the BOM, Excel on Mac and Windows reads the file as Windows-1252: "Brüssel" comes out
  garbled. Numbers and Google Sheets ignore the BOM.
- Excel with Belgian settings uses `;` as its list separator, so the file opens straight into
  columns (B39). Numbers detects `;` by itself.
- Without the guard, Excel reads a note like "- talked about AI" as a formula and shows `#NAME?`.
  A note like `=HYPERLINK(...)` could even run as a formula (CSV injection, OWASP). The apostrophe
  is the OWASP advice. The price is a visible `'` before such cells; the text itself stays whole.
- Newest first matches how the owner thinks: "who did I meet last?".

**Alternatives considered**:

- Comma separator: rejected by Britt (B39).
- No BOM: accents break in Excel.
- Formula guard with a leading space: Excel trims it on import, so the formula is back.
- No guard: `#NAME?` in Excel for every note that starts with "-".

## R2 — Getting the file onto the iPhone

**Decision**: the Web Share API with a file (`navigator.share({ files: [file] })`). The iPhone
then shows the share sheet with "Save to Files", AirDrop, Mail and Numbers. The CSV file is
**prepared in advance** (R3), so the tap calls `navigator.share` right away, with no `await`
before it. A new helper `platform/shareFile.ts` returns one of four results:

| Result | When | Last backup |
|---|---|---|
| `'shared'` | The `share()` promise resolves. | Recorded (FR-008) |
| `'cancelled'` | It rejects with `AbortError`: the sheet was closed. | Not changed (edge case) |
| `'failed'` | Any other error, for example `NotAllowedError`. | Not changed; message `backup.failed` |
| `'downloaded'` | `navigator.canShare({ files })` is missing or false (laptop browser). The file is downloaded through an `<a download>` link. | Recorded. The browser does not report a cancel. |

**Rationale**:

- iOS 15+ supports sharing files from a home-screen app. It is the only way to reach "Save to
  Files" and to learn whether the owner cancelled.
- Safari only allows `share()` right after a tap (user activation). Reading the database first
  (`await`) can use up that permission, and then `share()` fails with `NotAllowedError`.
  Preparing the file in advance avoids this, at no extra tap (SC-001).
- On iOS, `<a download>` in a home-screen app opens a preview without a clear way back. So it is
  only the fallback for the laptop (testing, preview builds).

**Alternatives considered**:

- Build the file in the tap handler, then share: risks `NotAllowedError` on iOS.
- Two steps ("Prepare" → "Save"): an extra tap, and still the same file.
- `mailto:` or a server upload: against constitution IV and T1.

**Cancel inside the Files picker** (wiki B42, 2026-10-12): it must **not** count as a backup;
the last backup time stays as it was. The app only learns what iOS reports. If iOS rejects the
share (or returns to the share sheet, which the owner then closes), the result is `'cancelled'`
and this already holds. If iOS resolves the share after a cancel in Files, the web app cannot
tell it apart from a real save. That would need a new decision. Check on the iPhone with
[quickstart.md](quickstart.md) section 3.6.

## R3 — The snapshot and the last-backup time

**Decision**: a new `readBackupSnapshot()` in `data/repository.ts` reads Persons, Encounters and
Events in **one read transaction**, and returns them with `takenAt = nowIso()` taken just
before. The hook `backup/useBackup.ts` keeps one prepared snapshot and CSV `File`. It rebuilds
them when it mounts and after every `onDataChanged` (several writes in a row → one rebuild, as
in `useOpenActionCount`). After a `'shared'` or `'downloaded'` result, `recordBackup(takenAt)`
stores **the snapshot time**, not the time the share sheet closed. It never moves
`lastBackupAt` back in time.

**Rationale**:

- One transaction means the file is consistent: no Encounter without its Person.
- A write that lands while the share sheet is open is not in the file. Its `updatedAt` is after
  `takenAt`, so the reminder still sees it (B40). Using the share-close time would hide it.
- A write between `takenAt` and the start of the transaction ends up in the file *and* counts as
  "after the backup". That gives at most one extra reminder, never a lost one.
- 500 Persons with 1 000 Encounters read and format in well under 100 ms (F7 measured the
  contact list with the same data), so rebuilding after each change is cheap.

**Alternatives considered**: reading per table without a transaction (can be inconsistent);
recording `nowIso()` after the share (hides changes made meanwhile).

## R4 — When the backup reminder is due

**Decision**: a pure function `isBackupReminderDue(snapshot, settings, today)` in
`backup/reminder.ts`. With `B = settings.lastBackupAt`, it is true when
`settings.backupReminderLaterOn !== today` and at least one of these holds:

1. **New Encounters** (T10, T11, FR-009): an Encounter with `createdAt > B` (all Encounters when
   `B` is absent) and
   - with an Event whose `endDate < today`, or
   - without an Event and with `date < today`.
2. **Changes** (B40, FR-009a), only when `B` is set and the active Event is not running today:
   a Person, Encounter or Event with `createdAt ≤ B < updatedAt` and
   `localDateOf(updatedAt) < today`.

Deleted records are gone, so they never count. Settings and dismissed Actions are not in the
backup and never count. The banner shows on the Add tab (`StartScreen`) while `due` is true. It is
evaluated on mount, after every `onDataChanged`, and when the app returns to the foreground.

**Rationale**:

- Rule 1 is T10/T11 exactly, extended to every Event and not only the active one. An Event that
  ended while another one is now active still has unsaved Encounters.
- Rule 2 only looks at records that existed at the last backup. New records follow rule 1, so an
  Encounter of a running Event never triggers early through rule 2.
- "While the active Event is running" follows "never during the Event" (T10, B40).
- Showing it while `due` is true is simpler than "only on the first open". "Later" still hides
  it for the rest of the day (FR-011).

**Alternatives considered**: storing a "dirty" flag on every write (easy to miss a write path);
checking only `countEncountersSince` (misses B40).

## R5 — Deleting an Event that has Encounters (B38)

**Decision**: `deleteEvent(id)` changes. In **one transaction** it:

1. removes `eventId` from every Encounter of that Event and sets their `updatedAt`;
2. deletes the Event;
3. switches to casual networking if it was the active Event (as now).

`EventInUseError` is removed. Diagnostics' "Remove test data" then only deletes test Events that
have no Encounters left (`listEncountersByEvent`). That way a test Event used by real Encounters
stays, as it does today.

A Person can end up with two casual Encounters on the same day (one moved, one already casual).
Both stay: B19 is a rule for adding, and merging them here would join two notes without asking.

**Rationale**: nothing is lost (constitution IX). The new `updatedAt` makes the reminder count the
change (B40), so the next backup shows them without an Event.

**Alternatives considered**: a separate `detachAndDeleteEvent` next to the strict `deleteEvent`
(two ways to delete, and the old one has no caller left); folding same-day Encounters (B19) here
(changes notes without asking).

## R6 — Delete all data

**Decision**: a new `deleteAllData()` clears `persons`, `encounters`, `events` and `dismissals`,
and replaces the Settings record with `{ key, language, updatedAt }`. All in one transaction. The
database itself stays (no `db.delete()`). `onDataChanged` fires, and the Actions badge drops to 0.
Then `App` calls `recheck()` and goes to the Add tab. Because `contextChosenOn` is gone, the daily
choice appears, as on a first start (US5 scenario 5).

**Rationale**:

- One transaction: all of it, or nothing.
- `db.delete()` closes the connection, and every open hook would then need a reload. Clearing the
  tables keeps the schema and the connection.

**Alternatives considered**: `db.delete()` + `location.reload()` (heavier, and it flashes the
offline screen on a weak connection).

## R7 — The Settings tab

**Decision**:

- A new `ui/SettingsTab.tsx` replaces `ComingSoon`. `ComingSoon.tsx` and the `soon.*` keys go:
  nothing uses them any more.
- Sections, top to bottom: Backup, Events, Language, Delete all data, then the version label.
  Backup comes first: it is the action that matters most, and the one the reminder points to.
- **Events**: a list (`settings/eventList.ts`, pure: Encounter count per Event). Tapping an Event
  opens `ui/EditEventForm.tsx` inside the tab, with the tab bar still visible. It has the same
  fields and date rule as `NewEventForm`, plus "Delete event".
- **Language**: the switch moves out of `StartScreen` into a small `ui/LanguageSwitch.tsx`, used
  by Settings (FR-002).
- **Diagnostics**: the long press on the version label moves with it. It works as now.

**Rationale**: the order follows the spec (FR-001). An edit form of its own is easier to read than
one `NewEventForm` with modes, since saving works differently: an edited Event never becomes
active.

**Alternatives considered**: a "mode" prop on `NewEventForm` (mixes two flows); a separate Events
screen without the tab bar (one more way back to build).

## R8 — The context bar after editing or deleting an Event

**Decision**: `App` also reloads the active Event when the **tab** changes (`tab` in the deps of
the effect that loads it).

**Rationale**: today it reloads only when `screen` changes. After renaming or deleting the active
Event in Settings, the Add tab would show the old name until the next flow.

## R9 — Typing the word for delete all data (B41)

**Decision**: `deleteAll.word` is `WISSEN` (nl) / `DELETE` (en), following the app language. The
button is enabled when `input.trim().toLocaleUpperCase() === t('deleteAll.word')`. The field has
`autoCapitalize="characters"`, `autoComplete="off"` and `autoCorrect="off"`.

**Rationale**: case and spaces around the word do not matter (FR-018). Capitals on the iPhone
keyboard save a tap; autocorrect would otherwise turn "WISSEN" into "Wissen" or another word.

## R10 — Showing the last backup time

**Decision**: `Intl.DateTimeFormat` with `nl-BE` / `en-GB` (as `formatDateRange`), with date and
time: "12 okt. 2026, 14:05". Without a backup: `backup.never`.

## R11 — Dependencies and schema

**Decision**: **no new library** and **no schema version change**. `Settings` gets one optional
field, `backupReminderLaterOn`, with no index. The CSV is built in a small module of its own
(about 40 lines).

**Rationale**: constitution II and X (YAGNI). A CSV library (for example papaparse, about 20 kB)
adds nothing for writing one well-defined table.
