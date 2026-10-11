# Feature Specification: F7 — Contacts

**Feature Branch**: `006-contacts`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "F7" (F7 — Contacten, `specs/features.md`)

Source: F7 in `specs/features.md`; wiki tab "Contacten" and Flow C step 3 in `wiki/flows.md`;
decisions B8, B12, B16, B21, L1, L3; constitution I, V, VI, IX. Terms follow
`wiki/begrippen.md`. Builds on F0 (`specs/001-app-foundation`: Person, Encounter, Event, deleting
a Person with its Encounters), F2 (`specs/003-add-by-name`: search link, connection status),
F4 (`specs/004-link-profile`: "Paste LinkedIn link", merge question) and F5
(`specs/005-add-by-qr`).

## Clarifications

### Session 2026-10-11

- Q: Is deleting a single Encounter part of F7 (constitution VI)? → A: Yes. Deleting the last
  Encounter of a Person offers to delete the whole Person (wiki B25).
- Q: Does F7 add the tab bar, or only a "Contacts" button? → A: F7 adds the full tab bar: "Add"
  (the start screen) plus Contacts, Actions, My QR and Settings. Tabs not built yet show a short
  "coming soon" screen (wiki B26).
- Q: Can the owner edit name and company on the detail screen (constitution V)? → A: Yes, both
  (wiki B27).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See who I met at an Event (Priority: P1)

After a day at a fair, the owner opens Contacts. She sees the people she met at the active Event,
newest first, each with name, company and connection status. She can switch the list to another
Event, to people met without an Event, or to all contacts.

**Why this priority**: Until now there is no way to see stored people in the app at all. Without
the list, nothing else in F7 can be reached.

**Independent Test**: Store three Persons under Event "Devoxx 2026" and one without an Event.
Open Contacts: the three Devoxx Persons are shown. Switch to "All contacts": four are shown.
Switch to "Without Event": one is shown.

**Acceptance Scenarios**:

1. **Given** an active Event, **When** the owner opens Contacts, **Then** the list shows the
   Persons with at least one Encounter at that Event, the most recently met first.
2. **Given** casual networking (no active Event), **When** she opens Contacts, **Then** the list
   shows all contacts.
3. **Given** the list, **When** she picks another Event, "Without Event" or "All contacts",
   **Then** the list shows only the matching Persons, and the chosen view is visible above the
   list.
4. **Given** each row, **Then** it shows the Person's name, company (if any), connection status,
   and the date of the last Encounter in the chosen view.
5. **Given** a Person met at two Events, **Then** that Person appears once in each Event's list
   and once in "All contacts".
6. **Given** a view with no Persons, **Then** a short, friendly empty message is shown with a way
   to add someone.

---

### User Story 2 - Find someone by name (Priority: P1)

The owner remembers "Jan something" and types "jan" in the search field. The list narrows while
she types.

**Why this priority**: After a few events the list is too long to scroll. Finding a person fast
is the start of every follow-up (Flow C).

**Independent Test**: Store "Jan Peeters" and "Janne De Smet" and "Piet Jansen". Type "jan": all
three are shown. Type "peet": only Jan Peeters is shown.

**Acceptance Scenarios**:

1. **Given** the list, **When** she types in the search field, **Then** only Persons whose name
   contains the typed text are shown, without pressing a search button.
2. **Given** the search, **Then** upper and lower case, extra spaces and accents do not matter
   ("zoe" finds "Zoë").
3. **Given** a search with no results, **Then** a message says nobody matches, with a way to
   clear the search.
4. **Given** a search, **When** she switches the view (User Story 1), **Then** the search stays
   and applies to the new view.

---

### User Story 3 - Look at one person and open LinkedIn (Priority: P1)

