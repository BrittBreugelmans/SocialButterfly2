# Implementation Plan: F10 — Settings & Data

**Branch**: `009-settings-data` (work on `main`, as for F0–F9) | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-settings-data/spec.md`

## Summary

The Settings tab replaces F7's "coming soon" screen. It holds the CSV backup, the list of Events
(change, delete), the language switch and "Delete all data". The language switch and Diagnostics
move there from the Add tab. The day after an Event, or after casual networking, a banner on
the Add tab reminds the owner to make a backup. It also comes when backed-up data has changed
since (T10, T11, B40).

Technical approach:

- **CSV (R1):** a small module of our own, with no library. `;` separator (B39), a UTF-8 BOM,
  CRLF, quoting, and a formula guard (`'` before `= + - @`). One row per Encounter (B35), plus a
  row for each Event without Encounters.
- **Getting the file out (R2):** the Web Share API with a file opens the iPhone share sheet
  ("Save to Files", AirDrop, Mail). The file is prepared in advance, so `share()` runs straight
  from the tap. A resolve records the backup, a cancel does not. The laptop falls back to a
  download.
- **Snapshot (R3):** one read transaction. `lastBackupAt` is the snapshot time, so changes made
  while the sheet is open still count for the next reminder.
- **Reminder (R4):** a pure rule over the snapshot: new Encounters after the Event's end or the
  casual day (T10/T11), or changes made on an earlier day while no Event is running (B40).
  "Later" stores today's date.
- **Events (R5):** `deleteEvent` keeps the Encounters without an Event (B38), in one
  transaction. `EventInUseError` goes.
- **Delete all data (R6):** one transaction clears four tables and resets Settings to just the
  language. Then the daily choice appears, as on a first start.
- **Schema:** one optional Settings field (`backupReminderLaterOn`). No version change, no new
  dependency (R11).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack (React 19, Dexie 4, Vite, vite-plugin-pwa). **No new
dependencies.** Browser APIs: Web Share API Level 2 (`navigator.share` / `canShare` with files),
`Intl.DateTimeFormat`.

**Storage**: IndexedDB via Dexie, **still schema version 2**. `Settings` gets one optional field
with no index.

**Testing**: Vitest, React Testing Library, fake-indexeddb. `navigator.share` / `canShare` are
mocked in the tests. Manual checks on the iPhone with Numbers, and Excel on a laptop
([quickstart.md](quickstart.md)).

**Target Platform**: iOS 17+ home-screen web app (Safari). Sharing files works from iOS 15.

**Project Type**: client-only web app (PWA)

**Performance Goals**: backup file ready and share sheet open within 3 s for 500 Persons
(SC-001). In practice the file is ready before the tap, so the sheet opens at once.

**Constraints**: €0; the app sends nothing to a server (FR-003, constitution IV); the file opens
correctly in Numbers and in Excel with Belgian settings (FR-005); no Encounter is lost by
deleting an Event (constitution IX).

**Scale/Scope**: 1 settings field; 6 repository functions (5 new, 1 changed); 3 small pure
modules (`backup/csv.ts`, `backup/reminder.ts`, `settings/eventList.ts`); 1 hook (`useBackup`);
1 platform helper (`shareFile`); 3 new components (`SettingsTab`, `EditEventForm`,
`LanguageSwitch`); 3 changed (`StartScreen`, `App`, `Diagnostics`); `ComingSoon` removed; about
29 text keys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | No LinkedIn contact at all. The CSV only holds links that are already stored. |
| II | Zero Cost | ✅ Pass | No library, no service. Sharing uses the iPhone's own share sheet. |
| III | Installable iPhone Web App | ✅ Pass | The Web Share API works in a home-screen app (iOS 15+). There is no native code. |
| IV | Local Data, Sync-Ready | ✅ Pass | The file is made on the device. The app uploads nothing: the owner herself chooses where it goes (Files, AirDrop). Every changed Encounter gets a new `updatedAt`. |
| V | LinkedIn-Only Identity | ✅ Pass | No Person is created or merged. Deleting an Event does not touch Person identity. |
| VI | Privacy | ✅ Pass | This principle is what F10 delivers: CSV export always available from the owner's screens, and delete-all. Settings is never reachable in guest mode (no tab bar there, FR-020). |
| VII | Bilingual | ✅ Pass | The language switch moves to Settings. All new keys exist in NL and EN. Dutch is the default (B37). |
| VIII | Speed in the Moment | ✅ Pass | The add flows are unchanged. The reminder is a banner, not a blocking screen, and never shows during an Event or in a flow (FR-010). |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Deleting an Event keeps its Encounters (B38). Delete-all is an explicit delete behind a typed word (B41). The reminder protects against iOS wiping the data (T9). Same-day casual Encounters after an Event delete are kept, not silently merged (R5). |
| X | Own Brand, Only v1 | ✅ Pass | No import (B36), no CSV library, no cloud backup. Every part traces to F10 in `features.md`. |

