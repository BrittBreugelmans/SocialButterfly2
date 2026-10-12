# Feature Specification: F10 — Settings & Data

**Feature Branch**: `009-settings-data`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "F10" (F10 — Instellingen & data, `specs/features.md`)

Source: F10 in `specs/features.md`; tab "Instellingen" in `wiki/flows.md`; decisions B11, B12,
B14, B23, B24, B26, B33, M3, T4, T9, T10, T11; open questions #6 and #8; constitution IV, VI,
VII, IX. Builds on F0 (`specs/001-app-foundation`: Settings record, `lastBackupAt`, language
switch, storage warning, FR-017), F1 (`specs/002-events`: creating and choosing Events, daily
choice) and F7 (`specs/006-contacts`: tab bar with a "coming soon" Settings tab; the language
switch and Diagnostics stay on the Add tab until F10).

## Clarifications

### Session 2026-10-12

- Q: How is the CSV backup laid out (open question #6, columns)? → A: One file, one row per
  Encounter, with the Person's and the Event's data repeated on each row (wiki B35).
- Q: Can a backup be imported to restore data in v1 (open question #6, import)? → A: No. Export
  only; restoring is for later (wiki B36).
- Q: Which default language does the app use (open question #8)? → A: Dutch on first start. Guest
  mode (F3) opens in the app language; the guest can switch (wiki B37).
- Q: What happens when the owner deletes an Event that still has Encounters? → A: After
  confirmation the Event is deleted and its Encounters stay, as without an Event. Nothing is lost
  (wiki B38).
- Q: Which separator does the CSV use between columns? → A: A semicolon (`;`), so the file opens
  straight into columns in Excel with Belgian settings, and in Numbers (wiki B39).
- Q: Does the backup reminder also come when only notes or other data changed since the last
  backup? → A: Yes. Changes to Persons, Encounters and Events count too, with the same timing as
  T10/T11: never during the Event or on the day of the change (wiki B40).
- Q: How hard is it to confirm "Delete all data"? → A: The delete button only works after the
  owner types a word: "WISSEN" in Dutch, "DELETE" in English (wiki B41).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Make a CSV backup (Priority: P1)

Before she leaves for a fair, or the day after, the owner opens Settings and taps "Make CSV
backup". The iPhone offers to save the file to Files or share it. The file holds all her
contacts, encounters, events and notes, and opens in Numbers or Excel.

**Why this priority**: The data lives only on the phone, and iOS can delete it (T9). The CSV is
the only safety net (T4) and a constitution rule (VI: export at all times). "Ready for the first
fair" asks for it.

**Independent Test**: With a few Persons (with and without profile link, with and without
company), Encounters (with and without Event, with notes containing commas, line breaks, accents
and emoji) and Events, make a backup and open it in Numbers: every Encounter is there with the
right Person, Event and note.

**Acceptance Scenarios**:

1. **Given** stored data, **When** the owner taps "Make CSV backup" in Settings, **Then** the
   iPhone offers to save or share one CSV file named after the app and today's date.
2. **Given** the file, **When** it is opened in Numbers or Excel, **Then** all data is readable,
   including accents, emoji, commas and line breaks in notes.
3. **Given** a finished backup, **Then** Settings shows the date and time of the last backup, and
   the backup reminder (Story 2) no longer appears for the Encounters it contains.
4. **Given** no data at all, **When** she makes a backup, **Then** she still gets a valid file with
   only the header row.

---

### User Story 2 - Backup reminder after an event (Priority: P1)

The day after Devoxx ends, the owner opens the app. A friendly reminder says she met new people
and suggests making a backup now. One tap makes the backup; "Later" hides the reminder for today.

**Why this priority**: Right after an event, the most new contacts sit only on the phone (T10).
Without a reminder, the backup in Story 1 is easily forgotten.

**Independent Test**: Add Encounters to an Event ending today. Open the app on the next day: the
reminder appears. Make the backup: it is gone. Add Encounters during a running Event: no reminder.

**Acceptance Scenarios**:

1. **Given** Encounters were added since the last backup to an Event whose end date is before
   today, **When** the app is opened for the first time today, **Then** the reminder appears on
   the Add tab with "Make backup" and "Later" (T10).
2. **Given** Encounters were added since the last backup while networking without an Event, on a
   date before today, **Then** the same reminder appears (T11).
3. **Given** all new Encounters belong to an Event that is still running, or were made today
   without an Event, **Then** no reminder appears: never during networking.
4. **When** she taps "Make backup", **Then** Story 1 runs; after a finished backup the reminder
   disappears.
5. **When** she taps "Later", **Then** the reminder is hidden for the rest of today and is checked
   again on the first open of a next day.
6. **Given** after her last backup she wrote notes on the Actions tab yesterday, and added no
   Encounters, **When** she opens the app for the first time today, **Then** the reminder appears
   (B40).
7. **Given** nothing was added or changed since the last backup, **Then** no reminder appears.

---

### User Story 3 - Manage Events (Priority: P2)

In Settings, the owner sees all her Events, newest first, with their dates and the number of
Encounters. She fixes a typo in a name, changes the dates of a fair that was moved, or deletes an
Event she created by mistake (B14).

**Why this priority**: F1 only creates and chooses Events; a wrong Event otherwise stays forever
(F1 edge case). P2 because the core flows work without it.

**Independent Test**: Rename an Event and change its end date: Contacts and the context bar show
the new name and dates. Delete an Event without Encounters: it disappears from Settings, the daily
choice and the Contacts filter.

**Acceptance Scenarios**:

1. **Given** Events exist, **When** she opens "Events" in Settings, **Then** she sees each Event
   with name, date range and number of Encounters; the active Event is marked.
2. **When** she changes the name or dates and saves, **Then** the same rules as creating apply:
   name not empty, end date not before start date (B11).
3. **When** she deletes an Event without Encounters and confirms, **Then** it is gone. If it was
   the active Event, the app switches to networking without an Event.
4. **When** she deletes an Event that has Encounters, **Then** the confirmation says how many
   Encounters it has and that they stay, as without an Event. After confirming, the Event is gone
   and those Encounters show under "without an Event" in Contacts, with their notes (B38).
5. **Given** no Events, **Then** the screen says so in one short line.

---

### User Story 4 - Choose the app language (Priority: P2)

The language switch moves from the Add tab to Settings. The owner picks Dutch or English there;
every owner screen follows at once.

**Why this priority**: The switch exists since F0 (M3); F10 gives it its final place, so the Add
tab stays clean for adding contacts.

**Independent Test**: Switch to English in Settings: all texts change, also after closing and
reopening the app. The Add tab no longer shows a language switch.

**Acceptance Scenarios**:

1. **When** she picks a language in Settings, **Then** every owner screen changes at once and the
   choice survives closing the app.
2. **Given** a first start, **Then** the app language is Dutch (B37).
3. **Given** F10 is built, **Then** the Add tab no longer shows the language switch.

---

### User Story 5 - Delete all data (Priority: P3)

Before she gives away her phone, or to start fresh, the owner deletes everything. The app first
says exactly how much will be deleted and offers to make a backup first.

**Why this priority**: Part of the owner's control over other people's data (constitution VI),
but rarely used.

**Independent Test**: With data stored, delete all data and confirm: Contacts, Actions and Events
are empty, My QR asks for the link again, the next open starts with the daily choice.

**Acceptance Scenarios**:

1. **When** she taps "Delete all data", **Then** a confirmation shows the number of Persons,
   Encounters and Events, says it cannot be undone, and offers "Make backup first".
2. **Given** the confirmation, **Then** the delete button only works after she types "WISSEN"
   (Dutch) or "DELETE" (English) (B41).
3. **When** she has typed the word and confirms, **Then** all Persons, Encounters, Events, notes,
   dismissed Actions, the own profile link (B33), the active Event and the last-backup time are
   deleted.
4. **When** she cancels, **Then** nothing changes.
5. **Given** the deletion is done, **Then** the app shows the Add tab as on a first start, in the
   same language.

---

### Edge Cases

- **Backup cancelled**: when the owner closes the save/share sheet without saving, the last-backup
  time does not change, where the iPhone reports this.
- **Very large data** (hundreds of Persons): the backup still finishes within a few seconds and
  the app stays usable.
- **Note that starts with `=`, `+`, `-` or `@`**: a spreadsheet app shows it as text, never as a
  formula.
- **Event renamed after a backup**: the next backup uses the new name; older files keep the old
  one.
- **Dates of the active Event changed so it no longer runs today**: it stays active today; the
  next daily choice (B13) applies as usual, including B23's warning.
- **Encounter dates outside the new date range of an Event**: they stay as they are; the
  Encounter keeps its own date.
- **Two Events with the same name**: allowed, as in F1; the date range tells them apart.
- **Storage full** while saving an Event: nothing changes; F0's storage message appears.
- **Delete all data while the note step is open** (B18): not possible; Settings is only reached
  with the tab bar, which is hidden during the note step.
- **Guest mode (F3)**: Settings, and so export and delete, are never reachable from guest mode.
- **Storage not persisted** (T9): the warning from F0 stays; the reminder and the backup button
  are the advised answer.
- **Daily choice and reminder on the same open**: the daily choice comes first; the reminder
  shows on the Add tab after it.

## Requirements *(mandatory)*

### Functional Requirements

#### Settings tab

- **FR-001**: The Settings tab MUST replace F7's "coming soon" screen. It MUST offer: Events,
  language, "Make CSV backup" with the time of the last backup, and "Delete all data".
- **FR-002**: The language switch and Diagnostics (with the version label) MUST move from the Add
  tab to Settings. Diagnostics stays hidden behind a long press, as now.

#### CSV backup

- **FR-003**: "Make CSV backup" MUST create one CSV file with all stored data, made on the device,
  and offer it through the iPhone's save/share sheet. The app MUST NOT upload it anywhere
  (constitution IV).
- **FR-004**: The file MUST have one row per Encounter (B35), with these columns in this order:
  name, company, profile URL, search URL, connection status, encounter date, event name, event
  start date, event end date, note. Empty values stay empty. Every Person appears, because every
  Person has at least one Encounter (B25). An Event without Encounters MUST get one row with only
  the event columns filled, so every Event is in the backup.
- **FR-004a**: The app MUST NOT offer importing a backup in v1 (B36).
- **FR-005**: Columns MUST be separated by a semicolon (`;`) (B39). The file MUST open straight
  into columns in Numbers and in Excel with Belgian settings: accents and emoji intact, and
  semicolons, commas, quotes and line breaks in text kept within their cell.
- **FR-006**: Text that a spreadsheet would read as a formula (starting with `=`, `+`, `-` or `@`)
  MUST be exported so it shows as text.
- **FR-007**: The file name MUST contain the app name and the date, for example
  `sociale-vlinder-2026-10-12.csv`.
- **FR-008**: After a finished backup, the app MUST store the time as the last backup (F0
  FR-017) and show it in Settings.

#### Backup reminder

- **FR-009**: On the first open of a day, the app MUST show the backup reminder on the Add tab
  when Encounters were added since the last backup that belong to an Event whose end date is
  before today (T10), or that have no Event and a date before today (T11).
- **FR-009a**: Changes since the last backup MUST also trigger the reminder (B40): a changed name,
  company, profile link, connection status, note or Event, made on a day before today. While the
  active Event runs today, such changes wait until the first open after its end date. Deleting a
  Person or Encounter does not count: the last backup still holds them.
- **FR-010**: The reminder MUST NOT appear for Encounters of a running Event or casual Encounters
  of today, and never during the add flow, note step or guest mode.
- **FR-011**: The reminder MUST offer "Make backup" (runs FR-003) and "Later" (hides it until the
  first open of a next day).

#### Events

- **FR-012**: Settings MUST list all Events, newest start date first, with name, date range,
  number of Encounters, and a mark on the active Event.
- **FR-013**: The owner MUST be able to change an Event's name, start date and end date, with the
  rules of F1: name not empty, end date not before start date (B11).
- **FR-014**: The owner MUST be able to delete an Event after confirmation. Deleting the active
  Event MUST switch the app to networking without an Event.
- **FR-015**: Deleting an Event with Encounters MUST keep those Encounters, with their dates and
  notes, as without an Event (B38). The confirmation MUST state how many Encounters it has.
  Deleting an Event MUST NOT delete any Encounter or Person (constitution IX).

#### Language

- **FR-016**: The owner MUST be able to choose Dutch or English in Settings; all owner screens
  follow at once and the choice MUST survive closing the app (M3, F0 FR-016).
- **FR-017**: On first start the app language MUST be Dutch (B37). Guest mode (F3) opens in the
  app language; that is built in F3.

#### Delete all data

- **FR-018**: "Delete all data" MUST ask for confirmation with the number of Persons, Encounters
  and Events, state that it cannot be undone, and offer "Make backup first". The delete button
  MUST only work after the owner types "WISSEN" (Dutch) or "DELETE" (English), following the app
  language; upper or lower case and spaces around the word do not matter (B41).
- **FR-019**: After confirmation, the app MUST delete all Persons, Encounters, Events, dismissed
  Actions, the own profile link, the active Event, the daily-choice date, the open note step and
  the last-backup time. Only the language choice MUST remain.

#### General

- **FR-020**: Settings, export and delete MUST NOT be reachable from guest mode (constitution VI).
- **FR-021**: All new texts MUST exist in Dutch and English and follow the app language.

### Key Entities

- **CSV backup** (new, a file, not stored in the app): all Persons, Encounters, Events and notes
  at the moment of export, one row per Encounter (FR-004). Export only (B36).
- **Settings** (exists, F0): uses `language`, `activeEventId`, `lastBackupAt`, `contextChosenOn`,
  `noteStepEncounterId`, `ownerProfileUrl`. New: the local date on which the owner tapped "Later"
  on the backup reminder.
- **Event** (exists): can now be changed and deleted.
- **Encounter** (exists): loses its Event when that Event is deleted (B38); otherwise unchanged.
- **Person**, **Encounter**, **Dismissal**: deleted by "Delete all data"; otherwise not changed by
  F10.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any tab, a backup file is saved to Files in at most 3 taps in the app ("Settings",
  "Make CSV backup", save) and within 3 seconds for 500 Persons.
- **SC-002**: In a test backup, 100% of Persons, Encounters, Events and notes are present and
  readable in Numbers and Excel, including accents, emoji, commas and line breaks.
- **SC-003**: In tests over a multi-day Event and casual networking, the reminder appears on the
  first open after the end date in 100% of cases with new or changed data, and 0 times during an
  Event or on the day of casual networking or of the change.
- **SC-004**: After "Delete all data", 0 Persons, Encounters, Events and dismissed Actions remain,
  and the own profile link is gone.
- **SC-005**: Renaming an Event takes at most 4 taps plus typing, and the new name shows
  everywhere at once.

## Assumptions

- **The reminder is a banner on the Add tab**, not a blocking screen: speed in the moment comes
  first (constitution VIII). It may appear on several days in a row until a backup is made.
- **"Later" means "not today"**: T10 says "the first time the app opens on a day after the end
  date", which holds on each next day too.
- **Sharing the file** (AirDrop, mail) is the owner's own choice through the iPhone; the app itself
  never sends it (constitution IV).
- **Creating Events stays in the daily choice (F1)**; Settings changes and deletes them (B14).
  Choosing the active Event stays in the context bar and daily choice.
- **Not in the backup**: dismissed Actions (working state, not contact data) and the own profile
  link (not a Person, B33). Record IDs are not needed, since there is no import (B36).
- **Column headers and connection status** are written in English (`connected`,
  `notConnected`), whatever the app language, so files from different days look the same.
- **Deleting an Event does not change the Actions tab**: Encounters only lose their Event, so no
  Action opens or closes because of it.
- **Delete all data keeps the language**: it is a device choice, not personal data.
- **No account, no cloud**: backups are files the owner keeps herself (constitution II, IV).