The owner taps a Person in the list. The detail screen shows the name, company, connection status,
whether the profile link is known, and a timeline of all Encounters: date, Event (or "Without
Event") and the note. One tap on "Open in LinkedIn" opens the profile, or the search link if the
profile link is still missing. She writes and sends her message herself in LinkedIn.

**Why this priority**: This is Flow C step 3: read the note, open LinkedIn, send a personal
message. It is the reason to store notes at all.

**Independent Test**: Store Jan Peeters with a profile link and two Encounters (Devoxx with note
"talked about Kotlin", and one without an Event, no note). Open his detail: both Encounters are
shown, newest first, with the note. Tap "Open in LinkedIn": his profile opens.

**Acceptance Scenarios**:

1. **Given** the list, **When** she taps a Person, **Then** the detail screen opens with name,
   company, connection status and the timeline of all that Person's Encounters, newest first,
   from every Event (not only the chosen view).
2. **Given** each Encounter in the timeline, **Then** it shows the date, the Event name or
   "Without Event", and the note in full; an Encounter without a note says that there is no note.
3. **Given** a Person with a profile link, **When** she taps "Open in LinkedIn", **Then** that tap
   opens the profile link.
4. **Given** a Person without a profile link, **When** she taps "Open in LinkedIn", **Then** that
   tap opens the stored search link, and the screen makes clear it is a search, not the profile.
5. **Given** a Person without a profile link, **Then** the detail screen offers "Paste LinkedIn
   link" (F4), including the merge question when the link belongs to another Person (B21).
6. **Given** the detail screen, **When** she goes back, **Then** the list returns with the same
   view, search and scroll position.

---

### User Story 4 - Change the connection status (Priority: P2)

The owner forgot to tap "I connected" at the fair (B16), or tapped it by mistake. On the detail
screen she changes the status to "connected" or back to "not connected".

**Why this priority**: B16 promises that the status can be changed later in F7. Without it, the
"not yet connected" Action (F8) can never be solved after the note step. P2 because the add
flows already set it in most cases.

**Independent Test**: Open a Person with status "not connected"; change it to "connected"; go back:
the list row shows "connected". Close and reopen the app: the status is still "connected".

**Acceptance Scenarios**:

1. **Given** a Person with status "not connected", **When** she sets it to "connected", **Then**
   the status is saved at once and shown on the detail screen and in the list.
2. **Given** a Person with status "connected", **When** she sets it to "not connected", **Then**
   the status is saved at once.
3. **Given** a status change, **Then** it takes one tap and needs no extra confirmation.

---

### User Story 5 - Delete a person (Priority: P2)

Someone asks the owner to remove their data, or she stored a person by mistake. On the detail
screen she deletes the Person. The app first asks for confirmation and says how many Encounters
and notes will be removed.

**Why this priority**: The constitution (VI) requires that the owner can always delete any
Person; the "ready for the first fair" list requires it. P2 because it is rare.

**Independent Test**: Open a Person with two Encounters; tap "Delete person"; the confirmation
names the Person and "2 encounters". Confirm: the Person is gone from every list, and searching
for the name finds nothing. Cancel instead: nothing changes.

**Acceptance Scenarios**:

1. **Given** the detail screen, **When** she taps "Delete person", **Then** a confirmation shows
   the Person's name and the number of Encounters that will be deleted, and that this cannot be
   undone.
2. **Given** the confirmation, **When** she confirms, **Then** the Person and all their
   Encounters and notes are deleted together, and she returns to the list without that Person.
3. **Given** the confirmation, **When** she cancels, **Then** nothing is deleted.
4. **Given** a Person whose note step was open today (B18), **When** that Person is deleted,
   **Then** the note step does not come back for them.

---

### User Story 6 - Delete one Encounter (Priority: P3)

The owner stored an Encounter under the wrong Event, or twice by mistake. In the timeline she
deletes that one Encounter; the Person and the other Encounters stay. If it is the Person's only
Encounter, the app offers to delete the whole Person instead (B25).

**Why this priority**: The constitution (VI) requires that any Encounter can be deleted. P3
because it is rare and the Person stays reachable either way.

**Independent Test**: Open a Person with two Encounters; delete the older one after confirming:
one Encounter remains, the Person is still in the list. Open a Person with one Encounter; tap
delete on it: the app asks to delete the whole Person.

**Acceptance Scenarios**:

1. **Given** a Person with two or more Encounters, **When** she deletes one Encounter, **Then** a
   confirmation shows its date, Event (or "Without Event") and whether it has a note; after
   confirming, only that Encounter and its note are deleted.
2. **Given** an Encounter was deleted, **Then** the Person leaves the views where they no longer
   have an Encounter (for example that Event's list) and stays in the others.
3. **Given** a Person with exactly one Encounter, **When** she deletes it, **Then** the
   confirmation says that the whole Person will be deleted, as in User Story 5; confirming
   deletes the Person, cancelling deletes nothing.
4. **Given** the Encounter whose note step was open today (B18), **When** it is deleted, **Then**
   the note step does not come back for it.

---

### User Story 7 - Correct a name or company (Priority: P3)

A name derived from a QR link was wrong ("Jan Peeters" should be "Jan Peeters-Maes"), or the
person changed jobs. On the detail screen the owner edits the name and the company (B27,
constitution V).

**Why this priority**: The constitution (V) says a QR-derived name must remain editable. P3
because the add flows already let her correct the name before saving.

**Independent Test**: Open Jan Peeters; change the name to "Jan Peeters-Maes" and the company to
"Elmos"; save. The list shows the new name and company, and searching for "maes" finds him.

**Acceptance Scenarios**:

1. **Given** the detail screen, **When** she edits the name and company and saves, **Then** the
   new values are shown on the detail screen and in the list.
2. **Given** an emptied name, **Then** saving is not possible until there is a name.
3. **Given** an emptied company, **Then** the Person is saved without a company.
4. **Given** a Person without a profile link, **When** the name or company changes, **Then**
   "Open in LinkedIn" searches for the new name and company.
5. **Given** she cancels the edit, **Then** nothing changes.

---

### Edge Cases

- **Person with many Encounters** (for example ten Events): the timeline shows them all; the list
  row still shows one line per Person.
- **Two Persons with the same name** (different profile links): both appear; company and last
  date tell them apart.
- **An Encounter whose Event was deleted** cannot happen: deleting an Event with Encounters is
  refused (F0). Managing Events is F10 (B14).
- **Long names, companies and notes**: names and companies are shortened in the list but shown in
  full on the detail screen; notes are always shown in full.
- **Encounter today in the current context**: it appears in the list and timeline right away.
- **Opening LinkedIn is blocked or LinkedIn does not load**: nothing changes in the app; she can
  tap again.
- **Pasting a link on the detail screen that leads to a merge** (B21): after merging, the detail
  screen shows the merged Person with all Encounters.
- **Storage full or another storage error while changing the status or deleting**: nothing is
  half-changed; F0's storage message appears.
- **Guest mode (F3)**: Contacts, the detail screen and notes are never reachable from it
  (constitution VI).
- **Empty app** (no Persons at all): Contacts shows the empty message from User Story 1.

## Requirements *(mandatory)*

### Functional Requirements

#### Reaching Contacts

- **FR-001**: F7 MUST add a tab bar with five tabs: "Add" (the start screen: context bar, "Add by
  name", "Scan QR"), "Contacts", "Actions", "My QR" and "Settings" (B26). One tap switches tabs.
- **FR-001a**: Tabs that are not built yet (Actions F8, My QR F9, Settings F10) MUST show a short,
  friendly "coming soon" screen and nothing else.
- **FR-001b**: The app MUST open on the "Add" tab, so adding a person stays as fast as before
  (constitution VIII).
- **FR-001c**: The tab bar MUST NOT be shown during the daily choice (F1), the add flows (F2, F5),
  the note step or guest mode (F3), so these screens stay focused and a guest cannot leave guest
  mode through it.
- **FR-002**: Contacts and the detail screen MUST NOT be reachable from guest mode (constitution
  VI).

#### List

- **FR-003**: The list MUST offer these views: each Event, "Without Event" (casual networking,
  B12) and "All contacts". It MUST open on the active Event, or on "All contacts" during casual
  networking.
- **FR-004**: A Person MUST appear in an Event's view when at least one of their Encounters
  belongs to that Event; in "Without Event" when at least one Encounter has no Event; in
  "All contacts" always. A Person appears at most once per view.
- **FR-005**: The list MUST be sorted by the date of the most recent Encounter in the chosen view,
  newest first; ties by name.
- **FR-006**: Each row MUST show name, company (if any), connection status and the date of the
  last Encounter in the view.
- **FR-007**: The Event picker MUST list Events newest first by start date.

#### Search

- **FR-008**: A search field MUST filter the current view on the Person's name while typing.
  Matching MUST ignore upper/lower case, extra spaces and accents, and match any part of the
  name.

#### Detail

- **FR-009**: The detail screen MUST show name, company, connection status, whether a profile
  link is known, and all of the Person's Encounters (date, Event or "Without Event", note),
  newest first.
- **FR-010**: Notes MUST be shown read-only in F7. Adding and editing notes is F6.
- **FR-011**: "Open in LinkedIn" MUST open the profile link on that tap, or the search link when
  there is no profile link (constitution I: only opening LinkedIn links). The label or a short
  line MUST say which one opens.
- **FR-012**: When the profile link is missing, the detail screen MUST offer "Paste LinkedIn
  link" with the F4 rules (cleaning up, refusing other links, merge question B21).

#### Changing and deleting

- **FR-013**: The owner MUST be able to set the connection status to "connected" or "not
  connected" in one tap on the detail screen (B16). The change MUST be saved at once.
- **FR-014**: The owner MUST be able to delete a Person after a confirmation that names the Person
  and the number of Encounters. Deleting MUST remove the Person and all their Encounters and
  notes together, or nothing at all (constitution IX).
- **FR-014a**: The owner MUST be able to delete one Encounter after a confirmation that shows its
  date, Event and whether it has a note (B25). Deleting the only Encounter of a Person MUST instead
  ask to delete the whole Person, with the FR-014 rules.
- **FR-014b**: The owner MUST be able to edit a Person's name and company on the detail screen
  (B27, constitution V). The name MUST NOT be empty; an empty company removes it. The profile link
  and the Person's identity MUST NOT change. When there is no profile link, the search link MUST
  follow the new name and company.
- **FR-015**: Nothing in F7 MUST change or delete data without an explicit tap by the owner.

#### General

- **FR-016**: All new texts MUST exist in Dutch and English, following the app language.
- **FR-017**: F7 MUST NOT send any data to a server and MUST NOT fetch anything from LinkedIn
  (constitution I, IV).

### Key Entities

No new entities or fields. F7 reads and changes what F0, F2, F4 and F5 defined:

- **Person**: `name` and optional `company` (editable in F7), `profileUrl` (optional, unique,
  not changed by editing), `searchUrl` (follows name and company while there is no profile
  link), `connectionStatus` (changed in F7).
- **Encounter**: `date`, optional Event (none = casual networking), optional `note`. Shown in the
  timeline; deleted on its own (B25) or together with the Person.
- **Event**: `name`, `startDate`; used for the views and the timeline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the start screen, the owner opens a known Person's profile in LinkedIn with at
  most 4 taps (Contacts, type or pick, tap the Person, "Open in LinkedIn").
- **SC-002**: With 500 stored Persons, the list and search results update while typing without a
  noticeable wait (under half a second).
- **SC-003**: 100% of a Person's Encounters appear in their timeline, whichever Event they belong
  to.
- **SC-004**: After deleting a Person, 0 Encounters or notes of that Person remain anywhere in the
  app.
- **SC-005**: A connection status change survives closing and reopening the app in 100% of cases.
- **SC-006**: In a walk-through of guest mode, Contacts and notes are reachable 0 times.
- **SC-007**: From the app's first screen, adding a person takes no more taps than before F7
  (SC-001 of F2 and F5 still hold).
- **SC-008**: After deleting one Encounter, 100% of the Person's other Encounters and notes
  remain.

## Assumptions

- **Notes are read-only here.** Writing a note later and editing it is F6, which waits for open
  question #5 (note per Encounter or per Person). F7 shows notes per Encounter, as the current
  model stores them.
- **Editing a name to one that another Person already has** is allowed without a question:
  identity is the profile link (constitution V), and two people can share a name.
- **Tab order**: "Add" first, then Contacts, Actions, My QR, Settings, as listed in
  `wiki/flows.md`.
- **The language switch and Diagnostics** stay on the "Add" tab until Settings (F10) is built.
- **Removing a profile link** without replacing it is not part of F7 (F4 left it open; no one asked
  for it).
- **Actions** (missing note, not connected, missing link) are not shown as a list here; that is
  F8. The detail screen shows the underlying state (status, link known or not).
- **Search covers the name only**, as the F7 list says. Company is shown in the row to tell
  people apart.
- **Same opening behaviour as F2/F5**: "Open in LinkedIn" is a real link, so the tap opens
  LinkedIn on the iPhone (B20).
- **Internet is required** (T6) to open LinkedIn; the list, search, detail and delete work from
  the data on the device.
- **Managing Events** (rename, delete) stays in F10 (B14).
- **Volume**: a few hundred Persons over a year of events; 500 is the test size for SC-002.
