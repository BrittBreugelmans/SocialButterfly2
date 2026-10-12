---

description: "Task list for F10 — Settings & Data"
---

# Tasks: F10 — Settings & Data

**Input**: Design documents from `specs/009-settings-data/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `backup-csv.test.ts`, `backup-reminder.test.ts`,
`settings-repository.test.ts`, `share-file.test.ts`, `settings-ui.test.tsx`), as in F0–F9. Two
more test files are split off so work can run in parallel: `use-backup.test.tsx` (the hook) and
`backup-reminder-ui.test.tsx` (the banner on the Add tab). The iPhone share sheet, Numbers and
Excel are checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US5 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F9 rules still apply ([../008-my-qr/tasks.md](../008-my-qr/tasks.md), "Ground rules"):
  - use the terms from `wiki/begrippen.md`; every text goes through `t()`;
  - the UI talks to storage only through `app/src/data/repository.ts`;
  - every write runs inside `withStorageErrors()`;
  - a `StorageFullError` is left to the F0 banner; any other error is rethrown.
- **No schema change**: `app/src/data/db.ts` is not edited. `backupReminderLaterOn` is a
  non-indexed field on `Settings` (data-model, research R11).
- **No new dependency**: `app/package.json` does not change (R11).
- **Nothing leaves the device by itself** (FR-003, constitution IV): no `fetch`, no external URL.
  The file only goes where the owner sends it from the share sheet.
- **`share()` straight from the tap** (research R2): the file is prepared in advance. Between the
  tap and `navigator.share(...)` there is no `await`.
- **Deleting never loses an Encounter by accident** (constitution IX): deleting an Event keeps its
  Encounters (B38). Only "Delete all data" removes them, behind the typed word (B41).
- UI tests follow `app/tests/my-qr-ui.test.tsx` and `app/tests/actions-ui.test.tsx`:
  - render `<LanguageProvider><App /></LanguageProvider>`;
  - call `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`;
  - get texts via `nl['…']`;
  - the Settings tab is reached with `user.click(screen.getByRole('button', { name: nl['tab.settings'] }))`.
- **Share mocks**: jsdom has no `navigator.share` / `canShare`. Define them with
  `Object.defineProperty(navigator, 'share', { value: vi.fn(), configurable: true })` (same for
  `canShare`), and delete them in `afterEach`. `URL.createObjectURL` / `revokeObjectURL` are
  stubbed with `vi.fn()` where the download fallback runs.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F9 baseline is green (344 tests) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the new Settings field, all texts, and an empty Settings tab with the version label
and Diagnostics moved into it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add to `Settings` in `app/src/data/types.ts` per [contracts/storage-api.md](contracts/storage-api.md): `/** Local date (YYYY-MM-DD) on which the owner tapped "Later" on the backup reminder (F10). */ backupReminderLaterOn?: string`. Also update the comment on `lastBackupAt` to: `/** ISO 8601 UTC. takenAt of the snapshot in the last finished CSV backup (F10, research R3). Never moves back in time. */`.
- [X] T003 [P] Add all new text keys from [contracts/screens.md](contracts/screens.md) "Text keys" to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word, in a `// F10 — Settings & data` block. The keys are:
  - `settings.*` (6): `title`, `events`, `eventsEmpty`, `eventActive`, `encounterCountOne`, `encounterCountMany`;
  - `event.*` (7): `editTitle`, `saveChanges`, `delete`, `deleteQuestion`, `deleteKeepsOne`, `deleteKeepsMany`, `deleteConfirm`;
  - `backup.*` (6): `title`, `make`, `last`, `never`, `done`, `failed`;
  - `reminder.*` (3): `text`, `make`, `later`;
  - `deleteAll.*` (7): `button`, `question`, `counts`, `backupFirst`, `typeWord`, `word`, `confirm`.

  Remove `soon.title` and `soon.settings` (they become unused in T004).
- [X] T004 Create `app/src/ui/SettingsTab.tsx` and wire it into `app/src/App.tsx`, replacing `<ComingSoon textKey="soon.settings" />` for tab `settings`. Then delete `app/src/ui/ComingSoon.tsx` and its import.
  - Props: `storageStatus: StorageStatus | 'checking'` and `onAllDataDeleted(): void`. For now, `App` passes `onAllDataDeleted={() => { recheck(); toStart() }}`.
  - Render `<main className="settings-tab">` with `<h1>{t('settings.title')}</h1>`. Then four empty `<section>`s, each with an `<h2>`, in this order (research R7): `backup.title`, `settings.events`, `app.languageSwitch`, `deleteAll.button`. The user stories fill them in.
  - Update `app/tests/tabs-ui.test.tsx`: no tab shows "coming soon" any more, and Settings shows the heading `nl['settings.title']`.
