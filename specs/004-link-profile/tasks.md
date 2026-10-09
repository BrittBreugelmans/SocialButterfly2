---

description: "Task list for F4 — Link the Profile URL"
---

# Tasks: F4 — Link the Profile URL

**Input**: Design documents from `specs/004-link-profile/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `profile-url.test.ts`, `link-profile.test.ts`,
`link-profile-ui.test.tsx`), as in F0–F2. iPhone behaviour is checked by hand with
[quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1, US2 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F2 rules still apply ([../003-add-by-name/tasks.md](../003-add-by-name/tasks.md), "Ground
  rules"): terms from `wiki/begrippen.md`, every text via `t()`, UI only through
  `app/src/data/repository.ts`, every write in one `db.transaction` inside `withStorageErrors()`.
- The clipboard is read **only** in a tap handler, before any `await` (research R1).
- The app never opens or checks a profile link on the network (L1).
- No new fields, no Dexie schema version.
- UI tests: `userEvent.setup()` installs its own clipboard stub on `navigator.clipboard`, so mock
  with `vi.spyOn(navigator.clipboard, 'readText')` **after** `userEvent.setup()`. Reach the note
  step as in `app/tests/add-by-name-ui.test.tsx` (start → "Toevoegen via naam" → name → wait for
  `aria-busy="false"` on the search link → tap it), with its `window` click listener that stops
  jsdom from following links. *(2026-10-09: in jsdom `DOMException` is not an `Error`; mock a refused paste with `mockRejectedValue`. Banners also use `role="status"`, so tests find the message by its class `.link-message`.)*

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F2 baseline is green (119 tests) before changing anything.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Profile-link normalization, clipboard reading and all new texts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `app/src/linkedin/profileUrl.ts` per research R2 and [contracts/storage-api.md](contracts/storage-api.md):
  - `normalizeProfileUrl(text: string): { ok: true; url: string } | { ok: false; reason: 'notProfile' | 'shortLink' }`.
  - Find the first whitespace-separated token in `text` that contains `linkedin.com/` or `lnkd.in/` (case-insensitive); none → `notProfile`. A `lnkd.in` token → `shortLink`.
  - Parse with `new URL(token)`, adding `https://` when it has no scheme; a parse error → `notProfile`. The lowercased host must equal `linkedin.com` or end with `.linkedin.com`; otherwise `notProfile`.
  - Split the pathname on `/`, drop empty parts, find the part `in` (lowercase compare); the next part is the handle. Missing → `notProfile`.
  - Handle = `encodeURIComponent(decodeURIComponent(part).trim().toLowerCase())`; a `decodeURIComponent` error or an empty handle → `notProfile`.
  - Return `https://www.linkedin.com/in/<handle>` — "no query string, no fragment and no trailing slash" (F0 rule).
  - Also `shortProfileUrl(url: string): string` returning `url` without `https://www.`.
- [X] T003 [P] Create `app/src/platform/clipboard.ts` with `readClipboardText(): Promise<string | 'dismissed' | 'unsupported'>`: when `navigator.clipboard?.readText` is missing, resolve `'unsupported'`; otherwise call `navigator.clipboard.readText()` **synchronously** (no `await` before it) and map a rejection to `'dismissed'`. Comment: must be called directly in the tap handler (research R1, T5).
- [X] T004 [P] Add the 11 keys from the table "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`link.*`), keeping the placeholders `{name}` and `{company}`.
- [X] T005 [P] Create `app/tests/profile-url.test.ts` with a table of inputs that must all give `https://www.linkedin.com/in/jan-peeters`:
  - `https://www.linkedin.com/in/jan-peeters`
  - `https://www.linkedin.com/in/jan-peeters/`
  - `https://www.linkedin.com/in/jan-peeters?utm_source=share&utm_medium=ios_app`
  - `http://linkedin.com/in/jan-peeters#about`
  - `https://be.linkedin.com/in/Jan-Peeters`
  - `www.linkedin.com/in/jan-peeters`
  - `https://WWW.LINKEDIN.COM/in/jan-peeters`
  - `https://www.linkedin.com/mwlite/in/jan-peeters`
  - `https://www.linkedin.com/in/jan-peeters/details/experience/`
  - `Bekijk het profiel van Jan: https://www.linkedin.com/in/jan-peeters?trk=x`
  - Encoded and plain forms of `zoë-peeters` give the same `…/in/zo%C3%AB-peeters`.
  - `notProfile` for: `''`, `hallo`, `https://example.com/in/jan`, `https://www.linkedin.com/company/elmos`, `https://www.linkedin.com/feed/`, `https://www.linkedin.com/in/`, `https://notlinkedin.com/in/jan`, `https://www.linkedin.com/in/%E0%A4%A`.
  - `shortLink` for `https://lnkd.in/abc123`.
  - Every `ok` result starts with `https://www.linkedin.com/in/` and has exactly one path segment after `/in/`, no `?`, `#` or trailing `/`.
  - `shortProfileUrl('https://www.linkedin.com/in/jan-peeters') === 'linkedin.com/in/jan-peeters'`.

