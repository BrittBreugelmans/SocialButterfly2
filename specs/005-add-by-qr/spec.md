# Feature Specification: F5 — Add by QR

**Feature Branch**: `005-add-by-qr`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "F5" (F5 — Toevoegen via QR, `specs/features.md`)

Source: F5 in `specs/features.md`; wiki Flow B and Flow D in `wiki/flows.md`;
`wiki/linkedin-beperkingen.md`; decisions B8, B15, B16, B18, B19, B20, B21, L1, L2, L4. Terms
follow `wiki/begrippen.md`. Builds on F2 (`specs/003-add-by-name`: the note step, same-name
question, opening LinkedIn on the tap) and F4 (`specs/004-link-profile`: cleaning up a profile
link).

## Clarifications

### Session 2026-10-11

- Q: Does a QR scan store a company (open question #4)? → A: Yes, optionally: the confirmation
  screen has an empty, optional company field, as in F2 (wiki B22).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan someone's LinkedIn QR code (Priority: P1)

At a fair, the other person opens their LinkedIn app and shows their QR code. The owner taps
"Scan QR" on the start screen; the camera opens and reads the code at once. The app shows the name
it derived from the profile link (for example `jan-peeters` → "Jan Peeters"), which she can
correct. One tap saves the Person with the profile link and an Encounter in the current context,
and opens the profile in LinkedIn so she can tap Connect. Back in the app, the note step from F2
appears.

**Why this priority**: Scanning is the fastest and most reliable way to get the real profile link
(L4): no typing, no search, no wrong person.

**Independent Test**: With an active Event, scan a LinkedIn QR code for
`https://www.linkedin.com/in/jan-peeters-1a2b3c?utm_source=share`. The app suggests the name
"Jan Peeters". Tap "Save and open LinkedIn": the profile opens; the stored Person has the profile
link `https://www.linkedin.com/in/jan-peeters-1a2b3c` and an Encounter today under the Event.

**Acceptance Scenarios**:

1. **Given** the start screen, **When** the owner taps "Scan QR", **Then** the camera view opens
   and starts looking for a QR code without further taps.
2. **Given** the camera sees a LinkedIn profile QR code, **When** it is read, **Then** the camera
   stops and a confirmation screen shows the derived name (editable), an empty optional company
   field, and the short profile link.
3. **Given** the confirmation screen, **When** she taps "Save and open LinkedIn", **Then** that tap
   opens the profile in LinkedIn and, at the same moment, saves the Person (with the profile link,
   status "not connected") and an Encounter for today in the current context (as B20).
4. **Given** she returns from LinkedIn, **Then** the note step appears for that Encounter, with the
   profile already shown as linked (F4).
5. **Given** a name field she emptied, **Then** saving is not possible until there is a name.
6. **Given** the camera view or the confirmation screen, **When** she goes back, **Then** nothing is
   saved.

---

### User Story 2 - Recognise someone she already stored (Priority: P1)

The owner scans the QR code of someone she already met. The app recognises the Person by the
profile link, says so, and adds a new Encounter to that Person instead of creating a second one
(B8). If she stored the person earlier by name only (F2, no profile link yet), the same-name
question from F2 appears so she can confirm it is the same person.

**Why this priority**: The constitution forbids silent duplicates (IX); recognising people across
events is the point of the timeline (B8).

**Independent Test**: Store Jan Peeters with profile link `…/in/jan-peeters` and an Encounter last
week. Scan his QR code: the app says it already knows Jan Peeters and, after the tap, there is still
one Person with two Encounters.

**Acceptance Scenarios**:

1. **Given** a stored Person with the scanned profile link, **When** the code is read, **Then** the
   confirmation screen shows that Person's stored name (not the derived one) with a line that she
   already knows this person, and saving adds a new Encounter to that Person.
2. **Given** that Person already has an Encounter today in the current context, **When** she
   confirms, **Then** no new Encounter is saved and the note step for today's Encounter appears,
   without opening LinkedIn (B19).
3. **Given** no Person has the link but a stored Person **without** a profile link has the same
   name (ignoring case and extra spaces), **When** she confirms, **Then** the app asks "Is this the
   same person?" (B15). Yes adds the Encounter to that Person **and** stores the profile link on
   it; "No, new person" saves a new Person.
4. **Given** a stored Person with the same name that already has a **different** profile link,
   **Then** it is not offered as a match (the links prove they are different people).

---

### User Story 3 - Wrong code or no camera (Priority: P2)

The camera reads a QR code that is not a LinkedIn profile (a website, a Wi-Fi code, a LinkedIn
company page), or the camera cannot be used. The app explains what happened and saves nothing.

**Why this priority**: At a fair many QR codes are around; a clear message avoids confusion. P2
because nothing is lost: the owner can still add the person by name (F2).

**Independent Test**: Scan the QR code of a website: a message says this is not a LinkedIn
profile code, the camera keeps scanning, and nothing is stored.

**Acceptance Scenarios**:

1. **Given** the camera reads a code that is not a LinkedIn profile link, **Then** a message says
   so, nothing is saved, and the camera keeps looking for another code.
2. **Given** a short `lnkd.in` link, **Then** the message asks for the profile QR code from the
   LinkedIn app (F4: short links are not accepted).
3. **Given** the owner refused camera access, or the device has no usable camera, **Then** the app
   explains how to allow camera access in the iPhone settings and offers "Add by name" instead.

---

### Edge Cases

- **Name derived from the link**: the handle is split on dashes and each word gets a capital
  (`jan-peeters` → "Jan Peeters"). A trailing part that contains digits, as LinkedIn adds to make
  handles unique (`jan-peeters-1a2b3c`), is left out of the name. Encoded characters are shown
  as letters (`zo%C3%AB` → "Zoë").
- **Handle without a usable name** (only digits, or a single letter): the name field starts empty
  and she types it.
- **The same code is read several times in a row**: it is handled once.
- **Several QR codes in view**: the first LinkedIn profile code that is read wins.
- **Poor light or a code too far away**: the camera keeps looking; there is no time limit. Back
  stops the camera.
- **The app goes to the background while the camera is open**: the camera stops; on return the
  owner taps "Scan QR" again.
- **Opening LinkedIn is blocked or LinkedIn does not load**: the Person and Encounter are saved;
  the note step offers "Open LinkedIn" (F2).
- **App closed by iOS while in LinkedIn**: the note step comes back the same day (B18).
- **Storage full**: nothing is half-saved; F0's storage message appears.
- **Edited name equals another stored Person's name**: handled as in User Story 2 scenario 3.

## Requirements *(mandatory)*

### Functional Requirements

#### Scanning

- **FR-001**: The start screen MUST offer "Scan QR" with one tap, next to "Add by name".
- **FR-002**: The camera view MUST start scanning at once, use the back camera, and stop as soon as
  a LinkedIn profile code is read, when the owner goes back, or when the app leaves the screen.
- **FR-003**: Camera images MUST NOT be stored or sent anywhere; only the text of a read code is
  used (constitution VI).
- **FR-004**: A code that is not a LinkedIn profile link MUST be refused with a message, and
  nothing is saved (F4 rules for what counts as a profile link).

#### Confirming

- **FR-005**: The confirmation screen MUST show the current context, the short profile link, and an
  editable name: the stored name for a known Person, otherwise the name derived from the link.
- **FR-006**: The confirmation screen MUST have an optional company field, empty for a new Person
  (B22, as B17 in F2). For a known Person it shows the stored company, and FR-008 applies.
- **FR-007**: "Save and open LinkedIn" MUST open the profile on that tap and start saving at the
  same moment (B20), except when the Person was already met today in the current context (B19).
  Saving MUST be complete or not happen at all (constitution IX).

#### Recognising

- **FR-008**: A Person whose profile link equals the scanned link MUST be reused: a new Encounter,
  no new Person (B8). Its stored name and company MUST NOT change.
- **FR-009**: Without a link match, stored Persons without a profile link and with the same name
  (F2 rule) MUST trigger "Is this the same person?" (B15). Choosing one MUST also store the scanned
  profile link on it.
- **FR-010**: A new Person MUST get the name, the company (if given), the profile link, a search
  link for the name and company, and the status "not connected".

#### After saving

- **FR-011**: The note step from F2 MUST follow, including "I connected" (B16), "Paste LinkedIn
  link" (F4) and the return after an iOS kill (B18).
- **FR-012**: All new texts MUST exist in Dutch and English.

### Key Entities

No new entities or fields. F5 uses what F0, F2 and F4 defined:

- **Person**: `name`, optional `company` (B22), `profileUrl` (normalized, unique), `searchUrl`,
  `connectionStatus`.
- **Encounter**: today, current context, optional note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the start screen, the owner gets a new person's profile open in LinkedIn with
  at most 2 taps ("Scan QR", "Save and open LinkedIn") when the derived name is right.
- **SC-002**: A LinkedIn profile code held in front of the camera in normal indoor light is read
  within 3 seconds.
- **SC-003**: 100% of scanned people already stored with that profile link get a new Encounter,
  not a second Person.
- **SC-004**: 100% of non-profile codes are refused with a message, and nothing is stored.
- **SC-005**: For handles of the form `first-last` or `first-last-<code>`, the suggested name is
  right without editing.

## Assumptions

- **The other person shows their QR from the LinkedIn app** ("Scan"/QR icon in the search bar,
  "My code"). It contains their profile link, sometimes with extra parameters (wiki
  `linkedin-beperkingen.md`).
- **Same opening behaviour as F2**: the confirmation button is a real link to the profile, so the
  tap opens LinkedIn on the iPhone (B20).
- **No QR codes from photos or screenshots**: only the live camera (constitution X).
- **Scanning Britt's own QR** is not special-cased; "Mijn QR" is F9.
- **Guest mode (F3)** does not offer scanning.
- **Internet is required** (T6) to open LinkedIn; scanning and saving themselves work without it.
- **Camera access** is asked by iOS the first time; the app explains a refusal but cannot change
  the iPhone setting itself.
