# Feature Specification: F4 — Link the Profile URL

**Feature Branch**: `004-link-profile`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "F4" (F4 — Profiel-link koppelen, `specs/features.md`). Britt's
feedback after F2: "ik mis op de note pagina de mogelijkheid om de link van het linkedin profiel
te uploaden".

Source: F4 in `specs/features.md`; wiki Flow A step 6 and Flow D in `wiki/flows.md`;
`wiki/linkedin-beperkingen.md`; decisions B7, B8, B15, L1, L3, T5. Terms follow
`wiki/begrippen.md`. Builds on F0 (`profileUrl`, unique and normalized), F2
(`specs/003-add-by-name`: the note step, B16, B18, B19, B20).

## Clarifications

### Session 2026-10-09

- Q: The pasted profile link already belongs to another Person: merge at once, or ask first? →
  A: Ask first: "This profile belongs to Jan Peeters (Elmos). Merge?" with Merge / Cancel
  (wiki B21).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paste the profile link on the note step (Priority: P1)

The owner found the person in LinkedIn and tapped Connect. In LinkedIn she uses "Share → Copy
link" on the profile, returns to the app, and on the note step taps "Paste LinkedIn link". iOS
asks to allow pasting; she allows it. The app checks that it is a LinkedIn profile link, cleans
it up, and stores it on the Person. From then on "Open LinkedIn" opens the profile itself instead
of the search.

**Why this priority**: The profile URL is the Person's real identity (glossary, L3). Without it,
recognising someone later (B8) and sending a message after the event depend on a search that may
find the wrong person.

**Independent Test**: Add "Jan Peeters" (F2). On the note step, copy
`https://www.linkedin.com/in/jan-peeters?utm_source=share&utm_medium=ios_app` to the clipboard and
tap "Paste LinkedIn link". The note step shows the profile as linked, and the stored Person has
`https://www.linkedin.com/in/jan-peeters` as profile URL. "Open LinkedIn" now opens that profile.

**Acceptance Scenarios**:

1. **Given** the note step and a LinkedIn profile link on the clipboard, **When** the owner taps
   "Paste LinkedIn link" and allows pasting, **Then** the cleaned-up link is stored on the Person
   at once and the note step shows it as linked.
2. **Given** a link with extra parts (tracking parameters, a trailing slash, `linkedin.com`
   without `www`, a country subdomain such as `be.linkedin.com`, upper-case letters in the
   domain), **When** it is pasted, **Then** the stored link is
   `https://www.linkedin.com/in/<handle>` without those extras.
3. **Given** the clipboard holds something that is not a LinkedIn profile link (text, another
   site, a LinkedIn company or post link), **When** it is pasted, **Then** nothing is stored and
   the app explains that it found no LinkedIn profile link.
4. **Given** a linked profile, **When** the owner looks at the note step, **Then** "Open LinkedIn"
   opens the profile, not the search.
5. **Given** a linked profile, **When** she pastes another profile link, **Then** it replaces the
   first one (for a wrong paste).
6. **Given** the note step after an iOS kill (B18), **When** it comes back, **Then** it shows
   whether the profile is already linked, and pasting still works.

---

### User Story 2 - Recognise an existing Person by the profile link (Priority: P1)

The owner added "Jan Peters" with a typo, but she already met Jan Peeters at another event and
stored his profile link then. When she pastes the link on the note step, the app sees that this
profile already belongs to a stored Person and asks whether to merge. She taps Merge. It keeps one
Person: the meetings and notes end up
under the existing Jan Peeters (B8), and no duplicate remains.