**Checkpoint**: `npm run typecheck && npm test` are green; nothing visible has changed yet.

---

## Phase 3: User Story 1 - Paste the profile link on the note step (Priority: P1) 🎯 MVP

**Goal**: "Plak LinkedIn-link" on the note step stores the normalized link on the Person; "Open
LinkedIn" then opens the profile.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) sections 2, 3 and 5.

### Tests for User Story 1

- [X] T006 [P] [US1] Create `app/tests/link-profile.test.ts` for `linkProfileUrl(personId, profileUrl)`:
  - Stores the link on a Person without one → `status: 'linked'`, the stored Person has it, `updatedAt` changed, `searchUrl` kept.
  - The same link again → `status: 'unchanged'`.
  - Another link → `status: 'linked'` and it replaces the first.
  - A link that belongs to another Person → `status: 'conflict'` with `other` = that Person, and **nothing** changed on either Person.
  - A non-normalized link (`https://www.linkedin.com/in/jan/`) or an unknown `personId` → `ValidationError`.
- [X] T007 [P] [US1] Create `app/tests/link-profile-ui.test.tsx` (App level, see Ground rules), adding `Jan Peeters` via quick mode to reach the note step:
  - `link.paste` is shown; tapping it with `readText` → `'https://www.linkedin.com/in/jan-peeters?utm_source=share'` shows `link.linked` and `linkedin.com/in/jan-peeters`; the stored Person has `https://www.linkedin.com/in/jan-peeters`; the button now reads `link.pasteAgain`.
  - After linking, the `note.openLinkedIn` link has `href` = the profile link.
  - `readText` → `'hallo'` shows `link.invalid`; `'https://lnkd.in/abc'` shows `link.shortLink`; nothing stored in both cases.
  - `readText` rejecting shows no message and stores nothing.
  - No `navigator.clipboard.readText` (delete it for the test) shows `link.unsupported`.
  - Remount on the same day after linking (B18): the note step shows `link.linked`.

### Implementation for User Story 1

