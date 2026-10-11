# Implementation Plan: F8 — Actions tab

**Branch**: `007-actions-tab` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-actions-tab/spec.md`

## Summary

The Actions tab replaces F7's "coming soon" screen. It shows one card per Person with open
Actions — note missing (only when no Encounter has a note, B31), not connected yet, profile link
missing — newest first, and lets the owner solve each one on the card: write a note, open
LinkedIn and tap "I connected", or paste the profile link (F4, including the merge question). An
Action can be dismissed, with Undo; a dismissed Action comes back when the Person is met again
(B30). The tab bar shows the number of open Actions as a badge.

Technical approach:

- **Data:** schema version 2 adds one table, `dismissals` (Person + type + `dismissedAt`, unique per
  Person and type). Nothing else changes; the upgrade only adds the empty table (research R1).
- **Logic:** a pure `src/people/actions.ts` derives Actions and cards in memory; a dismissal only
  counts while no Encounter was saved after it (R2, R3).
- **Badge:** a central `onDataChanged` signal fired by `withStorageErrors()` after every write keeps
  the count current from anywhere in the app (R4).
- **Screens:** `ActionsTab` with `ActionCard`s, reusing F7's `PersonDetail` and
  `ProfileLinkControl` (R5–R7).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack (React 19, Dexie 4, Vite, vite-plugin-pwa), jsqr (F5). **No new dependencies.**

**Storage**: IndexedDB via Dexie, **schema version 2** (new table `dismissals`; version 1 kept)

**Testing**: Vitest, React Testing Library, fake-indexeddb (including an upgrade test from version 1); manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (Safari)

**Project Type**: client-only web app (PWA)

**Performance Goals**: the tab opens and scrolls without a noticeable wait at 300 open Actions (SC-005); the badge updates right after a change (SC-004)

**Constraints**: €0; no network use (FR-014); notes never shown on the tab (FR-013); existing data MUST survive the upgrade (F0 FR-009)

**Scale/Scope**: 1 new table, 3 repository functions + 1 signal, 2 clean-ups in existing functions, 1 pure module, 1 hook, 2 new UI components, about 12 text keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | The card only links to the profile or search URL; "I connected" is the owner's own statement after tapping Connect in LinkedIn. |
| II | Zero Cost | ✅ Pass | No new library or service. |
| III | Installable iPhone Web App | ✅ Pass | Same home-screen app; the upgrade runs in the browser on first open (quickstart section 2). |
| IV | Local Data, Sync-Ready | ✅ Pass | Dismissals stay on the device, with UUID, `createdAt` and `updatedAt`; one record per Person and type merges cleanly later. |
| V | LinkedIn-Only Identity | ✅ Pass | Pasting a link uses F4's rules (normalized, unique, merge question). |
| VI | Privacy | ✅ Pass | Notes are not shown on the tab; the tab bar never appears in guest mode (F7 FR-001c). Deleting a Person also deletes their dismissals. |
| VII | Bilingual | ✅ Pass | About 12 new keys in NL and EN; the empty text is the fixed brand text. |
| VIII | Speed in the Moment | ✅ Pass | Nothing is added to the add flows; solving takes 1–2 taps; dismiss has no confirmation but has Undo. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Every gap is an Action until solved or dismissed (B30 brings it back on a new Encounter); the upgrade keeps all data; merges go through F4's confirmation. |
| X | Own Brand, Only v1 | ✅ Pass | No list of dismissed Actions, no filters, no notifications (spec Assumptions); no router, no live-query library. |

**Post-design re-check (after Phase 1)**: all pass. The schema change is required by the spec
(stored dismissals, FR-009) and follows F0's versioning rule; no Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-actions-tab/
├── plan.md              # This file
├── research.md          # R1–R9
├── data-model.md        # Dismissal, schema version 2, derived Actions and cards
├── quickstart.md        # laptop + iPhone checks, including the upgrade
├── contracts/
│   ├── storage-api.md   # dismissals, onDataChanged, clean-ups, actions.ts, useOpenActionCount
│   └── screens.md       # badge, Actions list, cards, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/src/
├── data/
│   ├── types.ts             # + ActionType, Dismissal
│   ├── db.ts                # + version(2): dismissals table
│   └── repository.ts        # + listDismissals, dismissAction, undoDismissal, onDataChanged;
│                            #   deletePerson and mergePersons also clean up dismissals
├── people/
│   ├── actions.ts           # NEW: ACTION_TYPES, openActions, buildActionCards, countOpenActions
│   └── useOpenActionCount.ts # NEW: badge count, reloads on onDataChanged
├── i18n/nl.ts, en.ts        # + tab.actionsCount, actions.*
├── ui/
│   ├── ActionsTab.tsx       # NEW: loads data, cards, dismiss/undo status line, opens PersonDetail
│   ├── ActionCard.tsx       # NEW: header, LinkedIn link, one row per Action, note field, dismiss
│   └── TabBar.tsx           # + optional badges prop, accessible name with count
├── App.tsx                  # Actions tab → ActionsTab; badge from useOpenActionCount
└── styles.css               # + badge, action cards
app/tests/
├── actions.test.ts          # NEW: rules, B30, B31, sorting, count, 300 Actions
├── actions-repository.test.ts # NEW: upgrade 1 → 2, dismiss/undo, clean-ups, onDataChanged
├── actions-ui.test.tsx      # NEW: cards, solving, dismiss + undo, return on new Encounter, detail, badge
└── tabs-ui.test.tsx         # Actions no longer "coming soon"
```

**Structure Decision**: same single client project. The derivation sits in `src/people/` next to
`contacts.ts`; storage rules in `src/data/repository.ts`; screens in `src/ui/`.

## Open points

None blocking. To check on the iPhone: the upgrade with real data, and the badge position on the
tab bar (quickstart sections 2–3).

## Complexity Tracking

No violations; nothing to justify.
