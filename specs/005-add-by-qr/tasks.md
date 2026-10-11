---

description: "Task list for F5 — Add by QR"
---

# Tasks: F5 — Add by QR

**Input**: Design documents from `specs/005-add-by-qr/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `name-from-url.test.ts`, `add-by-name.test.ts`,
`add-by-qr-ui.test.tsx`), as in F0–F4. The real camera is only checked on the iPhone with
[quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1, US2, US3 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F4 rules still apply ([../004-link-profile/tasks.md](../004-link-profile/tasks.md), "Ground
  rules"): terms from `wiki/begrippen.md`, every text via `t()`, UI only through
  `app/src/data/repository.ts`, every write in one transaction inside `withStorageErrors()`.
- Camera frames never leave memory: no storing, no sending (FR-003).
- Every way out of the scan screen stops the camera (FR-002).
- No new fields, no Dexie schema version.
- UI tests mock the camera module, keeping the real `CameraError`:
  `vi.mock(import('../src/platform/camera'), async (original) => ({ ...(await original()), startQrScanner: vi.fn() }))`.
  A helper sets `startQrScanner` to store `onCode` and resolve with a `stop` spy, so a test can
  "show" a code with `act(() => onCode('https://www.linkedin.com/in/…'))`. Reach screens and stop
  jsdom from following links as in `app/tests/add-by-name-ui.test.tsx`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F4 baseline is green (165 tests) before changing anything.
- [X] T002 Run `npm install jsqr@1.4.0 --save-exact` in `app/`; check that `app/package.json` lists `"jsqr": "1.4.0"` under `dependencies` and that `npm run build` still passes (research R1).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Name from link, the camera module, the new texts and the reusable same-name question.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Add `nameFromProfileUrl(url: string): string` to `app/src/linkedin/profileUrl.ts` per research R4: take the part after `/in/`, `decodeURIComponent` it (on error return `''`), split on `-`, drop trailing parts that contain a digit (repeat), return `''` when no part with at least 2 letters remains, otherwise uppercase the first letter of each part (`toLocaleUpperCase()`) and join with spaces.
- [X] T004 [P] Create `app/src/platform/camera.ts` per research R2 and [contracts/storage-api.md](contracts/storage-api.md):
  - `export class CameraError extends Error { constructor(readonly reason: 'denied' | 'unavailable') }`.
  - `startQrScanner(video, onCode)`: no `navigator.mediaDevices?.getUserMedia` → reject `CameraError('unavailable')`. Call `getUserMedia({ video: { facingMode: 'environment' }, audio: false })`; `NotAllowedError`/`SecurityError` → `CameraError('denied')`, any other error → `CameraError('unavailable')`.
  - Set `video.srcObject`, `playsInline`, `muted`, then `await video.play()`. Load jsQR with `const { default: jsQR } = await import('jsqr')`.
  - Loop with `requestAnimationFrame`, decoding at most every 200 ms: draw the frame on an off-screen canvas scaled to at most 720 px on the long side, `jsQR(data, width, height, { inversionAttempts: 'dontInvert' })`, and call `onCode(result.data)` when found.
  - Resolve with `stop()`: cancel the frame, stop every track of the stream, clear `video.srcObject`; safe to call twice.
- [X] T005 [P] Add the 12 keys from the table "New text keys" in [contracts/screens.md](contracts/screens.md) to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word (`start.scanQr`, `qr.*`), keeping the `{name}` placeholder.
- [X] T006 [P] Create `app/tests/name-from-url.test.ts` with the table in [data-model.md](data-model.md) "Derived name": `…/in/jan-peeters` → "Jan Peeters"; `…/in/jan-peeters-1a2b3c` → "Jan Peeters"; `…/in/zo%C3%AB-peeters-42` → "Zoë Peeters"; `…/in/van-den-broeck` → "Van Den Broeck"; `…/in/jpeeters` → "Jpeeters"; `…/in/12345` and `…/in/j-1` → "".
- [X] T007 Update `app/src/ui/SameNameQuestion.tsx` per [contracts/storage-api.md](contracts/storage-api.md) "SameNameQuestion props": rename the prop `searchUrl` to `newPersonUrl`, and add optional `linkFor?: (match: SameNameMatch) => string` used for each match's `href` (default `linkedInUrlFor(match.person)`). Update the call in `app/src/ui/AddByNameForm.tsx` (`newPersonUrl={searchUrl}`). All F2 tests stay green.

**Checkpoint**: `npm run typecheck && npm test` are green; nothing visible has changed yet.

---

## Phase 3: User Story 1 - Scan someone's LinkedIn QR code (Priority: P1) 🎯 MVP

**Goal**: "Scan QR" → camera → confirmation with derived name and optional company → one tap opens
the profile and saves → note step.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 2.

### Tests for User Story 1

- [X] T008 [P] [US1] Extend `app/tests/add-by-name.test.ts` for `addByName({ name, company, profileUrl })` with a new Person: it stores `profileUrl`, `searchUrl === buildSearchUrl(name, company)`, `connectionStatus === 'notConnected'`, an Encounter today in the current context, and the note step. A `profileUrl` already used by another Person → `DuplicateProfileUrlError`, nothing saved.
- [X] T009 [P] [US1] Create `app/tests/add-by-qr-ui.test.tsx` (App level, mocked camera, see Ground rules):
  - The start screen shows `start.scanQr`; tapping it shows `qr.title` and calls `startQrScanner` once.
  - Showing `https://www.linkedin.com/in/jan-peeters-1a2b3c?utm_source=share` calls `stop`, then shows `qr.confirmTitle`, the name input with "Jan Peeters", an empty company input and `linkedin.com/in/jan-peeters-1a2b3c`.
  - The `qr.save` link has `href` = `https://www.linkedin.com/in/jan-peeters-1a2b3c` and `target="_blank"`; it is `aria-disabled` while the name is blank.
  - Typing `Elmos` as company and tapping `qr.save`: the note step for Jan Peeters with `link.linked`; the stored Person has that `profileUrl`, company `Elmos`, and one Encounter today.
  - `add.back` on the confirmation and on the scan screen: nothing saved, start screen, `stop` called.
  - `qr.scanAgain` returns to scanning (`startQrScanner` called again).

