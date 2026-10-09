---

description: "Task list for F1 — Events"
---

# Tasks: F1 — Events

**Input**: Design documents from `specs/002-events/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `choice.test.ts`, `context.test.ts`, `events-ui.test.tsx`), as in F0.
iPhone behaviour is checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1, US2, US3 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0 rules still apply ([../001-app-foundation/tasks.md](../001-app-foundation/tasks.md), "Ground
  rules"): terms from `wiki/begrippen.md`, every text via `t()` in `nl.ts` and `en.ts`, UI only
  through `app/src/data/repository.ts`, no network calls with personal data.
- "Today" always comes from `todayLocal()` in `app/src/data/dates.ts`, never from
  `new Date().toISOString()` (research R2).
- No editing or deleting of Events in F1 (B14).
- The live app deploys on every push to `main`; no Cloudflare setting changes are needed.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F0 baseline is green (33 tests) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared date helpers, the new Settings field, all new texts and date formatting.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `app/src/data/dates.ts` with `todayLocal(): string` and `addDaysLocal(date: string, days: number): string`. Both return `YYYY-MM-DD` in the phone's **local** time. Build dates with `new Date(year, month - 1, day + days)` so daylight-saving changes cannot shift the day (research R2).
- [X] T003 Refactor `app/src/ui/Diagnostics.tsx`: remove the private `localIsoDate()` and use `todayLocal()` and `addDaysLocal(todayLocal(), 2)` from `app/src/data/dates.ts`. Behaviour stays the same.
- [X] T004 [P] Add `contextChosenOn?: string` to `Settings` in `app/src/data/types.ts`, with the comment "Local date (YYYY-MM-DD) on which the owner last chose an Event or casual networking (FR-005)". Do **not** add a Dexie schema version: the field is not indexed (research R4).
- [X] T005 [P] Add the 19 keys from the table "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`choice.*`, `event.*`, `context.*`). `choice.continue` keeps the `{name}` placeholder.
- [X] T006 [P] Create `app/src/events/formatDateRange.ts` with `formatDateRange(startDate: string, endDate: string, language: Language): string`. Parse the ISO dates as local dates. Use `Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })`; `.formatRange(start, end)` when the dates differ, `.format(start)` when they are equal (research R8).
- [X] T007 [P] Create `app/tests/choice.test.ts` with tests for the helpers: `addDaysLocal('2026-10-30', 3) === '2026-11-02'`; `addDaysLocal('2026-03-28', 2) === '2026-03-30'` (daylight-saving change); `todayLocal()` matches `^\d{4}-\d{2}-\d{2}$`; `formatDateRange('2026-10-06', '2026-10-08', 'en')` contains `Oct` and `2026`; equal dates give a single date without a dash.

**Checkpoint**: `npm run typecheck && npm test` are green; nothing visible has changed yet.

---

## Phase 3: User Story 1 - Create an Event on arrival (Priority: P1)

**Goal**: The owner creates an Event (name, start, end) and it becomes active at once; new
Encounters get the active Event automatically.

**Independent Test**: `npm test` (`context.test.ts`, form tests). On the iPhone, this needs the
choice screen from US2 as entry point: [quickstart.md](quickstart.md) section 2.

### Tests for User Story 1

- [X] T008 [P] [US1] Create `app/tests/context.test.ts` covering:
  - `createAndActivateEvent`: the Event is created, `activeEventId` is its id, and `contextChosenOn === todayLocal()`.
  - With an empty name or an `endDate` before `startDate` it rejects with `ValidationError`, **no** Event is saved and Settings are unchanged.
  - The same day for start and end is allowed.
  - `createEncounterInContext({ personId })`: with an active Event the Encounter gets that `eventId`; during casual networking it has no `eventId`; `date === todayLocal()`; an unknown `personId` rejects with `ValidationError`.
- [X] T009 [P] [US1] Create `app/tests/events-ui.test.tsx` with tests for `NewEventForm` rendered alone inside `LanguageProvider`:
  - The start and end date default to `todayLocal()`, and the end input has `min` = start date.
  - Save is disabled while the name is empty or only spaces.
  - Changing the start date to after the end date sets the end date to the start date.
  - Saving `Devoxx 2026` calls `onSaved` with an Event that is now active (`getSettings().activeEventId`).
  - `onBack` is called by the Back button without saving anything.

### Implementation for User Story 1

- [X] T010 [US1] Add `createAndActivateEvent(input: { name; startDate; endDate })` to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md):
  - Validate with the existing `validateEvent` ("`name` trimmed, not empty"; "`endDate` MUST NOT be before `startDate` and MAY equal it").
  - In **one** `db.transaction('rw', db.events, db.settings, …)`, add the Event and put Settings with `activeEventId` = the new id, `contextChosenOn = todayLocal()` and `updatedAt = nowIso()`.
  - Wrap it in `withStorageErrors()`. Make the T008 tests for it pass.
- [X] T011 [US1] Add `createEncounterInContext(input: { personId: string; note?: string })` to `app/src/data/repository.ts`:
  - In one transaction over `persons`, `events`, `encounters` and `settings`, check that the Person exists (`ValidationError` otherwise).
  - Read `activeEventId` from Settings **inside** the transaction and set `eventId` to it, or leave it absent during casual networking (FR-009).
  - Set `date = todayLocal()`, `note` via `optionalText`, and use `compact()`. Wrap it in `withStorageErrors()`. Make the T008 tests pass.
- [X] T012 [US1] Create `app/src/ui/NewEventForm.tsx` per the form table in [contracts/screens.md](contracts/screens.md):
  - Props: `onSaved(event: Event)` and `onBack()`.
  - Name input: autofocus, `maxLength={80}`, placeholder `event.namePlaceholder`.
  - Start and end use `<input type="date">`. The end has `min={startDate}`. When the start date moves past the end date, set the end date to the start date.
  - Save (`event.save`) is disabled while `name.trim() === ''`. It calls `createAndActivateEvent`.
  - On `ValidationError`, show `event.errorName` for field `name`, otherwise `event.errorDates`. On `StorageFullError`, stay on the form (the F0 banner appears).
  - Back (`event.back`) calls `onBack`. Make the T009 tests pass.
- [X] T013 [US1] Add form styles to `app/src/styles.css`: full-width inputs at least 44px high, labels above the fields, Save as the primary button, Back as `secondary`.

**Checkpoint**: storage functions and form work in tests; the form is reachable on screen after US2.

---

## Phase 4: User Story 2 - Choose how to network when opening the app (Priority: P1)

**Goal**: On the first opening of each day the owner chooses an Event, a new Event or casual
networking; later openings that day go straight to the start screen (B13).

**Independent Test**: `npm test` (`choice.test.ts`, `events-ui.test.tsx`) and
[quickstart.md](quickstart.md) sections 2 and 3 on the iPhone.

### Tests for User Story 2

- [X] T014 [P] [US2] Extend `app/tests/choice.test.ts`:
  - `needsDailyChoice`: true when `contextChosenOn` is missing, true when it is another date, false when it equals `today`.
  - `orderEventsForChoice` with fixed `today = '2026-10-09'`:
    - current = `startDate ≤ today ≤ endDate`, with `previousEventId` first, then by `startDate`;
    - upcoming = `startDate > today`, soonest first;
    - past = `endDate < today`, most recently ended first;
    - an Event ending today counts as current.
- [X] T015 [P] [US2] Extend `app/tests/context.test.ts` for `chooseContext`: with an id it sets `activeEventId` and `contextChosenOn === todayLocal()`; with `undefined` it removes `activeEventId` (casual networking) and still sets `contextChosenOn`; an unknown id rejects with `ValidationError` and changes nothing.
- [X] T016 [P] [US2] Extend `app/tests/events-ui.test.tsx` with App-level tests (render `<LanguageProvider><App /></LanguageProvider>`). Use `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime` for "today" and "tomorrow". Cover:
  - Without Settings, the choice (`choice.title`) appears.
  - With no Events, only `choice.newEvent` and `choice.casual` are shown.
  - Tapping `choice.casual` shows the start screen.
  - Unmount and mount again on the same day: the start screen appears without the choice.
  - With `contextChosenOn` = yesterday and a three-day Event still running as `activeEventId`: a `choice.continue` button with the Event name is first, and one tap shows the start screen.
  - With an ended Event: no continue button; the Event is under `choice.past`.
  - A `visibilitychange` to `visible` on a new day shows the choice.
  - `choice.newEvent` → form → save → start screen.
- [X] T017 [US2] Update the F0 tests `app/tests/banners.test.tsx` and `app/tests/i18n.test.tsx`: in a `beforeEach`, store Settings with `contextChosenOn: todayLocal()` (via `updateSettings`), so the App opens on the start screen as these tests expect. Do not change what they assert. *(2026-10-09: the start screen now appears after the daily check has read Settings, so two banner tests wait for it with `findByText` instead of `getByText`; the assertions are the same.)*

### Implementation for User Story 2

- [X] T018 [P] [US2] Create `app/src/events/choice.ts` with `needsDailyChoice(settings, today)` and `orderEventsForChoice(events, today, previousEventId?)`. Use exactly the rules from research R3 and the "Derived" table in [data-model.md](data-model.md). Make the T014 tests pass.
- [X] T019 [US2] Add `chooseContext(eventId: string | undefined)` to `app/src/data/repository.ts`:
  - In one `db.transaction('rw', db.settings, db.events, …)`, check that the Event exists (`ValidationError` otherwise).
  - Write Settings with `activeEventId = eventId` (removed by `compact()` when `undefined`), `contextChosenOn = todayLocal()` and `updatedAt = nowIso()`.
  - Wrap it in `withStorageErrors()`. Make the T015 tests pass.
- [X] T020 [US2] Create `app/src/events/useDailyChoice.ts`:
  - A hook returning `{ status: 'loading' | 'choose' | 'ready', recheck() }`.
  - On mount, read `getSettings()` and compute `needsDailyChoice(settings, todayLocal())`.
  - Recheck on `document` `visibilitychange` when `document.visibilityState === 'visible'`. Never recheck on a timer while the app is visible (research R1). Remove the listener on unmount.
- [X] T021 [US2] Create `app/src/ui/ContextChoice.tsx` per the choice table in [contracts/screens.md](contracts/screens.md):
  - Props: `onNewEvent()` and `onDone()`.
  - Load `listEvents()` and `getSettings()`, then group with `orderEventsForChoice(events, todayLocal(), settings.activeEventId)`.
  - Show a highlighted `choice.continue` button (with `{name}` and `formatDateRange`) only when `settings.activeEventId` is a current Event.
  - Show the sections current, upcoming and past, each heading only when the section is not empty. Each Event button shows its name and `formatDateRange`.
  - `choice.newEvent` calls `onNewEvent`. `choice.casual` calls `chooseContext(undefined)` and then `onDone`. An Event button calls `chooseContext(id)` and then `onDone`.
- [X] T022 [US2] Update `app/src/App.tsx`:
  - Keep F0's offline-at-start rule first.
  - Add `type Screen = 'choice' | 'newEvent' | 'start'` and use `useDailyChoice`. While its status is `'loading'`, render only `Banners`, so the start screen does not flash before the choice. When the status becomes `'choose'`, set the screen to `'choice'`.
  - Wire `ContextChoice` (`onNewEvent` → `'newEvent'`, `onDone` → `'start'`) and `NewEventForm` (`onSaved` → `'start'`, `onBack` → `'choice'`).
  - Keep `Banners` above every screen. Make the T016 and T017 tests pass.
- [X] T023 [US2] Add choice-screen styles to `app/src/styles.css`: full-width Event buttons (name on the first line, dates in `--muted` on the second), a filled "continue" button, small section headings, and long names cut off with an ellipsis.

**Checkpoint**: the choice works on the iPhone (quickstart sections 2–3); US1's form is reachable.

---

## Phase 5: User Story 3 - See and change the current context (Priority: P2)

**Goal**: The start screen always shows the Event (name and dates) or "casual networking", and
one tap opens the choice.

**Independent Test**: [quickstart.md](quickstart.md) section 4, plus `npm test`.

### Tests for User Story 3

- [X] T024 [P] [US3] Extend `app/tests/events-ui.test.tsx`:
  - With an active Event, the start screen shows `context.at` and the Event name and dates.
  - During casual networking it shows `context.casual`.
  - Tapping the bar (accessible name `context.change`) shows the choice.
  - Choosing casual and remounting on the same day still shows `context.casual`.

### Implementation for User Story 3

- [X] T025 [P] [US3] Create `app/src/ui/ContextBar.tsx`:
  - Props: `event: Event | undefined` and `onChange()`.
  - Render a full-width button with `aria-label={t('context.change')}`. It shows either `context.at` + event name + `formatDateRange(...)`, or `context.casual`. *(2026-10-09: `event` can also be `'loading'`; the bar then renders an empty placeholder, so it never shows the wrong context for a moment. Found by the T024 test.)*
- [X] T026 [US3] Update `app/src/ui/StartScreen.tsx` and `app/src/App.tsx`:
  - App loads the active Event (`getSettings()` then `listEvents()`, or `undefined`) whenever the screen becomes `'start'`, and passes it to `StartScreen` together with `onChangeContext` (→ `'choice'`).
  - `StartScreen` renders `ContextBar` at the top. Make the T024 tests pass.
- [X] T027 [US3] Add context-bar styles to `app/src/styles.css`: a light `--surface` background, the Event name in bold, dates in `--muted`, and an ellipsis for long names.

**Checkpoint**: all three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T028 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the new screens come from `t()` (search `app/src/ui/` for string literals in JSX).
- [X] T029 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically; check that the deployment succeeds. *(2026-10-09: pushed as `512a9ff`; the live bundle on socialbutterfly2.pages.dev matches the local build.)*
- [X] T030 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–5, including the date change in section 3 (manual, Britt).
- [X] T031 Tick the F1 items in `specs/features.md` and add a line to `wiki/log.md` (date, "F1 implemented", what changed), per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational. Its form is reachable on screen only after US2
  (T022); its storage functions work on their own.
- **US2 (Phase 4)**: depends on Foundational; T022 wires the `NewEventForm` from US1 (T012).
- **US3 (Phase 5)**: depends on US2 (the bar opens the choice).
- **Polish (Phase 6)**: after US3.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` tasks (T010, T011, T019) edit the same file: one at a time.
- `App.tsx` tasks (T022, T026) and `styles.css` tasks (T013, T023, T027) run one at a time.
- T017 (update the F0 tests) must be done together with T022, or the F0 tests fail.

### Parallel Opportunities

- Foundational: T002, T004, T005, T006 and T007 together; T003 after T002.
- US1: T008 and T009 together.
- US2: T014, T015 and T016 together; T018 alongside T019.
- US3: T024 and T025 together.

## Parallel Example: User Story 2

```text
Task: "T014 [US2] Extend app/tests/choice.test.ts"
Task: "T015 [US2] Extend app/tests/context.test.ts"
Task: "T016 [US2] Extend app/tests/events-ui.test.tsx"
```

## Implementation Strategy

### MVP (User Stories 1 + 2, both P1)

1. Phase 1 → Phase 2.
2. US1 (storage and form) → US2 (choice and screen switching).
3. **Stop and validate**: quickstart sections 2–3 on the iPhone.

### Incremental Delivery

1. MVP → push.
2. US3 (context bar) → push.
3. Polish: full quickstart, features list, wiki log.
