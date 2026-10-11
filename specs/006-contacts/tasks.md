---

description: "Task list for F7 — Contacts"
---

# Tasks: F7 — Contacts

**Input**: Design documents from `specs/006-contacts/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `contacts.test.ts`, `contacts-repository.test.ts`, `tabs-ui.test.tsx`,
`contacts-ui.test.tsx`, `person-detail-ui.test.tsx`), as in F0–F5. The tab bar position, scroll
restore and the 500-contact speed are checked on the iPhone with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US7 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F5 rules still apply ([../005-add-by-qr/tasks.md](../005-add-by-qr/tasks.md), "Ground
  rules"): terms from `wiki/begrippen.md`, every text via `t()`, UI only through
  `app/src/data/repository.ts`, every write in one transaction inside `withStorageErrors()`.
- No new fields, no Dexie schema version, no new dependencies (plan).
- Notes are read-only outside the edit mode (FR-010); the edit mode edits them (B29, Phase 11).
- Nothing changes or is deleted without an explicit tap; deletes always go through a confirmation
  (FR-014, FR-014a, FR-015).
- A `StorageFullError` is caught and left to the F0 banner (as in `NoteStep.tsx`); any other error
  is rethrown.
- UI tests render `<LanguageProvider><App /></LanguageProvider>`, set
  `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`, find texts through
  `nl['…']`, seed data with `createEvent`, `createPerson`, `createEncounter` and `chooseContext`,
  and stop jsdom from following links with the `stopNavigation` listener from
  `app/tests/link-profile-ui.test.tsx`. Contacts is reached with
  `user.click(screen.getByRole('button', { name: nl['tab.contacts'] }))`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the baseline is green (200 tests after the F1 bugfix, `wiki/log.md`) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Texts, the pure list helpers, reading all Encounters, and the tab bar that makes
Contacts reachable.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add all 40 keys from the table "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`tabs.label`, `tab.*`, `soon.*`, `contacts.*`, `person.*`, `encounter.*`, `diagnostics.addManyTestData`), keeping the placeholders `{name}`, `{count}`, `{query}`, `{date}`, `{event}`.
- [X] T003 [P] Create `app/src/people/contacts.ts` per [contracts/storage-api.md](contracts/storage-api.md) "Pure helpers" and [data-model.md](data-model.md) "Derived":
  - `export type ContactView = { kind: 'all' } | { kind: 'casual' } | { kind: 'event'; eventId: string }` and `export interface ContactRow { person: Person; lastMet?: string; encounterCount: number }`.
  - `searchKey(text)`: `text.normalize('NFD').replace(/\p{M}/gu, '')`, `toLocaleLowerCase()`, collapse `\s+` to one space, `trim()` (research R4).
  - `defaultView(activeEventId)`: `{ kind: 'event', eventId }` when defined, else `{ kind: 'all' }` (FR-003).
  - `buildContactRows(persons, encounters, view, query)`: group Encounters by `personId`; per Person keep the Encounters matching the view (`event`: `eventId === view.eventId`; `casual`: `eventId === undefined`; `all`: every one); skip the Person when none match, except in `all` ("also a Person without Encounters"); `lastMet` = max `date` of the matching ones; `encounterCount` = their number; keep rows whose `searchKey(person.name)` includes `searchKey(query)` (empty query keeps all); sort by `lastMet` descending (absent last), then `name.localeCompare`.
- [X] T004 [P] Create `app/tests/contacts.test.ts` for T003:
  - Views: 3 Persons under Event A, 1 casual, 1 under both A and casual → A shows 4, casual shows 2, all shows 5; each Person at most once per view; `encounterCount` and `lastMet` count only the view's Encounters.
  - Sort: newest `lastMet` first; same date → alphabetical.
  - `searchKey` table: `'  JAN  Peeters '` → `'jan peeters'`; `'Zoë'` → `'zoe'`; `'Çelik'` → `'celik'`.
  - Search: "jan" finds "Jan Peeters", "Janne De Smet", "Piet Jansen"; "peet" only "Jan Peeters"; "zoe" finds "Zoë"; "" finds all.
  - `defaultView('x')` and `defaultView(undefined)`.
  - A data set of 500 Persons with 1 000 Encounters builds and filters without error and returns 500 rows in `all`.
- [X] T005 Add `listEncounters(): Promise<Encounter[]>` (`db.encounters.toArray()`) to `app/src/data/repository.ts`, and create `app/tests/contacts-repository.test.ts` with a test that it returns Encounters of several Persons, with and without an Event.
- [X] T006 [P] Create `app/src/ui/ComingSoon.tsx` per [contracts/screens.md](contracts/screens.md) "Coming soon": prop `textKey: 'soon.actions' | 'soon.myQr' | 'soon.settings'`; renders `<main className="coming-soon">` with the butterfly (`aria-hidden`), `<h1>{t('soon.title')}</h1>` and `<p>{t(textKey)}</p>`; nothing else.
- [X] T007 [P] Create `app/src/ui/TabBar.tsx` per research R2: `export type Tab = 'add' | 'contacts' | 'actions' | 'myQr' | 'settings'`; props `tab`, `onChange(tab)`; `<nav className="tab-bar" aria-label={t('tabs.label')}>` with five `<button type="button">` in the order Add, Contacts, Actions, My QR, Settings, each an inline SVG icon (`aria-hidden`, 24 px, `currentColor`) and the label `tab.*`; the chosen one gets `aria-current="page"`; tapping the chosen tab does nothing.
- [X] T008 Create `app/src/ui/ContactsTab.tsx` as a temporary stub that renders `<main className="contacts"><h1>{t('contacts.title')}</h1></main>`, with props `onAddSomeone()`; US1 fills it in.
- [X] T009 Update `app/src/App.tsx` per research R1: add `const [tab, setTab] = useState<Tab>('add')`; where `StartScreen` is rendered now, render the chosen tab instead (`'add'` → the current `StartScreen`; `'contacts'` → `<ContactsTab onAddSomeone={() => setTab('add')} />`; the other three → `ComingSoon` with `soon.actions`, `soon.myQr`, `soon.settings`) followed by `<TabBar tab={tab} onChange={setTab} />`, and add the class `has-tab-bar` to the wrapper. No tab bar on `'choice'`, `'newEvent'`, `'addByName'`, `'addByQr'` and `'noteStep'` (FR-001c). Every path that returns to `'start'` after an add flow or the note step also sets `tab` to `'add'`.
- [X] T010 Create `app/tests/tabs-ui.test.tsx`:
  - The app opens on the Add tab: `start.addByName` visible; the `tab.add` button has `aria-current="page"`.
  - Tapping `tab.actions`, `tab.myQr`, `tab.settings` shows `soon.title` with `soon.actions`, `soon.myQr`, `soon.settings`; tapping `tab.contacts` shows `contacts.title`.
  - No `tabs.label` navigation on the add-by-name form, on the note step and on the daily choice (set `contextChosenOn` to yesterday for that case).
  - After adding someone by name and tapping `note.skip`, the app is on the Add tab with the tab bar.
  - Every existing UI test stays green.
- [X] T011 Add styles to `app/src/styles.css`: `.tab-bar` fixed at the bottom, full width, five equal columns, each button at least 44 px high with icon above a small label, background `var(--bg)` with a top border, padding-bottom `env(safe-area-inset-bottom)`; `[aria-current="page"]` in the theme blue (`#0a66c2`), others `var(--muted)`; `.has-tab-bar` gets bottom padding equal to the bar height plus the safe area; `.diagnostics` gets a `z-index` above the bar; `.coming-soon` centered like the start screen.

