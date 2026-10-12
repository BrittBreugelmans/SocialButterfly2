---

description: "Task list for F3 — Guest Mode"
---

# Tasks: F3 — Guest Mode

**Input**: Design documents from `specs/011-guest-mode/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included, as in F0–F11 (plan: `guest-mode-ui.test.tsx`, `settings-repository.test.ts`,
`add-by-name-ui.test.tsx`, `i18n.test.tsx`). One more file is split off so work can run in
parallel: `logo-hold-button.test.tsx` (the hold on its own, without the database). The iPhone
(finger hold, app switcher, Guided Access) is checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US3 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F10 rules still apply ([../009-settings-data/tasks.md](../009-settings-data/tasks.md),
  "Ground rules"):
  - use the terms from `wiki/begrippen.md` (`guestMode`, `guest`, `owner`); every text goes through `t()`;
  - the UI talks to storage only through `app/src/data/repository.ts`;
  - every write runs inside `withStorageErrors()`;
  - a `StorageFullError` is left to the F0 banner; any other error is rethrown.
- **No schema change**: `app/src/data/db.ts` is not edited. `guestModeOn` is a non-indexed field on
  `Settings` (data-model, research R1).
- **No new dependency**: `app/package.json` does not change.
- **Guest mode saves nothing** (FR-010): no call to `addByName`, `createPerson`,
  `createEncounter` or any other Person/Encounter/Event write from `GuestMode.tsx` or
  `LogoHoldButton.tsx`. The only write is `setGuestMode`, called from `App.tsx`.
- **Guest mode shows nothing of the owner** (FR-008, constitution VI): while it is on, `App`
  renders only `<GuestMode>`. No `Banners`, `TabBar`, `ContextBar`, Event name, same-name hint.
- **F11 logo**: use `<Logo />` from `app/src/ui/Logo.tsx` (one logo file, M5). Do not add another
  image.
- UI tests follow `app/tests/add-by-name-ui.test.tsx`:
  - render `<LanguageProvider><App /></LanguageProvider>`;
  - call `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`, unless the test is
    about the daily choice;
  - get texts via `nl['…']` / `en['…']`.
- **Fake timers for the hold**: use
  `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })` so
  fake-indexeddb keeps working, then `vi.advanceTimersByTime(…)` inside `act`. Call
  `vi.useRealTimers()` in `afterEach`. Press with `fireEvent.pointerDown(button, { pointerId: 1 })`
  and release with `fireEvent.pointerUp(button, { pointerId: 1 })`. jsdom has no
  `setPointerCapture`, so the component calls it with `?.`.

---

## Phase 1: Setup

- [X] T001 Confirm the F11 logo is in place (`app/public/logo.svg`, `app/src/ui/Logo.tsx`) and committed. Then run `npm run typecheck && npm test` in `app/` and note the test count as the F3 baseline before changing anything. *(2026-10-12: logo committed in `56f9a7c` / `5edaee5`; working tree clean. Typecheck OK; 39 test files, 456 passed, 7 skipped.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the Settings field, the repository function and all texts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add to `Settings` in `app/src/data/types.ts`, after `ownerProfileUrl`: `/** Present while guest mode is on (F3, research R1). Absent = off. Device state; never synced. */ guestModeOn?: true`.
- [X] T003 [P] Add the text keys from [contracts/screens.md](contracts/screens.md) "New text keys" to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word, in a `// F3 — Guest mode` block: `start.handOver`, `guest.greeting`, `guest.name`, `guest.company`, `guest.privacy`, `guest.done`, `guest.thanks`, `guest.ownerHold` (8 keys). The greeting, privacy, button and thank-you texts must match `wiki/merk-en-stijl.md` exactly, including the 🦋.
- [X] T004 Add a case block "F3 setGuestMode" to `app/tests/settings-repository.test.ts`:
  - `setGuestMode(true)` → `getSettings().guestModeOn === true`;
  - `setGuestMode(false)` → `'guestModeOn' in settings` is false (the field is removed, not `false`);
  - the language, `activeEventId` and `contextChosenOn` stay the same;
  - no Person, Encounter or Event is created (`listPersons()`, `listEncounters()`, `listEvents()` stay empty);
  - `deleteAllData()` after `setGuestMode(true)` leaves no `guestModeOn`.
