# Implementation Plan: F2 — Add by Name (Quick Mode)

**Branch**: `003-add-by-name` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-add-by-name/spec.md`

## Summary

The owner types a name (and optionally a company), taps "Search on LinkedIn", and the app saves
the Person and an Encounter in the current context before it opens the LinkedIn people search.
A stored Person with the same name triggers "Is this the same person?" (B15). After the search
she sees a note step with an "I connected" switch (B16). That step survives iOS closing the app
for the rest of the day (B18). Meeting the same Person twice on one day in the same context reuses
today's Encounter (B19).

Technical approach:

- **Data:** one new Settings field (`noteStepEncounterId`). No schema version change. New
  repository functions write each step in **one transaction**: `addByName` and `finishNoteStep`.
- **Logic:** pure helpers for the search link and the name match (`src/linkedin/`, `src/people/`).
- **Screens:** an "Add by name" button on the start screen, the quick mode form with the
  same-name question, and the note step. `App` gets two extra screen states; still no router.
- **Opening LinkedIn:** `window.open` right after the save. A fallback link on the note step
  covers a blocked or failed opening (research R1, checked on the iPhone).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: unchanged (React 19, Vite, vite-plugin-pwa, Dexie 4); no new packages

**Storage**: IndexedDB via Dexie, schema version 1 unchanged; one new non-indexed Settings field

**Testing**: Vitest, React Testing Library, fake-indexeddb; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (as F0)

**Project Type**: client-only web app (PWA)

**Performance Goals**: LinkedIn search for a new person in typing + at most 2 taps (SC-001); whole flow with skipped note under 30 s in the app (SC-002)

**Constraints**: €0; no personal data over the network except the search keywords LinkedIn needs in its own URL (constitution I, L2); save before LinkedIn opens (FR-009)

**Scale/Scope**: hundreds of Persons over the app's lifetime; 2 new screens, 1 changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | Only opens a public LinkedIn URL in LinkedIn or the browser. No reading back, no API, no automatic Connect; the owner taps Connect herself (FR-013). |
| II | Zero Cost | ✅ Pass | No new services or packages. |
| III | Installable iPhone Web App | ✅ Pass | Plain links and form controls; the opening behaviour is checked on the iPhone (R1). |
| IV | Local Data, Sync-Ready | ✅ Pass | Persons, Encounters and the note step are stored on the device; records keep UUIDs and timestamps. |
| V | LinkedIn-Only Identity | ✅ Pass | Every new Person gets a `searchUrl`; no email or phone fields. |
| VI | Privacy | ✅ Pass | The form, the same-name question and the note step are owner screens; guest mode (F3) will not show the question or notes. |
| VII | Bilingual | ✅ Pass | 21 new keys in NL and EN (contracts/screens.md); last-meeting dates in the app language. |
| VIII | Speed in the Moment | ✅ Pass | One button saves and searches; company optional (B17); the question only appears on a name match; note and switch are optional. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | `addByName` saves Person + Encounter + note step atomically before LinkedIn opens; same-name question (B15); note step returns after an iOS kill (B18); no duplicate Encounter on one day (B19). |
| X | Only v1 | ✅ Pass | No fuzzy matching, no editing of Persons, no router library. |

**Post-design re-check (after Phase 1)**: all pass; no violations, so no Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-by-name/
├── plan.md              # This file
├── research.md          # R1–R8
├── data-model.md        # Settings.noteStepEncounterId, derived rules, note step lifecycle
├── quickstart.md        # laptop + iPhone checks, including opening LinkedIn and an iOS kill
├── contracts/
│   ├── storage-api.md   # addByName, findSameNamePersons, getNoteStep, finishNoteStep
│   └── screens.md       # screen flow, form, same-name question, note step, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/src/
├── data/
│   ├── types.ts             # + Settings.noteStepEncounterId
│   └── repository.ts        # + findSameNamePersons, addByName, getNoteStep, finishNoteStep
├── linkedin/
│   └── links.ts             # NEW: buildSearchUrl(), linkedInUrlFor(person)
├── people/
│   └── nameMatch.ts         # NEW: normalizeName()
├── platform/
│   └── openExternal.ts      # NEW: openLinkedIn(url) → true if a window opened
├── i18n/nl.ts, en.ts        # + start.*, add.*, same.*, note.* keys; app.comingSoon removed
├── ui/
│   ├── AddByNameForm.tsx    # NEW: name, company, context, same-name question
│   ├── SameNameQuestion.tsx # NEW: list of matches + "No, new person"
│   ├── NoteStep.tsx         # NEW: note, "I connected" switch, save/skip, fallback link
│   ├── ContextBar.tsx       # onChange optional: read-only in the form
│   └── StartScreen.tsx      # + "Add by name" button instead of the "coming soon" text
├── App.tsx                  # screen state + 'addByName' | 'noteStep'; resumes the note step on start
└── styles.css               # + form, question, note step and switch styles
app/tests/
├── links.test.ts            # NEW: search link, name normalization
├── add-by-name.test.ts      # NEW: repository functions, atomic save, same day, note step lifecycle
└── add-by-name-ui.test.tsx  # NEW: form → search → note step; question; switch; resume after reload
```

**Structure Decision**: same single client project as F0 and F1. LinkedIn URL rules live in
`src/linkedin/` so F4, F5 and F7 can reuse them; storage rules stay in `src/data/repository.ts`.

## Open points

None blocking. One thing is checked on the iPhone instead of decided in advance: whether the
search opens in the LinkedIn app, in Safari, or in a browser view over the app (research R1,
quickstart section 3). The design works in all three.