### Implementation for User Story 1

- [X] T010 [US1] Extend `addByName` in `app/src/data/repository.ts` with optional `profileUrl` for a new Person per [contracts/storage-api.md](contracts/storage-api.md): pass it to `validatePerson` (F0 checks the normalized form), and inside the existing transaction call `assertProfileUrlFree(profileUrl)` before adding the Person. Without `profileUrl` nothing changes. Make the T008 tests pass.
- [X] T011 [US1] *(2026-10-11: the tests for US1–US3 were written first, then `AddByQr.tsx` was written once with the US2 and US3 parts (T017, T019) included; each story's tests were checked.)* Create `app/src/ui/AddByQr.tsx` per [contracts/screens.md](contracts/screens.md), props `activeEvent`, `onSaved(result: SavedByName)`, `onAddByName()`, `onBack()`:
  - State `phase: 'scanning' | 'confirm'`. While scanning, render the title `qr.title`, a square `<video playsInline muted autoPlay>` and the hint `qr.hint`; in an effect call `startQrScanner(videoRef.current, handleCode)` and keep `stop`; call `stop` on unmount and when leaving the phase.
  - `handleCode(text)`: `normalizeProfileUrl(text)`; when ok, `stop()`, store the url, set `name = nameFromProfileUrl(url)`, `company = ''`, phase `confirm`. (Wrong codes: US3.)
  - Confirm: title `qr.confirmTitle`, read-only `ContextBar`, name input (`add.name`, `maxLength={100}`, required) and company input (`add.company`, `maxLength={100}`, placeholder `add.companyPlaceholder`), `shortProfileUrl(url)`.
  - `qr.save`: `<a className="button-link" href={url} target="_blank" rel="noopener">`, `aria-disabled` while the name is blank or saving; `onClick` (no `preventDefault` when allowed) runs `addByName({ name, company, profileUrl: url })` once and calls `onSaved({ ...result, opened: true })`.
  - `qr.scanAgain` → phase `scanning`; `add.back` → `onBack()`.
- [X] T012 [US1] Update `app/src/ui/StartScreen.tsx` (new prop `onScanQr`, button `start.scanQr` under "Add by name") and `app/src/App.tsx` (screen `'addByQr'`; load the active Event also for this screen; `AddByQr.onSaved` → note step like F2; `onAddByName` → `'addByName'`; `onBack` → `'start'`). Make the T009 tests pass.
- [X] T013 [US1] Add styles to `app/src/styles.css`: the start buttons stacked with 12 px gap; `.qr-video` square, full width (max 420 px), `object-fit: cover`, rounded corners, black background; `.qr-hint` muted and centered; `.qr-link` (short link) muted.

**Checkpoint**: on the iPhone, scanning a new person works (quickstart section 2). Push is possible.

---

## Phase 4: User Story 2 - Recognise someone she already stored (Priority: P1)

**Goal**: A scanned link that a Person already has reuses that Person (B8, B19); a same-name Person
without a link triggers the F2 question (B15) and gets the link.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) section 3.