- [X] T005 Move the version label and Diagnostics from `app/src/ui/StartScreen.tsx` to the bottom of `app/src/ui/SettingsTab.tsx` (FR-002). Move the long-press code as it is: `LONG_PRESS_MS`, `pressTimer`, `startPress` / `cancelPress`, the `onKeyDown` with Enter/Space, `onContextMenu` preventDefault, and `<Diagnostics storageStatus onClose />`.
  - Remove the `storageStatus` prop from `StartScreen` and from its call in `App.tsx`.
  - Leave the language switch on `StartScreen` for now (US4 moves it).
  - Add a case to `app/tests/tabs-ui.test.tsx`: the version label is on Settings, not on Add, and Enter on it opens `nl['diagnostics.title']`.

**Checkpoint**: Settings tab with headings, version and Diagnostics; all earlier tests green.

---

## Phase 3: User Story 1 - Make a CSV backup (Priority: P1) 🎯 MVP

**Goal**: "Make CSV backup" in Settings opens the share sheet with one CSV file (one row per
Encounter, `;`, BOM). A finished share records the last backup time, which Settings shows.

**Independent Test**: seed Persons (with/without link and company), Encounters (with/without
Event, notes with `;`, `,`, `"`, a line break, `é`, an emoji, and one starting with `- `) and an
Event without Encounters. Tap the button with `share` mocked to resolve. The shared `File` is named
`sociale-vlinder-<today>.csv`, its text equals `buildBackupCsv(snapshot)`, and Settings shows
`backup.last`.

### Tests for User Story 1

- [X] T006 [P] [US1] Create `app/tests/backup-csv.test.ts` for `buildBackupCsv` and `backupFileName` per research R1 and [data-model.md](data-model.md) "CSV row". Build snapshots by hand (no database). Assert:
  - the text starts with `'﻿'`, then exactly `name;company;profileUrl;searchUrl;connectionStatus;encounterDate;eventName;eventStartDate;eventEndDate;note`, then `\r\n`;
  - one row per Encounter, with the Person's and the Event's fields; a casual Encounter has empty event columns;
  - row order: `encounterDate` newest first, then name, then `createdAt`; Events without Encounters come last, newest `startDate` first, with only the 3 event columns filled;
  - quoting: a value with `;`, `"`, `\n` or `\r`, or with a space at the start or end, is wrapped in `"…"`, and an inner `"` becomes `""`. A line break in a note stays inside one cell;
  - formula guard: values starting with `=`, `+`, `-`, `@` or a tab get a leading `'` and are quoted (`"'- talked about AI"`);
  - `connectionStatus` is written as `connected` / `notConnected`; dates as `YYYY-MM-DD`;
  - `é` and an emoji come through unchanged;
  - an empty snapshot gives BOM + header + `\r\n` only (US1 scenario 4);
  - `backupFileName('2026-10-12') === 'sociale-vlinder-2026-10-12.csv'`.
- [X] T007 [P] [US1] Create `app/tests/share-file.test.ts` for `shareFile(file)` per [contracts/storage-api.md](contracts/storage-api.md) "platform/shareFile.ts":
  - `canShare` true and `share` resolves → `'shared'`; `share` was called with `{ files: [file] }`;
  - `share` rejects with `new DOMException('x', 'AbortError')` → `'cancelled'`;
  - `share` rejects with a `NotAllowedError` or any other error → `'failed'`, with no unhandled rejection;
  - `navigator.share` is called **synchronously**: right after `const p = shareFile(file)`, before awaiting `p`, `share` has been called once;
  - `canShare` missing, or returning false → download fallback: `URL.createObjectURL` is called, a temporary `<a>` with `download === file.name` is clicked (spy on `HTMLAnchorElement.prototype.click`), the URL is revoked afterwards, and the result is `'downloaded'`.
- [X] T008 [P] [US1] Create `app/tests/settings-repository.test.ts` with the US1 cases:
  - `readBackupSnapshot()` returns all Persons, Encounters and Events, and a `takenAt` that is not after the time right after the call;
  - it fires no `onDataChanged`;
  - `recordBackup(t)` stores `lastBackupAt === t`;
  - a later `recordBackup` with an older time keeps the newer value ("It never moves back in time");
  - `recordBackup` fires `onDataChanged` once.
