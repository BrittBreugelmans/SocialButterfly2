# Feature Specification: F9 — My QR

**Feature Branch**: `008-my-qr`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "F9" (F9 — Mijn QR, `specs/features.md`)

Source: F9 in `specs/features.md`; wiki tab "Mijn QR" in `wiki/flows.md`; "Mijn QR" in
`wiki/merk-en-stijl.md`; term `myQr` in `wiki/begrippen.md`; decisions B10, B26, M2, L1, T5, T6,
B32, B33; constitution I, III, IV, VI, VIII, X. Builds on F4 (the "Paste LinkedIn link" rules:
read the clipboard, validate and normalize to `linkedin.com/in/<handle>`) and F7
(`specs/006-contacts`: tab bar with a "coming soon" My QR tab).

## Clarifications

### Session 2026-10-12

- Q: Where does the QR on My QR come from: generated in the app from the owner's profile link, or
  LinkedIn's own QR saved as an image (open question #12)? → A: The app generates it on the device
  from the owner's profile link (wiki B32).
- Q: How does the app learn the owner's own profile link? → A: Once, on the My QR screen itself:
  the first time it asks "Paste your LinkedIn link" (F4 rules). The link can be changed on the same
  screen. It is stored on the device (wiki B33).
- Q: What text appears with the QR for the person scanning? → A: One short caption below the QR,
  in Dutch and English at the same time: "Scan mij om te connecteren" / "Scan me to connect". No
  name, no language switch.
- Q: Does the tab bar stay visible while the QR is shown? → A: Yes. My QR is an ordinary tab; there
  is no separate full-screen mode.
- Q (plan phase): F0 blocks the whole app with a full "no internet" screen when it starts offline
  (F0 FR-005). Can My QR still be reached then? → A: Yes. The offline screen gets a "Show my QR"
  button; everything else stays blocked as before (wiki B34).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Show my QR (Priority: P1)

At a fair, someone says "let's connect". The owner taps My QR and holds up her phone. The screen
shows her LinkedIn QR code, large, with a small butterfly in the middle. The other person scans it
with their phone camera or the LinkedIn app and lands on her LinkedIn profile, where they tap
Connect themselves.

**Why this priority**: This is the whole point of F9 and part of the showcase (B10). It reverses
the usual flow: instead of looking someone up, she lets them find her in one tap.

**Independent Test**: With the owner's profile link set, open My QR and scan the screen with
another iPhone's camera and with the LinkedIn app: both open the owner's profile.

**Acceptance Scenarios**:

1. **Given** the owner's profile link is set, **When** she taps My QR, **Then** the QR code for
   that link fills most of the screen width, with the butterfly in the middle, and below it the
   caption "Scan mij om te connecteren" and "Scan me to connect", both at once.
2. **Given** the QR on screen, **When** another phone scans it with the camera app or the LinkedIn
   app, **Then** it opens the owner's LinkedIn profile.
3. **Given** the QR on screen, **Then** no notes, contacts, Actions or other Person data are
   visible on the screen (constitution VI).
4. **Given** the phone is in dark mode, **Then** the QR keeps dark modules on a light background so
   it stays scannable.
5. **Given** the connection drops while the app is open, **When** she opens My QR, **Then** the QR
   still appears: it is made on the device.