### Tests for User Story 2

- [X] T014 [P] [US2] Extend `app/tests/add-by-name.test.ts` for `addByName` with `existingPersonId` and `profileUrl`:
  - The Person has no `profileUrl` → it gets the scanned one; name and company unchanged; new Encounter.
  - The Person already has this `profileUrl` → unchanged; new Encounter; met today in the same context → `alreadyMetToday: true`, no new Encounter.
  - The Person has **another** `profileUrl` → `ValidationError`, nothing saved.
  - The `profileUrl` belongs to a third Person → `DuplicateProfileUrlError`, nothing saved.
- [X] T015 [P] [US2] Extend `app/tests/add-by-qr-ui.test.tsx`:
  - Stored `Jan Peeters` (company `Elmos`) with `…/in/jan-peeters` and an Encounter last week: scanning that link shows `qr.known` with "Jan Peeters" and "Elmos" as text (no name input); `qr.save` adds a second Encounter; still 1 Person.
  - Same, but already met today in the current context: the main action is the button `qr.saveMetToday`; tapping it shows the note step with `note.alreadyMet`; no new Encounter; `window.open` not called.
  - Stored `Jan Peeters` **without** a link: scanning `…/in/jan-peeters` (derived "Jan Peeters") and tapping `qr.save` shows `same.title`; the match is a link to `…/in/jan-peeters`; picking it leaves 1 Person, now with that `profileUrl`; `same.newPerson` links to the scanned profile and gives 2 Persons.
  - Stored `Jan Peeters` with **another** link: scanning `…/in/jan-peeters` shows no same-name question; `qr.save` creates a new Person.

### Implementation for User Story 2

