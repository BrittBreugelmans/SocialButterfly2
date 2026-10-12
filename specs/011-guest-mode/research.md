# Research: F3 — Guest Mode

All Technical Context items were known from F0–F11; nothing was marked NEEDS CLARIFICATION.
The points below are the design choices this feature needs.

## R1 — Remembering that guest mode is on (FR-018)

- **Decision**: one optional field on the existing Settings record, `guestModeOn?: true`, written
  through `updateSettings`. The App reads it on start, before any other screen is shown.
- **Rationale**: Settings already holds device state that must survive a reload
  (`noteStepEncounterId`, B18). An optional field with no index needs no schema version (as F10's
  `backupReminderLaterOn`). The App already waits for the daily choice and note-step checks before
  it renders, so one more read adds no flash of an owner screen.
- **Alternatives considered**: `localStorage` (synchronous, but a second storage place next to
  Dexie, outside `repository.ts`); `sessionStorage` (gone when iOS kills the app, which is exactly
  the case FR-018 covers); not remembering at all (the app would reopen on the tabs with the guest
  holding the phone, against constitution VI).
- **Write timing**: "Hand over" shows guest mode at once and writes the flag in the background
  (speed, constitution VIII). If the write fails (storage full), guest mode still works in memory;
  only FR-018 is lost for that session. Ending guest mode clears the flag the same way.

## R2 — Guest input is not stored

- **Decision**: name and company live in React state of the guest screen only. They are handed to
  the App on exit and passed to the quick mode form as initial values.
- **Rationale**: FR-010 (guest mode saves nothing) and the spec's assumption that input may be lost
  on a reload. Storing it would add a field and a cleanup rule for little gain.
- **Alternatives considered**: storing the draft in Settings (survives a reload, but is a Person's
  name outside the Person table, and must then also be cleared by "Delete all data").

## R3 — Guest language without changing the app language (FR-015, FR-016)

- **Decision**: a nested `GuestLanguageProvider` that supplies the same `LanguageContext` value
  shape, with its own `language` state starting at the app language and a `setLanguage` that only
  changes that local state. Guest screens use `useLanguage()` as usual, and can reuse
  `LanguageSwitch`. The translation function is pulled out as a pure `translate(language, key,
  params)` so both providers share it.
- **Rationale**: no change for any existing screen; the app setting is never written from guest
  mode; the next guest mode starts from the app language again (unmount drops the local state).
  `document.documentElement.lang` follows the guest language while guest mode is shown and goes
  back on unmount, so VoiceOver reads the right language.
- **Alternatives considered**: a `language` prop on each guest component (duplicates the switch
  logic); calling the real `setLanguage` and restoring it afterwards (writes Settings, and a reload
  in between would leave the app in the guest's language).

## R4 — The 2-second hold on the logo (FR-012, B44)

- **Decision**: a `LogoHoldButton` component: a `<button>` holding the F11 `Logo`, small, in a
  corner. Pointer events: `pointerdown` starts a 2000 ms timer and calls `setPointerCapture`;
  `pointerup` and `pointercancel` clear it. A class `holding` starts a CSS ring that fills in 2 s
  (FR-012 "shows that it is counting"). `contextmenu` is prevented; CSS sets
  `-webkit-touch-callout: none`, `user-select: none` and `touch-action: none` on the button, so iOS
  shows no image menu or text loupe. The click event does nothing.
- **Rationale**: the same pointer pattern as the Diagnostics long press in `SettingsTab.tsx`, which
  works on Britt's iPhone. Pointer capture means a finger that moves a little does not cancel the
  hold (unlike `pointerleave` in Settings). The logo comes from the one logo file (M5, M9), so
  Britt's own logo replaces it without changes here.
- **Ring under reduced motion**: the ring still fills; it is progress feedback, not decoration.
- **Accessible name**: `aria-label` "Back to Britt (hold 2 seconds)". Visible label: none (spec).
  A guest using VoiceOver would hear the hint; accepted, as the hold is not a security lock
  (spec Assumptions, Guided Access is the real lock).
- **Alternatives considered**: a shared `useLongPress` hook also used by Settings (refactoring F10
  code is out of scope; can be done later); `touchstart`/`touchend` (pointer events cover touch and
  mouse in one, already used); a `:active` CSS-only progress (cannot trigger the exit).

## R5 — Where guest mode sits in the App routing (FR-008, FR-018)

- **Decision**: guest mode is a state of `App` (`guestMode: boolean | 'loading'`), checked before
  everything else, including the offline screen, the daily choice and the note step. While it is
  on, the App renders only `<GuestMode>`: no `Banners`, no tab bar, no context bar.
- **On exit**: clear the flag; then route:
  1. daily choice still due (`status === 'choose'`) → the choice; the guest input waits and the
     quick mode form opens after the choice (so the Encounter gets the right context);
  2. a name was typed → quick mode form with the input;
  3. otherwise → Add tab.
- **Note step (B18)**: the start-up note-step check runs only after guest mode is off. In practice
  there is none: guest mode can only start from the start screen, which is reached after the note
  step is finished.
- **Rationale**: one place decides what the guest can see. The offline screen goes after guest mode
  because it offers "Show my QR" (an owner action) and guest mode needs no internet (spec edge
  case).
- **Alternatives considered**: a `'guest'` value of the existing `Screen` union only (the daily
  choice layout effect and the offline screen would win over it on a reload).

## R6 — Quick mode form with initial values (FR-013, FR-014)

- **Decision**: `AddByNameForm` gets optional `initialName` and `initialCompany` props, used as the
  initial state. Nothing else changes: the same-name check already runs from a `useEffect` on the
  name, so it runs at once for the handed-over name, before Britt taps "Search on LinkedIn" (B20).
- **Rationale**: F2's flow is reused untouched (FR-014): same-name question, save on the link tap,
  note step, "Back" saves nothing.
- **Alternatives considered**: a separate owner confirmation screen (an extra screen and tap for
  no gain).

## R7 — Guest screen layout (FR-006)

- **Decision**: one column, greeting as the heading at about 1.6rem, inputs at least 18px text and
  52px tall (also stops iOS zooming into fields under 16px), "Done" full width. The NL/EN switch and
  the logo button sit in the top row. Enter in the company field equals "Done". Colours from M8;
  light only (M6).
- **Rationale**: readable at arm's length by someone new to the app; matches the existing form
  styles so little new CSS is needed.

## R8 — iOS Guided Access

- **Decision**: no code. Guest mode works with or without it. With it on, LinkedIn cannot open
  from the app, which is fine because the guest never searches (B43). Britt ends Guided Access
  (triple-click) before she taps "Search on LinkedIn".
- **Check**: quickstart section 4 walks this on the iPhone.