- [X] T009 [P] [US1] Create `app/tests/use-backup.test.tsx` for `useBackup()` with `renderHook` (wrapped in `LanguageProvider` only if needed):
  - `ready` becomes true after mount;
  - with `canShare`/`share` mocked, calling `makeBackup()` calls `share` synchronously, before its promise settles;
  - the shared file's `name` is `backupFileName(todayLocal())`, its `type` starts with `text/csv`, and its text equals `buildBackupCsv` of the snapshot;
  - on `'shared'`, `getSettings().lastBackupAt` equals the snapshot's `takenAt`, not a later time (use `vi.setSystemTime`, or compare with a write made after preparing);
  - on `'cancelled'` and `'failed'`, `lastBackupAt` is unchanged;
  - after a write (`createEvent`), the next shared file contains the new Event (it was rebuilt after `onDataChanged`).
- [X] T010 [P] [US1] Create `app/tests/settings-ui.test.tsx` with the US1 cases:
  - Settings shows `nl['backup.make']` and `nl['backup.never']`;
  - tapping it with `share` resolving shows `nl['backup.done']`, and a line starting with "Laatste back-up:" that contains the current year (R10);
  - with `share` rejecting with `AbortError`, no message is shown and `backup.never` stays;
  - with another error, `nl['backup.failed']` is shown;
  - the button is disabled until the file is ready.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create `app/src/backup/csv.ts` with `CSV_COLUMNS`, `buildBackupCsv(snapshot)` and `backupFileName(today)` per research R1. Make T006 pass.
  - Index Persons and Events by id in `Map`s.
  - An Encounter whose Person is missing still gets a row, with empty person columns (no data loss).
  - The cell helper: formula guard first (prefix `'`), then quote when needed.
  - Join cells with `;` and rows with `\r\n`; end with `\r\n`; prefix `﻿`.
- [X] T012 [P] [US1] Create `app/src/platform/shareFile.ts` with `shareFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>` per research R2. Make T007 pass.
  - It is an `async` function whose first statement checks `navigator.canShare?.({ files: [file] })`, so `navigator.share` runs before the first `await`.
  - `AbortError` (check `error instanceof DOMException && error.name === 'AbortError'`, or `name === 'AbortError'`) → `'cancelled'`; any other error → `'failed'`.
  - Fallback: `URL.createObjectURL(file)`, an `<a href download={file.name}>` appended to `document.body`, `click()`, remove it, then `URL.revokeObjectURL` in a `setTimeout(…, 0)`. Return `'downloaded'`.
- [X] T013 [US1] Add a `// Backup (F10)` section to `app/src/data/repository.ts`, after the Settings section, with `BackupSnapshot` (exported type, per [data-model.md](data-model.md)), `readBackupSnapshot()` and `recordBackup(takenAt)`. Make T008 pass.
  - `readBackupSnapshot`: `const takenAt = nowIso()`, then `db.transaction('r', db.persons, db.encounters, db.events, …)` reading all three tables with `toArray()`. No `withStorageErrors` (it is not a write).
  - `recordBackup`: read `getSettings()`. If `lastBackupAt` is already `>= takenAt`, return the settings unchanged. Otherwise `return updateSettings({ lastBackupAt: takenAt })`.
- [X] T014 [US1] Create `app/src/backup/useBackup.ts` per [contracts/storage-api.md](contracts/storage-api.md) "backup/useBackup.ts" and research R3. Make T009 pass.
  - Keep `{ snapshot, file }` in a `useRef` and `ready` in state.
  - `prepare()`: `readBackupSnapshot()` → `new File([buildBackupCsv(s)], backupFileName(todayLocal()), { type: 'text/csv;charset=utf-8' })`. Ignore the result after unmount.
  - Call `prepare()` on mount, after `onDataChanged` (one rebuild per burst, with `queueMicrotask` as in `app/src/people/useOpenActionCount.ts`) and on `visibilitychange` to `visible`.
  - `makeBackup()`: not ready → `Promise.resolve('failed')`. Otherwise take the prepared values **synchronously**, `const result = await shareFile(file)`, and on `'shared'` / `'downloaded'` `await recordBackup(snapshot.takenAt)`. Return `result`.
  - Return `reminderDue: false` for now (US2 fills it in).
- [X] T015 [US1] Fill the Backup section of `app/src/ui/SettingsTab.tsx` per [contracts/screens.md](contracts/screens.md) "Main view". Make T010 pass.
  - A `<button disabled={!ready}>` `backup.make` that calls `makeBackup()` straight in `onClick` (no `await` before it).
  - Read `getSettings()` on mount and again after each backup, to show `backup.last` or `backup.never`.
  - Format the time with `Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })` (R10).
  - A status line (`role="status"`) shows `backup.done` after `'shared'`/`'downloaded'` and `backup.failed` after `'failed'`; nothing after `'cancelled'`.
  - A `StorageFullError` from `recordBackup` is left to the F0 banner.