**Checkpoint**: `npm run typecheck && npm test` are green; the tab bar works and adding a person is unchanged.

---

## Phase 3: User Story 1 - See who I met at an Event (Priority: P1) 🎯 MVP

**Goal**: The Contacts list per Event, without Event, or all, newest first, with an empty state.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 3 steps 1–2.

### Tests for User Story 1

- [X] T012 [P] [US1] Create `app/tests/contacts-ui.test.tsx` (US1 part):
  - Event "Devoxx 2026" active, three Persons with Encounters under it and one casual: Contacts shows the three, newest Encounter first; each row shows name, company, `contacts.notConnected` or `contacts.connected`, and the date (`formatDateRange(date, date, 'nl')`).
  - The `contacts.show` select starts on Devoxx; choosing `contacts.all` shows four, `contacts.casual` shows one.
  - Casual networking active: the select starts on `contacts.all`.
  - A Person with Encounters at two Events appears once in each Event view and once in `contacts.all`.
  - A view without Persons shows `contacts.empty`; `contacts.emptyAdd` switches to the Add tab.

### Implementation for User Story 1

- [X] T013 [US1] Create `app/src/ui/ContactList.tsx` per [contracts/screens.md](contracts/screens.md) "Contact list": props `rows: ContactRow[]`, `events: Event[]`, `view: ContactView`, `onViewChange(view)`, `onOpen(personId)`, `onAddSomeone()`, `message?: string`. Title `contacts.title`; a labelled native `<select>` (`contacts.show`) with `contacts.all`, `contacts.casual`, then each Event (newest first by `startDate`, as `listEvents` returns them) as "name · dates"; one `<button type="button" className="contact-row">` per row whose accessible name starts with the Person's name *(2026-10-11: an `aria-label` "name, company, status, date", because the spans have no spaces between them)*, showing name, company, a status chip and `formatDateRange(lastMet, lastMet, language)`; a `<p role="status" className="contacts-message">` for `message`; when `rows` is empty, `contacts.empty` and a button `contacts.emptyAdd` → `onAddSomeone()`.
- [X] T014 [US1] Fill `app/src/ui/ContactsTab.tsx` per research R3 and R5: on mount load `listPersons()`, `listEncounters()`, `listEvents()` and `getSettings()` together; set `view = defaultView(settings.activeEventId)`; keep the data in state with a `reload()` function; render `ContactList` with `buildContactRows(persons, encounters, view, '')` (the query arrives in US2). Render nothing until the first load is done. Make the T012 tests pass.
- [X] T015 [US1] Add styles to `app/src/styles.css`: `.contact-row` full width, left-aligned, at least 56 px high, divider line; name bold on one line and company muted on one line, both with `text-overflow: ellipsis`; `.status-chip` small rounded label (blue tint for connected, grey for not connected); the date muted on the right; the view select full width.

