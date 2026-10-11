# Feature Specification: F8 — Actions tab

**Feature Branch**: `007-actions-tab`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "F8" (F8 — Acties-tab, `specs/features.md`)

Source: F8 in `specs/features.md`; wiki tab "Acties" and Flow C in `wiki/flows.md`; vision
"nobody forgotten" in `wiki/visie.md`; fixed text in `wiki/merk-en-stijl.md`; decisions B6, B7,
B16, B21, B26, B28, B29, L1, L3; constitution I, VI, VIII, IX. Terms follow `wiki/begrippen.md`.
Builds on F2 (note step, "I connected"), F4 ("Paste LinkedIn link", merge question) and F7
(`specs/006-contacts`: tab bar with a "coming soon" Actions tab, Person detail, edit mode for
notes).

## Clarifications

### Session 2026-10-11

- Q: Does a dismissed Action stay dismissed for good, or come back when the Person is met again
  (open question #3)? → A: It comes back after a new Encounter, if the gap still exists (wiki
  B30).
- Q: When is "note missing" open, now that notes belong to an Encounter (B28)? → A: Only when
  **none** of the Person's Encounters has a note. All three Actions therefore belong to a Person;
  "Write note" on the tab writes on the Person's most recent Encounter (wiki B31).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what is still open (Priority: P1)

After a day at a fair, the owner opens the Actions tab. For each person with something left to
do she sees a card with the person's name, company, the Event and date of the last Encounter, and
the open Actions: "note missing", "not connected yet", "profile link missing". The people met most
recently come first. When nothing is open, the tab says "All done — time to flutter on."

**Why this priority**: This is the core of Flow C and of the vision's success criterion: nobody is
forgotten after an event (constitution IX). Without the list, nothing else in F8 has a place.

**Independent Test**: Store Jan (no note, not connected, no profile link), Zoë (note, connected,
profile link) and Piet (note, not connected, profile link). Open Actions: Jan's card shows three
Actions, Piet's card shows "not connected yet", Zoë has no card.

**Acceptance Scenarios**:

1. **Given** stored Persons with open Actions, **When** the owner opens the Actions tab, **Then**
   she sees one card per Person with at least one open Action, the Person met most recently first.
2. **Given** a card, **Then** it shows the Person's name, company (if any), the Event (or
   "Without event") and date of their last Encounter, and each open Action with a short label.
3. **Given** a Person whose `connectionStatus` is "not connected", **Then** their card shows "not
   connected yet".
4. **Given** a Person without a profile link, **Then** their card shows "profile link missing".
5. **Given** a Person none of whose Encounters has a note, **Then** their card shows "note
   missing" (B31). A Person with a note on at least one Encounter does not, even if a newer
   Encounter has none.
6. **Given** no open Actions at all, **Then** the tab shows "Alles gedaan, tijd om verder te
   fladderen." / "All done — time to flutter on." with a small butterfly.

---

### User Story 2 - Solve an Action right there (Priority: P1)

From the card, the owner solves each Action without leaving the tab: she writes the missing note,
opens LinkedIn and taps "I connected", or pastes the profile link. A solved Action disappears at
once; a card without open Actions disappears too.

**Why this priority**: The feature list asks to solve Actions "vanuit de tab". Following up after
an event must be quick: one card, a few taps, done.

**Independent Test**: For Jan (three open Actions): type a note and save → "note missing" is gone;
tap "I connected" → "not connected yet" is gone; paste his profile link → his card is gone and the
empty message appears.

**Acceptance Scenarios**:

1. **Given** "note missing", **When** she taps "Write note", **Then** a note field opens on the
   card for the Person's most recent Encounter (date and Event shown, B31); saving a non-empty
   note stores it on that Encounter and removes the Action. An empty note is not saved.
2. **Given** "not connected yet", **Then** the card offers a real link to LinkedIn (the profile,
   or the search link when the profile link is missing) and an "I connected" button; tapping "I
   connected" stores the status and removes the Action.
3. **Given** "profile link missing", **Then** the card offers "Search on LinkedIn" and "Paste
   LinkedIn link" with the F4 rules; a valid link is stored and the Action disappears. A link that
   belongs to another Person shows F4's merge question (B21); after merging, the cards reflect
   the merged Person.
4. **Given** the last open Action of a card is solved, **Then** the card disappears.
5. **Given** the owner taps the Person's name on a card, **Then** the Person's detail screen (F7)
   opens, and Back returns to the Actions tab.