- [X] T016 [US1] Add styles in `app/src/styles.css` for `.settings-tab`, its sections, `h2` and the status line, with the existing tokens and spacing (like `.my-qr` and `.actions-tab`).

**Checkpoint**: a full CSV backup works from Settings; quickstart section 3 can run on the iPhone.

---

## Phase 4: User Story 2 - Backup reminder after an event (Priority: P1)

**Goal**: the day after an Event (or casual networking), or after changes to backed-up data, a
banner on the Add tab offers "Make backup" and "Later" (T10, T11, B40).

**Independent Test**: seed an Event that ended yesterday with an Encounter created after
`lastBackupAt`; the Add tab shows `reminder.text`. "Later" hides it. With the Event still running
today, no banner.

### Tests for User Story 2

- [X] T017 [P] [US2] Create `app/tests/backup-reminder.test.ts` for `isBackupReminderDue(snapshot, settings, today)` per research R4, with snapshots built by hand and `today = '2026-10-12'`. Also cover `localDateOf`. Cases:
  - never backed up, Encounter of an Event that ended `2026-10-11` → true;
  - never backed up, Encounter of an Event running today (`endDate` `2026-10-12` or later) → false;
  - casual Encounter dated `2026-10-11` → true; casual Encounter dated today → false;
  - Encounter with `createdAt <= lastBackupAt` and no change since → false;
  - B40: Encounter with `createdAt <= lastBackupAt < updatedAt`, `localDateOf(updatedAt)` yesterday → true; the same change made today → false;
  - B40 for a Person (changed name or connection status) and for an Event (changed name) → true;
  - B40 while the active Event runs today (`settings.activeEventId` set, `startDate <= today <= endDate`) → false; while the active Event has ended → true;
  - `backupReminderLaterOn === today` → false in every case above; `backupReminderLaterOn` yesterday → no effect;
  - a deleted record (absent from the snapshot) never counts;
  - `localDateOf('2026-10-11T22:30:00.000Z')` is `'2026-10-12'` in Brussels time. Set `process.env.TZ = 'Europe/Brussels'` in the file, or assert against `new Date(iso)` local parts.
- [X] T018 [P] [US2] Add to `app/tests/settings-repository.test.ts`: `postponeBackupReminder()` stores `backupReminderLaterOn === todayLocal()` and fires `onDataChanged`.
- [X] T019 [P] [US2] Create `app/tests/backup-reminder-ui.test.tsx`. Seed with `createEvent` + `createPerson` + `createEncounter`, with an Event that ended yesterday (`addDaysLocal(todayLocal(), -1)`). Then:
  - the Add tab shows `nl['reminder.text']` with buttons `nl['reminder.make']` and `nl['reminder.later']`, in an element with `role="status"`;
  - "Later" hides it; it stays hidden after unmount and remount the same day;
  - "Make backup" with `share` resolving hides it;
  - "Make backup" with `share` failing shows `nl['backup.failed']` and keeps the banner;
  - with the Event running today instead, no banner;
  - the banner never shows on the add-by-name form or the note step (open the form: `reminder.text` is absent).

### Implementation for User Story 2

- [X] T020 [P] [US2] Add `localDateOf(iso: string): string` to `app/src/data/dates.ts`: `format(new Date(iso))`, with a doc comment ("The local date of an ISO 8601 UTC time, as YYYY-MM-DD").
- [X] T021 [US2] Create `app/src/backup/reminder.ts` with `isBackupReminderDue(snapshot, settings, today)` exactly per research R4 rules 1 and 2. Use `eventStatusOn` from `app/src/events/choice.ts` for "running today" and `localDateOf` from `app/src/data/dates.ts`. Make T017 pass.
- [X] T022 [US2] Add `postponeBackupReminder(): Promise<Settings>` to the Backup section of `app/src/data/repository.ts`: `return updateSettings({ backupReminderLaterOn: todayLocal() })`. Make T018 pass.
- [X] T023 [US2] In `app/src/backup/useBackup.ts`, compute `reminderDue` after each `prepare()`, from the snapshot, `getSettings()` and `todayLocal()`, with `isBackupReminderDue`. Keep it in state. Settings writes already fire `onDataChanged`, so "Later" and a backup re-run `prepare()`.
- [X] T024 [US2] Add the reminder banner to `app/src/ui/StartScreen.tsx` per [contracts/screens.md](contracts/screens.md) "Add tab", under `<ContextBar>`, only when `useBackup().reminderDue`. Make T019 pass.
  - Render `<div className="banner banner-reminder" role="status">` with `reminder.text` and two buttons.
  - "Maak back-up": `makeBackup()` straight in `onClick`; on `'failed'` show `backup.failed` inside the banner.
  - "Later": `void postponeBackupReminder()`; a `StorageFullError` is left to the F0 banner.