- [X] T005 Add `setGuestMode(on: boolean): Promise<Settings>` to `app/src/data/repository.ts` in the Settings section, per [contracts/storage-api.md](contracts/storage-api.md): `return updateSettings({ guestModeOn: on ? true : undefined })`. Doc comment: "Turns guest mode on or off on this device (F3 FR-018, research R1)." T004 passes.

**Checkpoint**: typecheck and all earlier tests green; T004 green.

---

## Phase 3: User Story 1 - The guest types their own name (Priority: P1) 🎯 MVP

**Goal**: "Hand over" on the Add tab opens a big guest screen (greeting, name, optional company,
privacy line, "Done"). "Done" shows the thank-you screen; "Back" returns with the input kept. No
owner data is visible, nothing is saved, and a reload reopens guest mode.

**Independent Test**: tap `nl['start.handOver']`, type "Jan Peeters" and "Elmos", tap
`nl['guest.done']`: `nl['guest.thanks']` shows. No tab bar, no Event name, no banners at any
moment, and `listPersons()` is still empty.

### Tests for User Story 1

- [X] T006 [US1] Create `app/tests/guest-mode-ui.test.tsx` with a `describe('US1')` block:
  - the Add tab shows a button `nl['start.handOver']`; tapping it shows the heading `nl['guest.greeting']`, the labels `nl['guest.name']` and `nl['guest.company']`, and `nl['guest.privacy']`;
  - the name field has focus;
  - the name and company fields have `maxLength` 100;
  - `nl['guest.done']` is disabled with an empty name and with `'   '`; enabled after typing "Jan Peeters" (company empty);
  - "Done" shows `nl['guest.thanks']`; `nl['add.back']` there returns to the form with "Jan Peeters" and "Elmos" still filled in;
  - Enter in the company field with a name filled in shows the thank-you screen;
  - privacy (FR-008): with an active Event named "Devoxx" (via `createEvent` + `chooseContext`), in guest mode there is no `navigation` role (tab bar), no text "Devoxx", and no `nl['install.hint']` / `nl['offline.banner']` banner (set `navigator.onLine` false as in `tests/banners.test.tsx`);
  - same name (FR-009): with a stored Person "Jan Peeters", typing "jan peeters" shows no `nl['same.title']` and no company or date of that Person;
  - nothing saved (FR-010): after "Done", `listPersons()` and `listEncounters()` are empty;
  - the flag: after "Hand over", `getSettings().guestModeOn` is `true` (use `waitFor`);
  - reload (FR-018): with `setGuestMode(true)` before render, the App opens on the greeting, also when the daily choice is due (no `contextChosenOn` for today) and also when `navigator.onLine` is false at start.

### Implementation for User Story 1

- [X] T007 [US1] Create `app/src/ui/GuestMode.tsx` per [contracts/screens.md](contracts/screens.md) "Guest form" and "Thank-you screen" and [contracts/storage-api.md](contracts/storage-api.md):
  - props `{ onExit(input: { name: string; company: string }): void }` (used from US2);
  - state: `step: 'form' | 'thanks'`, `name`, `company` (React state only, research R2);
  - form: `<main className="guest-screen">`, a top row `<div className="guest-top">` (empty for now; US2 and US3 fill it), `<h1>{t('guest.greeting')}</h1>`, a `<form>` with labelled inputs for name (`autoFocus`, `maxLength={100}`, `autoComplete="off"`, `autoCapitalize="words"`, placeholder `add.namePlaceholder`) and company (`maxLength={100}`, same attributes, placeholder `add.companyPlaceholder`, `enterKeyHint="done"`), `<p className="guest-privacy">{t('guest.privacy')}</p>`, and a submit button `guest.done`, `disabled` while `name.trim() === ''`. `onSubmit`: `preventDefault`, then go to `thanks` when the name is not blank;
  - thanks: same top row, `<p className="guest-thanks">{t('guest.thanks')}</p>`, and a secondary button `add.back` back to `form`;
  - no import from `data/repository.ts`.
