---

description: "Task list for F0 — App Foundation"
---

# Tasks: F0 — App Foundation

**Input**: Design documents from `specs/001-app-foundation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included, because the plan and research R9 choose Vitest, React Testing Library and
fake-indexeddb. iOS behaviour is checked by hand with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story so each story can be built and tested on its
own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)
- All source paths are under `app/` (the Cloudflare Pages root directory, see plan.md)

## Ground rules for every task

- Use terms from `wiki/begrippen.md` (Person, Encounter, Event, `activeEvent`, `note`,
  `profileUrl`, `searchUrl`, `connectionStatus`).
- No hard-coded user-facing text: every string goes through `t()` and exists in `nl.ts` and
  `en.ts` ([contracts/i18n.md](contracts/i18n.md)).
- UI code never touches the database directly; it only uses `app/src/data/repository.ts`
  ([contracts/storage-api.md](contracts/storage-api.md)).
- No network calls with personal data, no analytics, no third-party scripts (FR-008).
- **Do not push to `main` until T022 (Rollout).** The live address must keep the placeholder
  until then.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Vite + React + TypeScript project in `app/` with pinned versions.

- [X] T001 Create a Vite React TypeScript project in `app/` (template `react-ts`), replacing the placeholder `app/index.html`. Keep `<html lang="nl">` and `<title>De Sociale Vlinder</title>`. In `app/package.json` set `"name": "social-butterfly"`, `"version": "0.1.0"`, `"private": true` and scripts `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`), `typecheck` (`tsc -b`; the tsconfigs already set `noEmit`), `test` (`vitest run`). Do not push yet.
- [X] T002 Create `app/.nvmrc` with the exact Node 24 version used locally (output of `node -v`, e.g. `24.x.y` without the `v`). Add `"engines": { "node": ">=24 <25" }` to `app/package.json`. Record the exact version for T022 (`NODE_VERSION`), per wiki T13.
- [X] T003 Create `app/.npmrc` with `save-exact=true`, then install exact versions: dependencies `react`, `react-dom` (19), `dexie` (4); devDependencies `typescript` (5), `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fake-indexeddb`. Commit `app/package-lock.json`.
- [X] T004 [P] Set strict TypeScript in `app/tsconfig.app.json` (`"strict": true`, `"noUncheckedIndexedAccess": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`) and add `"types": ["vite/client", "vite-plugin-pwa/client"]`.
- [X] T005 [P] Configure Vitest in `app/vite.config.ts` (`test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] }`) and create `app/tests/setup.ts` importing `fake-indexeddb/auto` and `@testing-library/jest-dom/vitest`.
- [X] T006 [P] Create `app/.gitignore` with `node_modules/`, `dist/`, `dev-dist/`, `coverage/`.
- [X] T007 In `app/vite.config.ts`, expose the app version: read `version` from `app/package.json` and add `define: { __APP_VERSION__: JSON.stringify(version) }`; declare `declare const __APP_VERSION__: string` in `app/src/vite-env.d.ts`.

**Checkpoint**: `npm run dev`, `npm run typecheck` and `npm test` (no tests yet) run in `app/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data types, database schema, settings storage and the language core. Every user
story needs these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 [P] Define entity types in `app/src/data/types.ts` per [data-model.md](data-model.md): common fields `id` (UUID v4), `createdAt`, `updatedAt` (ISO 8601 UTC strings); `Person` { `name`: string, `company?`: string, `profileUrl?`: string, `searchUrl?`: string, `connectionStatus`: `'notConnected' | 'connected'` }; `Encounter` { `personId`: string, `eventId?`: string, `date`: string (ISO date `YYYY-MM-DD`), `note?`: string }; `Event` { `name`: string, `startDate`: string, `endDate`: string }; `Settings` { `key`: `'settings'`, `language`: `'nl' | 'en'`, `activeEventId?`: string, `lastBackupAt?`: string, `updatedAt`: string }. No email or phone fields (FR-014).
- [X] T009 [P] Define error classes in `app/src/data/errors.ts`: `ValidationError` (with a `field` property), `DuplicateProfileUrlError` (carries `existingPersonId`), `EventInUseError`, `StorageFullError`, per [contracts/storage-api.md](contracts/storage-api.md) "Errors".
- [X] T010 Create the Dexie database in `app/src/data/db.ts`: database name `sociale-vlinder`, schema **version 1** with stores `persons: 'id, &profileUrl, name'`, `encounters: 'id, personId, eventId, date'`, `events: 'id, startDate'`, `settings: 'key'` (single record with key `settings`). Export typed tables with `EntityTable`. Add a comment that every later schema change adds a new version with an upgrade step that carries data over (FR-009).
- [X] T011 Create helpers in `app/src/data/repository.ts`: `newId()` using `crypto.randomUUID()`, `nowIso()` returning `new Date().toISOString()`, and a `withStorageErrors()` wrapper that maps `QuotaExceededError` (also when nested in a Dexie error) to `StorageFullError`, and then calls every listener registered with `onStorageFull(listener)` (export both from this file). Then implement `getSettings()` (returns defaults `{ language: 'nl' }` if never saved) and `updateSettings(changes)` (merges, sets `updatedAt`), per the contract's "Settings" section.
- [X] T012 [P] Create the source dictionary `app/src/i18n/nl.ts` as a flat `as const` object with keys `app.title` = "De Sociale Vlinder" and `app.languageSwitch`. Create `app/src/i18n/en.ts` typed as `Record<keyof typeof nl, string>` (a missing key must be a compile error, FR-015) with `app.title` = "The Social Butterfly".
- [X] T013 Create `app/src/i18n/LanguageProvider.tsx` exposing `useLanguage(): { language, setLanguage, t }` per [contracts/i18n.md](contracts/i18n.md). `t(key, params?)` replaces `{name}` placeholders. In this phase `setLanguage` only updates React state; default language is `nl`. Also set `document.documentElement.lang` to the current language.
- [X] T014 Create the app shell: `app/src/main.tsx` renders `<LanguageProvider><App /></LanguageProvider>`; `app/src/App.tsx` renders `app/src/ui/StartScreen.tsx`, which shows `t('app.title')` and a small version label `v{__APP_VERSION__}` at the bottom.