---

### User Story 3 - Dismiss an Action (Priority: P2)

Not every gap needs closing: some people don't need a note, or she decides not to connect. The
owner dismisses that Action; it disappears from the tab.

**Why this priority**: B6 and the vision say Actions are dismissable; without it the tab never
becomes empty and loses its meaning. P2 because solving is the main path.

**Independent Test**: Dismiss Piet's "not connected yet": his card disappears. Close and reopen
the app: it stays gone.

**Acceptance Scenarios**:

1. **Given** an open Action, **When** she taps "Dismiss" next to it, **Then** it disappears at
   once, without a confirmation, and a status line offers "Undo" until her next change on the tab.
2. **Given** "Undo", **When** she taps it, **Then** the Action is back.
3. **Given** a dismissed Action, **When** the app is closed and reopened, **Then** it is still
   dismissed.
4. **Given** a dismissed Action, **When** the underlying gap is later solved anyway (for example
   she pastes the link from the detail screen), **Then** nothing changes on the tab.
5. **Given** a dismissed Action, **When** the Person is met again (an Encounter saved after the
   dismissal) and the gap still exists, **Then** the Action is open again (B30).
6. **Given** a dismissed Action, **When** an Encounter of the Person is deleted, or two Persons are
   merged, **Then** the Action does not come back because of that: only a newly saved Encounter
   counts.

---

### User Story 4 - Know how much is open (Priority: P2)

The tab bar shows a small badge with the number of open Actions on the Actions tab, so the owner
sees at a glance that follow-up is waiting.

**Why this priority**: The feature list asks for it; it is the reminder that makes the tab work.
P2 because the tab itself works without it.

**Independent Test**: With 4 open Actions, the Actions tab shows "4". Solve one: it shows "3".
Solve or dismiss all: no badge.

**Acceptance Scenarios**:

1. **Given** open Actions, **Then** the Actions tab in the tab bar shows their number.
2. **Given** an Action is solved or dismissed anywhere in the app (Actions tab, Person detail,
   note step), **Then** the number is up to date the next time the tab bar is shown.
3. **Given** no open Actions, **Then** no badge is shown.
4. **Given** more than 99 open Actions, **Then** the badge shows "99+".

---

### Edge Cases

- **A Person with many Encounters, some with a note**: no "note missing" (B31); the notes are
  shown in the F7 timeline.
- **Note step still open today** (B18): the app opens on the note step, so the tab cannot be
  reached until it is closed; afterwards a skipped note is an Action.
- **Person or Encounter deleted** (F7): its Actions disappear; nothing is left behind of its
  dismissals that could affect another Person.
- **Merge** (B21): the merged Person's Actions follow its state after the merge (status
  "connected" if either was, profile link present, notes of both). The Person that remains keeps
  its own dismissals; those of the Person that disappears are dropped.
- **A note added later in the F7 edit mode** removes "note missing" (B29).
- **The only note is cleared in F7, or its Encounter is deleted**: "note missing" is open again,
  unless it was dismissed.
- **Status set to "not connected" again in F7** (after it was "connected"): "not connected yet"
  comes back, unless it was dismissed.
- **Pasting fails** (not a profile link, short link, iOS paste refused): F4's messages appear on
  the card; nothing changes.
- **Opening LinkedIn is blocked or LinkedIn does not load**: nothing changes; she can tap again.
- **Storage full** while solving or dismissing: nothing is half-changed; F0's storage message
  appears and the Action stays.
- **Guest mode (F3)**: the tab bar, and so the Actions tab, is never shown (F7 FR-001c,
  constitution VI).
- **Many open Actions** (for example 300 after a big fair): the tab stays quick to open and scroll.

## Requirements *(mandatory)*

### Functional Requirements

#### Which Actions exist

- **FR-001**: The app MUST derive Actions from the stored data; there are three types (B7):
  "note missing", "not connected yet", "profile link missing".
- **FR-002**: "Not connected yet" MUST be open for every Person whose `connectionStatus` is "not
  connected", unless dismissed.
- **FR-003**: "Profile link missing" MUST be open for every Person without a profile link, unless
  dismissed.
- **FR-004**: "Note missing" MUST be open for every Person none of whose Encounters has a note,
  unless dismissed (B31).
- **FR-005**: An Action MUST disappear as soon as its gap is solved, wherever in the app that
  happens (note step, F7 detail and edit mode, Actions tab).

#### The tab