**Checkpoint**: the list works on the iPhone (quickstart section 3 steps 1–2). Push is possible.

---

## Phase 4: User Story 2 - Find someone by name (Priority: P1)

**Goal**: A search field that filters while typing, ignoring case, spaces and accents.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 3 step 3.

### Tests for User Story 2

- [X] T016 [P] [US2] Extend `app/tests/contacts-ui.test.tsx`: with "Jan Peeters", "Janne De Smet", "Piet Jansen" and "Zoë Maes" in `contacts.all`, typing "jan" in the `contacts.search` field shows the first three; "peet" shows only Jan Peeters; "zoe" shows Zoë Maes; "xyz" shows `contacts.noMatch` with "xyz" and a `contacts.clearSearch` button that empties the field and shows all four; with "jan" typed, switching the view keeps the text and filters the new view.

### Implementation for User Story 2

- [X] T017 [US2] Add the search to `app/src/ui/ContactList.tsx` and `app/src/ui/ContactsTab.tsx`: `query` state in `ContactsTab`, passed into `buildContactRows`; in `ContactList` an `<input type="search">` with `aria-label` and placeholder `contacts.search`, filtering on every change (no debounce, no button); when the query is not blank and `rows` is empty, show `contacts.noMatch` (with `{query}`) and a `contacts.clearSearch` button instead of `contacts.empty`. Make the T016 tests pass.

**Checkpoint**: search works on the iPhone (quickstart section 3 step 3).

---

## Phase 5: User Story 3 - Look at one person and open LinkedIn (Priority: P1)

**Goal**: The Person detail with timeline, a real link to the profile or search, "Paste LinkedIn
link" when the link is missing, and Back that keeps the list state.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 4.

### Tests for User Story 3

- [X] T018 [P] [US3] Create `app/tests/person-detail-ui.test.tsx` (US3 part):
  - Jan Peeters (company Elmos, profile `https://www.linkedin.com/in/jan-peeters`) with an Encounter under "Devoxx 2026" with note "Talked about Kotlin" and an older casual one without a note: tapping his row shows name, company, both Encounters newest first, "Devoxx 2026" and `contacts.casual`, the note, and `person.noNote`; the timeline shows Encounters from every Event even when the list view was Devoxx.
  - The `person.openProfile` link has `href` = his profile, `target="_blank"`, and `link.linked` with `linkedin.com/in/jan-peeters` is shown; no `link.paste` button.
  - A Person without a profile link shows the `person.searchLinkedIn` link with `href` = her stored `searchUrl`, the line `person.noProfile`, and `link.paste`; pasting `https://www.linkedin.com/in/piet` (clipboard spy as in `link-profile-ui.test.tsx`) shows `link.linked` and the link becomes `person.openProfile`.
  - Pasting a link that another Person has shows F4's merge question; `link.merge` leaves one Person whose detail shows the Encounters of both.
  - `add.back` returns to the list with the same view and search text.