**Checkpoint**: The app runs locally and shows "De Sociale Vlinder" plus the version label.

---

## Phase 3: User Story 1 - Open and install the app (Priority: P1) 🎯 MVP

**Goal**: The app is live at `https://socialbutterfly2.pages.dev/`, installs from Safari to
the home screen as "SB", and opens full screen. It shows a friendly message without internet.

**Independent Test**: [quickstart.md](quickstart.md) section 2 on the iPhone over mobile data,
plus the "No internet" and "Safari tab" rows in section 6.

### Tests for User Story 1

- [X] T015 [P] [US1] Write `app/tests/banners.test.tsx`: the install hint (`install.hint`) shows when `isStandalone()` returns false and is absent when it returns true; the full-screen offline message (`offline.message`) shows when the app starts with `navigator.onLine === false` and disappears after an `online` event; when the connection drops after start (an `offline` event), only the banner `offline.banner` shows and the start screen stays visible. Mock `app/src/platform/standalone.ts`.

### Implementation for User Story 1

- [X] T016 [P] [US1] Create `app/src/platform/standalone.ts` with `isStandalone()`: true when `matchMedia('(display-mode: standalone)').matches` or `navigator.standalone === true` (research R3).
- [X] T017 [P] [US1] Create `app/src/platform/online.ts` with a `useOnline()` hook based on `navigator.onLine` and the `online`/`offline` window events (research R4).
- [X] T018 [US1] Add keys `install.hint`, `offline.message` and `offline.banner` to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts` (short, friendly tone per `wiki/merk-en-stijl.md`). Create `app/src/ui/Banners.tsx`: when the app starts offline, show a full-screen friendly "needs internet" screen (`offline.message`); when the connection drops while the app is open, show a non-blocking banner (`offline.banner`) and keep the app usable (FR-005); in a Safari tab, show a non-blocking "Add to Home Screen" hint above the start screen. Render it from `app/src/App.tsx`.
- [X] T019 [US1] Configure PWA and icons:
  - Create a placeholder butterfly icon `app/public/icon.svg` (LinkedIn-like blue on white, **no LinkedIn logo or trademarks**, FR-003).
  - Add `app/pwa-assets.config.ts` for `@vite-pwa/assets-generator` (preset `minimal-2023`, script `npm run generate-pwa-assets`). It generates, next to the SVG, its fixed file names: `apple-touch-icon-180x180.png`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` and `favicon.ico`.
  - In `app/vite.config.ts`, add `VitePWA` with `registerType: 'autoUpdate'`, `injectRegister: false`, `workbox: { globPatterns: ['**/*.{js,css,html,svg,png}'] }` (app shell only, never personal data). Set the manifest per [contracts/hosting.md](contracts/hosting.md): `name: 'De Sociale Vlinder'`, `short_name: 'SB'`, `display: 'standalone'`, `start_url: '/'`, `scope: '/'`, `lang: 'nl'`, `theme_color` LinkedIn-like blue, `background_color: '#ffffff'`, icons `pwa-192x192.png`, `pwa-512x512.png` and `maskable-icon-512x512.png` (purpose `maskable`).
