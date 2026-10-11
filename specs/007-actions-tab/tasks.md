---

description: "Task list for F8 — Actions tab"
---

# Tasks: F8 — Actions tab

**Input**: Design documents from `specs/007-actions-tab/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `actions.test.ts`, `actions-repository.test.ts`, `actions-ui.test.tsx`),
as in F0–F7. The upgrade with real data and the badge position are checked on the iPhone with
[quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US4 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F7 rules still apply ([../006-contacts/tasks.md](../006-contacts/tasks.md), "Ground rules"):
  terms from `wiki/begrippen.md`, every text via `t()`, UI only through
  `app/src/data/repository.ts`, every write in one transaction inside `withStorageErrors()`, a
  `StorageFullError` is left to the F0 banner and any other error is rethrown.
- **Schema version 1 in `app/src/data/db.ts` is never edited**; version 2 is added below it.
- All three Actions belong to a **Person** (B31); "note missing" only when **no** Encounter of the
  Person has a note.
- A dismissal counts only while no Encounter of the Person has a `createdAt` later than its
  `dismissedAt` (B30, research R2).
- Notes are never shown on the Actions tab (FR-013).
- UI tests follow `app/tests/person-detail-ui.test.tsx`: `<LanguageProvider><App /></LanguageProvider>`,
  `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`, texts via `nl['…']`,
  data seeded through the repository, the `stopNavigation` listener for links,
  `vi.spyOn(window, 'scrollTo')` mocked. The Actions tab is reached with
  `user.click(screen.getByRole('button', { name: /^Acties/ }))` (its name gets ", N open" when
  there are open Actions).

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F7 baseline is green (254 tests) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, schema version 2, reading dismissals, the pure Action rules, texts, and the tab
wired to a new screen.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add to `app/src/data/types.ts` per [contracts/storage-api.md](contracts/storage-api.md) "Types": `export type ActionType = 'noteMissing' | 'notConnected' | 'profileLinkMissing'` and `export interface Dismissal extends RecordMeta { personId: string; type: ActionType; dismissedAt: string }`.
- [X] T003 [P] Create `app/tests/actions-repository.test.ts` with the upgrade test (research R9): open `new Dexie('sociale-vlinder')` declaring only `version(1)` with the F0 stores, add a Person, an Encounter and an Event, close it; then open the app's `db` and check that `listPersons()`, `listEncounters()`, `listEvents()` return them and `listDismissals()` returns `[]`. Close and delete the database in the test's set-up so it does not depend on `tests/setup.ts` order.
- [X] T004 Add schema version 2 to `app/src/data/db.ts` per [data-model.md](data-model.md) "Indexes (schema version 2)": below the untouched `db.version(1)` call add `db.version(2).stores({ dismissals: 'id, personId, &[personId+type]' })` with a comment that the upgrade only adds the empty table; add `dismissals: EntityTable<Dismissal, 'id'>` to the `db` type. Add `listDismissals(): Promise<Dismissal[]>` to `app/src/data/repository.ts`. Make the T003 test pass; all earlier tests stay green.
- [X] T005 [P] Add the 12 keys from "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`tab.actionsCount`, `actions.*`), keeping `{count}`, `{action}`, `{name}`. `actions.empty` is the fixed text from `wiki/merk-en-stijl.md`.
- [X] T006 [P] Create `app/src/people/actions.ts` per [contracts/storage-api.md](contracts/storage-api.md) "Pure helpers" and [data-model.md](data-model.md) "Action" and "Card":
  - `export const ACTION_TYPES: readonly ActionType[] = ['noteMissing', 'notConnected', 'profileLinkMissing']`.
  - `openActions(person, encounters, dismissals)`: take only this Person's Encounters and dismissals; gaps: `noteMissing` when no Encounter has a `note`, `notConnected` when `connectionStatus === 'notConnected'`, `profileLinkMissing` when `profileUrl` is absent; drop a type when a dismissal exists for it **and** no Encounter's `createdAt` is later than its `dismissedAt`; return in `ACTION_TYPES` order.
  - `buildActionCards(persons, encounters, dismissals)`: group Encounters by `personId` once; per Person with ≥ 1 Encounter and ≥ 1 open Action, a card `{ person, lastEncounter, actions }` where `lastEncounter` is the newest by `date`, then `createdAt`; sort by `lastEncounter.date` desc, then `lastEncounter.createdAt` desc, then `person.name.localeCompare`.
  - `countOpenActions(...)`: sum of `actions.length` over the cards.
- [X] T007 [P] Create `app/tests/actions.test.ts` for T006:
  - The three gaps one by one; a Person with all three solved has no card.
  - B31: a note on an older Encounter and none on the newest → no `noteMissing`; no note anywhere → `noteMissing`.
  - A dismissal hides its type; with an Encounter whose `createdAt` is later than `dismissedAt` the type is back (B30); with only older Encounters (as after a merge or a delete) it stays hidden.
  - A dismissal of another Person or another type has no effect.
  - Sorting by last Encounter date, then `createdAt`, then name; a Person without Encounters has no card.
  - `countOpenActions` sums the types; 300 Persons with one open Action each give 300 cards.
- [X] T008 Create `app/src/ui/ActionsTab.tsx` as a stub rendering `<main className="actions"><h1>{t('actions.title')}</h1></main>`, and in `app/src/App.tsx` render it for the Actions tab instead of `<ComingSoon textKey="soon.actions" />`. Update `app/tests/tabs-ui.test.tsx`: the Actions tab now shows the heading `actions.title` (remove it from the "coming soon" loop; My QR and Settings stay there).

**Checkpoint**: `npm run typecheck && npm test` are green; the database is at version 2 with all data kept.

---

## Phase 3: User Story 1 - See what is still open (Priority: P1) 🎯 MVP

**Goal**: One card per Person with open Actions, newest first; the empty state.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 3 steps 1 and 3.

### Tests for User Story 1

- [X] T009 [P] [US1] Create `app/tests/actions-ui.test.tsx` (US1 part):
  - Jan (no note, `notConnected`, no profile link, met today under "Devoxx 2026"), Zoë (note, `connected`, profile link) and Piet (note, `notConnected`, profile link, met 3 days ago casually): the tab shows two `<article>` cards, Jan first; Jan's card shows `actions.noteMissing`, `actions.notConnected`, `actions.profileLinkMissing`, "Devoxx 2026" and today's date (`formatDateRange`); Piet's card shows only `actions.notConnected` and `contacts.casual`; no card for Zoë.
  - A Person with a note on an older Encounter and none on the newest has no `actions.noteMissing` (B31).
  - No note text is shown on the tab (FR-013): Piet's note is not in the document.
  - With no open Actions the tab shows `actions.empty`.

### Implementation for User Story 1

- [X] T010 [US1] Create `app/src/ui/ActionCard.tsx` per [contracts/screens.md](contracts/screens.md) "Actions list": props `card: ActionCard`, `events: Event[]`, `onOpenPerson(personId)`; renders `<article className="action-card" aria-labelledby=…>` with a header (name as `<button className="action-name">`, company muted, "{event} · {date}" of `lastEncounter` with the Event name or `contacts.casual` and `formatDateRange(date, date, language)`), then a `<ul>` with one `<li className="action-row">` per open type showing its label (`actions.noteMissing`, `actions.notConnected`, `actions.profileLinkMissing`). No solving or dismiss yet.
- [X] T011 [US1] Fill `app/src/ui/ActionsTab.tsx`: load `listPersons()`, `listEncounters()`, `listEvents()`, `listDismissals()` together into state with a `reload()`; render title `actions.title` and one `ActionCard` per `buildActionCards(...)`; with no cards render the butterfly (`aria-hidden`) and `actions.empty`; render nothing until the first load is done. Make the T009 tests pass.
- [X] T012 [US1] Add styles to `app/src/styles.css`: `.actions` like `.contacts`; `.action-card` as a card (`var(--surface)` background, `var(--radius)`, padding 14 px, 10 px gap); `.action-name` as a plain left-aligned bold text button; the "event · date" line muted; `.action-row` with the label on the left and its buttons on the right (wrapping on narrow screens); `.actions-empty` centered like `.coming-soon`.

**Checkpoint**: the Actions tab shows what is open (quickstart section 3). Push is possible.

---

## Phase 4: User Story 2 - Solve an Action right there (Priority: P1)

**Goal**: Write the note, open LinkedIn + "I connected", paste the profile link, all on the card;
solved Actions and empty cards disappear; the name opens the detail.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 4.

### Tests for User Story 2

- [X] T013 [P] [US2] Extend `app/tests/actions-ui.test.tsx`:
  - Jan's card has one LinkedIn link `person.searchLinkedIn` with `href` = his `searchUrl` and `target="_blank"`; Piet's card (with profile link) has `person.openProfile` with his profile; a card with only `noteMissing` has no LinkedIn link.
  - `actions.writeNote` opens a textarea labelled `person.noteFor` (date, Event of the last Encounter); `note.save` is disabled while blank; typing "Talked about Kotlin" and saving removes `actions.noteMissing` and stores the note on Jan's **last** Encounter (B31); `link.cancel` closes the field without saving.
  - `actions.connected` removes `actions.notConnected` and stores `connectionStatus === 'connected'`.
  - `link.paste` with the clipboard holding `https://www.linkedin.com/in/jan-peeters` removes `actions.profileLinkMissing`; after the last row is solved the card is gone and `actions.empty` shows.
  - Pasting a link that another Person has shows the merge question; `link.merge` leaves one Person and the cards reflect the merged Person.
  - Tapping the name opens `PersonDetail` (heading with the name); `add.back` returns to `actions.title`.

