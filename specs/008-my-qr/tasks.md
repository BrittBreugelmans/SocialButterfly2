---

description: "Task list for F9 — My QR"
---

# Tasks: F9 — My QR

**Input**: Design documents from `specs/008-my-qr/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included (plan: `my-qr.test.ts`, `paste-profile-url.test.ts`, `wake-lock.test.ts`,
`my-qr-ui.test.tsx`), as in F0–F8. The QR test is split off into `qr.test.ts` so it can run in
parallel. Real scanners, the iOS version and the offline start are checked on the iPhone with
[quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US4 from spec.md
- All paths are under `app/`

## Ground rules for every task

- F0–F8 rules still apply ([../007-actions-tab/tasks.md](../007-actions-tab/tasks.md), "Ground
  rules"):
  - use the terms from `wiki/begrippen.md`; every text goes through `t()`;
  - the UI talks to storage only through `app/src/data/repository.ts`;
  - every write runs inside `withStorageErrors()`;
  - a `StorageFullError` is left to the F0 banner; any other error is rethrown.
- **No schema change**: `app/src/data/db.ts` is not edited. The own link is a non-indexed field on
  `Settings` (data-model).
- **The own link is not a Person** (FR-001): it is never compared with `Person.profileUrl`. Pasting
  it creates no Person, Encounter or Action and asks no merge question.
- The clipboard is read **synchronously in the tap handler**, before any `await` (F4 R1).
- My QR shows **no notes, Persons, Actions or Event** (FR-011).
- Exception to "every text via `t()`": the caption `myQr.scanMe` is read from **both** `nl` and
  `en` and always shows both lines (FR-010a, research R8).
- UI tests follow `app/tests/actions-ui.test.tsx` and `app/tests/link-profile-ui.test.tsx`:
  - render `<LanguageProvider><App /></LanguageProvider>`;
  - call `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`;
  - get texts via `nl['…']`;
  - mock the clipboard with `vi.spyOn(navigator.clipboard, 'readText')` (helpers
    `clipboardHolds` / `clipboardRefused`).
  - The My QR tab is reached with `user.click(screen.getByRole('button', { name: nl['tab.myQr'] }))`.
  - Offline tests set `navigator.onLine` as in `app/tests/banners.test.tsx`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F8 baseline is green (290 tests) before changing anything.
- [X] T002 Add the QR library in `app/package.json`: run `npm install uqr@0.1.3 --save-exact` in `app/`. Check that `package.json` lists `"uqr": "0.1.3"` (exact, like the other dependencies), that `package-lock.json` is updated, and that `uqr` brings no other dependencies (research R1).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the own link in storage, the shared paste helper, the texts, and the My QR tab wired to
a new screen.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Add to `Settings` in `app/src/data/types.ts` per [contracts/storage-api.md](contracts/storage-api.md): `/** The owner's own normalized profile link, for My QR (F9, B33). Not a Person. */ ownerProfileUrl?: string`.
- [X] T004 [P] Add the 8 text keys from [contracts/screens.md](contracts/screens.md) "Text keys" to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, word for word, in a `// F9 — My QR` block: `myQr.setupTitle`, `myQr.setupHint`, `myQr.scanMe`, `myQr.change`, `myQr.changed`, `myQr.alt`, `myQr.back`, `offline.showMyQr`. Keep `soon.myQr` for now (removed in T029).
- [X] T005 [P] Create `app/tests/paste-profile-url.test.ts` for `pasteProfileUrl()` per [contracts/storage-api.md](contracts/storage-api.md) "linkedin/pasteProfileUrl.ts". Cover these cases:
  - a profile link with query and trailing slash → `{ ok: true, url: 'https://www.linkedin.com/in/<handle>' }`;
  - `lnkd.in/…` → `{ ok: false, messageKey: 'link.shortLink' }`;
  - a company page or plain text → `'link.invalid'`;
  - `readText` rejected → `'dismissed'`;
  - `navigator.clipboard.readText` missing → `'link.unsupported'`;
  - `readText` is called synchronously when `pasteProfileUrl()` is called, before the returned promise settles.