- [X] T020 [US1] In `app/index.html` add `<meta name="apple-mobile-web-app-title" content="SB">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="theme-color" ...>`, `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`, and `viewport-fit=cover` in the viewport meta. In `app/src/main.tsx` call `registerSW({ immediate: true })` from `virtual:pwa-register`, so updates apply on the next launch without reinstalling (FR-009).
- [X] T021 [P] [US1] Create `app/public/_headers` with exactly the headers from [contracts/hosting.md](contracts/hosting.md): `Content-Security-Policy: default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`. Run `npm run build && npm run preview` and confirm in the browser console that the app loads with no CSP errors. *(2026-10-08: checked in the build output only: `dist/index.html` loads one same-origin module script and no inline script; `vite preview` does not apply `_headers`. The browser check happens on the live site in T023.)*
- [X] T022 [US1] **Rollout** (plan.md "Rollout"; manual, Britt): run `npm run typecheck && npm test && npm run build` in `app/`. Then, right before the first push that contains `app/package.json`, set in Cloudflare Pages: root directory `app`, build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION` = the value in `app/.nvmrc`; Web Analytics off. Push to `main` with nothing pushed in between. If the build fails, the placeholder stays online; fix and push again.
- [X] T023 [US1] Validate on the iPhone with [quickstart.md](quickstart.md) section 2 (install under 1 minute, label "SB", full screen, start screen within 3 s on mobile data) and the "No internet" and "Safari tab" rows of section 6.

**Checkpoint**: User Story 1 works on the iPhone. This is the MVP.

---

## Phase 4: User Story 2 - Data stays on the device (Priority: P1)

**Goal**: Persons, Encounters, Events and Settings are stored only on the device, survive
close, restart and updates, and iOS is asked to keep them permanently.

**Independent Test**: [quickstart.md](quickstart.md) sections 3 and 4 on the iPhone (test data
via Diagnostics), plus `npm test`.

### Tests for User Story 2

- [X] T024 [P] [US2] Write `app/tests/repository.test.ts` (fake-indexeddb, fresh database per test) covering:
  - `id` is a UUID; `createdAt` and `updatedAt` are set on create, and only `updatedAt` changes on update.
  - Person: `name` is "Trimmed, not empty"; `company` empty → `undefined`; `profileUrl === ''` → `ValidationError`; neither `profileUrl` nor `searchUrl` → `ValidationError`; a second Person with the same `profileUrl` → `DuplicateProfileUrlError` carrying the first Person's `id`; several Persons without `profileUrl` are allowed; a non-normalized `profileUrl` is rejected with `ValidationError` (`https://www.linkedin.com/in/britt/` with a trailing slash, and `https://linkedin.com/in/britt?trk=qr` without `www.` and with a query string), while `https://www.linkedin.com/in/britt-breugelmans` is accepted; `connectionStatus` defaults to `'notConnected'`.
  - Encounter: unknown `personId` or `eventId` → `ValidationError`; no `eventId` is allowed (casual networking); `date` must be `YYYY-MM-DD`.
  - Event: `endDate` "MUST NOT be before `startDate`; MAY equal it"; empty name → `ValidationError`.
  - `deletePerson` also deletes its Encounters in one transaction; `deleteEvent` with Encounters → `EventInUseError`.
  - `listCasualEncounters`, `countEncountersSince(undefined)` counts all, `countEncountersSince(iso)` counts `createdAt > iso`.
  - `getSettings()` returns `{ language: 'nl' }` defaults.
- [X] T025 [P] [US2] Write `app/tests/persistence.test.ts`: `requestPersistentStorage()` returns `'persisted'` when `navigator.storage.persist` resolves true, `'not-persisted'` when false, `'unsupported'` when `navigator.storage` or `persist` is missing.

### Implementation for User Story 2