- [X] T008 [US1] Add `onHandOver(): void` to `StartScreenProps` in `app/src/ui/StartScreen.tsx` and a third button in `.start-actions`, after "Scan QR": `<button type="button" className="add-by-name" onClick={onHandOver}>{t('start.handOver')}</button>`.
- [X] T009 [US1] Wire guest mode into `app/src/App.tsx` per research R5 and [contracts/storage-api.md](contracts/storage-api.md) "App state":
  - state `const [guestMode, setGuestModeState] = useState<boolean | 'loading'>('loading')`; on mount read `getSettings()` and set `settings.guestModeOn === true` (on a read error: `false`);
  - render order: if `guestMode === 'loading'` → `null`; if `guestMode === true` → only `<GuestMode onExit={…} />` (no `Banners`); **both checks come before the `offlineAtStart` branch**;
  - `onHandOver` on `StartScreen`: `setGuestModeState(true)` at once, then `setGuestMode(true).catch(ignoreStorageFull)` in the background (research R1). Define `ignoreStorageFull` as in `StartScreen.tsx` (rethrow anything else);
  - the F2 note-step check effect also waits for `guestMode === false` (add it to the guard and the deps);
  - for now `onExit` only does `setGuestModeState(false)`, `void setGuestMode(false).catch(ignoreStorageFull)` and `toStart()` (US2 adds the routing).
- [X] T010 [US1] Add guest screen styles to `app/src/styles.css` per research R7, using the M8 colour variables already in the file (light only, M6): `.guest-screen` one column with page padding; `.guest-top` a flex row, space-between, min-height 44px; `.guest-screen h1` about 1.6rem; guest inputs `font-size: 18px` (never under 16px, else iOS zooms) and `min-height: 52px`; the "Done" button full width, at least 52px tall; `.guest-privacy` muted text colour; `.guest-thanks` about 1.5rem, centred.

**Checkpoint**: T006 green; the guest can type and reach the thank-you screen; a reload reopens guest mode.

---

## Phase 4: User Story 2 - The owner takes over and searches (Priority: P1)

**Goal**: holding the small logo for 2 seconds ends guest mode. With a name typed, the quick mode
form opens filled in, and F2 runs unchanged. A short press does nothing.

**Independent Test**: in guest mode type "Jan Peeters" → Done. Press and release the logo: still
guest mode. Hold 2 s: the quick mode form shows "Jan Peeters" with the context bar. Tap "Search on
LinkedIn": the Person is stored.

### Tests for User Story 2

- [X] T011 [P] [US2] Create `app/tests/logo-hold-button.test.tsx` for `LogoHoldButton` alone (no App, no database), with fake timers per the ground rules:
  - renders a `button` with accessible name `nl['guest.ownerHold']` (inside `LanguageProvider`) that contains the logo `img`;
  - `click` alone does not call `onHold`;
  - pointer down, advance 1999 ms, pointer up → `onHold` not called; advance 5000 ms more → still not called;
  - pointer down, advance 2000 ms → `onHold` called once; pointer up afterwards → still once;
  - `pointerCancel` at 1000 ms → not called after 2000 ms;
  - while held the button has the class `holding`; after release it does not;
  - `contextmenu` on the button is `defaultPrevented` (`fireEvent.contextMenu` returns `false`);
  - `holdMs={500}` → called at 500 ms.
- [X] T012 [US2] Add a `describe('US2')` block to `app/tests/guest-mode-ui.test.tsx` (after T006, same file), with fake timers:
  - a short press on `nl['guest.ownerHold']` keeps the greeting on screen;
  - with "Jan Peeters" / "Elmos" typed (on the form, and again from the thank-you screen), a 2000 ms hold shows `nl['add.title']` with the name field "Jan Peeters", the company "Elmos", and the context bar; `getSettings()` has no `guestModeOn`;
  - with an empty name, a 2000 ms hold shows the Add tab (button `nl['start.handOver']` and the tab bar);
  - with a stored "Jan Peeters", after the hold, tapping `nl['add.search']` shows `nl['same.title']` (F2 unchanged, FR-014);
  - after the hold, `nl['add.back']` on the form shows the Add tab and saves nothing;
  - daily choice due (no `contextChosenOn` for today, `setGuestMode(true)` before render): type a name, hold 2 s → the daily choice shows first; choosing casual networking → the quick mode form, filled in.
