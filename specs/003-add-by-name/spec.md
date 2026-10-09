# Feature Specification: F2 — Add by Name (Quick Mode)

**Feature Branch**: `003-add-by-name`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "F2 from features.md" (F2 — Toevoegen via naam (snelle modus))

Source: F2 in `specs/features.md`; wiki Flow A and Flow D in `wiki/flows.md`; decisions B4, B6, B8,
B15, B16, B17, L2, L3, T6. Terms follow `wiki/begrippen.md`. Builds on F0
(`specs/001-app-foundation`: Person, Encounter, `searchUrl`, `connectionStatus`) and F1
(`specs/002-events`: the active Event and the rule that a new Encounter gets it automatically).

## Clarifications

### Session 2026-10-09

- Q: Same name as an existing Person without a profile URL (open question #1)? → A: Ask "Is this
  the same person?"; yes adds the Encounter to the existing Person (wiki B15).
- Q: How is the connection status set to "connected" (open question #2)? → A: An "I connected"
  switch on the note step, shown after returning from LinkedIn (wiki B16).
- Q: Is the company required (open question #4)? → A: No, optional; when empty, LinkedIn is
  searched with the name only (wiki B17). Whether a QR scan stores a company stays open for F5.
- Q: If iOS closes the app while the owner is in LinkedIn, does the note step come back on reopen?
  → A: Yes, as long as it is still the same day and she has not started adding another person.
- Q: (after the iPhone check) iOS blocks opening LinkedIn after the save; accept 3 taps, or let the
  tap open LinkedIn directly while saving at the same moment? → A: Open directly (wiki B20).
- Q: She picks an existing Person who already has an Encounter today in the same context: new
  Encounter or reuse? → A: Rare. No new Encounter; the app says she already met this person today
  and shows the note step for today's Encounter.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add someone by name and find them on LinkedIn (Priority: P1)

The owner is talking to someone at a fair. She opens quick mode, types their name and, if she
knows it, their company, and taps "Search on LinkedIn". That tap opens the LinkedIn people search
and saves the Person and the Encounter at the same moment (B20). The person points at their own profile; the owner
taps Connect in LinkedIn herself.

**Why this priority**: This is the core of the app (constitution Purpose, Flow A). Without it the
owner cannot add anyone, and F1's active Event has nothing to attach to.

**Independent Test**: With an active Event, add "Jan Peeters" from "Elmos" and tap "Search on
LinkedIn". LinkedIn opens a people search for "Jan Peeters Elmos". Close and reopen the app: Jan
Peeters is stored, with an Encounter for today under the active Event.

**Acceptance Scenarios**:

1. **Given** an active Event, **When** the owner enters a name and company and taps "Search on
   LinkedIn", **Then** the same tap opens a LinkedIn people search with the name and company, and
   a Person and an Encounter are saved (B20).
2. **Given** casual networking, **When** she adds someone, **Then** the Encounter is saved without
   an Event.
3. **Given** the form, **When** the name is empty or only spaces, **Then** "Search on LinkedIn"
   cannot be tapped.
4. **Given** the form, **When** she leaves the company empty and taps "Search on LinkedIn",
   **Then** the Person is saved without a company and LinkedIn searches with the name only.
5. **Given** a saved Person, **When** the owner looks at the stored data, **Then** it has the name,
   the company (if given), the search link, the status "not connected", and an Encounter with
   today's date.
6. **Given** she tapped "Search on LinkedIn", **When** the app is closed by iOS while she is in
   LinkedIn, **Then** the Person and Encounter are still stored when she reopens the app.

---

### User Story 2 - Recognise someone she already met (Priority: P1)

The owner adds "Jan Peeters", but a Jan Peeters is already stored. Before saving, the app asks
"Is this the same person?" and shows the stored Jan Peeters with company and last meeting date.
She taps "Yes": the new Encounter is added to the existing Person. Or she taps "No, new person":
a new Person is saved.

**Why this priority**: The constitution forbids silent duplicates (IX). Without this, F2 would
create a second Jan Peeters without the owner knowing.

**Independent Test**: Add "Jan Peeters" once. Add "jan peeters " again: the question appears.
Tap "Yes": there is still one Jan Peeters, now with two Encounters. Add "Jan Peeters" a third time
and tap "No, new person": there are two Persons named Jan Peeters.

**Acceptance Scenarios**:

1. **Given** a stored Person with the same name (ignoring case and extra spaces), **When** the owner
   taps "Search on LinkedIn", **Then** the app asks "Is this the same person?" before saving
   anything, showing each match with company and date of the last Encounter.
2. **Given** the question, **When** she picks an existing Person, **Then** a new Encounter (today,
   current context) is added to that Person, no new Person is created, and LinkedIn opens that
   Person's profile URL, or the search link when there is none.
3. **Given** the question, **When** she taps "No, new person", **Then** a new Person and Encounter
   are saved as in User Story 1.
4. **Given** the question, **When** she goes back, **Then** nothing is saved and the form keeps
   what she typed.
5. **Given** no stored Person with the same name, **When** she taps "Search on LinkedIn", **Then**
   no question appears.
6. **Given** the chosen Person already has an Encounter today in the current context, **When** she
   picks that Person, **Then** no new Encounter is saved, the app tells her she already met this
   person today, and the note step for today's Encounter appears with its existing note. LinkedIn
   does not open.

---

### User Story 3 - Note and connection status right after LinkedIn (Priority: P2)

When the owner comes back from LinkedIn, the app shows a note step for the Encounter she just
saved, for example "Works on the payment app, wants to talk about testing". On the same step she
switches on "I connected" if she tapped Connect in LinkedIn. She saves the note or skips it and is
back at the start screen, ready for the next person.

**Why this priority**: The note is what makes the later message personal (B3, B6), and setting the
status on the spot keeps the Actions tab short (B7, B16). Both are optional by design
(constitution VIII). P2 because the Encounter is already safe without them.

**Independent Test**: Add someone, return to the app, switch on "I connected", type a note and
save: the Encounter has that note and the Person is "connected". Add a second person and tap
"Skip" without touching the switch: the Encounter has no note and the Person is "not connected".

**Acceptance Scenarios**:

1. **Given** the owner just tapped "Search on LinkedIn", **When** she returns to the app, **Then** a
   note step for that Encounter is shown, with the person's name so she knows who it is for.
2. **Given** the note step, **When** she types a note and saves, **Then** the note is stored on
   that Encounter and the start screen appears.
3. **Given** the note step, **When** she taps "Skip" (or saves an empty note), **Then** no note is
   stored and the start screen appears.
4. **Given** the note step, **When** she switches on "I connected", **Then** the Person's status is
   "connected" at once, whether she then saves or skips the note.
5. **Given** the note step, **When** she does not touch the switch, **Then** the status stays
   "not connected".
6. **Given** she added an Encounter to an existing Person who is already "connected", **When** the
   note step appears, **Then** the switch is already on.
7. **Given** iOS closed the app while she was in LinkedIn, **When** she reopens the app on the same
   day, **Then** the note step for that Encounter appears again.
8. **Given** an unfinished note step, **When** she opens the app on a later day, or opens quick mode
   for another person, **Then** that note step does not come back.

---

### Edge Cases

- **App closed by iOS while in LinkedIn**: the Person and Encounter are already saved (US1
  scenario 6). On reopen the same day, the note step comes back (US3 scenario 7). Once it is
  dropped (next day, or another person started), the missing note and "not connected" become
  Actions in F8.
- **LinkedIn does not open or finds nobody** (typo, no internet, person not on LinkedIn): the
  Person is still saved with the search link. The owner can open it again later from F7 or remove
  the Person there.
- **No internet when tapping "Search on LinkedIn"**: the Person and Encounter are saved first;
  F0's offline banner explains why LinkedIn does not load.
- **Same name as an existing Person**: the app asks "Is this the same person?" (US2, wiki B15).
  Only the name counts for the match; the company helps the owner choose.
- **Several stored Persons with the same name**: all are listed, plus "No, new person".
- **Same Person twice on one day, same context**: rare. No second Encounter; the app says she
  already met this person today and shows today's note step (FR-007a). Same day but another
  Event is a new Encounter.
- **Same name, different company typed**: the question still appears. Choosing the existing Person
  keeps its stored name and company; editing a Person is not part of F2.
- **Name with extra spaces or a very long name**: spaces at the start and end are removed; long
  names and companies are cut off on screen, not refused.
- **Tapping "Search on LinkedIn" twice quickly**: only one Person and one Encounter are saved.
- **Back from the form without searching**: nothing is saved.
- **Storage full**: nothing is half-saved; F0's storage message appears and the form keeps what
  the owner typed.

## Requirements *(mandatory)*

### Functional Requirements

#### Opening quick mode

- **FR-001**: The start screen MUST offer a way to add someone by name in quick mode with one tap.
- **FR-002**: The quick mode form MUST show the current context (active Event or casual
  networking), so the owner sees where the Encounter will be stored.

#### The form

- **FR-003**: The form MUST have a name field (required) and a company field (optional, wiki B17).
- **FR-004**: "Search on LinkedIn" MUST be unavailable while the name is empty or only spaces.
- **FR-005**: The owner MUST be able to leave the form without saving anything.

#### Same name

- **FR-006**: Before saving, the app MUST check for stored Persons with the same name, ignoring
  case and extra spaces. When there is a match, it MUST ask "Is this the same person?" and show
  each match with its company and the date of its last Encounter (wiki B15).
- **FR-007**: Choosing an existing Person MUST add the new Encounter to that Person and MUST NOT
  create a new Person or change the existing Person's name or company.
- **FR-007a**: When the chosen Person already has an Encounter today in the current context (same
  Event, or both casual networking), the app MUST NOT save a new Encounter. It MUST tell the owner
  she already met this person today and show the note step for today's Encounter, with its
  existing note filled in, without opening LinkedIn. Skipping keeps the existing note.
- **FR-008**: Choosing "No, new person" MUST save a new Person. Going back from the question MUST
  save nothing and keep the form's input.

#### Saving and searching

- **FR-009**: Tapping "Search on LinkedIn" (or a choice in the same-name question) MUST open
  LinkedIn on that tap itself and start saving the Encounter, and the Person when new, at the same
  moment (B20; except FR-007a). The same-name check MUST be done before that tap, while the owner
  types. Saving MUST be complete or not happen at all: never a Person without its Encounter
  (constitution IX).
- **FR-010**: A new Person MUST have the name, the company (if given) and the LinkedIn people-search
  link. The search keywords are the name, followed by the company when given; with no company the
  name alone. It has no profile URL yet (F4 adds it).
- **FR-011**: For an existing Person, the app MUST open its profile URL when known, and its search
  link otherwise.
- **FR-012**: The saved Encounter MUST have today's date and the active Event, or no Event during
  casual networking (F1 FR-009). The owner MUST NOT choose an Event in the form.
- **FR-013**: The app MUST open LinkedIn only through the profile URL or the people-search link; it
  MUST NOT read anything back from LinkedIn or connect on the owner's behalf (constitution I, L1,
  L2).
- **FR-014**: A new Person MUST get the connection status "not connected".

#### Note and connection status

- **FR-015**: After "Search on LinkedIn", the app MUST show a note step for the new Encounter, with
  the person's name. It is visible when the owner returns from LinkedIn, also when iOS closed the
  app meanwhile: an unfinished note step MUST come back on reopen as long as it is the same day and
  the owner has not opened quick mode for another person. Otherwise it is dropped.
- **FR-016**: The note step MUST be skippable with one tap. An empty note counts as skipped. After
  saving or skipping, the start screen appears.
- **FR-017**: A note MUST be stored on the Encounter (the current model, F0), never shown to
  guests.
- **FR-018**: The note step MUST have an "I connected" switch (wiki B16). It shows the Person's
  current status. Changing it MUST store the new status at once, independent of saving or skipping
  the note.

#### Language

- **FR-019**: All new texts MUST exist in Dutch and English (F0 FR-015).

### Key Entities

No new entities or fields. F2 uses what F0 and F1 defined:

- **Person**: name, optional company, `searchUrl`, `connectionStatus` ("not connected" for a new
  Person; the owner can set "connected" on the note step). No `profileUrl` yet for a new Person;
  that comes in F4.
- **Encounter**: the Person, today's date, the active Event (or none), and an optional note.
- **Settings.activeEventId**: decides the Encounter's Event (F1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the start screen, the owner gets LinkedIn's search results for a new person
  with typing the name (and company) plus at most 2 taps; 1 extra tap only when the name matches a
  stored Person.
- **SC-002**: The whole add flow, including skipping the note, takes under 30 seconds of the
  owner's time in the app (not counting time in LinkedIn).
- **SC-003**: 100% of Persons for which "Search on LinkedIn" was tapped are still stored after the
  app is closed or killed while in LinkedIn.
- **SC-004**: 100% of Encounters created in quick mode have today's date and the context that was
  active when they were saved.
- **SC-005**: 0 Persons are stored without an Encounter.
- **SC-006**: 0 Persons with the same name are created without the owner having answered "No, new
  person".
- **SC-007**: Setting the status to "connected" takes 1 tap on the note step.

## Assumptions

- **Guest mode is F3**: F2 builds only quick mode (the owner types). F3 reuses the same save and
  search flow behind a guest-friendly screen.
- **Pasting the profile link is F4**: F2 stores only the search link. Flow A step 5 ("Plak
  LinkedIn-link") is out of scope here. Merging two Persons with the same profile URL is F4 (B8).
- **No separate "save without searching" button**: searching is the point of the flow (L2) and
  saving happens on the same tap, so one button is enough (constitution VIII, YAGNI).
- **Name match**: exact name after trimming, ignoring upper/lower case and repeated spaces. No
  fuzzy matching (typos, accents); the company is not part of the match.
- **Name and company length**: trimmed; at most 100 characters each; longer text is cut off on
  screen, not refused.
- **Note**: free text, trimmed, on the Encounter (current model). If open question #5 later moves
  notes to the Person, F6 handles that.
- **Connection status later**: changing the status after the note step is F7; the "not yet
  connected" Action is F8.
- **Contact list, editing, deleting and Actions** (missing note, not connected, missing profile
  link) are F7 and F8. F2 only makes sure the data for them is stored.
- **Internet is required** (T6). F2 adds no offline behaviour beyond F0's banner.