- [X] T025 [US2] Add `.banner-reminder` styles in `app/src/styles.css`: friendly and light (brand light blue), two buttons side by side, not alarming. It must not push "Voeg toe via naam" below the fold on an iPhone SE-sized screen (375×667).

**Checkpoint**: US1 + US2 = the full safety net (MVP).

---

## Phase 5: User Story 3 - Manage Events (Priority: P2)

**Goal**: Settings lists all Events with dates, Encounter count and the active mark. The owner
edits name and dates, or deletes an Event. Its Encounters stay, without an Event (B38).

**Independent Test**: rename an Event and change its end date: the list and the Add tab's context
bar show the new values. Delete an Event with 2 Encounters: the confirmation says they stay, and
Contacts → without an event shows them with their notes.

### Tests for User Story 3

- [X] T026 [P] [US3] In `app/tests/repository.test.ts`, replace the test "refuses to delete an Event that still has Encounters" with "keeps its Encounters without an Event (B38)":
  - after `deleteEvent`, the Event is gone, `db.encounters.count()` is unchanged, and each former Encounter has no `eventId`, the same `date`, `note` and `personId`, and a newer `updatedAt`;
  - remove the `EventInUseError` import.
- [X] T027 [P] [US3] Add to `app/tests/settings-repository.test.ts`:
  - deleting the active Event clears `activeEventId`;
  - deleting an unknown id throws `ValidationError`;
  - a Person with a casual Encounter and an Event Encounter on the same day keeps both after the delete (R5);
  - `deleteEvent` fires `onDataChanged` once;
  - `updateEvent` with an empty name or `endDate < startDate` throws `ValidationError` and changes nothing ("name not empty after trimming, `endDate ≥ startDate`").
- [X] T028 [P] [US3] Create `app/tests/event-list.test.ts` for `eventListRows(events, encounters, activeEventId)`:
  - the counts per Event; an Event without Encounters has `encounterCount` 0;
  - casual Encounters are not counted anywhere;
  - `isActive` only on the active Event;
  - the order of `events` is kept.
- [X] T029 [P] [US3] Add US3 cases to `app/tests/settings-ui.test.tsx`:
  - with two Events seeded (one active, 2 Encounters), Settings shows both names, their `formatDateRange` text, `nl['settings.eventActive']` once, and "2 ontmoetingen" (`settings.encounterCountMany`);
  - with none, `nl['settings.eventsEmpty']`;
  - tapping an Event opens `nl['event.editTitle']`, prefilled. Change the name and save: back in the list with the new name. Then the Add tab's context bar shows the new name (R8);
  - an empty name shows `nl['event.errorName']` and saves nothing; *(2026-10-12: as in `NewEventForm`, Save is disabled with an empty name, so the test checks the disabled button and that nothing changed.)*
  - moving the start date past the end date moves the end date along;
  - "Evenement verwijderen" opens a confirmation with `deleteQuestion` and `deleteKeepsMany` (count 2); Cancel keeps it; confirm removes it from the list, and the Contacts tab lists the 2 Persons under without an event;
  - an Event without Encounters shows only `deleteQuestion`, without the "keeps" line.

### Implementation for User Story 3

- [X] T030 [US3] Change `deleteEvent(id)` in `app/src/data/repository.ts` per research R5 and [contracts/storage-api.md](contracts/storage-api.md). Make T026 and T027 pass.
  - In one `db.transaction('rw', db.events, db.encounters, db.settings, …)`: an unknown id throws `ValidationError('id', 'Unknown Event')`.
  - Then put every Encounter with this `eventId` back with `compact<Encounter>({ ...encounter, eventId: undefined, updatedAt: now })`, delete the Event, and clear `activeEventId` as now.
  - Update the doc comment ("Keeps its Encounters without an Event (B38)").
  - Remove `EventInUseError` from `app/src/data/errors.ts` and from the imports in `repository.ts`.