- [X] T006 [P] Create `app/src/linkedin/pasteProfileUrl.ts` per research R6. Export `PasteProfileUrlResult` and `pasteProfileUrl()`.
  - Call `readClipboardText()` first, synchronously.
  - Then map: `'unsupported'` → `{ ok: false, messageKey: 'link.unsupported' }`; `'dismissed'` → `'dismissed'`.
  - For text, use `normalizeProfileUrl(text)`: reason `shortLink` → `'link.shortLink'`; any other failure → `'link.invalid'`; ok → `{ ok: true, url }`.
  - Make T005 pass.
- [X] T007 Refactor `paste()` in `app/src/ui/ProfileLink.tsx` to use `pasteProfileUrl()`, keeping its behaviour:
  - `'dismissed'` → return;
  - `ok: false` → `setMessage(t(result.messageKey))`;
  - `ok: true` → `linkProfileUrl(person.id, result.url)` as before.
  - `app/tests/link-profile-ui.test.tsx`, `person-detail-ui.test.tsx` and `actions-ui.test.tsx` must stay green, unchanged.
- [X] T008 Create `app/tests/my-qr.test.ts` for `setOwnerProfileUrl` per [contracts/storage-api.md](contracts/storage-api.md):
  - a normalized link is stored, and `getSettings().ownerProfileUrl` returns it with a newer `updatedAt`;
  - a link that is not normalized (`https://linkedin.com/in/Britt/`, `www.linkedin.com/in/britt?x=1`, `not a link`) throws `ValidationError` and stores nothing ("When present it MUST be a normalized profile link: `normalizeProfileUrl(value)` returns exactly `value`");
  - replacing works;
  - it fires `onDataChanged` once;
  - with a Person that has the same `profileUrl`, both stay unchanged and unrelated (`listPersons()` is unchanged, no Dismissal is created).
- [X] T009 Add `setOwnerProfileUrl(url: string): Promise<Settings>` to `app/src/data/repository.ts`, in the Settings section after `updateSettings`.
  - If `normalizeProfileUrl(url)` is not `{ ok: true, url }` with the same `url`, throw `new ValidationError('ownerProfileUrl', 'Not a normalized profile link')`.
  - Otherwise `return updateSettings({ ownerProfileUrl: url })`. That function already uses `withStorageErrors` and sets `updatedAt`.
  - Do not touch Persons.
  - Make T008 pass.
- [X] T010 Create `app/src/ui/MyQrTab.tsx` (props `onBack?: () => void`) and wire it in `app/src/App.tsx`, replacing `<ComingSoon textKey="soon.myQr" />` for tab `myQr`.
  - The component loads `getSettings()` on mount; state `Settings | undefined`, and `undefined` renders `null`. Ignore the result after unmount.
  - It renders `<main className="my-qr">`. When `onBack` is set, a `<button type="button" className="back-button">` with `t('myQr.back')` comes first (existing style).
  - For now the content is a placeholder. US1 and US2 fill in State B and State A.
  - Update `app/tests/tabs-ui.test.tsx`: My QR no longer shows `nl['soon.myQr']`.

**Checkpoint**: storage, paste helper and the empty My QR screen are in place; all earlier tests green.

---

## Phase 3: User Story 1 - Show my QR (Priority: P1) 🎯 MVP

**Goal**: with an own link stored, My QR shows a large QR with the butterfly in the middle and the
caption in both languages; scannable; nothing private. It can also be reached from the offline
start screen (B34).

**Independent Test**: seed `setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')`,
open My QR: an image named `myQr.alt` and both caption lines. `makeQr` output decodes with jsQR
to the exact link.

### Tests for User Story 1