- [X] T016 [US2] Extend `addByName` in `app/src/data/repository.ts` for `existingPersonId` + `profileUrl` per research R5 and [data-model.md](data-model.md) "Existing Persons": inside the transaction, if the Person has no `profileUrl`, `assertProfileUrlFree(profileUrl, person.id)` and `put` it with the link and `updatedAt`; if it has the same link, leave it; if it has another link, throw `ValidationError('profileUrl', …)`. The B19 "met today" check and the note step stay as they are. Make the T014 tests pass.
- [X] T017 [US2] Update `app/src/ui/AddByQr.tsx`:
  - On a profile code, look up `findPersonByProfileUrl(url)`. If found: `known = person`, and `metToday` from `findSameNamePersons(person.name)` (the entry for that Person). Show name and company as text with `qr.known`; `qr.save` saves with `existingPersonId: known.id`; when `metToday`, a plain button `qr.saveMetToday` instead of the link, saving with `opened: false`.
  - Otherwise, while the name is edited, run `findSameNamePersons(name)` keeping only matches **without** `person.profileUrl` (as F2's form does with `aria-busy`). A tap on `qr.save` with matches → `preventDefault`, show `SameNameQuestion` with `newPersonUrl={url}` and `linkFor={() => url}`; picking a match saves with `existingPersonId` + `profileUrl`; "No, new person" saves a new Person.
  - Make the T015 tests pass.

**Checkpoint**: no duplicates when scanning known people (quickstart section 3).

---

## Phase 5: User Story 3 - Wrong code or no camera (Priority: P2)

**Goal**: Clear messages for wrong codes and a refused or missing camera; nothing saved.

**Independent Test**: `npm test` and [quickstart.md](quickstart.md) sections 4 and 5.

### Tests for User Story 3

- [X] T018 [P] [US3] Extend `app/tests/add-by-qr-ui.test.tsx`:
  - Showing `https://example.com` shows `qr.notProfile` in `.qr-message`; `stop` is not called; nothing saved; a LinkedIn profile code shown afterwards still opens the confirmation.
  - Showing `https://lnkd.in/abc` shows `qr.shortLink`.
  - `startQrScanner` rejecting with `new CameraError('denied')` shows `qr.cameraDenied` and a button `start.addByName` that opens the F2 form; `CameraError('unavailable')` shows `qr.cameraUnavailable`.
  - A `visibilitychange` to `hidden` while scanning calls `stop`.

### Implementation for User Story 3

- [X] T019 [US3] Update `app/src/ui/AddByQr.tsx`: in `handleCode`, a `shortLink` result sets message `qr.shortLink`, `notProfile` sets `qr.notProfile` (keep scanning; the same refused text again changes nothing); a `<p role="status" className="qr-message">` shows it. Catch `CameraError` from `startQrScanner`: show `qr.cameraDenied` or `qr.cameraUnavailable` instead of the video, plus a button `start.addByName` calling `onAddByName`. Stop the camera on `document` `visibilitychange` → `hidden`. Make the T018 tests pass. *(2026-10-11: after a stop in the background the scan screen shows `qr.scanAgain`, which restarts the camera.)*
- [X] T020 [US3] Add styles to `app/src/styles.css`: `.qr-message` like `.link-message` (hidden when empty); the camera-refused box like `.note-info`.

**Checkpoint**: all three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`; check that all texts on the new screens come from `t()`, and that the build puts jsQR in its own chunk (not in the main bundle). *(2026-10-11: 194 tests green five times in a row; `jsQR-*.js` is its own chunk of 130 kB, 47 kB gzipped.)*
- [X] T022 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically. *(2026-10-11: pushed as `22df4b0`.)*
- [X] T023 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–6, with a second phone showing a LinkedIn QR code; note in section 5 where iOS shows the camera setting (manual, Britt).
- [X] T024 Tick the F5 items in `specs/features.md` and add a line to `wiki/log.md`, per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational.
- **US2 (Phase 4)**: depends on US1 (`AddByQr` and `addByName` with `profileUrl`).
- **US3 (Phase 5)**: depends on US1 (the scan screen); independent of US2.
- **Polish (Phase 6)**: after US2 and US3.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` (T010, T016), `AddByQr.tsx` (T011, T017, T019) and `styles.css` (T013, T020)
  tasks run one at a time.

### Parallel Opportunities

- Foundational: T003–T006 together; T007 alongside them (other files).
- US1: T008 and T009 together.
- US2: T014 and T015 together.
- US3: T018 alongside US2's implementation (different file from T016).

## Parallel Example: Foundational

```text
Task: "T003 Add nameFromProfileUrl to app/src/linkedin/profileUrl.ts"
Task: "T004 Create app/src/platform/camera.ts"
Task: "T005 Add the 12 text keys to nl.ts and en.ts"
Task: "T006 Create app/tests/name-from-url.test.ts"
```

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1 → Phase 2 → US1.
2. **Stop and validate**: quickstart section 2 on the iPhone: camera permission, scan speed,
   opening the profile. Known people would still get a duplicate-link error at this point, so
   push the MVP only for testing, or continue with US2 first.

### Incremental Delivery

1. US1 + US2 → push (no duplicates).
2. US3 (messages, refused camera) → push.
3. Polish: full quickstart, features list, wiki log.