- [X] T008 [US1] Add `linkProfileUrl(personId: string, profileUrl: string)` to `app/src/data/repository.ts` per research R3 and [contracts/storage-api.md](contracts/storage-api.md): reject a link that fails the existing `isNormalizedProfileUrl` with `ValidationError('profileUrl', …)`; in **one** `db.transaction('rw', db.persons, …)` load the Person (`ValidationError` if missing), return `unchanged` when it already has the link, return `conflict` (without writing) when `db.persons.where('profileUrl').equals(profileUrl).first()` is another Person, otherwise `put` it with the new `profileUrl` and `updatedAt = nowIso()` and return `linked`. Wrap it in `withStorageErrors()`. Make the T006 tests pass.
- [X] T009 [US1] Update `app/src/ui/NoteStep.tsx` per [contracts/screens.md](contracts/screens.md):
  - Keep the current Person in state (`const [current, setCurrent] = useState(person)`) and use it for the title, `linkedInUrlFor` and the linked line.
  - Under "Open LinkedIn": a `secondary` button `link.paste` (or `link.pasteAgain` when `current.profileUrl` is set). Its `onClick` calls `readClipboardText()` **first, synchronously**, then awaits the result: `'dismissed'` → nothing; `'unsupported'` → message `link.unsupported`; text → `normalizeProfileUrl`; not ok → `link.invalid` or `link.shortLink`; ok → `linkProfileUrl(current.id, url)`; `linked`/`unchanged` → `setCurrent(person)` and clear the message; `conflict` → handled in US2 (for now: no change).
  - When `current.profileUrl` is set, show `<p className="link-linked">` with `link.linked` and `shortProfileUrl(current.profileUrl)`.
  - One `<p role="status" className="link-message">` for the message. On `StorageFullError`, show nothing extra (the F0 banner appears).
  - Make the T007 tests pass.
- [X] T010 [US1] Add styles to `app/src/styles.css`: `.link-linked` (muted, small, the URL in bold and cut off with an ellipsis), `.link-message` (like `.note-info`, hidden when empty).

**Checkpoint**: on the iPhone, pasting a profile link works (quickstart sections 2, 3, 5). Push is possible.

---

## Phase 4: User Story 2 - Recognise an existing Person by the profile link (Priority: P1)

**Goal**: A pasted link that belongs to another Person asks "Merge?" (B21). Merge keeps one Person
with every Encounter and note; Cancel stores nothing.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 4.

### Tests for User Story 2

- [X] T011 [P] [US2] Extend `app/tests/link-profile.test.ts` for `mergePersons({ fromPersonId, intoPersonId, noteDraft? })`:
  - `into` keeps `name`, `profileUrl`, `searchUrl`; gets `from.company` only when it had none; becomes `'connected'` when either was connected; `updatedAt` changed.
  - Encounters of `from` on other days or in other contexts move to `into` (`personId`), with their notes.
  - A clash (same `date`, same `eventId`, or both casual) leaves **one** Encounter: `into`'s, with note `"<into note>\n<from note>"`; with one empty note, just the other; the `from` Encounter is gone.
  - `noteDraft` replaces the note of `from`'s open note-step Encounter before merging; `Settings.noteStepEncounterId` then points to the Encounter that holds the note step, returned as `noteStepEncounter`.
  - `from` is deleted; the total number of notes' texts is unchanged (nothing lost).
  - `fromPersonId === intoPersonId` or an unknown id → `ValidationError` and nothing changed.
- [X] T012 [P] [US2] Extend `app/tests/link-profile-ui.test.tsx`:
  - Stored `Jan Peeters` (company `Elmos`, profile `…/in/jan-peeters`, a note `eerste` on an Encounter today in the current context). Add `Jan Peters`, type note `tweede`, paste `…/in/jan-peeters`: `link.mergeQuestion` with `Jan Peeters` and `Elmos` appears; `link.paste` is hidden.
  - Without a company: `link.mergeQuestionNoCompany`.
  - `link.cancel`: the question disappears, `Jan Peters` has no `profileUrl`, both Persons still exist.
  - `link.merge`: `link.merged` with `Jan Peeters`; the note step title is for `Jan Peeters`; the note shows `eerste` and `tweede` on two lines; `link.linked` shows the profile; 1 Person remains.
  - Save after the merge: one Encounter today with that note; `Settings.noteStepEncounterId` removed.

### Implementation for User Story 2

