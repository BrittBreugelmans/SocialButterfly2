# Implementation Plan: F1 — Events

**Branch**: `002-events` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-events/spec.md`

## Summary

The owner creates Events (name, start and end date) and chooses each day whether she networks
at an Event or casually (B12, B13). The choice is stored on the device; every Encounter created
later gets the active Event automatically (B5).

Technical approach:

- **Data:** one new Settings field (`contextChosenOn`) and three repository functions that write
  the choice atomically. No schema version change.
- **Logic:** two pure functions decide when to ask and in which order to show Events.
- **Screens:** a choice screen, a new-event form and a context bar on the start screen. `App`
  switches between them with simple screen state; there is no router.

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: unchanged from F0 (React 19, Vite, vite-plugin-pwa, Dexie 4); no new packages

**Storage**: IndexedDB via Dexie, schema version 1 unchanged; one new non-indexed Settings field

**Testing**: Vitest, React Testing Library, fake-indexeddb; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (as F0)

**Project Type**: client-only web app (PWA)

**Performance Goals**: create and activate a one-day Event in under 20 s (SC-001); choose in at most 2 taps (SC-002)

**Constraints**: €0; no personal data over the network; the choice never interrupts active use (research R1)

**Scale/Scope**: tens of Events over the app's lifetime; 3 screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | No LinkedIn interaction in F1. |
| II | Zero Cost | ✅ Pass | No new services or packages. |
| III | Installable iPhone Web App | ✅ Pass | Native date picker; no native code. |
| IV | Local Data, Sync-Ready | ✅ Pass | Choice stored in Settings on the device; Events keep UUIDs and timestamps. |
| V | LinkedIn-Only Identity | ✅ Pass | Not affected. |
| VI | Privacy | ✅ Pass | The Event list is an owner screen; guest mode (F3) never shows it (spec assumption). |
| VII | Bilingual | ✅ Pass | 19 new keys in NL and EN; dates formatted in the app language. |
| VIII | Speed in the Moment | ✅ Pass | One-day Event = name + 1 tap; daily choice = 1 tap via "Continue with"; no Event choice per contact (FR-009). |
| IX | No Lost Contacts | ✅ Pass | Atomic `createAndActivateEvent` and `chooseContext`; Encounters get the Event inside the same transaction; asking each day prevents a wrong context. |
| X | Only v1 | ✅ Pass | No editing or deleting of Events (B14, F10); no router library. |

**Post-design re-check (after Phase 1)**: all pass; no violations, so no Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-events/
├── plan.md              # This file
├── research.md          # R1–R8
├── data-model.md        # Settings.contextChosenOn, derived states, transitions
├── quickstart.md        # laptop + iPhone checks, including the date change
├── contracts/
│   ├── storage-api.md   # chooseContext, createAndActivateEvent, createEncounterInContext, helpers
│   └── screens.md       # screen flow, choice, form, context bar, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/src/
├── data/
│   ├── dates.ts             # NEW: todayLocal(), addDaysLocal()
│   ├── types.ts             # + Settings.contextChosenOn
│   └── repository.ts        # + chooseContext, createAndActivateEvent, createEncounterInContext
├── events/
│   ├── choice.ts            # NEW: needsDailyChoice(), orderEventsForChoice()
│   ├── useDailyChoice.ts    # NEW: checks on start and on return to the foreground
│   └── formatDateRange.ts   # NEW: Intl formatRange in the app language
├── i18n/nl.ts, en.ts        # + choice.*, event.*, context.* keys
├── ui/
│   ├── ContextChoice.tsx    # NEW: the choice screen
│   ├── NewEventForm.tsx     # NEW: name, start, end
│   ├── ContextBar.tsx       # NEW: on the start screen
│   ├── StartScreen.tsx      # + ContextBar
│   └── Diagnostics.tsx      # uses data/dates.ts instead of its own localIsoDate()
├── App.tsx                  # screen state: 'choice' | 'newEvent' | 'start'
└── styles.css               # + choice, form and context bar styles
app/tests/
├── choice.test.ts           # NEW: ordering and daily-choice rules with fixed dates
├── context.test.ts          # NEW: repository context functions, Encounter linking
└── events-ui.test.tsx       # NEW: choice → form → start; context bar; same day vs next day
```

**Structure Decision**: same single client project as F0. Event logic lives in a new
`src/events/` folder; the storage rules stay in `src/data/repository.ts`.

## Open points

None. Both spec questions were answered (B13, B14).
