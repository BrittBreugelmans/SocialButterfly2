# Implementation Plan: F7 — Contacts

**Branch**: `006-contacts` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-contacts/spec.md`

## Summary

F7 gives the app its tab bar (Add, Contacts, Actions, My QR, Settings; B26) and builds the
Contacts tab. The list shows the people of the active Event, without an Event, or everyone. It is
searchable by name (ignoring case, spaces and accents). A Person's detail screen shows the
timeline of Encounters and notes and a real link to the profile, or to the search when the
profile link is missing. From there the owner can paste a profile link (F4), switch the
connection status (B16), edit name and company (B27), delete one Encounter (B25) or delete the
Person.

Technical approach:

- **Navigation:** no router. `App.tsx` gets a `tab` state. The tab bar is shown only on the five
  tab screens, never in add flows or the note step (research R1, R2).
- **List:** read all Persons, Encounters and Events once, then build rows in memory with a pure
  `buildContactRows` plus `searchKey` (R3, R4). The list state and scroll position are kept while
  a detail is open (R5).
- **Data:** no schema change. New repository functions `updatePersonDetails` (name, company,
  search link) and `deleteEncounterFromTimeline` (refuses the last Encounter), plus
  `listEncounters` (R8, R9).
- **Reuse:** F4's paste-and-merge code moves out of `NoteStep` into a shared `ProfileLinkControl`
  (R10).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack (React 19, Dexie 4, Vite, vite-plugin-pwa), jsqr (F5). **No new dependencies.**

**Storage**: IndexedDB via Dexie, schema version 1 unchanged

**Testing**: Vitest, React Testing Library, fake-indexeddb; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (Safari)

**Project Type**: client-only web app (PWA)

**Performance Goals**: list and search update without a noticeable wait at 500 Persons (SC-002, under 0.5 s on the iPhone); no extra taps in the add flows (SC-007)

**Constraints**: €0; no network use for contacts (FR-017); notes read-only (FR-010); tab bar never reachable from guest mode (FR-001c, FR-002)

**Scale/Scope**: about 6 new UI components, 1 refactored (NoteStep), 3 repository functions, 1 error, about 40 text keys; a few hundred Persons per year

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | "Open in LinkedIn" is a plain link to the profile or search URL; nothing is fetched from LinkedIn. |
| II | Zero Cost | ✅ Pass | No new library or service. |
| III | Installable iPhone Web App | ✅ Pass | Tab bar respects the iPhone safe area; checked in the home-screen app (quickstart section 2). |
| IV | Local Data, Sync-Ready | ✅ Pass | Only local reads and writes; every change sets `updatedAt`; ids unchanged. |
| V | LinkedIn-Only Identity | ✅ Pass | Editing name or company never changes `profileUrl` (the identity); the QR-derived name now stays editable after saving (B27). |
| VI | Privacy | ✅ Pass | Delete Person **and** delete Encounter are now available (B25). Contacts and notes are not reachable from guest mode: the tab bar is hidden there (FR-001c). |
| VII | Bilingual | ✅ Pass | About 40 new keys in NL and EN (contracts/screens.md); the typed `en` record catches gaps. |
| VIII | Speed in the Moment | ✅ Pass | The app opens on the Add tab; the add flows keep the same taps and show no tab bar (SC-007). |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Nothing is deleted without a confirmation; deletes are one transaction; the last Encounter cannot be deleted without deleting the Person (no Persons without Encounters). Merge reuses F4's confirmed flow. |
| X | Own Brand, Only v1 | ✅ Pass | Tabs not built yet show "coming soon" only (B26), with no extra features. No router, no icon library, no virtual list. Diagnostics test data is hidden behind a long press. |

**Post-design re-check (after Phase 1)**: all pass. No new dependencies; no Complexity Tracking
needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-contacts/
├── plan.md              # This file
├── research.md          # R1–R12
├── data-model.md        # what F7 changes, delete rules, derived contact rows and views
├── quickstart.md        # laptop + iPhone checks
├── contracts/
│   ├── storage-api.md   # updatePersonDetails, deleteEncounterFromTimeline, listEncounters, contacts.ts, ProfileLinkControl
│   └── screens.md       # tab bar, coming soon, list, detail, confirmations, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/src/
├── data/
│   ├── errors.ts            # + LastEncounterError
│   └── repository.ts        # + updatePersonDetails, deleteEncounterFromTimeline, listEncounters
├── people/
│   └── contacts.ts          # NEW: ContactView, buildContactRows, searchKey, defaultView
├── i18n/nl.ts, en.ts        # + tabs.*, tab.*, soon.*, contacts.*, person.*, encounter.*, diagnostics.addManyTestData
├── ui/
│   ├── TabBar.tsx           # NEW: bottom nav, 5 tabs, inline SVG icons
│   ├── ComingSoon.tsx       # NEW: placeholder for Actions, My QR, Settings
│   ├── ContactsTab.tsx      # NEW: loads data; view, search, open Person, scroll restore
│   ├── ContactList.tsx      # NEW: view picker, search field, rows, empty states
│   ├── PersonDetail.tsx     # NEW: header, edit form, LinkedIn link, status, timeline, deletes
│   ├── ConfirmPanel.tsx     # NEW: in-page confirmation (text, red confirm, cancel)
│   ├── ProfileLink.tsx      # NEW: ProfileLinkControl, moved out of NoteStep (F4 behaviour)
│   ├── NoteStep.tsx         # uses ProfileLinkControl; behaviour unchanged
│   └── Diagnostics.tsx      # + "Add 500 test contacts"
├── App.tsx                  # + tab state; tab bar only on tab screens; add flows return to Add
└── styles.css               # + tab bar (safe area), list rows, status chip, timeline, confirm panel
app/tests/
├── contacts.test.ts         # NEW: buildContactRows (views, sort, 500 Persons), searchKey table, defaultView
├── contacts-repository.test.ts # NEW: updatePersonDetails, deleteEncounterFromTimeline, listEncounters
├── tabs-ui.test.tsx         # NEW: opens on Add, switching, coming soon, no tab bar in flows
├── contacts-ui.test.tsx     # NEW: list views, search, empty states, back keeps state
├── person-detail-ui.test.tsx # NEW: timeline, links, status, edit, delete Person/Encounter, last Encounter, paste + merge
└── link-profile-ui.test.tsx # existing: must stay green after the ProfileLinkControl move
```

**Structure Decision**: same single client project. Pure list logic sits in `src/people/` next to
`nameMatch.ts`; storage rules stay in `src/data/repository.ts`; screens in `src/ui/`.

## Open points

None blocking. To check on the iPhone: the tab bar above the home indicator, scroll restore on
Back, and the 500-contact speed (quickstart sections 2–4).

## Complexity Tracking

No violations; nothing to justify.