### Implementation for User Story 2

- [X] T014 [US2] Extend `app/src/ui/ActionCard.tsx` per research R5: new props `onChanged()` and `onMerged()`; when `notConnected` or `profileLinkMissing` is open, one `<a className="button-link secondary" href={linkedInUrlFor(person)} target="_blank" rel="noopener">` labelled `person.openProfile` (with profile) or `person.searchLinkedIn`; row `noteMissing`: button `actions.writeNote` → `<textarea>` (`aria-label` `person.noteFor` with date and Event of `lastEncounter`, placeholder `note.placeholder`, `rows={3}`) with `note.save` (disabled while blank; calls `updateEncounter(lastEncounter.id, { note })` then `onChanged()`) and `link.cancel`; row `notConnected`: button `actions.connected` → `updatePerson(person.id, { connectionStatus: 'connected' })` then `onChanged()`; row `profileLinkMissing`: `ProfileLinkControl` with `allowReplace={false}`, `onLinked` → `onChanged()`, `onMerge(other)` → `mergePersons({ fromPersonId: person.id, intoPersonId: other.id })` then `onMerged()`. *(2026-10-11: one `onChanged()` prop for solving and merging; a separate `onMerged()` was not needed.)*
- [X] T015 [US2] Update `app/src/ui/ActionsTab.tsx` per research R7: pass `onChanged={reload}` and `onMerged={reload}` to each card; add `personId` state: the name button sets it and the tab renders F7's `PersonDetail` (`personId`, `events`, `onBack` → clear and `reload()`, `onChanged` → `reload()`, `onPersonReplaced` → set the new id, `onDeleted` → clear and `reload()`); scroll to the top when opening and restore the list position on Back, as `ContactsTab` does. Make the T013 tests pass.
- [X] T016 [US2] Add styles to `app/src/styles.css`: the card's LinkedIn link full width under the header; the note field inside the row full width with its two buttons under it; the "I connected" and "Write note" buttons compact (min-height 40 px).

