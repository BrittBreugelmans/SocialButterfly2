---

description: "Task list for F2 — Add by Name (Quick Mode)"
---

# Tasks: F2 — Add by Name (Quick Mode)

**Input**: Design documents from `specs/003-add-by-name/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `links.test.ts`, `add-by-name.test.ts`, `add-by-name-ui.test.tsx`), as
in F0 and F1. iPhone behaviour is checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1, US2, US3 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0 and F1 rules still apply ([../002-events/tasks.md](../002-events/tasks.md), "Ground rules"):
  terms from `wiki/begrippen.md`, every text via `t()` in `nl.ts` and `en.ts`, UI only through
  `app/src/data/repository.ts`, "today" only from `todayLocal()`.
- The only network traffic F2 adds is opening a LinkedIn URL for the owner. The app never reads
  anything back from LinkedIn (constitution I).
- Every new repository write runs in **one** `db.transaction` inside `withStorageErrors()`.
- No editing of Persons, no fuzzy name matching, no router (constitution X).
- UI tests render `<LanguageProvider><App /></LanguageProvider>` after
  `updateSettings({ contextChosenOn: todayLocal() })`, so the F1 daily choice does not appear,
  and mock `window.open` with `vi.spyOn(window, 'open')`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F1 baseline is green (66 tests) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new Settings field, the LinkedIn and name helpers, opening a URL, and all new texts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add `noteStepEncounterId?: string` to `Settings` in `app/src/data/types.ts`, with the comment "The Encounter whose note step is open (F2, B18). Ignored when the Encounter is gone or not dated today." Do **not** add a Dexie schema version: the field is not indexed (research R5).
- [X] T003 [P] Create `app/src/linkedin/links.ts` per [contracts/storage-api.md](contracts/storage-api.md), "Pure helpers":
  - `buildSearchUrl(name: string, company?: string): string` returns `'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(keywords)`, where keywords = trimmed name, plus `' '` + trimmed company when the company is not empty (research R2, B17).
  - `linkedInUrlFor(person: Pick<Person, 'profileUrl' | 'searchUrl'>): string | undefined` returns `profileUrl ?? searchUrl` (FR-011).
- [X] T004 [P] Create `app/src/people/nameMatch.ts` with `normalizeName(name: string): string`: trim, replace every run of whitespace with one space, then `toLocaleLowerCase()` (research R3). No accent folding.
- [X] T005 [P] Create `app/src/platform/openExternal.ts` with `openLinkedIn(url: string): boolean`. It calls `window.open(url, '_blank')` **without** the `noopener` feature (with it, `window.open` always returns `null`, so a block could not be detected), sets `opened.opener = null` on the returned window, and returns `true` unless the call returned `null` or threw (research R1). Add a comment that it must be called in the same tap handler, right after the save.
- [X] T006 [P] Add the 21 keys from the table "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`start.*`, `add.*`, `same.*`, `note.*`). Keep the placeholders `{date}` and `{name}`. Do **not** remove `app.comingSoon` yet (T013 does that).
- [X] T007 [P] Create `app/tests/links.test.ts`:
  - `buildSearchUrl('Jan Peeters', 'Elmos')` === `'https://www.linkedin.com/search/results/people/?keywords=Jan%20Peeters%20Elmos'`.
  - `buildSearchUrl(' Jan Peeters ', '  ')` and `buildSearchUrl('Jan Peeters')` both end in `keywords=Jan%20Peeters`.
  - Special characters are encoded: `buildSearchUrl('Zoë & Co', 'A/B')` contains `Zo%C3%AB%20%26%20Co%20A%2FB`.
  - `linkedInUrlFor` prefers `profileUrl`, falls back to `searchUrl`, and returns `undefined` when both are missing.
  - `normalizeName('  Jan   PEETERS ')` === `'jan peeters'`; `normalizeName('Zoë')` !== `normalizeName('Zoe')`.

**Checkpoint**: `npm run typecheck && npm test` are green; nothing visible has changed yet.

---

## Phase 3: User Story 1 - Add someone by name and find them on LinkedIn (Priority: P1) 🎯 MVP

**Goal**: From the start screen, the owner types a name (and optionally a company) and taps
"Search on LinkedIn". The Person and an Encounter in the current context are saved, then the
LinkedIn people search opens.