- [X] T026 [US2] Implement the Persons part of `app/src/data/repository.ts` per [contracts/storage-api.md](contracts/storage-api.md): `createPerson`, `updatePerson`, `getPerson`, `findPersonByProfileUrl`, `listPersons`, `deletePerson`. Rules from data-model.md: `name` "Trimmed, not empty"; `company` "Optional … Trimmed; empty → `undefined`"; `profileUrl` "**Unique** when present … Never `''`" (catch Dexie `ConstraintError` → `DuplicateProfileUrlError` with the existing Person's `id`); reject a `profileUrl` that is not in normalized form with `ValidationError`: "it must start with `https://www.linkedin.com/in/`, have exactly one path segment after `/in/`, and have no query string, no fragment and no trailing slash" (normalizing input is done in F4/F5, not here); "At least one of `profileUrl` or `searchUrl` MUST be present"; `connectionStatus` "Default `'notConnected'`". `deletePerson` deletes the Person and its Encounters in one `db.transaction('rw', …)`. All writes go through `withStorageErrors()`.
- [X] T027 [US2] Implement the Encounters part of `app/src/data/repository.ts`: `createEncounter` (`personId` "Must reference an existing Person"; `eventId` "References an existing Event, or absent for casual networking"; `date` ISO `YYYY-MM-DD`), `updateEncounter` (note, date), `listEncountersByPerson` (newest first), `listEncountersByEvent`, `listCasualEncounters` (Encounters without `eventId`; filter, since missing values are not indexed), `countEncountersSince(isoTime | undefined)`, `deleteEncounter`.
- [X] T028 [US2] Implement the Events part of `app/src/data/repository.ts`: `createEvent` and `updateEvent` (`name` "Trimmed, not empty"; `startDate`/`endDate` ISO dates; `endDate` "MUST NOT be before `startDate`; MAY equal it", FR-018), `listEvents` (newest `startDate` first), `deleteEvent` (rejects with `EventInUseError` if Encounters exist). Make T024 pass.
- [X] T029 [US2] Create `app/src/platform/persistence.ts` with `requestPersistentStorage(): Promise<'persisted' | 'not-persisted' | 'unsupported'>`: call `navigator.storage.persist()` and then `navigator.storage.persisted()` (research R2). Call it on **every** app start from `app/src/App.tsx` and keep the result in state. Make T025 pass.
- [X] T030 [US2] Add keys `storage.notPersisted` and `storage.full` to `app/src/i18n/nl.ts` and `app/src/i18n/en.ts`. In `app/src/ui/Banners.tsx`, show a persistent, non-blocking warning when the status is `'not-persisted'` or `'unsupported'`: data may be deleted by iOS and a CSV backup (F10) is advised (FR-007). Also subscribe with `onStorageFull` and show a dismissible `storage.full` banner whenever any write fails because the device is full (spec edge case "Device storage full").
- [X] T031 [US2] Create `app/src/ui/Diagnostics.tsx`, opened by long-pressing (≈600 ms) the version label on `app/src/ui/StartScreen.tsx` (plan "Complexity Tracking"). It shows: storage status from T029, app version, and counts of Persons, Encounters and Events. Buttons:
  - **Add test data**: 1 Person `[test] Vlinder` with a `searchUrl`, plus 3 Encounters: one at a one-day Event `[test] One-day` (start = end), one at a multi-day Event `[test] Multi-day` (end = start + 2 days), and one casual (no Event).
  - **Remove test data**: delete Persons named `[test] …` (Encounters cascade), then Events named `[test] …`.
  Show `storage.full` if a `StorageFullError` occurs. Add all labels as i18n keys (`diagnostics.*`) in both dictionaries.
- [X] T032 [US2] Validate on the iPhone with [quickstart.md](quickstart.md) section 3 (persistent status, add test data, close, restart, update via a pushed text change, remove test data) and section 4 (Safari Web Inspector: only requests to `socialbutterfly2.pages.dev`, no personal data). Write the observed `persisted()` result on the iPhone into [research.md](research.md) R2.

**Checkpoint**: User Stories 1 and 2 both work; data survives close, restart and update.

---

## Phase 5: User Story 3 - Basic Dutch/English language switch (Priority: P2)

**Goal**: The owner switches between Dutch and English; all visible text changes at once and
the choice is remembered.

**Independent Test**: [quickstart.md](quickstart.md) section 5, plus `npm test`.

### Tests for User Story 3

- [X] T033 [P] [US3] Write `app/tests/i18n.test.tsx`: the start screen shows "De Sociale Vlinder" by default; after switching to English it shows "The Social Butterfly" without reload, and banner texts change too; after unmounting and mounting again, the stored language is English (`getSettings().language === 'en'`); `document.documentElement.lang` follows the language; when `updateSettings` rejects with `StorageFullError`, the `storage.full` banner is visible and the text stays in the chosen language.

### Implementation for User Story 3

- [X] T034 [US3] Extend `app/src/i18n/LanguageProvider.tsx`: on mount, load `language` from `getSettings()`; `setLanguage` updates state immediately and saves through `updateSettings({ language })` (FR-016). If saving fails with `StorageFullError`, keep the chosen language for this session; the banner from T030 appears. Until settings are loaded, use `nl`.
- [X] T035 [US3] Add an NL/EN switch to `app/src/ui/StartScreen.tsx` (label from `app.languageSwitch`, two clear options "NL" and "EN", large enough to tap). Make T033 pass.
- [X] T036 [US3] Check that every visible text in `app/src/ui/StartScreen.tsx`, `app/src/ui/Banners.tsx` and `app/src/ui/Diagnostics.tsx` comes from `t()`: search `app/src/ui/` for string literals inside JSX and move any you find into both dictionaries.
- [X] T037 [US3] Validate on the iPhone with [quickstart.md](quickstart.md) section 5.

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T038 [P] Run `npm run typecheck`, `npm test` and `npm run build` in `app/`. Check the gzipped size of the main JS bundle in the build output and note it in `specs/001-app-foundation/research.md` R4 (supports SC-002, 3 s on mobile data).
- [X] T039 Run the full [quickstart.md](quickstart.md) once more on the iPhone, including all rows of section 6 (no internet, Safari tab, someone else, cost €0 in the Cloudflare dashboard).
- [X] T040 [P] Replace the one-line `README.md` at the repository root with: what the app is, the live address `https://socialbutterfly2.pages.dev/`, how to run it locally (`cd app`, `nvm use`, `npm install`, `npm run dev`), and links to `CLAUDE.md`, `wiki/` and `specs/`.
- [X] T041 Tick the finished F0 items in `specs/features.md` (online at own URL, installable on iPhone, data model, data stays local, NL/EN basis) and add a line to `wiki/log.md` (date, "F0 implemented", what changed), per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; blocks all user stories.
- **US1 (Phase 3)**: depends on Foundational. T022 (Rollout) is the first push to `main`.
- **US2 (Phase 4)**: depends on Foundational. Its iPhone check (T032) needs the app online,
  so it runs after T022.
- **US3 (Phase 5)**: depends on Foundational (`getSettings`/`updateSettings` and `onStorageFull`
  from T011). The storage-full case in T033 also needs the banner from T030 (US2). Its iPhone
  check (T037) runs after T022.
- **Polish (Phase 6)**: after the stories you want to ship.

### Within Each Story

- Tests first; they should fail before the implementation.
- `repository.ts` tasks (T011, T026, T027, T028) edit the same file: do them in order.
- `nl.ts`/`en.ts` and `Banners.tsx` are shared: tasks touching them (T018, T030, T031, T036)
  run one at a time.

### Parallel Opportunities

- Setup: T004, T005 and T006 together after T003.
- Foundational: T008, T009 and T012 together; then T010 → T011, and T013 → T014.
- US1: T015, T016, T017 and T021 together.
- US2: T024 and T025 together, then T026 → T027 → T028; T029 can run alongside T026–T028.
- US3: T033 alongside US2 implementation (different files).
- Polish: T038 and T040 together.

## Parallel Example: User Story 1

```text
Task: "T015 [US1] Write app/tests/banners.test.tsx"
Task: "T016 [US1] Create app/src/platform/standalone.ts"
Task: "T017 [US1] Create app/src/platform/online.ts"
Task: "T021 [US1] Create app/public/_headers"
```

## Parallel Example: User Story 2

```text
Task: "T024 [US2] Write app/tests/repository.test.ts"
Task: "T025 [US2] Write app/tests/persistence.test.ts"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 US1, including the Rollout (T022).
3. **Stop and validate** on the iPhone (T023). The real app replaces the placeholder.

### Incremental Delivery

1. US1 → live and installable (MVP).
2. US2 → data layer and Diagnostics; validate persistence on the iPhone.
3. US3 → language switch.
4. Polish → full quickstart, README, features list and wiki log.

Each push to `main` after T022 deploys automatically. A failed build leaves the previous
version online.
