# Feature Specification: F11 — Brand & Delight

**Feature Branch**: `010-brand-delight`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "F11" (F11 — Merk & plezier, `specs/features.md`)

Source: F11 in `specs/features.md`; `wiki/merk-en-stijl.md` (logo, colours, moments of delight,
tone); `wiki/visie.md`; decisions B10, B16, B18, B19, B20, B32, M1, M2, M4, M5, M6, M7;
constitution III, VIII, X
and the ranked quality values (speed > correctness > delight > simplicity). Replaces the
placeholders from F0 (app icon, colours) and F9 (butterfly in the middle of My QR).

## Clarifications

### Session 2026-10-12

- Q: When does the butterfly fly? Saving happens on the same tap that opens LinkedIn (B20), so the
  app is out of sight at that moment. → A: When the owner closes the note step (note saved or
  skipped), over the start screen. Once per new Encounter (wiki M7).
- Q: Who makes the logo? → A: It is drawn in this project from the wiki description. The owner
  gets a few proposals and picks and approves one. If she likes none of them, she makes one herself
  and F11 puts it in place (wiki M5).
- Q: Dark mode? → A: No. The app stays light, also when the iPhone is in dark mode (wiki M6).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognisable logo and app icon (Priority: P1)

The owner looks at her home screen. Between her other apps sits De Sociale Vlinder: a butterfly
whose wings subtly look like two connected network nodes, in the app's blue. It is clearly her own
brand, not LinkedIn's. When she shows the app to someone ("I built an app for this"), the same
logo appears in the app.

**Why this priority**: The logo is the core of the brand and of the showcase (B10). The app icon,
the launch screen and the butterfly on My QR all build on it.

**Independent Test**: The owner has approved one logo proposal (or delivered her own, M5).
Install the app on the iPhone home screen. The icon shows the final logo,
sharp, with no white corners or cut-off parts. Open the app: the logo appears where the app shows
its brand. Compare with the LinkedIn app icon: no shared logo, letters or shapes.

**Acceptance Scenarios**:

1. **Given** the app is added to the home screen, **Then** its icon shows the final logo, sharp and
   filling the rounded square that iOS draws, with the label "SB" (M4).
2. **Given** the logo, **Then** it shows a butterfly whose wings suggest two connected network
   nodes, and contains no LinkedIn logo, "in" mark or LinkedIn name.
3. **Given** the app is open, **Then** the logo appears on the start screen and wherever the
   placeholder butterfly was used before.
4. **Given** My QR shows the owner's QR, **Then** the butterfly in the middle is the final logo and
   the QR stays scannable (F9 FR-009).

---

### User Story 2 - One consistent colour palette (Priority: P1)

Every screen uses the same set of blue tones, plus a few neutral and warning colours. Buttons,
links, the tab bar, the status bar area and the icon all look like one app.

**Why this priority**: Together with the logo this is what makes the app look polished. It is
also the base for every later screen.

**Independent Test**: Walk through every tab and every add flow. All colours come from the palette;
text is easy to read on its background; nothing still looks like a placeholder.

**Acceptance Scenarios**:

1. **Given** any screen, **Then** its colours come from one defined palette of blue tones, neutrals
   and status colours (warning, error, danger).
2. **Given** any text on any background, **Then** it meets the usual contrast level for readable
   text (WCAG AA).
3. **Given** the app runs from the home screen, **Then** the area behind the iPhone status bar
   matches the palette.
4. **Given** the palette, **Then** it is LinkedIn-like blue (M2) and uses no LinkedIn logo or
   trademark (constitution X).
5. **Given** the phone is in dark mode, **Then** the app stays light, with the same palette as in
   light mode (M6).

---

### User Story 3 - Butterfly flutters after adding a contact (Priority: P2)

The owner has just met someone, connected in LinkedIn and come back to the app. She writes a
note or skips it. As the start screen appears, a small butterfly briefly flutters across it: a
little moment of fun that tells her "done". It never makes her wait: she can tap straight through
it, for example to add the next person.

