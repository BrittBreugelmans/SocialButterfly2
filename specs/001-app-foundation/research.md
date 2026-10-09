# Research: F0 — App Foundation

**Date**: 2026-10-08 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Hosting and stack were decided by Britt in clarify (wiki decisions T7–T10). This file records
the facts behind the remaining technical choices. Facts were checked against WebKit, Apple,
MDN, Cloudflare, Dexie and vite-plugin-pwa documentation in October 2026.

## R1. Local database

- **Decision**: IndexedDB through **Dexie 4** (typed tables, schema versions, unique indexes).
- **Rationale**: IndexedDB is the only durable, large on-device store in Safari. Dexie gives
  typed access and versioned schema upgrades, which later features and sync need (FR-009,
  FR-013). A unique index `&profileUrl` enforces FR-012. Records without `profileUrl` are
  allowed, several at once, because missing values are not indexed.
- **Rule that follows**: never store `profileUrl` as `''`. An empty string is a valid key and
  would clash. Missing means `undefined`.
- **Alternatives considered**: `localStorage` (small, synchronous, string only, no indexes);
  raw IndexedDB (verbose, error-prone); `idb` (thinner, no schema versioning helpers).

## R2. Keeping data on iOS (T9)

- **Decision**: call `navigator.storage.persist()` on every app start and read
  `navigator.storage.persisted()`. If it returns `false` (or the API is missing), show a
  persistent warning banner (FR-007).
- **Facts**:
  - The API exists since iOS 17. WebKit grants it by heuristics, including "opened as a Home
    Screen Web App". Being granted automatically is **not** documented, so it must be tested
    on the device.
  - Home-screen apps are exempt from Safari's 7-day deletion of site data.
  - iOS can still evict data of non-persistent origins when the device is low on storage.
  - Removing the home-screen icon deletes the app's data (widely reported, not documented by
    Apple).
- **Alternatives considered**: no request (B in clarify) and an automatic second copy
  (C in clarify), both rejected by Britt.
- **Observed on Britt's iPhone (2026-10-08)**: quickstart checks passed (install, data kept
  after close/restart/update). The exact `persisted()` result shown in Diagnostics is not yet
  noted here.

## R3. Safari tab vs installed app

- **Fact**: home-screen web apps have their own storage, separate from Safari tabs. Since
  iOS 26, every site added to the home screen opens as a web app by default.
- **Decision**: detect standalone mode (`display-mode: standalone` or `navigator.standalone`).
  In a Safari tab, show a short "Add to Home Screen" guide above the app, so data does not end
  up in the wrong place.

## R4. Offline message and updates (FR-005, FR-009)

- **Facts**:
  - Without a service worker, an offline launch shows iOS's own error page.
  - vite-plugin-pwa with `registerType: 'autoUpdate'` activates a new service worker at once.
    The page reloads itself only when `registerSW({ immediate: true })` is called.
  - iOS often resumes a suspended app without reloading it, so an update usually lands on the
    next real launch.
- **Decision**: **vite-plugin-pwa** (`generateSW`, `autoUpdate`, `registerSW({ immediate: true })`),
  which precaches only the app shell.
  - When the app starts without a connection, the app shell loads and shows a friendly
    full-screen "needs internet" message. If the connection drops while the app is open, a
    non-blocking banner appears and the app stays usable (FR-005). Both use `navigator.onLine`
    and the `online`/`offline` events.
  - Updates are applied without reinstalling. Data is untouched, because it lives in IndexedDB
    and not in the cache.
- **Note**: the precached app shell is a side effect, not offline support. Offline use stays
  out of scope (constitution IV).
- **Measured (2026-10-08, first build)**: main JS bundle 332 kB, **105 kB gzipped** (React,
  Dexie, app); CSS 1 kB gzipped; precache 18 entries (343 KiB). That is well within SC-002
  (3 s on mobile data); confirm on the iPhone in T023.

## R5. Language (FR-015, FR-016)

- **Decision**: own typed dictionaries (`nl.ts`, `en.ts`) plus a small React context. No
  library.
- **Rationale**: the English dictionary is typed from the Dutch one's keys, so a missing
  translation is a **compile error**, which makes FR-015 checkable by the build. That is YAGNI
  compared with a library for two languages and a few dozen strings.
- **Alternatives considered**: `react-i18next` (more than needed), browser language detection
  (Dutch is the default per the spec until open question #8).

## R6. Identity and timestamps (FR-013)

- **Decision**: `crypto.randomUUID()` (iOS 15.4+, HTTPS only) for every `id`; `createdAt` and
  `updatedAt` as ISO 8601 UTC strings, set by the repository layer, never by the UI.
- **Rationale**: UUIDs are unique across devices, so a later sync can merge records without
  renumbering.
- **Not now (YAGNI)**: tombstones for deleted records. Adding a `deletedAt` later is a schema
  version upgrade, not a rewrite.

## R7. Hosting on Cloudflare Pages (T7)

- **Facts**:
  - Pages is still supported, with no end date. Cloudflare's new work goes into Workers static
    assets, and a migration guide exists.
  - Free plan: 500 builds per month and one build at a time.
  - A "Root directory" setting allows building from the `app/` subfolder.
  - A `_headers` file in the build output sets HTTP headers.
  - Web Analytics is off unless you enable it.
- **Decision**:
  - Connect the GitHub repo `BrittBreugelmans/SocialButterfly2`. Root directory `app`, build
    `npm run build`, output `dist`.
  - Production branch `main`; preview builds for other branches.
  - Leave Web Analytics **off**.
  - Ship a `_headers` file with a strict Content-Security-Policy (`connect-src 'self'`), so the
    browser itself blocks sending data elsewhere (FR-008).
- **Risk**: if Cloudflare ever retires Pages, moving to Workers static assets keeps the same
  build output.

## R8. Home-screen name and icon (FR-003)

- **Facts**:
  - iOS prefers `apple-touch-icon` (180×180) over manifest icons.
  - The label comes from `apple-mobile-web-app-title` or the manifest `short_name`.
  - Only about 12–13 characters are visible, so "De Sociale Vlinder" (18) will be cut off as
    "De Sociale V…".
  - The owner can edit the name in the Add sheet.
- **Decision**: ship an `apple-touch-icon` and manifest icons with a placeholder butterfly
  (final design in F11).
  - Home-screen label: **"SB"** (`apple-mobile-web-app-title` and `short_name`), chosen by
    Britt on 2026-10-08.
  - Inside the app, the name follows the language: "De Sociale Vlinder" or "The Social
    Butterfly".

## R9. Testing

- **Decision**:
  - **Vitest** for unit and integration tests, with **fake-indexeddb** for repository tests.
  - **React Testing Library** for the language switch and banners.
  - **Manual checks on Britt's iPhone** for install, persistence, restart and update, following
    [quickstart.md](quickstart.md).
- **Rationale**: the risky behaviour (iOS storage and installation) cannot be simulated
  faithfully, so it is checked on the real device. Everything else is automated.
- **Alternatives considered**: Playwright WebKit end-to-end tests. Not worth it for F0; may
  return when flows exist (F2+).