- [X] T013 [P] [US2] Add cases to `app/tests/add-by-name-ui.test.tsx` that render `<AddByNameForm activeEvent={undefined} initialName="Jan Peeters" initialCompany="Elmos" onSaved={vi.fn()} onBack={vi.fn()} />` inside `LanguageProvider`:
  - the fields start with those values;
  - the search link's `href` is `buildSearchUrl('Jan Peeters', 'Elmos')`;
  - with a stored "Jan Peeters", tapping `nl['add.search']` shows `nl['same.title']` without typing first (the check ran on mount).

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `app/src/ui/LogoHoldButton.tsx` per research R4 and [contracts/screens.md](contracts/screens.md) "LogoHoldButton":
  - props `{ onHold(): void; holdMs?: number }`, default `holdMs` 2000;
  - a `<button type="button" className="logo-hold">` with `aria-label={t('guest.ownerHold')}` and `<Logo size={44} />` inside;
  - `onPointerDown`: `event.currentTarget.setPointerCapture?.(event.pointerId)`, set `holding` true, start `window.setTimeout(() => { setHolding(false); onHold() }, holdMs)` stored in a ref;
  - `onPointerUp` and `onPointerCancel`: clear the timer, `holding` false. No `onPointerLeave` (pointer capture keeps the hold when the finger moves a little);
  - `onClick`: nothing. `onContextMenu`: `event.preventDefault()`;
  - clear the timer on unmount;
  - class `holding` while held (`className={holding ? 'logo-hold holding' : 'logo-hold'}`).
  T011 passes.
- [X] T015 [P] [US2] Add optional `initialName?: string` and `initialCompany?: string` to `AddByNameFormProps` in `app/src/ui/AddByNameForm.tsx` and use them as the initial `useState` values (`initialName ?? ''`, `initialCompany ?? ''`). Nothing else changes (research R6). T013 passes.
- [X] T016 [US2] In `app/src/ui/GuestMode.tsx`, put `<LogoHoldButton onHold={() => onExit({ name, company })} />` at the start of `.guest-top` on both steps.
- [X] T017 [US2] Add exit routing to `app/src/App.tsx` per research R5 and data-model "State transitions":
  - state `const [guestInput, setGuestInput] = useState<{ name: string; company: string }>()`;
  - `onExit(input)`: `setGuestModeState(false)`; `setGuestMode(false).catch(ignoreStorageFull)`; if `normalizeName(input.name) !== ''` (from `people/nameMatch.ts`) `setGuestInput(input)`; then: if `status === 'choose'` → `setScreen('choice')`; else if a name was typed → `setScreen('addByName')`; else `toStart()`;
  - `contextChosen`: after `recheck()`, go to `'addByName'` when `guestInput` is set, else `toStart()`;
  - pass `initialName={guestInput?.name}` and `initialCompany={guestInput?.company}` to `AddByNameForm`, with `key={guestInput ? 'guest' : 'owner'}` so the initial values apply;
  - clear `guestInput` in the form's `onSaved` and `onBack`, and when "Add by name" or "Scan QR" is tapped on the start screen.
  T012 passes.
- [X] T018 [US2] Add hold styles to `app/src/styles.css`: `.logo-hold` without border or background, 44×44 touch area, `-webkit-touch-callout: none`, `-webkit-user-select: none`, `user-select: none`, `touch-action: none`, `position: relative`; a ring (`::after`, a circle around the logo in brand blue `#0d5fb8`) that is empty by default and fills in 2 s while `.logo-hold.holding` (e.g. a `conic-gradient` driven by an `@property --hold` animation, or a `scale` from 0 to 1, `animation: … 2s linear forwards`). Keep the ring under `prefers-reduced-motion` (it is progress feedback, research R4).