**Independent Test**: `npm test` (`add-by-name.test.ts`, `add-by-name-ui.test.tsx`) and
[quickstart.md](quickstart.md) sections 2–3. Until US3, the app returns to the start screen after
the search.

### Tests for User Story 1

- [X] T008 [P] [US1] Create `app/tests/add-by-name.test.ts` for `addByName({ name, company })` with a new Person:
  - The Person has `name` "Trimmed, not empty", `company` "Trimmed; empty → absent", `searchUrl === buildSearchUrl(name, company)`, no `profileUrl`, and `connectionStatus === 'notConnected'`.
  - The Encounter has `date === todayLocal()`; with an active Event (`chooseContext(id)`) its `eventId` is that id; during casual networking it has no `eventId`.
  - `getSettings().noteStepEncounterId === encounter.id` and `alreadyMetToday === false`.
  - An empty or blank name rejects with `ValidationError` and **nothing** is saved: 0 Persons, 0 Encounters, `noteStepEncounterId` unchanged.
- [X] T009 [P] [US1] Create `app/tests/add-by-name-ui.test.tsx` (App level, see Ground rules):
  - The start screen shows a `start.addByName` button and no longer shows `app.comingSoon`.
  - Tapping it shows `add.title`, the context (`context.casual`, or `context.at` + Event name), and the name input has focus.
  - `add.search` is disabled while the name is empty or only spaces.
  - Typing `Jan Peeters` and `Elmos` and tapping `add.search` calls `window.open` **once** with `(buildSearchUrl('Jan Peeters', 'Elmos'), '_blank')` (the mock returns `{} as Window`). Inside the mock, start `listPersons()` and later assert it returned 1 Person: the save finished before LinkedIn opened (FR-009).
  - With an empty company, `window.open` gets the name-only URL.
  - Two quick taps on `add.search` save 1 Person and 1 Encounter.
  - `add.back` returns to the start screen and saves nothing.

### Implementation for User Story 1

- [X] T010 [US1] Add `addByName(input: { name: string; company?: string })` to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md):
  - Validate with the existing `validatePerson({ name, company, searchUrl: buildSearchUrl(name, company) })`.
  - In **one** `db.transaction('rw', db.persons, db.events, db.encounters, db.settings, …)`: add the Person; create the Encounter exactly as `createEncounterInContext` does (read `activeEventId` inside the transaction, `date = todayLocal()`); put Settings with `noteStepEncounterId = encounter.id` and `updatedAt = nowIso()`.
  - Return `{ person, encounter, alreadyMetToday: false }`. Wrap it in `withStorageErrors()`. Make the T008 tests pass.
- [X] T011 [P] [US1] Make `onChange` optional in `app/src/ui/ContextBar.tsx`. Without it, render the same content in a `<div className="context-bar">` (not a button, no `aria-label`), so the form shows the context read-only (FR-002).
- [X] T012 [US1] Create `app/src/ui/AddByNameForm.tsx` per the form table in [contracts/screens.md](contracts/screens.md):
  - Props: `activeEvent: Event | undefined | 'loading'`, `onSaved(result: { person: Person; encounter: Encounter; alreadyMetToday: boolean; opened: boolean })`, `onBack()`.
  - Reuse the classes `event-form-screen` and `event-form`. Title `add.title`; `ContextBar` without `onChange`.
  - Name input: autofocus, `maxLength={100}`, `autoComplete="off"`, `autoCapitalize="words"`, placeholder `add.namePlaceholder`. Company input: `maxLength={100}`, same attributes, placeholder `add.companyPlaceholder`.
  - `add.search` is disabled while `name.trim() === ''` or while saving. On tap: `const result = await addByName({ name, company })`, then `const opened = openLinkedIn(linkedInUrlFor(result.person)!)`, then `onSaved({ ...result, opened })`.
  - On `StorageFullError`, stay on the form with the input kept (the F0 banner appears). `add.back` calls `onBack`.