### Implementation for User Story 3

- [X] T019 [US3] Create `app/src/ui/ProfileLink.tsx` with `ProfileLinkControl` per [contracts/storage-api.md](contracts/storage-api.md) "Shared UI component" and research R10, by moving the paste logic out of `app/src/ui/NoteStep.tsx` unchanged: the clipboard read in the tap handler, `normalizeProfileUrl`, `linkProfileUrl`, the `link.*` messages in `<p role="status" className="link-message">`, `MergeQuestion` on a conflict (with a busy state while `onMerge` runs), the `link.linked` line; the button shows `link.pasteAgain` only when `allowReplace` and a link exists, and is hidden when a link exists and `allowReplace` is false. Update `NoteStep.tsx` to use it with `allowReplace` and an `onMerge` that runs `mergePersons` with the `noteDraft` as today. All tests in `app/tests/link-profile-ui.test.tsx` and `app/tests/add-by-name-ui.test.tsx` stay green without changes. *(2026-10-11: the note step's "Merged with …" line is passed as `initialMessage`, so it shares the message line as before.)*
- [X] T020 [US3] Create `app/src/ui/PersonDetail.tsx` per [contracts/screens.md](contracts/screens.md) "Person detail": props `personId`, `events: Event[]`, `onBack()`, `onChanged()` (the list must reload), `onPersonReplaced(personId)` (after a merge). Load `getPerson` and `listEncountersByPerson`; render Back (`add.back`), name, company; the LinkedIn link `<a className="button-link" href={linkedInUrlFor(person)} target="_blank" rel="noopener">` labelled `person.openProfile` when `profileUrl` exists, otherwise `person.searchLinkedIn` with the line `person.noProfile`; `ProfileLinkControl` with `allowReplace={false}`, whose `onMerge(other)` runs `mergePersons({ fromPersonId: person.id, intoPersonId: other.id })` and then calls `onPersonReplaced(other.id)`; heading `person.timeline` and one `<li>` per Encounter with the date (`formatDateRange(date, date, language)`), the Event name or `contacts.casual`, and the note with `white-space: pre-wrap` or `person.noNote`.
- [X] T021 [US3] Update `app/src/ui/ContactsTab.tsx` per research R5: `personId` state; a row tap stores `window.scrollY`, sets `personId` and scrolls to the top; with a `personId`, render `PersonDetail` instead of `ContactList`; on Back clear `personId`, restore the stored scroll position in a `useLayoutEffect` (before paint, with the data already in state), then `reload()` in the background; `onPersonReplaced(id)` sets `personId` to `id` and reloads. Make the T018 tests pass.
- [X] T022 [US3] Add styles to `app/src/styles.css`: `.person-detail` header (name large, company muted); `.timeline` list with a left line and one card per Encounter (date bold, Event muted, note below in `pre-wrap`, `person.noNote` muted italic).

**Checkpoint**: Flow C step 3 works: find a person, read the note, open LinkedIn (quickstart section 4).

---

## Phase 6: User Story 4 - Change the connection status (Priority: P2)

**Goal**: One-tap status switch on the detail screen, saved at once (B16).

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5 step 1.

### Tests for User Story 4

- [X] T023 [P] [US4] Extend `app/tests/person-detail-ui.test.tsx`: a Person with `notConnected`: the `note.connected` switch is off; one click turns it on and the stored Person has `connectionStatus === 'connected'` without any other tap; Back shows `contacts.connected` in the row; clicking again stores `notConnected`.

### Implementation for User Story 4

- [X] T024 [US4] Add the status switch to `app/src/ui/PersonDetail.tsx` per research R7: a `<label className="switch">` with `<input type="checkbox" role="switch">` and `note.connected`, as in `NoteStep.tsx`; on change set the state and call `updatePerson(person.id, { connectionStatus })`; on an error flip back (storage full → F0 banner); call `onChanged()` after a successful save. Make the T023 tests pass.

**Checkpoint**: the "not yet connected" state can be fixed after the event.

---

## Phase 7: User Story 5 - Delete a person (Priority: P2)

**Goal**: Delete a Person with all Encounters and notes, after a confirmation that names them.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5 step 4.

### Tests for User Story 5

- [X] T025 [P] [US5] Extend `app/tests/person-detail-ui.test.tsx`:
  - A Person "Jan Peeters" with 2 Encounters: `person.delete` shows `person.deleteQuestionMany` with "Jan Peeters" and "2"; `link.cancel` deletes nothing; confirming with `person.deleteConfirm` returns to the list, shows `contacts.deleted` with "Jan Peeters", and the database has no Person and no Encounters for him; searching "jan" shows `contacts.noMatch`.
  - With 1 Encounter the text is `person.deleteQuestionOne`.
  - A Person whose Encounter is the open note step (`updateSettings({ noteStepEncounterId })`): after deleting, `getNoteStep()` returns `undefined`. *(2026-10-11: checked on the data only: with an open note step the app opens on it (B18), so Contacts is not reachable until it is closed.)*

### Implementation for User Story 5

- [X] T026 [P] [US5] Create `app/src/ui/ConfirmPanel.tsx` per research R9: props `text`, `confirmLabel`, `busy`, `onConfirm()`, `onCancel()`; renders `<div role="alertdialog" aria-labelledby=… className="confirm-panel">` with the text, a red `confirmLabel` button and `link.cancel`; both disabled while `busy`; focus moves to the panel on mount.
- [X] T027 [US5] Add "Delete person" to `app/src/ui/PersonDetail.tsx` and the message to `app/src/ui/ContactsTab.tsx`: a red text button `person.delete` at the bottom opens `ConfirmPanel` with `person.deleteQuestionOne` or `person.deleteQuestionMany` (`{name}`, `{count}` = number of Encounters) and `person.deleteConfirm`; confirming calls `deletePerson(person.id)` (F0, one transaction) and then a new prop `onDeleted(name)`; `ContactsTab` clears `personId`, sets the list `message` to `contacts.deleted` with the name, reloads, and clears the message on the next view or search change. Make the T025 tests pass.
- [X] T028 [US5] Add styles to `app/src/styles.css`: `.confirm-panel` as a bordered card like the merge question; `.danger` buttons and text buttons in red (`#c62828`), with the same size rules as other buttons.

**Checkpoint**: constitution VI (delete any Person) holds; "ready for the first fair" item "Persoon verwijderen" works.

---

## Phase 8: User Story 6 - Delete one Encounter (Priority: P3)

**Goal**: Delete a single Encounter; the last one leads to deleting the Person (B25).

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5 step 3.

### Tests for User Story 6

- [X] T029 [P] [US6] Extend `app/tests/contacts-repository.test.ts` for `deleteEncounterFromTimeline`: with 2 Encounters only the chosen one (and its note) is gone and the Person stays; with 1 Encounter it rejects with `LastEncounterError` and nothing is deleted; an unknown id rejects with `ValidationError`.
- [X] T030 [P] [US6] Extend `app/tests/person-detail-ui.test.tsx`:
  - Jan with a Devoxx Encounter (with note) and a casual one: `encounter.delete` on the Devoxx one shows `encounter.deleteQuestion` with its date and "Devoxx 2026" plus `encounter.deleteNote`; confirming leaves one Encounter in the timeline; Back with the Devoxx view: Jan is no longer listed, but he is in `contacts.casual`.
  - Jan with one Encounter: `encounter.delete` shows `encounter.deleteLast` with "Jan" and `person.deleteConfirmPerson`; confirming deletes the Person and returns to the list with `contacts.deleted`; `link.cancel` deletes nothing.

### Implementation for User Story 6

- [X] T031 [US6] Add `export class LastEncounterError extends Error` (name `'LastEncounterError'`, message "This is the Person's only Encounter") to `app/src/data/errors.ts`, and `deleteEncounterFromTimeline(id)` to `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md): one `rw` transaction on `encounters`; unknown id → `ValidationError('id', 'Unknown Encounter')`; count the Encounters with the same `personId`; `1` → throw `LastEncounterError`; otherwise delete it. Leave `deleteEncounter` unchanged. Make the T029 tests pass.
- [X] T032 [US6] Add the per-Encounter delete to `app/src/ui/PersonDetail.tsx`: a small `encounter.delete` button on each timeline item; with 2+ Encounters it opens `ConfirmPanel` with `encounter.deleteQuestion` (`{date}`, `{event}` = Event name or `contacts.casual`) plus `encounter.deleteNote` when the Encounter has a note, and `person.deleteConfirm`; confirming calls `deleteEncounterFromTimeline`, reloads the timeline and calls `onChanged()`. With exactly one Encounter it opens `ConfirmPanel` with `encounter.deleteLast` and `person.deleteConfirmPerson`, which runs the US5 Person delete. A `LastEncounterError` (race) switches to that same Person-delete confirmation. Make the T030 tests pass.

**Checkpoint**: constitution VI (delete any Encounter) holds.

---

## Phase 9: User Story 7 - Correct a name or company (Priority: P3)

**Goal**: Edit name and company on the detail screen; the search link follows (B27).

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5 step 2.

### Tests for User Story 7

- [X] T033 [P] [US7] Extend `app/tests/contacts-repository.test.ts` for `updatePersonDetails`: name and company are trimmed and stored; `searchUrl === buildSearchUrl(name, company)`; an empty company removes it (and the search link uses only the name); an empty name rejects with `ValidationError` and nothing changes; `profileUrl`, `connectionStatus`, `id` and `createdAt` are unchanged and `updatedAt` is newer; another Person with the same name is allowed; an unknown id rejects with `ValidationError`.
- [X] T034 [P] [US7] Extend `app/tests/person-detail-ui.test.tsx`: `person.edit` shows inputs `add.name` and `add.company` with the stored values (`maxLength` 100); changing them to "Jan Peeters-Maes" and "Elmos" and tapping `person.save` shows the new values; Back and search "maes" finds him; for a Person without a profile link the `person.searchLinkedIn` link now has `href` = `buildSearchUrl('Jan Peeters-Maes', 'Elmos')`; an emptied name shows `person.errorName` and nothing is saved; `link.cancel` restores the stored values.

### Implementation for User Story 7

- [X] T035 [US7] Add `updatePersonDetails(id, { name, company })` to `app/src/data/repository.ts` per research R8 and [data-model.md](data-model.md) "What F7 changes": one `rw` transaction on `persons`; unknown id → `ValidationError('id')`; `name` "Trimmed, not empty"; `company` "Trimmed; empty → absent"; `searchUrl = buildSearchUrl(name, company)`; keep `profileUrl`, `connectionStatus`, `id`, `createdAt`; set `updatedAt`; store with `compact`; return the Person. Make the T033 tests pass.
- [X] T036 [US7] Add the edit form to `app/src/ui/PersonDetail.tsx`: `person.edit` turns name and company into inputs (`add.name` required, `add.company`, both `maxLength={100}`) with `person.save` and `link.cancel`; a blank name shows `person.errorName` and does not save; saving calls `updatePersonDetails`, shows the new values and calls `onChanged()`; cancel restores the stored values. No same-name question. Make the T034 tests pass.

**Checkpoint**: all seven user stories work.

---

## Phase 10: Polish & Cross-Cutting Concerns

*(2026-10-11: T039–T041 come after Phase 11.)*

- [X] T037 Add a button `diagnostics.addManyTestData` to `app/src/ui/Diagnostics.tsx` per research R12: it creates the `[test]` Events if missing and 500 Persons named `[test] Contact 001`…`500` (every third with a company, every fifth `connected`), each with 1–3 Encounters spread over the `[test]` Events and casual networking on recent days; it refreshes the counts. The existing "Remove test data" removes them.
- [X] T038 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the new screens come from `t()`, that no screen besides the five tabs shows the tab bar, and that no new dependency was added to `app/package.json`. *(2026-10-11: 248 tests green (was 200), build OK, `package.json` unchanged.)*
- [ ] T039 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T040 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–6, including the 500-contact check and the tab bar above the home indicator (manual, Britt).
- [ ] T041 Tick the F7 items in `specs/features.md` (and "Persoon verwijderen (F7)" under "Klaar voor de eerste beurs" once F10's CSV export also works) and add a line to `wiki/log.md`, per CLAUDE.md.

---

## Phase 11: Change request — notes in the edit mode (B28, B29) (Priority: P2)

**Goal**: The edit mode of the detail screen also edits the note of every Encounter; name, company
and notes are saved together. F6 is merged into F7.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 5 step 2.

### Tests

- [X] T042 [P] [US7] Extend `app/tests/contacts-repository.test.ts` for `updatePersonDetails` with `notes`: a note on an Encounter without one is stored (trimmed); a changed note replaces the old one; an empty note removes the `note` field; an Encounter whose note did not change keeps its `updatedAt`; an Encounter of another Person → `ValidationError` and neither the name nor any note changed.
- [X] T043 [P] [US7] Extend `app/tests/person-detail-ui.test.tsx`: in the edit mode every timeline item has a textarea labelled `person.noteFor` (date, Event) with the stored note or empty; the LinkedIn link, `link.paste`, the status switch and `encounter.delete`/`person.delete` are not shown; typing a note in the empty casual Encounter and changing the Devoxx note, then `person.save`, shows both notes in the timeline and stores them; clearing a note shows `person.noNote`; `link.cancel` restores the stored notes.

### Implementation

- [X] T044 [US7] Add the key `person.noteFor` from [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word.
- [X] T045 [US7] Extend `updatePersonDetails` in `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md) and research R8: optional `notes: { encounterId, note }[]`; one `rw` transaction on `persons` and `encounters`; each Encounter must exist and have `personId === id` (else `ValidationError('notes')`, before anything is written); note "Trimmed; empty → absent"; `put` an Encounter (with `compact` and a new `updatedAt`) only when its note changed. Make the T042 tests pass.
- [X] T046 [US7] Update `app/src/ui/PersonDetail.tsx` per [contracts/screens.md](contracts/screens.md) "Person detail": the draft holds `notes: Record<encounterId, string>` filled from the timeline; in the edit mode render one form with name, company, the timeline with a `<textarea>` per Encounter (`aria-label` = `person.noteFor`, placeholder `note.placeholder`, `rows={3}`), then `person.save` and `link.cancel`; hide the LinkedIn link, `ProfileLinkControl`, the status switch and the delete buttons while editing; saving passes only the notes that differ from the stored ones, then reloads the timeline. Make the T043 tests pass.