- [X] T011 [P] [US1] Create `app/tests/qr.test.ts` for `makeQr` per research R2 and [contracts/storage-api.md](contracts/storage-api.md) "myQr/qr.ts". Add a test helper `toPixels(qr, scale = 4)`:
  - it returns `{ data: Uint8ClampedArray, width, height }` in RGBA;
  - it adds `QUIET_ZONE` light modules on each side; dark is 0 and light is 255, alpha 255.

  Assert:
  - for 4 links, `jsQR(data, width, height)?.data === url`. Build the links with `normalizeProfileUrl`: `britt-breugelmans`, a 100-character handle, `zoë-de-wit` and a handle with an emoji.
  - `qr.badge.side <= Math.floor(qr.size * 0.22)`, `qr.badge.side > 0`, and the badge is centred (`x === y`, `x * 2 + side === size`, or off by one for parity).
  - every module inside the badge is light.
  - the three finder patterns (7×7 corners) are untouched: compare with `uqr`'s `encode(text, { ecc: 'H', border: 0 }).data`.
- [X] T012 [P] [US1] Create `app/tests/my-qr-ui.test.tsx` with US1 cases, seeding the link with `setOwnerProfileUrl`:
  - My QR shows `getByRole('img', { name: nl['myQr.alt'] })`.
  - Both caption lines are shown: `nl['myQr.scanMe']` and `en['myQr.scanMe']`. They are still both there after switching the app to English.
  - The short link `linkedin.com/in/britt-breugelmans` is shown.
  - With a Person (with a note) and an Event seeded, neither the Person's name, the note nor the Event name appears on My QR (FR-011).
  - The tab bar is visible.
  - "Link aanpassen" (`nl['myQr.change']`) is shown.
- [X] T013 [P] [US1] Extend `app/tests/banners.test.tsx` with the offline cases (B34):
  - Starting offline shows a button `nl['offline.showMyQr']`. Tapping it shows the QR image (link seeded) without a tab bar (`queryByRole('button', { name: nl['tab.contacts'] })` is null) and with a `nl['myQr.back']` button.
  - Back returns to `nl['offline.message']`.
  - Going online while the QR is shown (`navigator.onLine = true` + `window.dispatchEvent(new Event('online'))`) keeps the QR visible, now with the tab bar.
  - Without a stored link, "Show my QR" shows the setup text `nl['myQr.setupTitle']`.

### Implementation for User Story 1

- [X] T014 [US1] Create `app/src/myQr/qr.ts` per research R2 and [contracts/storage-api.md](contracts/storage-api.md):
  - `export const QUIET_ZONE = 4`.
  - `makeQr(text)` calls `encode(text, { ecc: 'H', border: 0 })` from `uqr`. Check in the T011 test that `data.length === size` with `border: 0`.
  - Compute `side = Math.floor(size * 0.22)`, made odd when `size` is odd and even when it is even, so it can be centred. Set `x = y = (size - side) / 2`.
  - Copy `data` into `dark`, with every module inside the badge set to `false`.
  - Return `{ size, dark, badge: { x, y, side } }`.
  - Pure: no DOM. Make T011 pass.
- [X] T015 [US1] Fill State B in `app/src/ui/MyQrTab.tsx` per [contracts/screens.md](contracts/screens.md) "State B" and research R3, when `settings.ownerProfileUrl` is set:
  - `const qr = useMemo(() => makeQr(url), [url])`.
  - Render `<div className="my-qr-panel">` with an `<svg role="img" aria-label={t('myQr.alt')} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">`, where `n = size + 2 * QUIET_ZONE`.
  - Inside the SVG:
    - a `<rect width={n} height={n} fill="#ffffff">`;
    - one `<path fill="#004182">` built as `M{x+q} {y+q}h1v1h-1z` for each dark module;
    - a white `<rect>` with `rx` on the badge, inset by 0.5 module;
    - a nested `<svg x y width height viewBox="0 0 512 512">` with the butterfly shapes from `app/public/icon.svg`: the ellipses in `#0a66c2`, the body and antennae in `#004182`, without the white background rect.
  - Below the panel:
    - `<p className="my-qr-caption"><span lang="nl">{nl['myQr.scanMe']}</span><span lang="en">{en['myQr.scanMe']}</span></p>`;
    - `<p className="my-qr-link">{shortProfileUrl(url)}</p>`;
    - a `<button type="button" className="text-button small">` with `t('myQr.change')` (existing style). It has no handler yet (US3).
    - `<p role="status" className="link-message">`.
  - Make T012 pass.