**Checkpoint**: Flow C works from one tab (quickstart section 4).

---

## Phase 5: User Story 3 - Dismiss an Action (Priority: P2)

**Goal**: Dismiss with Undo; dismissals survive closing the app; they come back after a new
Encounter (B30).

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5.

### Tests for User Story 3

- [X] T017 [P] [US3] Extend `app/tests/actions-repository.test.ts`:
  - `dismissAction(personId, 'notConnected')` stores a record with `dismissedAt`, `createdAt`, `updatedAt`; calling it again for the same Person and type keeps **one** record, updates `dismissedAt`/`updatedAt` and returns the old one as `previous`.
  - Unknown Person → `ValidationError`; unknown type → `ValidationError`.
  - `undoDismissal(id)` deletes a new record; `undoDismissal(id, previous)` puts the previous one back unchanged.
  - `deletePerson` removes the Person's dismissals; `mergePersons` removes those of `fromPersonId` and keeps those of `intoPersonId`.
- [X] T018 [P] [US3] Extend `app/tests/actions-ui.test.tsx`:
  - On Piet's card, the `actions.dismissLabel` button (action `actions.notConnected`, name Piet) removes the card and shows `actions.dismissed` with an `actions.undo` button; `actions.undo` brings it back; a later solve on another card clears the status line.
  - After unmounting and rendering the app again, a dismissed Action stays hidden (SC-006).
  - After a dismissal, `createEncounter` for that Person with a later save time (`vi.setSystemTime` or a short wait) makes the Action come back when the tab is opened again (B30).