**Checkpoint**: notes can be added and edited after the event (B6, B29).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (`ContactList`, `ContactsTab`).
- **US3 (Phase 5)**: depends on US1 (rows to tap); independent of US2 except the Back test, which checks the search text (run after US2).
- **US4 (Phase 6)**: depends on US3 (`PersonDetail`).
- **US5 (Phase 7)**: depends on US3.
- **US6 (Phase 8)**: depends on US5 (`ConfirmPanel`, Person delete for the last Encounter).
- **US7 (Phase 9)**: depends on US3; independent of US4–US6.
- **Phase 11** (notes in the edit mode): depends on US7 (T035, T036).
- **Polish (Phase 10)**: T037–T038 after all stories; T039–T041 after Phase 11.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` (T005, T031, T035), `PersonDetail.tsx` (T020, T024, T027, T032, T036),
  `ContactsTab.tsx` (T014, T017, T021, T027) and `styles.css` (T011, T015, T022, T028) tasks run
  one at a time.

### Parallel Opportunities

- Foundational: T002, T003, T004, T006, T007 together; T005 alongside them (other files).
- Each story's test tasks run together with each other and with the previous story's styles task.
- US5: T026 (`ConfirmPanel.tsx`) alongside T025.
- US6 repository work (T029, T031) can start right after US3, alongside US4 and US5.
- US7 repository work (T033, T035) can run alongside US4–US6 (different functions, but the same
  file: do not edit `repository.ts` in two tasks at once).

## Parallel Example: Foundational

```text
Task: "T002 Add the 40 text keys to nl.ts and en.ts"
Task: "T003 Create app/src/people/contacts.ts"
Task: "T004 Create app/tests/contacts.test.ts"
Task: "T006 Create app/src/ui/ComingSoon.tsx"
Task: "T007 Create app/src/ui/TabBar.tsx"
```

## Parallel Example: User Story 5

```text
Task: "T025 Extend person-detail-ui.test.tsx for deleting a Person"
Task: "T026 Create app/src/ui/ConfirmPanel.tsx"
```

## Implementation Strategy

### MVP (User Stories 1–3)

1. Phase 1 → Phase 2 → US1 → US2 → US3.
2. **Stop and validate**: quickstart sections 2–4 on the iPhone: tabs, list, search, detail,
   "Open in LinkedIn". This already covers Flow C step 3 and can be pushed.

### Incremental Delivery

1. Foundational + US1 → push (tabs and list).
2. US2 + US3 → push (search, detail, LinkedIn).
3. US4 + US5 → push (status, delete Person: constitution VI for Persons).
4. US6 + US7 → push (delete Encounter, edit name/company).
5. Polish: 500-contact check, full quickstart, features list, wiki log.