- [X] T016 [US1] Add the offline entry per research R7 and [contracts/screens.md](contracts/screens.md) "Offline screen". Make T013 pass.
  - In `app/src/ui/Banners.tsx`, `OfflineScreen` gets the prop `onShowMyQr: () => void` and, below the message, `<button type="button" className="secondary">{t('offline.showMyQr')}</button>`.
  - In `app/src/App.tsx`:
    - add state `qrWhileOffline`;
    - `if (offlineAtStart) return qrWhileOffline ? <MyQrTab onBack={() => setQrWhileOffline(false)} /> : <OfflineScreen onShowMyQr={() => setQrWhileOffline(true)} />`;
    - in the `online` effect, when `qrWhileOffline` is true, also `setTab('myQr')` and `setQrWhileOffline(false)`. A due daily choice (F1) or open note step (B18) still comes first, as usual; the test sets `contextChosenOn` to today.
- [X] T017 [US1] Add styles to `app/src/styles.css`:
  - `.my-qr`: column, centred, gap 12 px, padding as other tabs.
  - `.my-qr-panel`: `width: min(86vw, calc(100dvh - 260px))`, `aspect-ratio: 1`, `background: #ffffff` (fixed, also in dark mode), `border-radius: var(--radius)`, a soft shadow; the `svg` inside is 100% × 100%.
  - `.my-qr-caption`: two centred lines, the first `font-weight: 600`.
  - `.my-qr-link`: `color: var(--muted)`, small.
  - `.offline-screen button`: margin-top 16 px.
  - Check in the dev server at 375 × 667 portrait that the panel is ≥ 80% of the width (FR-008), and in landscape that it is fully visible without scrolling.

**Checkpoint**: with a seeded link, the QR works and scans; also from the offline screen. MVP
together with US2.

---

## Phase 4: User Story 2 - Set my own link once (Priority: P1)

**Goal**: without a link, My QR explains how to copy it and offers "Paste LinkedIn link"; a valid
paste stores it and shows the QR.

**Independent Test**: fresh database, open My QR: setup text and button, no QR. Paste
`https://www.linkedin.com/in/Britt-Breugelmans/?utm=x`: the QR appears and
`getSettings().ownerProfileUrl` is `https://www.linkedin.com/in/britt-breugelmans`.

### Tests for User Story 2

- [X] T018 [US2] Extend `app/tests/my-qr-ui.test.tsx` with US2 cases (no link seeded):
  - The setup state shows `nl['myQr.setupTitle']`, `nl['myQr.setupHint']` and a button `nl['link.paste']`. It has no QR image and no `nl['myQr.change']`.
  - A valid paste with extra parameters → the QR image appears, and the stored link is normalized.
  - `lnkd.in/abc` → `nl['link.shortLink']`, nothing stored. A company page → `nl['link.invalid']`.
  - Paste refused → no message, nothing stored.
  - After switching tabs and back, the QR shows without asking again.
  - `listPersons()` is still empty after a valid paste.

### Implementation for User Story 2

- [X] T019 [US2] Fill State A in `app/src/ui/MyQrTab.tsx` per [contracts/screens.md](contracts/screens.md) "State A":
  - a `🦋` (aria-hidden), `<h1>{t('myQr.setupTitle')}</h1>`, `<p className="subtitle">{t('myQr.setupHint')}</p>`, a `<button type="button" className="secondary">` with `t('link.paste')`, and the status line.
  - Add a shared `pasteLink()` in the component. Call `pasteProfileUrl()` synchronously in the click handler. Then:
    - `'dismissed'` → nothing;
    - `ok: false` → `setMessage(t(result.messageKey))`;
    - `ok: true` → `setSettings(await setOwnerProfileUrl(result.url))` and clear the message;
    - catch `StorageFullError` and leave it to the F0 banner; rethrow other errors.
  - Make T018 pass.
