# Implementation Plan: F0 — App Foundation

**Branch**: `001-app-foundation` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-app-foundation/spec.md`

## Summary

Build the foundation every later feature stands on.

- **Hosting and installation:** a React + TypeScript app built with Vite, hosted on Cloudflare
  Pages at `https://socialbutterfly2.pages.dev/`, installable on the iPhone home screen as a full-screen
  web app.
- **Data on the device:** all data lives in an IndexedDB database on the device (Dexie). The
  app asks iOS to keep it permanently and warns when iOS refuses.
- **Rules for later features:** a typed storage API and typed NL/EN dictionaries fix how
  F1–F11 read data and show text.
- **Privacy:** a strict Content-Security-Policy makes "no personal data leaves the device"
  something the browser enforces.

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24, exact version pinned in `app/.nvmrc` and in Cloudflare `NODE_VERSION` (wiki T13)

**Primary Dependencies**: React 19, Vite, vite-plugin-pwa, Dexie 4; dev: @vite-pwa/assets-generator, Vitest, React Testing Library, fake-indexeddb (exact versions in `app/package.json`)

**Storage**: IndexedDB on the device via Dexie; no server storage

**Testing**: Vitest, React Testing Library, fake-indexeddb; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ Safari, installed as a home-screen web app; desktop browsers for development only

**Project Type**: client-only web app (PWA), static hosting

**Performance Goals**: start screen usable within 3 s from the icon on mobile data (SC-002)

**Constraints**: €0 per month; no personal data over the network; internet assumed (offline not required); data survives updates

**Scale/Scope**: 1 user, 1 device; at most a few thousand Persons and Encounters

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | F0 makes no LinkedIn calls. Opening LinkedIn later is navigation, which the CSP allows (`contracts/hosting.md`). |
| II | Zero Cost | ✅ Pass | Free Cloudflare Pages plan and open-source libraries; Web Analytics off. |
| III | Installable iPhone Web App | ✅ Pass | Manifest, `apple-touch-icon`, standalone display; no native build. |
| IV | Online App, Local Data, Sync-Ready | ✅ Pass | IndexedDB only; CSP `connect-src 'self'`; UUIDs plus `createdAt`/`updatedAt`; versioned schema. |
| V | LinkedIn-Only Identity | ✅ Pass | Unique `&profileUrl`; Person needs `profileUrl` or `searchUrl`; no email/phone fields. |
| VI | Privacy | ✅ Pass | No network writes; CSP enforced. Export/delete screens are F10, and the storage API already supports delete. |
| VII | Bilingual | ✅ Pass | Typed NL/EN dictionaries; a missing translation fails the build. |
| VIII | Speed in the Moment | ✅ Pass | Small app shell, precached by the service worker; the warning banner never blocks input. |
| IX | No Lost Contacts | ✅ Pass | Persistent storage request plus warning; atomic deletes; Event delete refused while in use; storage-full error leaves data intact. |
| X | Own Brand, Only v1 | ✅ Pass | Placeholder butterfly icon, no LinkedIn logo; no feature beyond F0. Diagnostics panel justified below. |

**Post-design re-check (after Phase 1)**: still all pass. No violations, so Complexity Tracking
only records one deliberate addition.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-foundation/
├── plan.md              # This file
├── research.md          # Phase 0: facts and decisions R1–R9
├── data-model.md        # Phase 1: entities, indexes, rules
├── quickstart.md        # Phase 1: validation on laptop and iPhone
├── contracts/
│   ├── storage-api.md   # API later features use for data
│   ├── i18n.md          # How text is shown in NL/EN
│   └── hosting.md       # Cloudflare Pages, headers, manifest, service worker
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
app/                         # Cloudflare Pages root directory
├── index.html               # replaces the current placeholder page
├── package.json
├── .npmrc                   # save-exact=true
├── pwa-assets.config.ts     # icon generator (npm run generate-pwa-assets)
├── .nvmrc                   # exact Node 24 version (= Cloudflare NODE_VERSION)
├── vite.config.ts           # React + vite-plugin-pwa (manifest, service worker)
├── tsconfig.json            # strict
├── public/
│   ├── _headers             # CSP and other headers
│   ├── icon.svg             # placeholder butterfly (source for the icons)
│   └── *.png, favicon.ico   # generated: apple-touch-icon-180x180, pwa-*, maskable-icon-512x512
├── src/
│   ├── main.tsx
│   ├── styles.css
│   ├── vite-env.d.ts        # __APP_VERSION__
│   ├── App.tsx              # start screen shell, banners, language switch
│   ├── data/
│   │   ├── types.ts         # Person, Encounter, Event, Settings
│   │   ├── db.ts            # Dexie database, schema version 1
│   │   ├── repository.ts    # storage API (contracts/storage-api.md)
│   │   └── errors.ts
│   ├── i18n/
│   │   ├── nl.ts            # source dictionary
│   │   ├── en.ts            # typed against nl
│   │   └── LanguageProvider.tsx
│   ├── platform/
│   │   ├── persistence.ts   # persist() / persisted()
│   │   ├── standalone.ts    # installed vs Safari tab
│   │   └── online.ts        # online/offline state
│   └── ui/
│       ├── StartScreen.tsx
│       ├── Banners.tsx      # not-persisted, install hint, offline
│       └── Diagnostics.tsx  # storage status, counts, test data
└── tests/
    ├── setup.ts             # fake-indexeddb, jest-dom, empty database per test
    ├── repository.test.ts   # uniqueness, validation, atomic delete, timestamps
    ├── persistence.test.ts
    ├── i18n.test.tsx        # switch, persistence of choice
    └── banners.test.tsx
```

**Structure Decision**: a single client-only project in the existing `app/` folder, which
becomes the Cloudflare Pages root directory. There is no backend, because constitution IV keeps
all data on the device. Later features add folders under `src/` (for example `src/events/`,
`src/guest/`) and use only `data/repository.ts` and `i18n/`.

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Diagnostics panel (long-press the version number) | User Story 2 must be tested on the iPhone before any screen for adding data exists (F1/F2). It also shows whether iOS granted persistent storage. | Testing only on a laptop does not cover iOS storage. A separate test build would get a different address, and therefore separate storage. |

## Rollout

The address already serves the old placeholder page from `app/`. Switching to the real build
happens in one step:

1. Create the project in `app/` locally: `package.json`, `.nvmrc` with the exact Node 24 version
   (for example the output of `node -v`), and the rest of the structure above. Check locally
   ([quickstart.md](quickstart.md) section 1).
2. Right before pushing that first commit with `app/package.json` to `main`, change the
   Cloudflare Pages settings ([contracts/hosting.md](contracts/hosting.md)):
   - root directory `app`, build command `npm run build`, output directory `dist`;
   - environment variable `NODE_VERSION` = the value in `app/.nvmrc`.
3. Push. Push nothing else to `main` between steps 2 and 3. The new settings and
   `app/package.json` arrive in the same push.

**If the build fails**, Cloudflare keeps serving the last successful deployment, so the
placeholder stays online. Fix the problem and push again.

**When the Node version changes**, update `app/.nvmrc` and `NODE_VERSION` together.

## Open points

- **Decided 2026-10-08** (spec Clarifications):
  - The home-screen label is "SB".
  - The in-app name follows the language.
  - An Event has a start and an end date.
  - Casual networking without an Event is allowed.
  - The address is `https://socialbutterfly2.pages.dev/`. It already serves the old placeholder
    page; switching to the Vite build is described under "Rollout".
  - The backup reminder after casual networking appears on the day after those Encounters (spec FR-017).
- No open points left for F0.