**Why this priority**: This is the signature moment of delight in the wiki ("Contact opgeslagen:
vlinder fladdert kort over het scherm"). P2 because delight ranks below speed and correctness.

**Independent Test**: Add a contact via name and via QR. Close the note step once by saving a note
and once by skipping it. Each time the butterfly flutters over the start screen, is gone within
1.5 seconds, and a tap on "Add by name" during the animation works at once. Turn on iOS "Reduce
Motion": no fluttering.

**Acceptance Scenarios**:

1. **Given** a new Encounter was saved via name or QR, **When** she closes its note step by saving
   a note or by skipping it, **Then** a small butterfly flutters once across the start screen (M7).
2. **Given** the butterfly is flying, **When** she taps a button, **Then** the tap works at once,
   as if there were no animation.
3. **Given** the butterfly is flying, **Then** it is gone within 1.5 seconds and leaves nothing
   behind on the screen.
4. **Given** iOS "Reduce Motion" is on, **Then** the butterfly does not flutter across the screen.
5. **Given** the same person is met twice on one day (B19, no new Encounter), **When** she closes
   the note step shown for the existing Encounter, **Then** the butterfly does not fly.
6. **Given** saving the Encounter fails (for example, storage full), **Then** the butterfly does
   not fly; F0's message appears as before.
7. **Given** saving the note fails, **Then** the note step stays open as before and the butterfly
   does not fly yet.

---

### User Story 4 - Branded launch screen (Priority: P3)

When she opens the app from the home screen, she briefly sees the logo on the brand background
instead of a blank white screen, until the app is ready.

**Why this priority**: A small polish item from F11. P3 because it lasts only a moment and the app
works the same without it.

**Independent Test**: Close the app fully and open it from the home screen: the launch screen
shows the logo on the brand background, then the app appears. Opening is not slower than before.

**Acceptance Scenarios**:

1. **Given** the app is opened from the home screen, **When** it is still loading, **Then** the
   logo on the brand background is shown instead of a blank screen, where iOS allows it.
2. **Given** the launch screen, **Then** it disappears as soon as the app is ready; the app adds no
   waiting time to show it.
3. **Given** the iPhone is held in portrait, **Then** the logo is centred and not stretched.

---

### Edge Cases

- **Older icon cached by iOS**: iOS keeps the icon from when the app was added. The owner may need
  to remove the app from the home screen and add it again to see the new icon. Her data stays on
  the device (same address). The quickstart notes this.
- **Next person right away**: she taps "Add by name" while the butterfly flies; the next screen
  opens at once and the butterfly stops. At most one butterfly flies at a time.
- **Guest mode** (F3): the butterfly animation follows the same rules; it never shows notes or other
  Persons' data.
- **App goes to the background** while the butterfly flies: the animation is dropped; it does not
  replay on return.
- **Note step comes back after iOS closed the app** (B18): closing it then still gives the
  butterfly, once per Encounter, never twice.
- **Note step never closed** (the next day it no longer comes back, B18): no butterfly for that
  Encounter.
- **Note step in Contacts or Actions** (writing a note later, F7/F8): no butterfly; only the add
  flow gets it.
- **"I connected"** on the note step (B16) does not close it and does not trigger the butterfly.
- **Small screen or landscape**: the logo and the butterfly stay fully visible and in proportion.
- **Offline start** (F0 offline screen, B34): the offline screen uses the same logo and palette.
- **Butterfly on My QR**: if the final logo makes the QR harder to scan, the QR wins: the logo is
  made smaller or simpler in the middle (F9 FR-009).

## Requirements *(mandatory)*

### Functional Requirements

#### Logo

- **FR-001**: The app MUST have one final logo: a butterfly whose wings subtly suggest two connected
  network nodes (social + tech), in the brand palette.
- **FR-002**: The logo MUST NOT contain LinkedIn's logo, the "in" mark, the LinkedIn name or any
  other LinkedIn trademark (M2, constitution X).
- **FR-003**: The logo MUST be drawn in this project from the wiki description, as a few proposals.
  The owner picks one and approves it before it goes into the app. If she approves none, she
  delivers her own logo and F11 uses that one instead (M5).
- **FR-004**: The logo MUST replace every placeholder butterfly in the app: the app icon, the start
  screen, the offline screen, "coming soon" screens and the middle of the QR on My QR. The logo
  MUST exist in one place in the project, so that swapping it later (for example for the owner's
  own design) updates all of these at once.
- **FR-005**: The logo MUST stay recognisable from home-screen icon size up to full-screen size.

#### App icon and launch screen

- **FR-006**: The home-screen icon MUST show the final logo, sharp on the owner's iPhone, without
  white corners or cut-off parts. The home-screen label stays "SB" (M4).
- **FR-007**: All other icon sizes the app offers (browser tab, install prompts) MUST show the same
  logo.
- **FR-008**: When the app opens from the home screen, it MUST show the logo on the brand background
  while loading, where iOS allows it, and MUST NOT add waiting time to show it.

#### Colours

- **FR-009**: The app MUST use one defined palette: LinkedIn-like blue tones (M2), neutrals for text
  and backgrounds, and status colours (warning, error, danger). Every screen MUST take its colours
  from it.
- **FR-010**: All text MUST meet WCAG AA contrast against its background.
- **FR-011**: The browser and status-bar colour of the installed app MUST come from the palette.
- **FR-012**: The QR on My QR MUST keep dark modules on a light background (F9 FR-010), whatever
  the palette.
- **FR-012a**: The app MUST stay light when the iPhone is in dark mode. There is no dark palette
  (M6).

#### Butterfly animation

- **FR-013**: When the owner closes the note step of a newly saved Encounter (added via name or via
  QR) by saving a note or by skipping it, a small butterfly MUST flutter once across the start
  screen (M7).
- **FR-014**: The animation MUST NOT block input: every tap, swipe or keystroke during the animation
  MUST work at once (constitution VIII, X).
- **FR-015**: The animation MUST last at most 1.5 seconds and leave nothing behind on screen.
- **FR-016**: The animation MUST NOT delay saving, opening LinkedIn or showing the next screen.
- **FR-017**: The butterfly MUST fly at most once per new Encounter. It MUST NOT fly when no new
  Encounter was saved (B19, a failed save, a cancelled flow), nor when a note is written later in
  Contacts or Actions.
- **FR-018**: When iOS "Reduce Motion" is on, the butterfly MUST NOT move across the screen.
- **FR-019**: The animation is decorative: screen readers MUST ignore it.

#### General

- **FR-020**: Animations MUST NOT slow down the core flows: adding via name or QR takes the same
  number of taps and no extra waiting time compared to before F11.
- **FR-021**: F11 MUST NOT change any data, flow, text or tab. Only the look changes, plus the
  animation.
- **FR-022**: F11 MUST NOT load fonts, images or other files from an outside service at runtime
  (constitution II, IV).

### Key Entities

- No new or changed data. **Person**, **Encounter**, **Event**, **Action** and the own profile link
  stay as they are.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a contact via name or via QR takes the same number of taps as before F11, and
  the owner notices no extra wait (no step slower than before on her iPhone).
- **SC-002**: During the butterfly animation, a tap on a button responds as fast as without it, in
  10 out of 10 tries.
- **SC-003**: The butterfly is gone within 1.5 seconds, every time.
- **SC-004**: In 10 out of 10 tries, another iPhone (camera app and LinkedIn app) still opens the
  owner's profile from My QR with the final logo in the middle.
- **SC-005**: 100% of the text on every screen meets WCAG AA contrast.
- **SC-006**: A visual walk-through of every tab and flow finds no placeholder butterfly, no
  off-palette colour and no LinkedIn logo or trademark.
- **SC-007**: Shown the home screen, someone who does not know the app recognises the icon as a
  butterfly, not as LinkedIn.

## Assumptions

- **Typeface**: the iPhone's own system font stays. No custom font: it is free, fast and needs no
  download (constitution II).
- **Exact colour values** are picked in the plan phase within "LinkedIn-like blue" (M2) and
  reviewed by the owner on her iPhone.
- **Home-screen label** stays "SB" and the in-app name follows the language (M4).
- **Only the moments in the wiki** get delight: the butterfly after adding, the empty Actions text
  (already built in F8) and the butterfly on My QR (F9). No other new animations in F11.
- **"Reduce Motion"** is an iOS accessibility setting the app can read; respecting it is standard.
- **The launch screen** depends on what iOS supports for web apps on the home screen; if a device
  size is not covered, iOS shows its default and nothing breaks.
- **No sound and no vibration** with the animation.