- [X] T020 [US2] Add setup styles to `app/src/styles.css`, reusing the `.coming-soon` look (big butterfly, centred text) for `.my-qr` without QR.

**Checkpoint**: MVP complete. The owner can set her link and show her QR.

---

## Phase 5: User Story 3 - Change my link (Priority: P2)

**Goal**: "Change link" under the QR replaces the link only after a valid paste.

**Independent Test**: with a link set, paste another valid link via "Link aanpassen": the stored
link and the short link on screen change, and `myQr.changed` is shown. An invalid paste keeps the old
link.

### Tests for User Story 3

- [X] T021 [US3] Extend `app/tests/my-qr-ui.test.tsx` with US3 cases:
  - Change to `https://www.linkedin.com/in/zoe-de-wit` → the short link shows `linkedin.com/in/zoe-de-wit`, `nl['myQr.changed']` is shown, and the stored link is updated.
  - A company page → `nl['link.invalid']`, and the old link and short link stay.
  - Paste refused → nothing changes.

### Implementation for User Story 3

- [X] T022 [US3] In `app/src/ui/MyQrTab.tsx`, give the "Change link" button the `pasteLink()` handler from T019. After a successful change, set the status line to `t('myQr.changed')`. Failures show the F4 message and keep the stored link (FR-004). Make T021 pass.

**Checkpoint**: a wrong link can always be fixed.

---

## Phase 6: User Story 4 - Screen stays bright (Priority: P2)

**Goal**: while the QR is shown, the screen stays on where iOS allows it; no error anywhere else.

**Independent Test**: with a mocked `navigator.wakeLock`, My QR in State B requests a `'screen'`
lock. Leaving the tab releases it. Hiding and showing the page requests it again. Without
`navigator.wakeLock` nothing breaks.

### Tests for User Story 4

- [X] T023 [P] [US4] Create `app/tests/wake-lock.test.ts` for `useWakeLock` (`renderHook` from Testing Library). Mock `navigator.wakeLock = { request: vi.fn().mockResolvedValue(sentinel) }`, where `sentinel` has `release: vi.fn().mockResolvedValue(undefined)` and `released: false`. Cover these cases:
  - `active` true → `request('screen')` is called once;
  - rerender with `active` false → `sentinel.release()`;
  - unmount → release;
  - `document.visibilityState = 'hidden'` then `'visible'` with a `visibilitychange` event while active → request again;
  - `navigator.wakeLock` undefined → no throw;
  - `request` rejected → no throw, no unhandled rejection;
  - `active` false from the start → no request.
- [X] T024 [P] [US4] Extend `app/tests/my-qr-ui.test.tsx`: with `navigator.wakeLock` mocked, State B (link seeded) calls `request('screen')`, State A (no link) does not, and switching to the Contacts tab releases the lock.

### Implementation for User Story 4

- [X] T025 [US4] Create `app/src/platform/wakeLock.ts` with `useWakeLock(active: boolean): void` per research R4. Make T023 pass.
  - In a `useEffect` on `active`: if it is not active or `navigator.wakeLock` is missing, return.
  - Keep `let sentinel: WakeLockSentinel | undefined` and `let cancelled = false`.
  - `acquire()`: when `document.visibilityState === 'visible'`, call `navigator.wakeLock.request('screen').then((s) => { if (cancelled) void s.release(); else sentinel = s }, () => {})`.
  - Call `acquire()` once and add a `visibilitychange` listener that calls it.
  - Cleanup: set `cancelled = true`, remove the listener, and `void sentinel?.release().catch(() => {})`.
- [X] T026 [US4] In `app/src/ui/MyQrTab.tsx`, call `useWakeLock(Boolean(settings?.ownerProfileUrl))` at the top level of the component, before any early return. Make T024 pass.

