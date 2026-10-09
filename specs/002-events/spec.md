# Feature Specification: F1 — Events

**Feature Branch**: `002-events`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "F1 - evenementen (features.md file)"

Source: F1 in `specs/features.md`; wiki decisions B5, B11, B12. Terms follow `wiki/begrippen.md`.
Builds on F0 (`specs/001-app-foundation`): the Event and Settings data model already exist.

## Clarifications

### Session 2026-10-09

- Q: When does the choice between an Event, a new Event and casual networking appear on opening? → A: On the first opening of each new day, with yesterday's choice on top if that Event is still running.
- Q: Can the owner change or delete an Event in F1, or is that F10? → A: Entirely in F10 ("Evenementen beheren"); F1 only creates and chooses Events.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an Event on arrival (Priority: P1)

The owner arrives at a conference or fair. She creates the Event with a name, a start date and
an end date, and it immediately becomes the active Event. From then on, every new Encounter
belongs to it without her choosing it again.

**Why this priority**: Decision B5 ("choose the active Event on arrival") is the reason Events
exist: it saves a choice per contact at a busy event (constitution VIII).

**Independent Test**: Create a one-day Event and a three-day Event; check that each becomes the
active Event right after saving and that an end date before the start date is refused.

**Acceptance Scenarios**:

1. **Given** no active Event, **When** the owner enters "Devoxx 2026", keeps the suggested dates
   and saves, **Then** a one-day Event for today exists and is the active Event.
2. **Given** the create form, **When** she sets start 6 October and end 8 October, **Then** a
   three-day Event is saved and is the active Event.
3. **Given** the create form, **When** she sets an end date before the start date, **Then** the
   Event cannot be saved and she sees why.
4. **Given** the create form, **When** she leaves the name empty, **Then** the Event cannot be
   saved and she sees why.

---

### User Story 2 - Choose how to network when opening the app (Priority: P1)

When the owner opens the app, she can choose: continue with an existing Event, create a new
Event, or network without an Event ("casual networking", B12).

**Why this priority**: Decision B12 makes this choice part of opening the app; without it, the
owner cannot switch between Events and casual networking.

**Independent Test**: With two Events stored, open the app and choose each option once; check
that the start screen shows the chosen context every time. Change the phone's date to the next
day and reopen: the choice appears again.

**Acceptance Scenarios**:

1. **Given** at least one stored Event, **When** the choice appears, **Then** it lists the
   Events (current and upcoming first, with their dates), "New event" and "Casual networking".
2. **Given** the choice, **When** she taps an existing Event, **Then** it becomes the active
   Event and the start screen opens.
3. **Given** the choice, **When** she taps "Casual networking", **Then** there is no active
   Event and the start screen says she is networking without an Event.
4. **Given** no stored Events, **When** the choice appears, **Then** it shows only "New event" and
   "Casual networking".
5. **Given** the owner already chose today, **When** she opens the app again the same day,
   **Then** the start screen opens directly, without the choice.
6. **Given** she chose a three-day Event yesterday, **When** she opens the app on day 2, **Then**
   the choice appears with that Event on top, and one tap continues with it.

---

### User Story 3 - See and change the current context (Priority: P2)

On the start screen, the owner always sees whether she is at an Event (name and dates) or
networking casually, and can change it in one tap. Example: she leaves the fair for a dinner and
switches to casual networking.

**Why this priority**: Prevents Encounters landing under the wrong Event. P2 because the choice
on opening (US2) already covers the most common case.

**Independent Test**: Activate an Event, switch to casual networking from the start screen, and
back again; the start screen shows the right context each time, also after reopening the app.

**Acceptance Scenarios**:

1. **Given** an active Event, **When** the owner looks at the start screen, **Then** she sees its
   name and dates.
2. **Given** the start screen, **When** she taps the context, **Then** the choice from US2 opens.
3. **Given** a choice was made, **When** she closes and reopens the app, **Then** the same choice
   is still active (subject to FR-005).

---

### Edge Cases

- **No Events yet**: the choice shows only "New event" and "Casual networking".
- **Active Event has ended** (its end date is before today): on the first opening of the new day
  the choice appears; the ended Event is no longer on top but listed with the past Events.
- **Multi-day Event, day 2**: the choice appears once, with that Event on top (one tap).
- **Casual networking yesterday**: the choice appears on the first opening of the new day, so a
  new fair is not missed.
