# Implementation Plan: F3 — Guest Mode

**Branch**: `011-guest-mode` (work on `main`, as for F0–F11) | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-guest-mode/spec.md`

## Summary

A "Hand over" button on the Add tab opens guest mode: a big, friendly screen with the greeting,
name and optional company, the privacy line and an NL/EN switch. The guest taps "Done" and sees
"Thanks! Hand the phone back to Britt 🦋". Guest mode saves nothing. Britt holds the small logo
for 2 seconds and lands on F2's quick mode form, filled in. From there F2 runs unchanged (B43,
B44).

Technical approach:

- **Guest flag (R1):** one optional Settings field `guestModeOn`. The App reads it before any
  other screen, so a reload by iOS reopens guest mode, not the tabs (FR-018).
- **Routing (R5):** guest mode wins over the offline screen, the daily choice and the note step.
  While it is on, only `GuestMode` is rendered: no banners, tab bar or context bar (FR-008).
- **Language (R3):** a nested `GuestLanguageProvider` with local state; the app language is never
  written from guest mode (FR-016).
- **Hold (R4):** `LogoHoldButton` with pointer events, pointer capture, a 2000 ms timer and a
  filling ring. iOS image menu and loupe are switched off.
- **Hand-back (R6):** `AddByNameForm` gets `initialName` / `initialCompany`; its same-name check
  runs at once.
- **Schema:** still version 2. No new dependency.

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack (React 19, Dexie 4, Vite, vite-plugin-pwa). **No new
dependencies.** Browser APIs: Pointer Events (`setPointerCapture`).

**Storage**: IndexedDB via Dexie, **still schema version 2**. `Settings` gets one optional field
with no index.

**Testing**: Vitest, React Testing Library, fake-indexeddb; fake timers for the 2-second hold.
Manual checks on the iPhone, including Guided Access ([quickstart.md](quickstart.md)).

**Target Platform**: iOS 17+ home-screen web app (Safari).

**Project Type**: client-only web app (PWA)

**Performance Goals**: guest mode appears on the "Hand over" tap with no visible wait (the flag is
written in the background); the hold ends guest mode at 2 s ± one frame.

**Constraints**: €0; nothing leaves the device (constitution IV); the guest can reach no owner
screen and no other Person's data (constitution VI); F2's add flow stays at most 2 taps for Britt
after the hold (SC-002).

**Scale/Scope**: 1 settings field; 1 repository function; 1 pure i18n helper and 1 provider;
2 new components (`GuestMode`, `LogoHoldButton`); 3 changed (`App`, `StartScreen`,
`AddByNameForm`); 8 text keys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | Guest mode never touches LinkedIn. The owner opens LinkedIn from F2's form as before. |
| II | Zero Cost | ✅ Pass | No library, no service. |
| III | Installable iPhone Web App | ✅ Pass | Pointer events and CSS only. Works under iOS Guided Access (R8). |
| IV | Local Data, Sync-Ready | ✅ Pass | The flag is device state in Settings; guest input stays in memory. Nothing is sent anywhere. |
| V | LinkedIn-Only Identity | ✅ Pass | No Person is created in guest mode. Saving goes through F2's `addByName` with its rules. |
| VI | Privacy | ✅ Pass | This is what F3 delivers: privacy line visible; only `GuestMode` is rendered, so no list, notes, Actions, Event name or banners; the same-name check runs only on the owner's form (B43); a reload reopens guest mode (FR-018). |
| VII | Bilingual, Welcoming | ✅ Pass | Switch on both guest screens, input kept; all 8 keys in NL and EN; approved fixed texts. |
| VIII | Speed in the Moment | ✅ Pass | One tap to hand over; after the hold, F2's 1–2 taps. The flag write does not block the screen. Justified extra step for the owner: the 2-second hold, chosen by Britt (B44) to keep the guest out. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Nothing is saved until the owner searches, then F2's same-name question applies (B15). Guest input lost on a reload is not a saved Encounter (spec Assumptions). |
| X | Own Brand, Only v1 | ✅ Pass | Uses the F11 logo file; no LinkedIn marks. No guest-on-own-phone (open question #14). |

**Post-design re-check (after Phase 1)**: all pass. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/011-guest-mode/
├── plan.md              # This file
├── research.md          # R1–R8
├── data-model.md        # Settings.guestModeOn, guest input, state transitions
├── quickstart.md        # tests, laptop walk-through, iPhone + Guided Access
├── contracts/
│   ├── storage-api.md   # setGuestMode, translate, GuestLanguageProvider, components, App state
│   └── screens.md       # Add tab, guest form, thank-you, LogoHoldButton, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/
├── src/
│   ├── data/
│   │   ├── types.ts             # + Settings.guestModeOn
│   │   └── repository.ts        # + setGuestMode
│   ├── i18n/
│   │   ├── LanguageProvider.tsx # + translate (pure), + GuestLanguageProvider
│   │   └── nl.ts, en.ts         # + start.handOver, guest.* (8 keys)
│   ├── ui/
│   │   ├── GuestMode.tsx        # NEW: form + thank-you, inside GuestLanguageProvider
│   │   ├── LogoHoldButton.tsx   # NEW: 2-second hold on the logo (R4)
│   │   ├── StartScreen.tsx      # + "Hand over" button
│   │   └── AddByNameForm.tsx    # + initialName / initialCompany
│   ├── App.tsx                  # guestMode state, read on start, render first; exit routing; guestInput
│   └── styles.css               # + guest screen, hold ring, touch-callout off
└── tests/
    ├── guest-mode-ui.test.tsx   # NEW: see quickstart section 2
    ├── settings-repository.test.ts # + setGuestMode
    ├── add-by-name-ui.test.tsx  # + initial values, same-name question for a handed-over name
    └── i18n.test.tsx            # + translate; guest switch does not change Settings.language
```

**Structure Decision**: same single client project. Guest screens live in `src/ui/` like every
other screen; language logic stays in `src/i18n/`; only `data/repository.ts` touches the database.

## Dependency on F11

The hold button uses `ui/Logo.tsx` and `public/logo.svg` from F11 (`specs/010-brand-delight`),
which Britt is finishing now. F3 implementation starts after that is in place; if Britt's own logo
replaces voorstel B later, guest mode follows without changes (M5).

## Wiki follow-up (done with this plan)

None needed: B43, B44, the flows and the fixed texts were updated with the spec. No new term.

## Open points

None blocking. To check on the iPhone (quickstart section 4): no image menu during the hold;
reopening after the app is swiped away; Guided Access.

## Complexity Tracking

No violations; nothing to justify.