**Checkpoint**: all four user stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T027 [P] Check accessibility in `app/src/ui/MyQrTab.tsx`. The QR image has its name. The caption spans carry `lang`. "Change link" and "Back" are real buttons with a visible focus style. The butterfly emoji in State A is `aria-hidden`. *(2026-10-12: buttons keep the browser's focus ring; State B got a visually hidden `<h1>` with `tab.myQr`, since it has no visible heading.)*
- [X] T028 Run `npm run typecheck`, `npm test` and `npm run build` in `app/`. Note the test count (was 290) and the JS bundle size before and after (research R9: `uqr` adds only a few kB). Check that `app/package.json` has exactly one new dependency (`uqr` 0.1.3), and that My QR makes no network request (no `fetch` or external URL in `myQr/`, `MyQrTab.tsx`, `wakeLock.ts`). *(2026-10-12: 344 tests green (was 290), build OK. Main bundle 125.3 kB gzip; the last F8 build was 119.0 kB, so +6.4 kB, in line with `uqr` (7.8 kB gzip unminified). One new dependency; no network use in the new files.)*
- [X] T029 Remove the now unused `soon.myQr` key from `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`, and narrow `textKey` in `app/src/ui/ComingSoon.tsx` to `'soon.settings'`.
- [X] T030 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T031 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–7 (manual, Britt): note the iOS version, scan 10 times with a second phone (camera app + LinkedIn app), test Auto-Lock at 30 s, and start offline in airplane mode. *(2026-10-12: QR shows on the iPhone (Britt); scanning with a second phone and a full test by someone else still to do.)*
- [ ] T032 Tick the F9 items in `specs/features.md` and add a line to `wiki/log.md`, per CLAUDE.md. If the iPhone runs iOS older than 18.4, note in the log that "screen stays on" waits for an iOS update.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)**: depends on Foundational. Its tests seed the link through the repository, so
  they do not need US2.
- **US2 (Phase 4)**: depends on Foundational and on T015 (State B is where a valid paste lands).
- **US3 (Phase 5)**: depends on US1 (the button) and US2 (`pasteLink()`).
- **US4 (Phase 6)**: the hook (T023, T025) depends only on Setup and can start right after Phase 1.
  Wiring it in (T024, T026) needs T015.
- **Polish (Phase 7)**: after all stories.

### Within Each Story

- Tests first; they should fail before the implementation.
- These files are shared, so their tasks run one at a time:
  - `MyQrTab.tsx`: T010, T015, T019, T022, T026, T027;
  - `App.tsx`: T010, T016;
  - `styles.css`: T017, T020;
  - `my-qr-ui.test.tsx`: T012, T018, T021, T024;
  - `nl.ts`/`en.ts`: T004, T029.

### Parallel Opportunities

- Foundational: T003, T004, T005, T006 together. Then T007 (after T006), and T008 → T009 (after
  T003), then T010.
- US1: T011, T012 and T013 together (three different test files); T014 alongside T012/T013.
- US4's hook (T023 + T025) alongside US1–US3 (own files).

## Parallel Example: Foundational

```text
Task: "T003 Add Settings.ownerProfileUrl to app/src/data/types.ts"
Task: "T004 Add the 8 F9 text keys to nl.ts and en.ts"
Task: "T005 Create app/tests/paste-profile-url.test.ts"
Task: "T006 Create app/src/linkedin/pasteProfileUrl.ts"
```

## Parallel Example: User Story 1

```text
Task: "T011 Create app/tests/qr.test.ts (decode with jsQR)"
Task: "T012 Create app/tests/my-qr-ui.test.tsx (US1 cases)"
Task: "T013 Extend app/tests/banners.test.tsx (offline Show my QR)"
Task: "T014 Create app/src/myQr/qr.ts"
```

## Implementation Strategy

### MVP (User Stories 1–2)

1. Phase 1 → Phase 2 → US1 → US2.
2. **Stop and validate**: quickstart sections 2, 3 and 6 on the iPhone: set the link, scan 10/10,
   start offline. This is already the whole showcase moment (B10) and can be pushed.

### Incremental Delivery

1. Foundational + US1 + US2 → push (set the link and show the QR, also offline).
2. US3 → push (change the link).
3. US4 → push (screen stays on).
4. Polish: unused key, full quickstart, features list, wiki log.