### Implementation for User Story 3

- [X] T019 [US3] Add to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md) "Dismissals" and research R6: `dismissAction(personId, type)` (one `rw` transaction on `persons` and `dismissals`; Person must exist; `type` must be in `['noteMissing', 'notConnected', 'profileLinkMissing']`; look up `[personId+type]`; update it with `dismissedAt = updatedAt = now`, or add a new record with a new id; return `{ dismissal, previous }`) and `undoDismissal(dismissalId, previous?)` (one transaction: `put(previous)` or `delete(dismissalId)`). Extend `deletePerson` and `mergePersons` to delete the dismissals of the removed Person (`where('personId').equals(id).delete()`) inside their existing transactions, adding `db.dismissals` to the transaction tables. Make the T017 tests pass.
- [X] T020 [US3] Add dismiss to `app/src/ui/ActionCard.tsx` and the status line to `app/src/ui/ActionsTab.tsx`: each row gets a text button `actions.dismiss` with `aria-label` `actions.dismissLabel` (`{action}` = the row label, `{name}`); `ActionCard` calls a new prop `onDismiss(type)`; `ActionsTab` runs `dismissAction`, keeps `{ dismissal, previous, label, name }` as the last dismissal, reloads, and shows `<p role="status" className="actions-message">` with `actions.dismissed` and a button `actions.undo` (→ `undoDismissal(dismissal.id, previous)`, clear, reload). Any other change on the tab (save, connect, paste, write note opened, opening a Person) clears it. Make the T018 tests pass. *(2026-10-11: the Undo line is cleared by data changes and by opening a Person; opening the note field alone does not clear it.)*

**Checkpoint**: the tab can become empty on purpose (quickstart section 5).

---

## Phase 6: User Story 4 - Know how much is open (Priority: P2)

**Goal**: A badge with the open count on the Actions tab, current after every change anywhere.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 3 step 2 and section 6.

### Tests for User Story 4

- [X] T021 [P] [US4] Extend `app/tests/actions-repository.test.ts` for `onDataChanged`: a listener is called after `createPerson` and after `dismissAction`; not after a write that throws a `ValidationError`; not after unsubscribing.
- [X] T022 [P] [US4] Extend `app/tests/actions-ui.test.tsx`:
  - With Jan (3 open) and Piet (1 open) the Actions tab button is named `tab.actionsCount` with 4 and shows "4"; no Actions → named `tab.actions` and no number.
  - Adding someone by name and skipping the note raises the number by 3 once back on the Add tab.
  - Solving one Action on the Actions tab lowers the number at once; switching the status in the F7 detail does too.
  - 120 open Actions show "99+".

### Implementation for User Story 4