6. **Given** the app starts without internet (F0's full "no internet" screen), **When** she taps
   "Show my QR" on that screen, **Then** My QR appears, with a way back to the offline screen
   (B34).

---

### User Story 2 - Set my own link once (Priority: P1)

The first time she opens My QR, there is no QR yet. The screen explains in one line how to copy
her profile link in LinkedIn (Share profile → Copy link) and offers "Paste LinkedIn link". After a
valid paste, her QR appears right away and stays there every next time.

**Why this priority**: Without her own link there is no QR. P1 together with Story 1: they form
the smallest useful slice.

**Independent Test**: On a fresh install, open My QR: the setup screen appears. Copy a profile link
with extra parameters, tap "Paste LinkedIn link": the QR appears and encodes the normalized link.
Close and reopen the app: My QR shows the QR at once.

**Acceptance Scenarios**:

1. **Given** no own profile link is stored, **When** she opens My QR, **Then** she sees a short
   explanation and "Paste LinkedIn link"; no QR.
2. **Given** a valid profile link on the clipboard, **When** she taps "Paste LinkedIn link" and
   iOS allows the paste, **Then** the link is normalized (F4 rules), stored on the device, and her
   QR appears.
3. **Given** the clipboard holds something that is not a LinkedIn profile link (a short link, a
   company page, text), **Then** F4's message for that case appears and nothing is stored.
4. **Given** iOS refuses the paste, **Then** nothing is stored and she can try again.
5. **Given** a stored link, **When** the app is closed and reopened, **Then** My QR shows the QR
   without asking again.

---

### User Story 3 - Change my link (Priority: P2)

Her handle changed, or she pasted the wrong link. Below the QR she taps "Change link" and pastes the
new one; the new QR replaces the old one.

**Why this priority**: Rare, but without it a wrong paste would be stuck for good. P2 because the
QR works without it.

**Independent Test**: With a link set, tap "Change link" and paste another valid profile link: the
QR now opens the new profile. Paste an invalid one: the old QR stays.

**Acceptance Scenarios**:

1. **Given** a stored link, **Then** the My QR screen shows a small "Change link" option that does
   not compete with the QR.
2. **When** she pastes a new valid profile link through it, **Then** the new normalized link
   replaces the old one and the QR updates at once.
3. **When** the paste fails or is not a profile link, **Then** the stored link and the QR stay as
   they were, and F4's message appears.

---

### User Story 4 - Screen stays bright (Priority: P2)

While she holds up her QR, the phone does not dim or lock, so the other person has time to scan.

**Why this priority**: Asked in F9; a screen that dims mid-scan makes the moment awkward. P2
because the QR can still be scanned within the normal dimming time.

**Independent Test**: Set Auto-Lock to 30 seconds. Open My QR and wait 2 minutes without touching
the phone: the screen stays on. Switch to another tab: normal Auto-Lock applies again.

**Acceptance Scenarios**:

1. **Given** the QR is shown and the device allows it, **Then** the screen does not dim or lock
   while My QR stays open.
2. **Given** she leaves My QR (other tab, other app, phone locked by hand), **Then** the normal
   dimming and Auto-Lock apply again.
3. **Given** the device does not allow keeping the screen on, **Then** the QR is shown as usual and
   no error appears.

---

### Edge Cases

- **Setup screen with no link yet**: "Change link" is not shown; the screen also stays awake only
  when a QR is shown.
- **Long or special-character handle** (accents, emoji, very long): the QR still encodes the full
  normalized link and stays scannable.
- **Own profile link also belongs to a stored Person** (for example she once scanned her own QR):
  the two are unrelated; no merge question, no new Person, no Action.
- **Small screen or landscape**: the QR stays fully visible and square, without scrolling.
- **Storage full** when saving the link: nothing changes; F0's storage message appears.
- **Guest mode (F3)**: the tab bar, and so My QR, is never shown from guest mode (F7 FR-001c).
- **Note step still open today** (B18): the app opens on the note step, so My QR is reached after
  it is closed, as for every tab.
- **Connection comes back** while My QR is open from the offline screen: the app continues as usual
  (F0 FR-005) and stays on My QR, now with the tab bar.
- **Returning to the app** while My QR was open: the QR is shown again and the screen stays on
  again.

## Requirements *(mandatory)*

### Functional Requirements

#### Own profile link

- **FR-001**: The app MUST store one own profile link of the owner on the device. It is not a
  Person: it MUST NOT appear in Contacts, Actions, duplicate checks or merges.
- **FR-002**: When no own profile link is stored, My QR MUST show a one-line explanation of how to
  copy the profile link in LinkedIn and a "Paste LinkedIn link" button.
- **FR-003**: "Paste LinkedIn link" on My QR MUST follow F4's rules: read the clipboard after the
  owner's tap (iOS asks for confirmation, T5), accept only a LinkedIn profile link, normalize it to
  `https://www.linkedin.com/in/<handle>`, and show F4's messages when it is refused.
- **FR-004**: When a QR is shown, My QR MUST offer "Change link", which works as FR-003 and replaces
  the stored link only after a valid paste.
- **FR-005**: The own profile link MUST survive closing and reopening the app.

#### The QR

- **FR-006**: The My QR tab MUST replace F7's "coming soon" screen.
- **FR-007**: When an own profile link is stored, My QR MUST show a QR code that encodes exactly the
  normalized link, generated on the device (B32). It MUST NOT depend on LinkedIn or any other
  online service.
- **FR-008**: The QR MUST be large: at least 80% of the screen width in portrait, square and fully
  visible without scrolling, with the tab bar visible. My QR has no separate full-screen mode.
- **FR-009**: A butterfly MUST be shown in the middle of the QR, and the QR MUST stay scannable by
  the iPhone camera app and the LinkedIn app.
- **FR-010**: The QR MUST use dark modules on a light background in light and dark mode. It MAY use
  the app's own blue tones; it MUST NOT use LinkedIn's logo or brand (M2, constitution X).
- **FR-010a**: Below the QR, My QR MUST show one caption in both languages at once, whatever the
  app language: "Scan mij om te connecteren" / "Scan me to connect". It MUST NOT show the owner's
  name or a language switch.
- **FR-010b**: F0's full "no internet" screen (F0 FR-005) MUST offer "Show my QR", which opens My
  QR (including the setup of FR-002 when no link is stored) and a way back to the offline screen.
  The rest of the app MUST stay blocked there as before (B34).
- **FR-011**: My QR MUST NOT show notes, contacts, Actions or any data of other Persons
  (constitution VI).

#### Screen stays on

- **FR-012**: While My QR shows a QR and the app is in the foreground, the app MUST ask the device
  to keep the screen on, where the device allows it. When My QR is left or the app goes to the
  background, the normal behaviour MUST return.
- **FR-013**: When the device does not allow it, My QR MUST work as usual without an error message.

#### General

- **FR-014**: The app MUST NOT send the own profile link or anything else to LinkedIn or any server
  (constitution I, IV).
- **FR-015**: All new texts MUST exist in Dutch and English and follow the app language, except
  the caption of FR-010a, which shows both.

### Key Entities

- **Own profile link** (new, stored on the device): the owner's normalized LinkedIn profile URL,
  used only for My QR. Part of the device settings, with a change timestamp like every record
  (constitution IV). Whether it goes into the CSV export belongs to open question #6 (F10).
- **Person**, **Encounter**, **Event**, **Action**: not changed by F9.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any tab, the QR is on screen in 1 tap, without a noticeable wait (under half a
  second on the owner's iPhone).
- **SC-002**: In 10 out of 10 tries, another iPhone (camera app and LinkedIn app) opens the owner's
  profile from the QR at arm's length in normal indoor light.
- **SC-003**: Setting the own link takes at most 2 taps in the app once the link is copied ("Paste
  LinkedIn link" and the iOS paste confirmation).
- **SC-004**: With Auto-Lock at 30 seconds, the screen stays on for at least 2 minutes while My QR
  is open, on the owner's iPhone.
- **SC-005**: After closing and reopening the app, the QR appears without asking for the link again,
  in 100% of cases.

## Assumptions

- **My QR is an owner screen**, not part of guest mode: she holds up the phone, the other person
  only scans. Its texts follow the app language; no NL/EN switch on the screen. The caption for
  the person scanning shows both languages at once (FR-010a), so no switch is needed.
- **"Bright" means no dimming or locking**: a web app cannot raise the screen brightness; the owner
  turns it up herself if needed.
- **The owner copies her link in LinkedIn** (Share profile → Copy link), as in Flow A; no QR
  scanning of her own LinkedIn QR to set it up.
- **No delete of the own link** in F9: changing it is enough. Deleting all data (F10) also removes
  it.
- **A small free library** to make QR codes may be chosen in the plan phase (constitution II).
- **Internet is not needed** for My QR (also from the offline screen, B34); the person scanning
  needs it to open LinkedIn.