- [X] T013 [US1] Update `app/src/ui/StartScreen.tsx`: replace the `app.comingSoon` paragraph with a primary button `start.addByName` that calls a new prop `onAddByName()`. Remove `'app.comingSoon'` from `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`.
- [X] T014 [US1] Update `app/src/App.tsx`:
  - Extend `Screen` with `'addByName'`. `StartScreen` gets `onAddByName={() => setScreen('addByName')}`.
  - Load the active Event when the screen is `'start'` **or** `'addByName'`, and pass it to `AddByNameForm`.
  - `AddByNameForm`: `onSaved` → `'start'` for now (US3 changes this), `onBack` → `'start'`. Make the T009 tests pass.
- [X] T015 [US1] Add styles to `app/src/styles.css`: `start.addByName` as a large full-width primary button (at least 56px high); the form inputs reuse `.event-form`; the read-only context bar without the tap affordance.

**Checkpoint**: on the iPhone, adding someone opens LinkedIn (quickstart sections 2–3). Push is possible.

---

## Phase 4: User Story 2 - Recognise someone she already met (Priority: P1)

**Goal**: A stored Person with the same name triggers "Is this the same person?". Yes adds an
Encounter to that Person (or reuses today's in the same context); no creates a new Person.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 6.

### Tests for User Story 2

- [X] T016 [P] [US2] Extend `app/tests/add-by-name.test.ts`:
  - `findSameNamePersons('  jan   PEETERS ')` finds a stored `Jan Peeters`, not `Jan Peeter`; it returns `[]` without a match.
  - Each match has `lastEncounterDate` = its newest Encounter date; matches are sorted newest first; a Person without Encounters has no `lastEncounterDate`.
  - `addByName({ name, existingPersonId })`: no new Person; the Person's `name`, `company` and `updatedAt` are unchanged; a new Encounter is created in the current context; `alreadyMetToday === false`.
  - Same Person, an Encounter already today in the **same** context (same `eventId`, or both casual): no new Encounter (count unchanged), the existing one is returned, `alreadyMetToday === true`, `noteStepEncounterId` = its id.
  - Same Person, an Encounter today in **another** context: a new Encounter.
  - Unknown `existingPersonId` rejects with `ValidationError` and nothing is saved.
- [X] T017 [P] [US2] Extend `app/tests/add-by-name-ui.test.tsx` with a stored `Jan Peeters` (company `Elmos`, Encounter on `2026-10-01`):
  - Typing `jan  peeters` and tapping `add.search` shows `same.title` with a button showing `Jan Peeters`, `Elmos` and `same.lastMet`; `window.open` is **not** called yet. A Person without company shows `same.noCompany`.
  - `add.back` on the question returns to the form with the typed text kept; nothing is saved.
  - Picking the stored Person: still 1 Person, a new Encounter, and `window.open` is called with its `profileUrl` when set, otherwise its `searchUrl`.
  - `same.newPerson`: 2 Persons named Jan Peeters.
  - When the stored Person already has an Encounter today in the current context: picking it does **not** call `window.open` (B19).

### Implementation for User Story 2

- [X] T018 [US2] Add `findSameNamePersons(name: string)` to `app/src/data/repository.ts`: compare `normalizeName(person.name) === normalizeName(name)` over `db.persons.toArray()`; for each match, `lastEncounterDate` = the newest `date` from its Encounters (absent when none). Sort by `lastEncounterDate`, newest first. Make the T016 tests for it pass.
- [X] T019 [US2] Extend `addByName` in `app/src/data/repository.ts` with `existingPersonId?: string` (same single transaction):
  - Load that Person (`ValidationError('existingPersonId', 'Unknown Person')` when missing). Do **not** change it (FR-007).
  - Look for its Encounter with `date === todayLocal()` and the same context as `activeEventId` (both absent for casual networking). Found → reuse it and return `alreadyMetToday: true`. Otherwise create one as in T010.
  - Set `noteStepEncounterId` to the returned Encounter in both cases. Make the T016 tests pass.
- [X] T020 [P] [US2] Create `app/src/ui/SameNameQuestion.tsx` per the question table in [contracts/screens.md](contracts/screens.md):
  - Props: `matches: Array<{ person: Person; lastEncounterDate?: string }>`, `onPick(personId: string)`, `onNewPerson()`, `onBack()`.
  - Title `same.title`. One full-width button per match: name; company or `same.noCompany`; `same.lastMet` with `{date}` = `formatDateRange(d, d, language)` (a single date in the app language), only when `lastEncounterDate` exists.
  - Then `same.newPerson` and `add.back` (class `secondary`).
- [X] T021 [US2] Update `app/src/ui/AddByNameForm.tsx`:
  - On `add.search`, first call `findSameNamePersons(name)`. If there are matches, show `SameNameQuestion` inside the form component (state `matches`), keeping `name` and `company`.
  - `onPick(id)` → `addByName({ name, company, existingPersonId: id })`; `onNewPerson` → `addByName({ name, company })`; `onBack` → hide the question.
  - Call `openLinkedIn(linkedInUrlFor(result.person)!)` **only when** `!result.alreadyMetToday`; pass `opened: false` otherwise. Make the T017 tests pass.
- [X] T022 [US2] Add question styles to `app/src/styles.css`: match buttons like `.event-option` (name bold on line 1, company and last-met date in `--muted` on line 2, ellipsis for long text).

**Checkpoint**: no silent duplicates (quickstart section 6, steps 1–5 except the note step).

---

## Phase 5: User Story 3 - Note and connection status right after LinkedIn (Priority: P2)

**Goal**: After the search, a note step with an "I connected" switch. It comes back after an iOS
kill on the same day (B18), and offers a fallback "Open LinkedIn" link (research R1).

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) sections 4 and 5.