**Checkpoint**: T011–T013 green. Guest mode can be started and ended; F2 runs from the handed-over name. US1 + US2 is the MVP.

---

## Phase 5: User Story 3 - The guest switches language (Priority: P2)

**Goal**: an NL/EN switch on both guest screens changes all guest texts at once and keeps the
input. The app language does not change; the next guest mode starts in the app language again.

**Independent Test**: with the app in Dutch, open guest mode, type a name, tap "EN": all texts are
English and the name is still there. Hold 2 s: the quick mode form is in Dutch.

### Tests for User Story 3

- [X] T019 [P] [US3] Add cases to `app/tests/i18n.test.tsx`:
  - `translate('nl', 'guest.done') === nl['guest.done']`; `translate('en', 'same.lastMet', { date: 'x' }) === 'Last met: x'`;
  - inside `<LanguageProvider><GuestLanguageProvider>…</GuestLanguageProvider></LanguageProvider>`, a child using `useLanguage()` starts at the app language; its `setLanguage('en')` changes the child's texts, but a `useLanguage()` outside the guest provider stays `'nl'` and `getSettings().language` stays `'nl'`;
  - `document.documentElement.lang` is `'en'` while the guest provider is in English and returns to `'nl'` after it unmounts.
- [X] T020 [US3] Add a `describe('US3')` block to `app/tests/guest-mode-ui.test.tsx` (after T012, same file):
  - guest mode opens in Dutch when the app is Dutch, and in English after `updateSettings({ language: 'en' })` before render (B37);
  - the switch is on both the form and the thank-you screen;
  - after typing "Jan Peeters" and tapping `nl['app.languageEn']`: `en['guest.greeting']`, `en['guest.privacy']` and `en['guest.done']` show, the name is still "Jan Peeters", and `getSettings().language` is still `'nl'`;
  - "Done" then shows `en['guest.thanks']`;
  - after the 2 s hold, the quick mode form shows `nl['add.title']`;
  - opening guest mode again shows `nl['guest.greeting']`.

### Implementation for User Story 3

- [X] T021 [US3] In `app/src/i18n/LanguageProvider.tsx` per research R3 and [contracts/storage-api.md](contracts/storage-api.md) "i18n":
  - export `translate(language, key, params?)`, the current lookup and `{param}` replacement as a pure function; `LanguageProvider`'s `t` calls it (no behaviour change);
  - export `GuestLanguageProvider({ children })`: reads the outer `useLanguage().language` once as its initial state; `setLanguage` only sets local state (returns a resolved promise, never calls `updateSettings`); `t` uses `translate` with the local language; it provides the value through the same `LanguageContext.Provider`;
  - in `GuestLanguageProvider`, set `document.documentElement.lang` to the local language in an effect, and on unmount set it back to the outer language.
  T019 passes.
- [X] T022 [US3] In `app/src/ui/GuestMode.tsx`, wrap everything in `<GuestLanguageProvider>` (the inner screens use `useLanguage()` from inside it, so split into an outer wrapper and an inner component), and put `<LanguageSwitch />` at the end of `.guest-top` on both steps. T020 passes.