- [X] T031 [US3] Update `removeTestData()` in `app/src/ui/Diagnostics.tsx` (R5): for each test Event, `if ((await listEncountersByEvent(event.id)).length === 0) await deleteEvent(event.id)`. Remove the `EventInUseError` import and the try/catch. The comment stays: an Event that real Encounters still use is kept.
- [X] T032 [P] [US3] Create `app/src/settings/eventList.ts` with `EventListRow` and `eventListRows(events, encounters, activeEventId?)`. It is pure: count Encounters per `eventId` with a `Map`. Make T028 pass.
- [X] T033 [P] [US3] Create `app/src/ui/EditEventForm.tsx` per [contracts/screens.md](contracts/screens.md) "Edit event view". Props: `event: Event`, `encounterCount: number`, `onDone(): void`.
  - Same fields, ids (`useId`), `maxLength={80}` and start-date rule as `app/src/ui/NewEventForm.tsx` (`if (value > endDate) setEndDate(value)`).
  - Save calls `updateEvent(event.id, { name, startDate, endDate })`. A `ValidationError` on `name` shows `event.errorName`, otherwise `event.errorDates`. An edited Event never becomes active, and the active Event is never changed here.
  - "Evenement verwijderen" opens `ConfirmPanel` with:
    - text `t('event.deleteQuestion', { name })`;
    - detail `deleteKeepsOne` / `deleteKeepsMany` (`{count}`) only when `encounterCount > 0`;
    - `confirmLabel = t('event.deleteConfirm')`.

    On confirm: `deleteEvent(event.id)`, then `onDone()`.
  - "Terug" (`event.back`) calls `onDone()`.
- [X] T034 [US3] Fill the Events section of `app/src/ui/SettingsTab.tsx`. Make T029 pass.
  - Load `listEvents()`, `listEncounters()` and `getSettings()`, and build the rows with `eventListRows`.
  - Each row is a `<button>` showing the name, `formatDateRange(...)`, the count (`encounterCountOne` / `encounterCountMany`) and `eventActive` when active.
  - Tapping a row sets `editing` state and renders `<EditEventForm>` instead of the main view (tab bar stays). `onDone` clears it and reloads the list.
  - With no Events, show `settings.eventsEmpty`.
- [X] T035 [US3] In `app/src/App.tsx`, add `tab` to the dependency list of the effect that loads the active Event (research R8), so the context bar on Add is current after editing or deleting in Settings.
- [X] T036 [US3] Add styles in `app/src/styles.css` for the event rows: name and dates on two lines, the count muted, the `actief` mark as a small pill, the whole row tappable (≥ 44 px high). Reuse `.event-form` for the edit form.

**Checkpoint**: Events can be changed and deleted without losing Encounters.

---

## Phase 6: User Story 4 - Choose the app language (Priority: P2)

**Goal**: the NL/EN switch lives in Settings; the Add tab no longer has it. Dutch on first start
(B37).

**Independent Test**: on Settings, tap EN: all texts are English, also after remounting the app.
The Add tab has no `app.languageEn` button.

### Tests for User Story 4

- [X] T037 [P] [US4] Update `app/tests/i18n.test.tsx`:
  - the switch buttons (`nl['app.languageEn']`) are found after opening the Settings tab;
  - "starts in Dutch" stays (B37);
  - the storage-full case still works from Settings;
  - add a case: the Add tab shows no `app.languageEn` / `app.languageNl` button.

### Implementation for User Story 4

- [X] T038 [P] [US4] Create `app/src/ui/LanguageSwitch.tsx`: move the `language-switch` group from `app/src/ui/StartScreen.tsx` as it is (`role="group"`, `aria-label`, `aria-pressed`, `setLanguage`). Keep the class names, so the existing styles apply. *(2026-10-12: the visible "Taal" label inside the group was dropped, since the section heading already says it; the group keeps its `aria-label`. `.language-label` style removed.)*
- [X] T039 [US4] Render `<LanguageSwitch />` in the language section of `app/src/ui/SettingsTab.tsx`. Remove the switch and its now unused `language`/`setLanguage` from `app/src/ui/StartScreen.tsx`. Make T037 pass.
- [X] T040 [P] [US4] In `app/src/i18n/LanguageProvider.tsx`, change the comment "Dutch until Settings are loaded (open question #8)" to "Dutch until Settings are loaded; Dutch is also the default (B37)".

**Checkpoint**: the Add tab only holds the add flows, the context bar and the reminder.

---

## Phase 7: User Story 5 - Delete all data (Priority: P3)

**Goal**: "Delete all data" shows the counts, offers a backup first, and only works after typing
the word (B41). Afterwards the app is as on a first start, in the same language.

