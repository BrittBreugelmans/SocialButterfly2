# Feature Specification: F3 — Guest Mode

**Feature Branch**: `011-guest-mode`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "F3" (F3 — Doorgeef-modus (gast), `specs/features.md`)

Source: F3 in `specs/features.md`; wiki Flow A and "Doorgeef-modus — eisen" in `wiki/flows.md`;
fixed texts in `wiki/merk-en-stijl.md`; terms `guestMode`, `guest`, `owner` in
`wiki/begrippen.md`; decisions B4, B9, B15, B20, B37, B43, B44; constitution VI, VII, VIII, IX.
Builds on F2 (`specs/003-add-by-name`: the quick mode form, same-name question, save and search,
note step) and F7 (`specs/006-contacts`: tab bar hidden during add flows and guest mode, FR-001c).

## Clarifications

### Session 2026-10-12

- Q: What happens after the guest has typed their name? A same-name match would show another
  Person's company and last meeting date (constitution VI), and iOS Guided Access blocks opening
  LinkedIn. → A: The guest taps "Done" and hands the phone back. The owner unlocks and sees the
  quick mode form (F2) filled in with what the guest typed. She taps "Search on LinkedIn" herself,
  and answers the same-name question if it appears (wiki B43).
- Q: How does the owner get back to her own mode without the guest being able to? → A: She holds
  a small butterfly button pressed for 2 seconds. A short tap does nothing. No code (wiki B44).
- Q: (review) Which image is the button? → A: The app logo (F11), not a separate butterfly. The
  greeting and thank-you texts are approved as proposed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The guest types their own name (Priority: P1)

The owner meets someone at a fair and says "I built an app for this, want to type your name?".
She taps "Hand over" on the start screen and gives her phone to the guest. The guest sees a big,
friendly screen: "Hi! I'm Britt, the social butterfly. Who are you?", a name field, an optional
company field and the line "Your name is only stored on Britt's phone." The guest types their name
and taps "Done". The screen thanks them and asks to hand the phone back to Britt.

**Why this priority**: This is the icebreaker from the vision and decision B4. Without it, guest
mode does not exist.

**Independent Test**: Tap "Hand over". Type "Jan Peeters" and "Elmos", tap "Done": the thank-you
screen appears. Check that no list, note, Event name or tab bar was visible at any moment.

**Acceptance Scenarios**:

1. **Given** the start screen, **When** the owner taps "Hand over", **Then** guest mode opens with
   the greeting, a name field, an optional company field and the privacy line.
2. **Given** guest mode opens, **When** it appears, **Then** the name field is ready to type in.
3. **Given** guest mode, **When** the name is empty or only spaces, **Then** "Done" cannot be
   tapped.
4. **Given** a name (company optional), **When** the guest taps "Done", **Then** a thank-you
   screen asks them to hand the phone back to Britt, and nothing is saved yet.
5. **Given** the thank-you screen, **When** the guest taps "Back", **Then** the form returns with
   what they typed, so they can fix a typo.
6. **Given** guest mode, **When** the guest types a name that matches a stored Person, **Then**
   nothing on the screen shows or hints at that match.

---

### User Story 2 - The owner takes over and searches (Priority: P1)

The guest hands the phone back. The owner holds the logo in the corner for 2 seconds. The
quick mode form from F2 opens, already filled in with the guest's name and company, in the
owner's language, with the context bar. She checks the name and taps "Search on LinkedIn". From
here everything works as in F2: the same-name question if needed, saving, LinkedIn, the note step.

**Why this priority**: Without a way back, the guest's name never becomes a Person. Without the
guard, the guest could open the contact list (constitution VI).

**Independent Test**: In guest mode, type "Jan Peeters", tap "Done". Tap the logo once:
nothing happens. Hold it 2 seconds: the quick mode form shows "Jan Peeters". Tap "Search on
LinkedIn": the same flow as F2 follows, and the Person is stored.

**Acceptance Scenarios**:

1. **Given** the guest form or the thank-you screen, **When** the owner holds the logo
   for 2 seconds, **Then** guest mode ends and the quick mode form opens, filled in with the name
   and company the guest typed.
2. **Given** guest mode, **When** someone taps the logo shortly, or lets go before 2
   seconds, **Then** nothing happens and guest mode stays.