### Tests for User Story 3

- [X] T023 [P] [US3] Extend `app/tests/add-by-name.test.ts`:
  - `getNoteStep()` after `addByName` returns `{ person, encounter }` for that Encounter.
  - It returns `undefined` when `noteStepEncounterId` is absent, when the Encounter was deleted, and when the Encounter's `date` is not today (use `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime` to move to tomorrow).
  - `finishNoteStep(id, '  Works on payments ')` stores `'Works on payments'` on the Encounter and removes `noteStepEncounterId`.
  - `finishNoteStep(id, '')` and `finishNoteStep(id, undefined)` keep an existing note and remove `noteStepEncounterId`.
- [X] T024 [P] [US3] Extend `app/tests/add-by-name-ui.test.tsx`:
  - After `add.search`, the note step shows `note.title` with the name, an empty note, and the switch `note.connected` off.
  - Turning the switch on sets `connectionStatus === 'connected'` **before** save or skip (read with `getPerson`); turning it off again sets `'notConnected'`.
  - Typing a note and tapping `note.save` stores it and shows the start screen; `note.skip` stores no note and shows the start screen.
  - Unmount and mount the App again on the same day with an open note step: the note step appears (B18). After save or skip, a remount shows the start screen.
  - On the next day (fake date + `contextChosenOn` = that day): no note step.
  - When `window.open` returns `null`: `note.openFailed` is shown, and a link `note.openLinkedIn` has the search URL as `href` and `target="_blank"`. When it opened: the link is shown without the hint.
  - Met today (B19): `note.alreadyMet` is shown, the note is pre-filled with the existing note, and the switch is on when the Person is already `'connected'`.

### Implementation for User Story 3

- [X] T025 [US3] Add `getNoteStep()` and `finishNoteStep(encounterId: string, note: string | undefined)` to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md):
  - `getNoteStep`: read `noteStepEncounterId`; return `{ person, encounter }` only if the Encounter exists, its `date === todayLocal()`, and its Person exists; otherwise `undefined`. Do not write.
  - `finishNoteStep`: in **one** transaction over `encounters` and `settings`, store `optionalText(note)` on the Encounter only when it is not `undefined` (empty = skip, the existing note stays) *(2026-10-09: implemented as the contract says: the note is stored only when it is not empty after trimming, so an empty save also keeps the existing note)*, set `updatedAt`, and remove `noteStepEncounterId` (use `compact()`). Make the T023 tests pass.