**Why this priority**: The constitution forbids silent duplicates (IX), and F4 in
`specs/features.md` asks for this explicitly ("Bestaande persoon met dezelfde URL → samenvoegen,
geen dubbel"). The profile URL is the only reliable way to recognise a person when names differ.

**Independent Test**: Store Jan Peeters with profile link `…/in/jan-peeters` and an Encounter last
week. Add "Jan Peters" (no name match) and paste `…/in/jan-peeters` on the note step. Afterwards
the app asks to merge with Jan Peeters; after "Merge" there is one Person, Jan Peeters, with both
Encounters.

**Acceptance Scenarios**:

1. **Given** a pasted profile link that already belongs to another Person, **When** the paste is
   handled, **Then** the app asks "This profile belongs to Jan Peeters (Elmos). Merge?" with
   Merge and Cancel, and nothing changes until she answers (B21).
2. **Given** that question, **When** she taps Cancel, **Then** nothing is stored or merged, and the
   note step shows the profile as not linked.
3. **Given** she taps Merge, **Then** the Person that already had the link stays,
   with its name and company; it gets the company of the note step's Person when it had none; its
   status is "connected" when either Person was connected.
4. **Given** the merge, **Then** all Encounters of the note step's Person move to the Person that
   already had the link, the note step's Person no longer exists, and the note step continues for
   the remaining Person.
5. **Given** both Persons have an Encounter today in the same context, **When** they are merged,
   **Then** one Encounter remains (B19): the one of the Person that already had the link, with both
   notes kept (the other note added after its note).

---

### Edge Cases

- **iOS asks to allow pasting** (T5): the owner taps "Paste" in the iOS bubble. If she taps
  elsewhere or pasting is refused, nothing is stored and nothing breaks; she can tap again.
- **Clipboard empty**: same message as "no LinkedIn profile link".
- **Short link `lnkd.in/…`**: it cannot be checked without opening it, so it is not accepted; the
  message asks for the full profile link (L1: the app does not visit LinkedIn by itself).
- **Mobile or app-specific links** (`linkedin.com/mwlite/in/…`, `/in/<handle>/details/…`): only
  the handle after `/in/` is kept.
- **Handle with special characters** (`/in/zo%C3%AB-peeters`): stored the same way every time, so
  the same profile always gives the same link.
- **The pasted link is the Person's own link already**: nothing changes; the note step shows it as
  linked.
- **Pasting while the note step is open for a Person met today** (B19): works the same.
- **Storage full**: nothing is half-saved; F0's storage message appears.
- **The note step was skipped**: there is no other place to paste the link until F7 (contact
  detail) and F8 (Actions); the missing link is an Action there.

## Requirements *(mandatory)*

### Functional Requirements

#### Pasting

- **FR-001**: The note step MUST offer "Paste LinkedIn link" with one tap. It reads the clipboard
  only after that tap (T5); iOS may ask for confirmation.
- **FR-002**: The app MUST accept only LinkedIn profile links: a link to `linkedin.com` (with or
  without `www`, or a country subdomain) whose path contains `/in/<handle>`. Everything else MUST
  be refused with a clear message, and nothing is stored.
- **FR-003**: The app MUST store the link in one normalized form:
  `https://www.linkedin.com/in/<handle>`, without query, fragment, trailing slash or extra path
  parts after the handle, so the same profile always gives the same link.
- **FR-004**: The note step MUST show whether the Person has a linked profile, and pasting again
  MUST replace the link.
- **FR-005**: Once linked, "Open LinkedIn" on the note step MUST open the profile link (F2
  FR-011).

#### Existing Person with the same link

- **FR-006**: A profile link MUST belong to at most one Person (F0). When the pasted link belongs
  to another Person, the app MUST NOT create a duplicate. It MUST first ask whether to merge,
  naming the other Person and its company (B21). Merge merges the two Persons as in User Story 2;
  Cancel stores nothing.
- **FR-007**: A merge MUST happen completely or not at all: never a Person without its
  Encounters, never an Encounter without its Person (constitution IX).
- **FR-008**: After a merge, the note step MUST continue for the remaining Person and its
  Encounter for today.

#### Actions and language

- **FR-009**: A Person with a linked profile MUST no longer count as "profile link missing" (B7;
  the Actions tab itself is F8).
- **FR-010**: All new texts MUST exist in Dutch and English.

### Key Entities

No new entities or fields. F4 uses what F0 and F2 defined:

- **Person**: `profileUrl` (normalized, unique) is set or replaced; `searchUrl` stays.
- **Encounter**: may move to another Person in a merge; notes are kept.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Linking a copied profile link takes at most 2 taps in the app ("Paste LinkedIn
  link" plus the iOS confirmation); 1 extra tap only when it merges with another Person.
- **SC-002**: 100% of stored profile links are in the normalized form; pasting the same profile
  in its different forms (share link, browser link, with or without `www`) always gives the same
  stored link.
- **SC-003**: 0 Persons share a profile link; 0 merges happen without the owner tapping Merge;
  after a merge, 0 Encounters and 0 notes are lost.
- **SC-004**: 100% of non-profile clipboard contents are refused with a message, and nothing is
  stored.

## Assumptions

- **Only on the note step in F4**: the paste button lives on the note step (Flow A step 6, Britt's
  feedback). F7 (contact detail) and F8 (Actions tab) will reuse it for Persons whose note step is
  closed.
- **No name change**: pasting a link does not change the Person's name; deriving a name from the
  link is F5 (QR, L4).
- **`searchUrl` stays** next to the profile link; the profile link is used first (F2 FR-011).
- **Linking does not mean connected**: the "I connected" switch stays separate (B16).
- **No network check**: the app does not open or check the link itself (L1); a valid-looking link
  to a profile that does not exist is the owner's responsibility.
- **Removing a link** (without replacing it) is not part of F4; F7 can add it if needed.
- **Internet is required** (T6), but pasting and checking work without it.