**Post-design re-check (after Phase 1)**: all pass. `deleteEvent` changes behaviour; that is
Britt's decision B38. The Diagnostics test-data cleanup keeps its old safety (R5). No Complexity
Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/009-settings-data/
├── plan.md              # This file
├── research.md          # R1–R11
├── data-model.md        # Settings.backupReminderLaterOn, Event delete, snapshot, CSV row, reminder rule
├── quickstart.md        # laptop + iPhone checks: Numbers, Excel BE, share sheet, reminder by date
├── contracts/
│   ├── storage-api.md   # repository functions, csv, reminder, useBackup, shareFile, eventList
│   └── screens.md       # Settings tab, edit event, delete all, reminder banner, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/
├── src/
│   ├── data/
│   │   ├── types.ts         # + Settings.backupReminderLaterOn
│   │   ├── dates.ts         # + localDateOf(iso)
│   │   ├── errors.ts        # − EventInUseError
│   │   └── repository.ts    # + readBackupSnapshot, recordBackup, postponeBackupReminder, countData, deleteAllData; deleteEvent keeps Encounters (B38)
│   ├── backup/
│   │   ├── csv.ts           # NEW: buildBackupCsv, backupFileName, CSV_COLUMNS (R1)
│   │   ├── reminder.ts      # NEW: isBackupReminderDue (R4)
│   │   └── useBackup.ts     # NEW: prepared snapshot + File, reminderDue, makeBackup (R2, R3)
│   ├── settings/
│   │   └── eventList.ts     # NEW: eventListRows (encounter count, active mark)
│   ├── platform/
│   │   └── shareFile.ts     # NEW: share sheet with file, download fallback (R2)
│   ├── i18n/nl.ts, en.ts    # + settings.*, backup.*, reminder.*, deleteAll.*, event.edit/delete keys; − soon.*
│   ├── i18n/LanguageProvider.tsx # comment: default Dutch is now B37 (was open question #8)
│   ├── ui/
│   │   ├── SettingsTab.tsx  # NEW: backup, events, language, delete all, version + Diagnostics
│   │   ├── EditEventForm.tsx # NEW: rename / change dates / delete with ConfirmPanel
│   │   ├── LanguageSwitch.tsx # NEW: moved out of StartScreen
│   │   ├── StartScreen.tsx  # − language switch, − version/Diagnostics, + reminder banner
│   │   ├── Diagnostics.tsx  # removeTestData: only test Events without Encounters (R5)
│   │   └── ComingSoon.tsx   # REMOVED (no tab left "coming soon")
│   ├── App.tsx              # settings tab → SettingsTab; reload active Event on tab change (R8); onAllDataDeleted → recheck + Add
│   └── styles.css           # + settings sections, event rows, reminder banner, delete-all panel
└── tests/
    ├── backup-csv.test.ts       # NEW: header, order, quoting (; " CR LF), BOM, formula guard, casual and event-only rows, empty data
    ├── backup-reminder.test.ts  # NEW: T10, T11, B40, running Event, Later, never backed up, deletes don't count
    ├── settings-repository.test.ts # NEW: deleteEvent keeps Encounters + clears active; deleteAllData keeps language; recordBackup never goes back; snapshot
    ├── share-file.test.ts       # NEW: shared / cancelled (AbortError) / failed / download fallback
    ├── settings-ui.test.tsx     # NEW: sections, backup button + last time, edit/delete event, delete-all word, Diagnostics long press, language
    ├── banners.test.tsx / start-screen: reminder banner (Make backup, Later), no language switch on Add
    ├── repository.test.ts       # EventInUseError test → "keeps its Encounters without an Event"
    ├── i18n.test.tsx            # language switch now found on the Settings tab
    └── tabs-ui.test.tsx         # no tab "coming soon" any more
```

**Structure Decision**: same single client project. Backup logic gets its own folder
`src/backup/`, like `src/myQr/`. The pure Event list helper goes in `src/settings/`. Browser APIs
stay in `src/platform/`. Only `data/repository.ts` touches the database.

## Wiki follow-up (done with this plan)

- `begrippen.md`: added "Back-up" (`backup`), "Back-upherinnering" (`backupReminder`) and "Alle
  data wissen" (`deleteAllData`), so code and wiki use the same words.
- `merk-en-stijl.md`: added the reminder text (`reminder.text`) to the texts table, marked for
  Britt's review.

## Open points

None blocking. To check on the iPhone (quickstart):

- **Cancel inside the Files picker** (section 3.6): does it count as a backup? Either way is
  acceptable (research R2); note what happens.
- **Excel with Belgian settings** (section 3.5): columns split straight away.

## Complexity Tracking

No violations; nothing to justify.