**Checkpoint**: all three stories work on their own and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 [P] Check accessibility of `app/src/ui/GuestMode.tsx` and `LogoHoldButton.tsx`: the greeting is the only `h1`; both inputs have a visible `label`; "Done" is a real submit button; the thank-you text is announced (`role="status"` on `.guest-thanks`); touch targets are at least 44 px; text contrast follows M8. Write the result next to this task. *(2026-10-12: all points hold. One `h1` (the greeting); both inputs have a visible label; "Done" is a submit button; `.guest-thanks` has `role="status"`; logo button 52 px, language buttons and "Done" ≥ 44 px; muted text `#5a6672` on white passes AA (M8). Accepted: the hold has no keyboard alternative and its `aria-label` names the trick (research R4).)*
- [X] T024 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`. Note next to this task: the test count (baseline from T001) and the main JS bundle size before and after; `app/package.json` and `app/src/data/db.ts` are unchanged; `GuestMode.tsx` and `LogoHoldButton.tsx` import nothing from `data/repository.ts`; no `fetch` or external URL in the new files. *(2026-10-12: typecheck and build OK; 494 tests green, 7 skipped (baseline 456, so +38). Main bundle 130.0 kB gzip, CSS 3.8 kB gzip; no F11 figure was noted, F10 was 128.6 kB. `package.json` and `db.ts` unchanged; `GuestMode.tsx` and `LogoHoldButton.tsx` import nothing from `data/repository.ts`; no `fetch` or external URL. Also changed: `tests/banners.test.tsx` now waits (`findBy`) for the offline screen and banners, which appear after the guest-mode check (research R5). The ring mask uses `black`, not a hex colour, for `tests/brand.test.ts`. `GuestLanguageProvider` follows the app language until the guest switches (not "read once" as T021 said), so a reload in English cannot open guest mode in Dutch.)*
- [ ] T025 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T026 Validate on the iPhone with [quickstart.md](quickstart.md) section 4 (manual, Britt): holding the logo with a finger shows no image menu or loupe and survives a small move; the keyboard opens on the name field; swiping the app away in guest mode reopens guest mode; Guided Access; someone else types their name without help in under 30 s (SC-003).
- [ ] T027 Tick the F3 items in `specs/features.md` and "Doorgeef-modus getest met iemand anders" if T026 did that, and add a line to `wiki/log.md`, per CLAUDE.md. If Britt changed `guest.name` / `guest.company`, add them to the fixed texts in `wiki/merk-en-stijl.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories. T001 needs F11's logo.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (`GuestMode`, the App guest state). T011, T013, T014 and T015
  can start right after Foundational.
- **US3 (Phase 5)**: depends on US1 (`GuestMode`). T019 and T021 can start right after
  Foundational. T020 needs US2's hold for its last two cases.
- **Polish (Phase 6)**: after all stories.

### Within Each Story

- Tests first; they should fail before the implementation.
- These files are shared, so their tasks run one at a time:
  - `GuestMode.tsx`: T007, T016, T022;
  - `App.tsx`: T009, T017;
  - `styles.css`: T010, T018;
  - `guest-mode-ui.test.tsx`: T006, T012, T020;
  - `repository.ts`: T005 only;
  - `nl.ts` / `en.ts`: T003 only.

### Parallel Opportunities

- Foundational: T002 and T003 together; then T004 → T005.
- After Foundational: T011 + T014 (hold button), T013 + T015 (form initial values) and T019 + T021
  (guest language) can each run alongside US1.
- US1 itself is mostly sequential (T006 → T007 → T008 → T009 → T010).

## Parallel Example: after Foundational

```text
Task: "T006 Create app/tests/guest-mode-ui.test.tsx (US1)"
Task: "T011 Create app/tests/logo-hold-button.test.tsx"
Task: "T013 Add initial-value cases to app/tests/add-by-name-ui.test.tsx"
Task: "T019 Add translate / GuestLanguageProvider cases to app/tests/i18n.test.tsx"
```

```text
Task: "T014 Create app/src/ui/LogoHoldButton.tsx"
Task: "T015 Add initialName / initialCompany to app/src/ui/AddByNameForm.tsx"
Task: "T021 Add translate and GuestLanguageProvider to app/src/i18n/LanguageProvider.tsx"
```

## Implementation Strategy

### MVP (User Stories 1–2)

1. Phase 1 → Phase 2 → US1 → US2.
2. **Stop and validate**: quickstart section 3 steps 1, 2, 4–7 on the laptop, then section 4 on
   the iPhone. Without US2 the guest cannot be left, so US1 alone is not pushed.

### Incremental Delivery

1. Foundational + US1 + US2 → push (guest mode in the app language).
2. US3 → push (NL/EN switch for the guest).
3. Polish: accessibility, build check, iPhone with someone else, features list, wiki log.