- [X] T023 [US4] Add `onDataChanged(listener)` to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md) "Change signal", like `onStorageFull`: a `Set` of listeners; in `withStorageErrors()`, call each listener after `await write()` succeeds (not in the `catch`). Make the T021 tests pass.
- [X] T024 [US4] Create `app/src/people/useOpenActionCount.ts` per research R4: state `number | undefined`; a `load()` reading `listPersons()`, `listEncounters()`, `listDismissals()` and setting `countOpenActions(...)`; load on mount; subscribe with `onDataChanged`, coalescing several signals in one tick (`queueMicrotask` or a pending flag) into one `load()`; ignore results after unmount; unsubscribe on unmount.
- [X] T025 [US4] Update `app/src/ui/TabBar.tsx` and `app/src/App.tsx` per research R8 and [contracts/screens.md](contracts/screens.md) "Tab bar": `TabBar` gets optional `badges?: Partial<Record<Tab, number>>`; for a tab with a count > 0, render `<span className="tab-badge" aria-hidden="true">` on the icon with the number, or "99+" above 99, and set the button's `aria-label` to `tab.actionsCount` with `{count}` (the real number); `App.tsx` calls `useOpenActionCount()` and passes `badges={{ actions: count }}`. Make the T022 tests pass. *(2026-10-11: only tabs with a count label (`BADGE_LABELS`, now only Actions) show a badge.)*
- [X] T026 [US4] Add styles to `app/src/styles.css`: `.tab-bar button` gets `position: relative`; `.tab-badge` positioned at the icon's top-right (about `top: 2px; left: calc(50% + 6px)`), min-width 18 px, height 18 px, padding 0 5 px, `border-radius: 999px`, `background: var(--blue)`, `color: #fff`, `font-size: 0.65rem`, `font-weight: 700`, centered.

**Checkpoint**: all four user stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T027 Remove the now unused `soon.actions` key from `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, and narrow `ComingSoon`'s `textKey` in `app/src/ui/ComingSoon.tsx` to `'soon.myQr' | 'soon.settings'`.
- [X] T028 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the new screens come from `t()`, that no note text appears on the Actions tab, and that `app/package.json` has no new dependency. *(2026-10-12: 290 tests green (was 254), build OK, `package.json` unchanged. One run of the new UI tests failed once as the clock passed midnight; 16 runs after that were green.)*
- [ ] T029 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T030 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–6, starting with the upgrade check on real data (manual, Britt).
- [ ] T031 Tick the F8 items in `specs/features.md` and add a line to `wiki/log.md`, per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (`ActionCard`, `ActionsTab`).
- **US3 (Phase 5)**: depends on US1; its repository part (T017, T019) can start right after Phase 2.
- **US4 (Phase 6)**: depends on Foundational only for the count (`actions.ts`, `listDismissals`);
  its UI test that solves an Action needs US2.
- **Polish (Phase 7)**: after all stories.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` (T004, T019, T023), `ActionCard.tsx` (T010, T014, T020), `ActionsTab.tsx`
  (T008, T011, T015, T020), `App.tsx` (T008, T025) and `styles.css` (T012, T016, T026) tasks run
  one at a time.

### Parallel Opportunities

- Foundational: T002, T003, T005, T006, T007 together; T004 after T002 and T003.
- Each story's test tasks run together.
- US3 repository work (T017, T019) alongside US2's UI work.
- US4's hook (T024) alongside US3 (different files), once T023 is done.

## Parallel Example: Foundational

```text
Task: "T002 Add ActionType and Dismissal to app/src/data/types.ts"
Task: "T003 Create app/tests/actions-repository.test.ts with the upgrade test"
Task: "T005 Add the 12 text keys to nl.ts and en.ts"
Task: "T006 Create app/src/people/actions.ts"
Task: "T007 Create app/tests/actions.test.ts"
```

## Parallel Example: User Story 3

```text
Task: "T017 Extend actions-repository.test.ts for dismissAction / undoDismissal / clean-ups"
Task: "T018 Extend actions-ui.test.tsx for dismiss, undo and return after a new Encounter"
```

## Implementation Strategy

### MVP (User Stories 1–2)

1. Phase 1 → Phase 2 → US1 → US2.
2. **Stop and validate**: quickstart sections 2–4 on the iPhone: the upgrade keeps the data, the
   cards are right, solving works. This already covers Flow C and can be pushed.

### Incremental Delivery

1. Foundational + US1 → push (see what is open; the upgrade runs).
2. US2 → push (solve from the tab).
3. US3 → push (dismiss, Undo, return on a new Encounter).
4. US4 → push (badge).
5. Polish: unused key, full quickstart, features list, wiki log.