3. **Given** the owner is holding the logo, **When** time passes, **Then** she sees
   that the hold is counting, so she knows when to let go.
4. **Given** the filled-in form, **When** the owner taps "Search on LinkedIn", **Then** everything
   works as in F2: same-name question (B15), save and open LinkedIn with one tap (B20), note step.
5. **Given** the filled-in form, **When** the owner changes the name or company first, **Then** the
   changed values are used.
6. **Given** the filled-in form, **When** the owner taps "Back", **Then** nothing is saved and the
   start screen appears.
7. **Given** guest mode with an empty name, **When** the owner holds the logo for 2
   seconds, **Then** guest mode ends and the start screen appears, with nothing saved.

---

### User Story 3 - The guest switches language (Priority: P2)

The owner is at an international event. Guest mode opens in Dutch, the app's language (B37). The
guest taps "EN" and the greeting, labels, privacy line and thank-you screen switch to English on
the same screen, without losing what they typed.

**Why this priority**: The constitution requires every guest screen in Dutch and English with a
switch on that screen (VII). P2 because guest mode already works in the app language.

**Independent Test**: With the app in Dutch, open guest mode and type a name. Tap "EN": all texts
are English and the name is still there. Tap "Done": the thank-you screen is English. Return to the
owner: her screens are Dutch again.

**Acceptance Scenarios**:

1. **Given** the app language is Dutch, **When** guest mode opens, **Then** it is in Dutch (B37).
2. **Given** guest mode, **When** the guest taps the NL/EN switch, **Then** every text on guest
   screens changes language at once and the typed name and company stay.
3. **Given** the guest switched language, **When** the owner takes over, **Then** owner screens
   use the app language, unchanged.
4. **Given** the next time guest mode opens, **When** it appears, **Then** it is in the app
   language again.

---

### Edge Cases

- **Guest taps around**: guest screens have no tab bar, no context bar, no list, no notes and no
  link to any owner screen. The only ways out are "Done" (to the thank-you screen) and the 2-second
  hold.
- **Same name as a stored Person**: the check and the question happen only on the owner's form
  after the hand-back (US2). The guest never sees it.
- **Owner banners**: the backup reminder (F10), storage warnings and other owner messages are not
  shown in guest mode. They come back on owner screens.
- **No internet in guest mode**: the guest can still type and tap "Done"; nothing needs the
  internet until the owner taps "Search on LinkedIn" (F2 handles that).
- **App closed or reloaded by iOS during guest mode** (for example, the phone locked): the app
  reopens in guest mode, not on an owner screen. What the guest typed may be lost; they type it
  again. The daily choice (F1) and the note step (F2) wait until the owner leaves guest mode.
- **iOS Guided Access**: guest mode works with or without it. With it on, the owner ends Guided
  Access before tapping "Search on LinkedIn", because iOS does not let LinkedIn open while it is on.
- **Guest walks away without typing**: the owner holds the logo; the start screen appears,
  nothing saved.
- **Long name or company**: same as F2: trimmed, at most 100 characters each.
- **Note step after LinkedIn**: only the owner sees it, as in F2. If she gives the phone to the
  guest again, she starts guest mode again from the start screen.

## Requirements *(mandatory)*

### Functional Requirements

#### Opening guest mode

- **FR-001**: The start screen MUST offer "Hand over" to open guest mode with one tap.
- **FR-002**: Guest mode MUST open in the app language (B37) with the name field ready to type in.

#### The guest screen

- **FR-003**: The guest screen MUST show the greeting "Hoi! Ik ben Britt, de sociale vlinder.
  Wie ben jij?" / "Hi! I'm Britt, the social butterfly. Who are you?" (wiki fixed text).
- **FR-004**: The guest screen MUST have a name field (required) and a company field (optional,
  B17), with the same limits as F2.
- **FR-005**: The guest screen MUST show "Je naam wordt alleen op Britts telefoon bewaard." /
  "Your name is only stored on Britt's phone." (B9, constitution VI).
- **FR-006**: The guest screen MUST be big and friendly: large text and large touch targets,
  readable at arm's length for someone who has never seen the app.
- **FR-007**: "Done" MUST be unavailable while the name is empty or only spaces.