- **Typo or wrong dates in a new Event**: cannot be fixed in F1; the owner creates a new Event.
  The wrong one stays in the list until she changes or deletes it in F10.
- **App left open past midnight**: the choice appears the next time the app is opened, not while
  it is in use.
- **Two Events overlap in time**: both appear as current; the owner picks one.
- **Same name twice** (for example "Devoxx" in 2026 and 2027): allowed; the dates tell them apart.
- **Past Event chosen on purpose** (for example to add someone she forgot yesterday): allowed;
  the start screen shows its dates so the choice is visible.
- **Active Event deleted** (later, F10): the app falls back to casual networking (already
  enforced by the F0 storage layer).
- **App starts without internet**: F0's full-screen offline message comes first (F0 FR-005).

## Requirements *(mandatory)*

### Functional Requirements

#### Creating an Event

- **FR-001**: The owner MUST be able to create an Event with a name, a start date and an end date.
- **FR-002**: The start date MUST default to today and the end date to the start date, so a
  one-day Event needs only a name and one tap to save. If the owner moves the start date past the
  end date, the end date MUST move along to the start date.
- **FR-003**: Saving MUST be refused, with a clear message, when the name is empty or the end date
  is before the start date (B11). The same day is allowed.
- **FR-004**: A newly created Event MUST become the active Event immediately.

#### Choosing the context

- **FR-005**: The choice between an existing Event, a new Event and casual networking MUST appear
  on the first opening of each new day (and the very first time). Later openings on the same day
  go straight to the start screen. If yesterday's choice was an Event that is still running, it
  MUST be shown on top, so one tap continues with it.
- **FR-006**: The choice MUST list stored Events with their dates: current and upcoming Events
  first (by start date), past Events after them.
- **FR-007**: Choosing an Event MUST make it the active Event; choosing "Casual networking" MUST
  leave no active Event. The choice and the day it was made MUST be stored on the device and survive closing the app.
- **FR-008**: The start screen MUST always show the current context (Event name and dates, or
  "Casual networking") and open the choice with one tap.

#### Using the active Event

- **FR-009**: Every new Encounter MUST be linked to the active Event at the moment it is created,
  or to no Event during casual networking. The owner MUST NOT have to pick an Event per contact
  (B5, constitution VIII).

#### Managing Events

- **FR-010**: Changing or deleting an existing Event is NOT part of F1; it belongs to F10
  ("Evenementen beheren"). F1 only creates and chooses Events.

#### Language

- **FR-011**: All new texts MUST exist in Dutch and English (F0 FR-015).

### Key Entities

No new entities. F1 uses what F0 defined, plus one Settings field:

- **Event**: name, start date, end date (end ≥ start). Names do not have to be unique.
- **Settings.activeEventId**: the active Event; absent means casual networking.
- **Settings, new field**: the local date on which the owner last made the choice (FR-005), so
  the app knows whether to ask again today.
- **Encounter.eventId**: set from the active Event when an Encounter is created (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On arrival, the owner creates and activates a one-day Event in under 20 seconds
  (typing the name plus at most 2 taps).
- **SC-002**: Choosing an existing Event or casual networking takes at most 2 taps from opening the
  app.
- **SC-003**: 100% of Encounters created while an Event is active belong to that Event; 0% of
  Encounters created during casual networking belong to an Event.
- **SC-004**: 0 Events can be saved with an end date before the start date.
- **SC-005**: In a walkthrough of all user stories, the start screen shows the correct context
  every time (100%).

## Assumptions

- **Dates are local dates** on the owner's phone (Belgian time when she is in Belgium).
- **Event names**: trimmed, not empty, at most 80 characters (enough for "Devoxx Belgium 2026 —
  Antwerpen"); longer names are cut off on screen, not refused.
- **Order in the choice**: current Events (today between start and end), then upcoming (by start
  date), then past (newest first).
- **Encounters are created in F2/F3/F5**: F1 provides the rule (FR-009) and the storage function;
  it is visible to the owner once F2 exists. In F1 it is checked by automated tests.
- **Backup reminder** after an Event (T10/T11) is part of F10, not F1.
- **Guest mode** (F3) never shows the choice or the list of Events.
- **Owner screens** follow the app language chosen in F0; guest-facing text is not involved here.