- [X] T013 [US2] Add `mergePersons(input: { fromPersonId: string; intoPersonId: string; noteDraft?: string })` to `app/src/data/repository.ts` per research R4 and the "Merge rules" table in [data-model.md](data-model.md), in **one** `db.transaction('rw', db.persons, db.encounters, db.settings, …)`:
  - Validate both ids (different, both exist).
  - If `noteDraft !== undefined` and `Settings.noteStepEncounterId` is an Encounter of `from`, set its note to `optionalText(noteDraft)` first.
  - For each `from` Encounter: find an `into` Encounter with the same `date` and `eventId === eventId`; if found, set its note to the non-empty notes joined with `'\n'` (into first) and delete the `from` Encounter, and if it was the note-step Encounter, point `noteStepEncounterId` to the `into` one; otherwise `put` it with `personId = into.id` and `updatedAt`.
  - Update `into` (`company` fill, `connectionStatus`, `updatedAt`) and delete `from`.
  - Return `{ person, noteStepEncounter }`. Wrap it in `withStorageErrors()`. Make the T011 tests pass.
- [X] T014 [P] [US2] Create `app/src/ui/MergeQuestion.tsx`: props `other: Person`, `busy: boolean`, `onMerge()`, `onCancel()`. Text `link.mergeQuestion` with `{name}` and `{company}`, or `link.mergeQuestionNoCompany` when `other.company` is absent; buttons `link.merge` (primary) and `link.cancel` (`secondary`); `role="alertdialog"` with the question as its label.
- [X] T015 [US2] Update `app/src/ui/NoteStep.tsx`:
  - New prop `onMerged(result: { person: Person; encounter: Encounter; message: string })`.
  - On `conflict`, keep `other` in state and show `MergeQuestion` in place of the paste button.
  - Cancel → clear `other`. Merge → `mergePersons({ fromPersonId: current.id, intoPersonId: other.id, noteDraft: note })`, then `onMerged({ person, encounter: noteStepEncounter, message: t('link.merged', { name: other.name }) })`.
  - Accept an optional prop `initialMessage` and show it in the status line on mount. *(2026-10-09: the F2 test in `app/tests/add-by-name-ui.test.tsx` that renders `NoteStep` on its own now passes `onMerged={() => {}}`; nothing else changed there.)*
- [X] T016 [US2] Update `app/src/App.tsx`: key `NoteStep` on `` `${noteStep.person.id}:${noteStep.encounter.id}` ``; pass `onMerged` that replaces `person` and `encounter` in the note-step state (keeping `alreadyMetToday` and `opened`) and stores the message, passed as `initialMessage`. Make the T012 tests pass.
- [X] T017 [US2] Add merge-question styles to `app/src/styles.css`: a `--surface` box with rounded corners, the question in bold, the two buttons full width.

**Checkpoint**: both user stories work.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T018 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the note step come from `t()`.
- [ ] T019 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T020 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–6, including the iOS "Plakken" bubble (manual, Britt).
- [ ] T021 Tick the F4 items in `specs/features.md` and add a line to `wiki/log.md`, per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational and on F2's note step.
- **US2 (Phase 4)**: depends on US1 (the paste flow produces the `conflict`).
- **Polish (Phase 5)**: after US2.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` (T008, T013), `NoteStep.tsx` (T009, T015) and `styles.css` (T010, T017) tasks
  run one at a time.

### Parallel Opportunities

- Foundational: T002–T005 together.
- US1: T006 and T007 together.
- US2: T011, T012 and T014 together.

## Parallel Example: Foundational

```text
Task: "T002 Create app/src/linkedin/profileUrl.ts"
Task: "T003 Create app/src/platform/clipboard.ts"
Task: "T004 Add the 11 link.* keys to nl.ts and en.ts"
Task: "T005 Create app/tests/profile-url.test.ts"
```

## Parallel Example: User Story 2

```text
Task: "T011 [US2] Extend app/tests/link-profile.test.ts"
Task: "T012 [US2] Extend app/tests/link-profile-ui.test.tsx"
Task: "T014 [US2] Create app/src/ui/MergeQuestion.tsx"
```

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1 → Phase 2 → US1.
2. **Stop and validate**: quickstart sections 2, 3 and 5 on the iPhone, especially the iOS
   "Plakken" bubble (research R1). A conflict does nothing yet, so no duplicate can appear.

### Incremental Delivery

1. MVP → push.
2. US2 (merge) → push.
3. Polish: full quickstart, features list, wiki log.