#### Privacy

- **FR-008**: Guest mode MUST NOT show the tab bar, the context bar or Event names, the contact
  list, notes, Actions, any other Person's data, or owner messages (backup reminder, storage
  warnings) (constitution VI, F7 FR-001c).
- **FR-009**: Guest mode MUST NOT show or hint at a same-name match while the guest types.
- **FR-010**: Guest mode MUST NOT save any Person or Encounter. Saving happens only when the owner
  taps "Search on LinkedIn" on her form (F2).

#### Hand-back

- **FR-011**: "Done" MUST show a thank-you screen that asks the guest to hand the phone back to
  Britt. A "Back" button MUST return to the form with the input kept.
- **FR-012**: Both guest screens MUST show the app logo (F11) small, without a label. Holding it for
  2 seconds MUST end guest mode (B44). A shorter press MUST do nothing. While held, it MUST show
  that it is counting.
- **FR-013**: Ending guest mode with a name typed MUST open the quick mode form (F2), filled in
  with that name and company, in the app language. With no name typed, it MUST open the start
  screen. Nothing is saved by ending guest mode.
- **FR-014**: From the filled-in form, everything MUST work as in F2 (same-name question, save and
  search on one tap, note step, "Back" saves nothing).

#### Language

- **FR-015**: Both guest screens MUST have an NL/EN switch. Switching MUST change all guest texts
  at once and keep the input (constitution VII).
- **FR-016**: The guest's switch MUST NOT change the app language. The next guest mode opens in the
  app language again.
- **FR-017**: All new texts MUST exist in Dutch and English, short, friendly and lightly playful
  (constitution VII, wiki tone).

#### Robustness

- **FR-018**: If the app is closed or reloaded while guest mode is on, it MUST reopen in guest mode
  until the owner ends it with the 2-second hold. Owner screens that would normally appear first
  (daily choice F1, note step F2) MUST wait until then.

### Key Entities

No new entities or fields. F3 stores nothing itself; the Person and Encounter are saved by F2's
flow after the hand-back.

- **Guest input**: the name and company the guest typed. It lives only while guest mode is on and
  is handed to the quick mode form when the owner takes over.
- **Guest mode on/off**: remembered on the device so the app reopens in guest mode (FR-018).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a walk-through of guest mode, the contact list, notes, Actions, Event names and
  other Persons' data are visible 0 times.
- **SC-002**: The owner goes from the start screen to guest mode in 1 tap, and from the guest's
  "Done" to LinkedIn's search results with the 2-second hold plus 1 tap (plus 1 when the name
  matches a stored Person).
- **SC-003**: A guest who has never seen the app types their name and taps "Done" without help in
  under 30 seconds.
- **SC-004**: 0 short taps on the logo end guest mode; a 2-second hold ends it every
  time.
- **SC-005**: 100% of guest texts exist in Dutch and English, and switching keeps the typed input.
- **SC-006**: 0 Persons or Encounters are saved by guest mode alone.
- **SC-007**: After the app is closed during guest mode, it reopens in guest mode 100% of the time.

## Assumptions

- **Entry point**: a "Hand over" button on the start screen (Add tab), next to "Add by name" and
  "Scan QR". Label "Geef door" / "Hand over" (approved by Britt).
- **Name only**: the guest types name and company, nothing else. No QR scan in guest mode (F5).
- **Thank-you text**: "Dank je! Geef de gsm terug aan Britt." / "Thanks! Hand the phone back to
  Britt." (approved by Britt, wiki fixed texts).
- **Logo**: the hold button uses the one logo file from F11 (M5, M9). When Britt's own logo
  replaces it, guest mode follows without changes.
- **Hold time**: 2 seconds, as chosen (B44). A guest who knows the trick can still use it; iOS
  Guided Access is the extra lock for the owner who wants more (wiki tip).
- **Typed input after a reload**: may be lost (FR-018 only keeps guest mode on). Retyping a name is
  cheaper than storing guest input.
- **One guest at a time**: guest mode ends after each guest. For the next guest the owner taps
  "Hand over" again.
- **Butterfly animation** (F11, M7): unchanged; it plays when the owner closes the note step, not
  in guest mode.
- **Internet is required** (T6) only for LinkedIn, which is on the owner's side.