**Independent Test**: with data and `ownerProfileUrl` seeded, open the panel. The button is
disabled until `wissen` is typed. Confirm: the daily choice shows, Contacts and Actions are empty,
My QR asks for the link, and the language is unchanged.

### Tests for User Story 5

- [X] T041 [P] [US5] Add to `app/tests/settings-repository.test.ts`:
  - `countData()` returns the numbers of Persons, Encounters and Events;
  - `deleteAllData()` leaves `persons`, `encounters`, `events` and `dismissals` empty;
  - the Settings record is exactly `{ key: 'settings', language, updatedAt }`, with `language` kept as `'en'` when it was `'en'`. So `activeEventId`, `contextChosenOn`, `noteStepEncounterId`, `ownerProfileUrl`, `lastBackupAt` and `backupReminderLaterOn` are gone;
  - it fires `onDataChanged` once;
  - with a write failing as `QuotaExceededError` (spy on a table's `clear`, as earlier storage-full tests do), it throws `StorageFullError` and all data is still there.
- [X] T042 [P] [US5] Add US5 cases to `app/tests/settings-ui.test.tsx`:
  - "Alle data wissen" opens a panel with `deleteAll.question` and `deleteAll.counts` showing the seeded numbers;
  - `nl['deleteAll.confirm']` is disabled;
  - typing `wissen` enables it, and so do `  WISSEN ` and `Wissen`; `WISSE` or `DELETE` (in Dutch) do not ("upper or lower case and spaces around the word do not matter");
  - in English the word is `DELETE`;
  - Cancel closes it and keeps all data;
  - "Maak eerst een back-up" calls `share` and the panel stays open;
  - confirming shows the daily choice (`ContextChoice` heading), and afterwards Contacts is empty, the Actions badge is gone and My QR shows `nl['myQr.setupTitle']`.

### Implementation for User Story 5

- [X] T043 [US5] Add `countData()` and `deleteAllData()` to `app/src/data/repository.ts` per research R6 and [data-model.md](data-model.md) "Delete all data". Make T041 pass.
  - `countData`: `Promise.all` of the three `count()`s.
  - `deleteAllData`: inside `withStorageErrors`, one `db.transaction('rw', db.persons, db.encounters, db.events, db.dismissals, db.settings, …)` that reads `getSettings()`, clears the four tables, and puts `{ key: 'settings', language: current.language, updatedAt: nowIso() }`.
- [X] T044 [US5] Fill the delete-all section of `app/src/ui/SettingsTab.tsx` per [contracts/screens.md](contracts/screens.md) "Delete all data panel". Make T042 pass.
  - A `danger` button `deleteAll.button` opens the panel and loads `countData()`.
  - "Maak eerst een back-up" calls `makeBackup()` straight in `onClick` and shows the same status line as in US1.
  - The input has `autoCapitalize="characters"`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck={false}`, and the label `t('deleteAll.typeWord', { word: t('deleteAll.word') })`.
  - The confirm button is enabled only when `input.trim().toLocaleUpperCase() === t('deleteAll.word')` (R9) and not busy.
  - Confirm: `await deleteAllData()`, then `onAllDataDeleted()`. On a `StorageFullError`, keep the panel open (F0 banner shows).
  - Cancel (`link.cancel`) closes the panel and clears the input.
- [X] T045 [US5] Check `onAllDataDeleted` in `app/src/App.tsx` (wired in T004): `recheck()` + `toStart()`. Confirm that the daily choice appears, because `contextChosenOn` is gone. Also confirm the Actions badge drops via `onDataChanged`. Fix whatever T042 shows is missing.
- [X] T046 [US5] Add styles in `app/src/styles.css` for the delete-all panel: the word input and the danger button, in line with `.confirm-panel`.

**Checkpoint**: all five user stories work.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T047 [P] Check accessibility in `app/src/ui/SettingsTab.tsx`, `EditEventForm.tsx` and the reminder banner:
  - every section has a heading;
  - the event rows are real buttons with a readable name (name, dates, count);
  - the word input has a label;
  - status lines use `role="status"`;
  - focus moves to the confirmation panels (as `ConfirmPanel` does);
  - the butterfly emoji in `reminder.text` is fine inline (it is part of the sentence). *(2026-10-12: all points hold. Two fixes from this check: while the delete-all panel is open, the backup message shows only in the panel, so it is not read out twice; and the Settings tab reloads after every data change (`onDataChanged`), so the event list is current after Diagnostics adds or removes test data.)*
- [X] T048 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`. Note:
  - the test count (was 344) and the JS bundle size before and after;
  - `app/package.json` is unchanged;
  - `app/src/data/db.ts` is unchanged;
  - no `fetch` or external URL in `backup/`, `settings/`, `shareFile.ts`, `SettingsTab.tsx` or `EditEventForm.tsx`;
  - `EventInUseError` and `ComingSoon` appear nowhere in `app/src` or `app/tests`. *(2026-10-12: 419 tests green (was 344), build OK. Main bundle 128.6 kB gzip (F9: 125.3 kB), so +3.3 kB. `package.json` and `db.ts` unchanged. No `fetch` or external URL in the new files. `EventInUseError`, `ComingSoon` and `soon.*` appear nowhere.)*
- [ ] T049 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T050 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–6 (manual, Britt):
  - the share sheet opens at once, also with 500 test contacts from Diagnostics (SC-001);
  - Numbers shows all columns;
  - Excel with Belgian settings splits the columns;
  - the two cancel checks (write down what "Cancel" in the Files picker does);
  - the reminder by changing the iPhone date;
  - deleting an Event with Encounters;
  - delete all data with test data only.
- [ ] T051 Tick the F10 items in `specs/features.md` and add a line to `wiki/log.md`, per CLAUDE.md. Include what the Files-picker cancel did (research R2). If Britt changed the reminder text, also update `wiki/merk-en-stijl.md` (remove "nog te keuren") and the `reminder.text` keys. *(2026-10-12: implementation line added to `wiki/log.md`; ticking `features.md` waits for T050.)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (`useBackup`, `readBackupSnapshot`, `makeBackup`). The pure
  rule (T017, T020, T021) can start right after Foundational.
- **US3 (Phase 5)**: depends only on Foundational. It can run alongside US1/US2, except for the
  shared files listed below.
- **US4 (Phase 6)**: depends only on Foundational (T005 already touched `StartScreen`).
- **US5 (Phase 7)**: depends on US1 for "Make backup first" (`makeBackup`). The repository part
  (T041, T043) can start after Foundational.
- **Polish (Phase 8)**: after all stories.

### Within Each Story

- Tests first; they should fail before the implementation.
- These files are shared, so their tasks run one at a time:
  - `SettingsTab.tsx`: T004, T005, T015, T034, T039, T044, T047;
  - `StartScreen.tsx`: T005, T024, T039;
  - `App.tsx`: T004, T005, T035, T045;
  - `repository.ts`: T013, T022, T030, T043;
  - `useBackup.ts`: T014, T023;
  - `styles.css`: T016, T025, T036, T046;
  - `settings-repository.test.ts`: T008, T018, T027, T041;
  - `settings-ui.test.tsx`: T010, T029, T042;
  - `tabs-ui.test.tsx`: T004, T005.

### Parallel Opportunities

- Foundational: T002 and T003 together, then T004 → T005.
- US1: T006, T007, T008, T009 and T010 together (five test files). Then T011 and T012 together
  (own files), then T013 → T014 → T015.
- US2's pure rule (T017 + T020 + T021) alongside US1.
- US3's pure helper and form (T028, T032, T033) alongside US1/US2.
- US4's T038 and T040 alongside anything else.

## Parallel Example: User Story 1

```text
Task: "T006 Create app/tests/backup-csv.test.ts"
Task: "T007 Create app/tests/share-file.test.ts"
Task: "T008 Create app/tests/settings-repository.test.ts (snapshot, recordBackup)"
Task: "T009 Create app/tests/use-backup.test.tsx"
Task: "T010 Create app/tests/settings-ui.test.tsx (backup section)"
```

```text
Task: "T011 Create app/src/backup/csv.ts"
Task: "T012 Create app/src/platform/shareFile.ts"
```

## Parallel Example: User Story 3

```text
Task: "T028 Create app/tests/event-list.test.ts"
Task: "T032 Create app/src/settings/eventList.ts"
Task: "T033 Create app/src/ui/EditEventForm.tsx"
```

## Implementation Strategy

### MVP (User Stories 1–2)

1. Phase 1 → Phase 2 → US1 → US2.
2. **Stop and validate**: quickstart sections 3 and 4 on the iPhone (backup to Files, Numbers,
   Excel, the reminder). This is the safety net that "ready for the first fair" asks for, and
   it can be pushed.

### Incremental Delivery

1. Foundational + US1 + US2 → push (backup and reminder).
2. US3 → push (manage Events).
3. US4 → push (language in Settings).
4. US5 → push (delete all data).
5. Polish: accessibility, full quickstart, features list, wiki log.
