# Feature Specification: F0 — App Foundation

**Feature Branch**: `001-app-foundation`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "#F0 - fundament van de features file. lees eerst de wiki. Open vragen #10 en #11 horen bij deze feature: neem ze op als onduidelijkheden zodat clarify ze aan mij voorlegt"

Source: F0 in `specs/features.md`. Terms follow `wiki/begrippen.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open and install the app (Priority: P1)

The owner opens the app on her iPhone at its own web address, adds it to the home screen via
Safari, and from then on starts it like any other app: own icon, own name, full screen, no
browser bars.

**Why this priority**: Without a reachable, installable app no other feature can be used at an
event.

**Independent Test**: On the owner's iPhone over mobile data, open the address in Safari, add
to the home screen, and start the app from the icon. Delivers a working app shell.

**Acceptance Scenarios**:

1. **Given** the owner's iPhone with internet, **When** she opens the app's web address in
   Safari, **Then** the app's start screen appears.
2. **Given** the app is open in Safari, **When** she chooses "Add to Home Screen", **Then** an
   icon named "De Sociale Vlinder" appears on the home screen.
3. **Given** the app is on the home screen, **When** she taps the icon, **Then** the app opens
   full screen without Safari's address bar or toolbars.

---

### User Story 2 - Data stays on the device (Priority: P1)

Data that the app saves (Persons, Encounters, Events, settings) stays on the owner's iPhone. It
is still there after closing the app, restarting the phone, or receiving a new app version. No
personal data ever leaves the device.

**Why this priority**: Correctness of data is the second quality value; every later feature
(F1–F10) builds on this storage and data model.

**Independent Test**: Store a set of test records (for example a Person with two Encounters at
two Events), close the app, restart the phone, publish a new app version, and reopen: all
records are unchanged. Inspect network traffic: no personal data is sent.

**Acceptance Scenarios**:

1. **Given** saved records, **When** the owner closes the app and reopens it, **Then** all
   records are present and unchanged.
2. **Given** saved records, **When** the phone restarts and the app is reopened, **Then** all
   records are present and unchanged.
3. **Given** saved records, **When** a new version of the app is published and the owner opens
   the app, **Then** she gets the new version and all records are present and unchanged.
4. **Given** the app is in use, **When** network traffic is inspected, **Then** no names,
   companies, profile URLs, notes or other personal data are sent anywhere.

---

### User Story 3 - Basic Dutch/English language switch (Priority: P2)

The owner can switch the app between Dutch and English. All visible text changes at once and
the choice is remembered. Later features (such as guest mode, F3) build on this.

**Why this priority**: The constitution requires NL/EN; laying the basis now avoids rework in
every later feature. It is P2 because the app is usable in one language first.

**Independent Test**: Switch the language, check every visible text, close and reopen the app.

**Acceptance Scenarios**:

1. **Given** the app is shown in Dutch, **When** the owner switches to English, **Then** all
   visible text is in English without restarting the app.
2. **Given** the owner chose English, **When** she closes and reopens the app, **Then** it opens
   in English.

---

### Edge Cases

- **No internet at start**: the app shows a short, friendly message that it needs internet
  instead of a broken or blank screen. Working offline is not required (constitution IV).
- **iOS clears website data** (for example after a long time without use or when storage is
  low): what the app does is open; see FR-007 and open question #11.
- **Safari tab vs installed app**: on iOS, the home-screen app and a Safari tab can keep
  separate data. The owner must use the installed app; data entered in a Safari tab is not
  guaranteed to appear in the installed app.
- **Update while the app is open**: the new version is applied without losing data, at the
  latest on the next start.
- **Device storage full**: saving fails visibly with a clear message; existing data stays
  intact.
- **Someone else opens the address**: they get an empty app on their own device. They never
  see the owner's data, because that data exists only on the owner's iPhone.

## Requirements *(mandatory)*

### Functional Requirements

#### Availability and installation

- **FR-001**: The app MUST be reachable at a stable, secure public web address
  [NEEDS CLARIFICATION: open question #10 — which free hosting and which address (free
  subdomain of a hosting service, or an own domain, which usually costs money), and which stack
  goes with it?].
- **FR-002**: The owner MUST be able to install the app on the iPhone home screen through
  Safari's "Add to Home Screen".
- **FR-003**: The installed app MUST open full screen with its own name ("De Sociale Vlinder")
  and its own icon. The icon MUST NOT use LinkedIn's logo or trademarks (constitution X).
- **FR-004**: The app MUST NOT depend on any paid service, paid hosting or paid account
  (constitution II).
- **FR-005**: The app MAY assume an internet connection. Without one, it MUST show a clear,
  friendly message instead of a broken screen.

#### Local data

- **FR-006**: The app MUST store Persons, Encounters, Events and settings only on the owner's
  device. Stored data MUST survive closing the app, restarting the phone, and app updates.
- **FR-007**: The app MUST protect the stored data against loss by the operating system to the
  degree agreed [NEEDS CLARIFICATION: open question #11 — which storage approach, how much
  protection against iOS clearing local data is needed in F0, and when should the owner be
  reminded to make a backup? The reminder itself is part of F10.].
- **FR-008**: The app MUST NOT send any personal data (names, companies, profile URLs, notes,
  events) to any server (constitution IV, VI).
- **FR-009**: New app versions MUST reach the owner without reinstalling the app and without
  loss of data.

#### Data model

- **FR-010**: A Person MUST be able to have one or more Encounters; each Encounter MUST belong
  to exactly one Person.
- **FR-011**: Each Encounter MUST belong to one Event and have a date.
- **FR-012**: A normalized `profileUrl` MUST be unique: no two Persons can share it. A Person
  MAY exist without a `profileUrl` (only a `searchUrl`) until the owner pastes it later.
- **FR-013**: Every record MUST have a stable unique identifier and the time it was created and
  last changed, so cloud sync can be added later without a rewrite (constitution IV).
- **FR-014**: The model MUST store only Persons with (or about to get) a LinkedIn profile; it
  has no fields for email or phone (constitution V).

#### Language

- **FR-015**: Every user-facing text MUST exist in Dutch and English.
- **FR-016**: The owner MUST be able to switch the app language between Dutch and English; the
  choice MUST be stored on the device and applied on the next start.

### Key Entities

- **Person**: someone with a LinkedIn profile. Name, optional company, `profileUrl` (unique when
  known), `searchUrl` (used while the `profileUrl` is missing), `connectionStatus`. Has one or
  more Encounters.
- **Encounter**: one time the owner met a Person. Belongs to one Person and one Event, has a
  date and an optional `note`.
- **Event**: a conference, fair or meetup. Name and date. Has many Encounters.
- **Settings**: device-level choices: app language and the `activeEvent`.

`Action` (F8) is not stored as its own entity here; it follows from the state above. How
dismissed Actions are stored is decided in F8 (open question #3).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner installs the app on her iPhone home screen in under 1 minute, starting
  from the web address.
- **SC-002**: The app opens from the home-screen icon to a usable start screen within 3 seconds
  on mobile data.
- **SC-003**: 100% of test records are present and unchanged after closing the app, restarting
  the phone, and installing a new app version.
- **SC-004**: 0 network requests contain personal data during a full test session.
- **SC-005**: 100% of visible texts change on a language switch, and the choice persists after
  a restart.
- **SC-006**: Running costs are €0 per month.

## Assumptions

- **Single owner, single device, no login.** The app has no accounts; data is per device.
- **Note per Encounter** (as in `wiki/begrippen.md`); provisional until open question #5 is
  confirmed.
- **Company is an optional field**; whether it becomes required is open question #4 (F2).
- **Encounters without an active Event**: behaviour is decided in F1 (open question #7).
- **Default language is Dutch** until open question #8 is decided (F10); the owner can switch.
- **Out of scope for F0**: screens to add contacts (F2, F3, F5), manage Events (F1), notes (F6),
  CSV export, delete-all and the backup reminder screen (F10), branding details (F11).
- The F0 item "Constitution generated" in `specs/features.md` is already done
  (`.specify/memory/constitution.md` v1.0.0) and is not part of this spec.
- How test records are created for User Story 2 before F1/F2 exist is decided in the plan.