- **FR-006**: The Actions tab MUST replace F7's "coming soon" screen. It MUST show one card per
  Person with at least one open Action, sorted by the date of the Person's most recent Encounter,
  newest first, then by name.
- **FR-007**: Each card MUST show the Person's name, company (if any), the Event or "Without event"
  and date of the most recent Encounter, and every open Action of that Person with a label, a way
  to solve it (FR-008) and "Dismiss" (FR-009).
- **FR-008**: Solving from the card MUST work as follows:
  - "note missing": "Write note" opens a note field for the Person's most recent Encounter (B31);
    a non-empty note is saved on that Encounter;
  - "not connected yet": a real link that opens the profile (or the search link without a profile
    link) on the same tap, plus "I connected", which stores "connected" at once;
  - "profile link missing": "Search on LinkedIn" (real link) and "Paste LinkedIn link" with F4's
    rules, including the merge question (B21).
- **FR-009**: "Dismiss" MUST hide that Action at once, without confirmation, with "Undo" until the
  next change on the tab. Dismissals MUST be kept on the device and survive closing the app.
- **FR-009a**: A dismissed Action MUST be open again when the Person has an Encounter saved after
  the dismissal and the gap still exists (B30). Deleting Encounters or merging Persons MUST NOT
  bring it back.
- **FR-010**: Tapping the Person's name MUST open the F7 detail screen for that Person; Back returns
  to the Actions tab.
- **FR-011**: When no Action is open, the tab MUST show the fixed text "Alles gedaan, tijd om
  verder te fladderen." / "All done — time to flutter on." (`wiki/merk-en-stijl.md`).

#### Badge

- **FR-012**: The Actions tab in the tab bar MUST show the number of open Actions as a badge, "99+"
  above 99, and no badge at 0. The number MUST be current every time the tab bar is shown.

#### General

- **FR-013**: Notes MUST NOT be shown on the Actions tab; it only says that a note is missing. The
  tab is never reachable from guest mode (constitution VI).
- **FR-014**: The app MUST NOT send anything to LinkedIn or any server; LinkedIn is only opened as
  a link (constitution I, IV).
- **FR-015**: All new texts MUST exist in Dutch and English.

### Key Entities

- **Action** (derived, not stored): a type ("note missing", "not connected yet", "profile link
  missing") and the Person it belongs to (B31). Open when the gap exists and it is not dismissed,
  or was dismissed before the Person's newest Encounter was saved (B30).
- **Dismissal** (new, stored on the device): which Action the owner dismissed: the type, the
  Person, and when. Must be sync-ready like every record (constitution IV).
- **Person**, **Encounter**, **Event**: as in F0–F7; F8 changes `connectionStatus`,
  `profileUrl` and Encounter `note` through the existing rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After an event, 100% of Persons with an open gap (per FR-002–FR-004) appear on the
  Actions tab, unless the Action was dismissed.
- **SC-002**: Solving "not connected yet" takes at most 2 taps from the tab (open LinkedIn, "I
  connected"), plus the Connect tap inside LinkedIn.
- **SC-003**: Solving "note missing" takes at most 2 taps plus typing ("Write note", save).
- **SC-004**: 100% of solved or dismissed Actions disappear from the tab at once, and the badge
  shows the right number the next time the tab bar is shown.
- **SC-005**: With 300 open Actions the tab opens and scrolls without a noticeable wait (under
  half a second on the owner's iPhone).
- **SC-006**: Dismissals survive closing and reopening the app in 100% of cases.

## Assumptions

- **One card per Person**, not one row per Action: the owner thinks in people ("did I finish
  Jan?"), and one card avoids repeating name and company.
- **All Actions, from every Event and casual networking**, in one list; newest first puts the last
  event on top. Filtering per Event is not part of F8 (the F8 list does not name it).
- **Dismiss has no confirmation but has Undo**: dismissing is quick and easily reversed, unlike
  deleting (constitution VIII).
- **No list of dismissed Actions** to bring them back later; only Undo right after dismissing. A
  dismissed gap can still be solved from the F7 detail screen.
- **Actions appear right away**, also during the event (for example a skipped note); the badge is
  a quiet number, no notification.
- **All three Actions belong to the Person** (B31): the status and the link are stored on the
  Person, and "note missing" looks at all of the Person's Encounters.
- **The Person detail opened from a card** is the F7 screen; its Back returns to the Actions tab.
- **Internet is required** (T6) to open LinkedIn; the list, notes, status and dismissals work from
  the data on the device.