- [X] T026 [US3] Create `app/src/ui/NoteStep.tsx` per the note step table in [contracts/screens.md](contracts/screens.md):
  - Props: `person: Person`, `encounter: Encounter`, `alreadyMetToday: boolean`, `opened: boolean`, `onDone()`.
  - Title `note.title` with `{name}`. When `alreadyMetToday`, show `note.alreadyMet` above the note.
  - `<textarea>` labelled `note.label`, pre-filled with `encounter.note ?? ''`, placeholder `note.placeholder`.
  - `<input type="checkbox" role="switch">` labelled `note.connected`, checked = `person.connectionStatus === 'connected'`. Each change calls `updatePerson(person.id, { connectionStatus })` at once (research R6).
  - `note.save` → `finishNoteStep(encounter.id, note)` → `onDone()`. `note.skip` → `finishNoteStep(encounter.id, undefined)` → `onDone()`.
  - Always a small link `<a href={linkedInUrlFor(person)} target="_blank" rel="noopener">` with `note.openLinkedIn`; when `!opened && !alreadyMetToday`, show `note.openFailed` before it.
- [X] T027 [US3] Update `app/src/App.tsx`:
  - Extend `Screen` with `'noteStep'` and keep state `noteStep: { person; encounter; alreadyMetToday; opened } | undefined`.
  - `AddByNameForm.onSaved(result)` → store it and show `'noteStep'`. `NoteStep.onDone` → clear it and show `'start'`.
  - When the daily-choice status becomes `'ready'` (not `'choose'`), call `getNoteStep()` once; if it returns a step, show `'noteStep'` with `alreadyMetToday: false, opened: true` (B18). Keep the F1 rule that the choice comes first. Make the T024 tests pass. *(2026-10-09: nothing is shown until this check is done, so the start screen does not flash before a resumed note step. Because of that extra wait, two F1 language tests in `app/tests/i18n.test.tsx` now wait for the EN button with `findByRole` instead of `getByRole`, as F1 did in T017; the assertions are the same.)*
- [X] T028 [US3] Add note step styles to `app/src/styles.css`: a textarea at least 4 lines high with 16px text (no iOS zoom), a switch at least 44px high, Save as primary, Skip as `secondary`, the "Open LinkedIn" link small and in `--muted`, the hint in the warning colour.

**Checkpoint**: all three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T029 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the new screens come from `t()` (search `app/src/ui/` for string literals in JSX) and that `app.comingSoon` is gone everywhere.
- [ ] T030 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically; check that the deployment succeeds.
- [ ] T031 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–8 (manual, Britt). Write down in section 3 how LinkedIn opened (LinkedIn app, Safari or browser view).
- [ ] T032 Tick the F2 items in `specs/features.md` and add a line to `wiki/log.md` (date, "F2 implemented", how LinkedIn opened on the iPhone), per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (extends `addByName` and `AddByNameForm`).
- **US3 (Phase 5)**: depends on US1 (the form's `onSaved`); its "met today" display needs US2's
  `alreadyMetToday`, so do US2 first.
- **Polish (Phase 6)**: after US3.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` tasks (T010, T018, T019, T025) edit the same file: one at a time.
- `App.tsx` (T014, T027), `AddByNameForm.tsx` (T012, T021) and `styles.css` (T015, T022, T028)
  tasks run one at a time.
- T013 removes `app.comingSoon`; do it together with T014 so typecheck stays green.

### Parallel Opportunities

- Foundational: T002–T007 all together.
- US1: T008, T009 and T011 together.
- US2: T016, T017 and T020 together.
- US3: T023 and T024 together.

## Parallel Example: Foundational

```text
Task: "T003 Create app/src/linkedin/links.ts"
Task: "T004 Create app/src/people/nameMatch.ts"
Task: "T005 Create app/src/platform/openExternal.ts"
Task: "T006 Add the 21 text keys to nl.ts and en.ts"
Task: "T007 Create app/tests/links.test.ts"
```

## Parallel Example: User Story 2

```text
Task: "T016 [US2] Extend app/tests/add-by-name.test.ts"
Task: "T017 [US2] Extend app/tests/add-by-name-ui.test.tsx"
Task: "T020 [US2] Create app/src/ui/SameNameQuestion.tsx"
```

## Implementation Strategy

### MVP (User Stories 1 + 2, both P1)

1. Phase 1 → Phase 2.
2. US1 (save and search) → US2 (same-name question).
3. **Stop and validate**: quickstart sections 2, 3 and 6 on the iPhone. This already shows how
   LinkedIn opens (research R1) before the note step is built.

### Incremental Delivery

1. MVP → push.
2. US3 (note step, switch, return after an iOS kill) → push.
3. Polish: full quickstart, features list, wiki log.
