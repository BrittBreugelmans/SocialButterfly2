# Implementation Plan: F11 — Brand & Delight

**Branch**: `010-brand-delight` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-brand-delight/spec.md`

## Summary

F11 replaces the placeholders from F0 and F9 with the final brand. Britt gets 3 logo proposals:
a butterfly whose wings suggest two connected network nodes. She picks one, or makes her own
(M5). That logo becomes the app icon and the launch screen. It also replaces every 🦋 placeholder
in the app and sits in the middle of My QR. One palette of LinkedIn-like blues (light only, M6)
colours every screen. After the note step of a new contact closes, a small butterfly flutters once
over the start screen (M7). It never blocks a tap and is skipped under Reduce Motion.

Technical approach:

- **Logo:** `app/public/logo.svg` is the single source. A `Logo` component shows it in the app,
  and the QR's SVG shows it in its cleared centre. The existing icon generator makes all icons
  from it. Proposals first, on `logo-proposals.html`: the gate is Britt's choice (R1, R2).
- **Palette:** `app/src/brand/palette.ts` with 12 tokens, mirrored on `:root` in `styles.css`.
  Hard-coded colours become tokens. Tests guard three things: palette and CSS stay in sync, all
  text pairs reach WCAG AA, and the logo uses only palette colours (R3).
- **Icon + launch screen:** `pwa-assets.config.ts` reads `logo.svg`. It adds a palette background
  to the apple and maskable icons and generates iOS launch images for iPhones on iOS 17+. The
  images and `<link>` tags are committed, and the launch images are kept out of the precache
  (R4, R5).
- **Butterfly:** a `flutter` counter in `App` goes up when `NoteStep` closes for a new Encounter.
  `Flutter` is a fixed, `pointer-events: none`, `aria-hidden` layer with one 1.2 s CSS animation
  of `transform` and `opacity`. It renders nothing under Reduce Motion and removes itself on
  animation end, after 1.5 s, or when the page is hidden (R6, R7).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: the stack from F0–F9 (React 19, Dexie 4, Vite, vite-plugin-pwa, uqr, jsqr) and the dev tool `@vite-pwa/assets-generator` 2.0.0 that is already installed. **No new dependencies.**

**Storage**: unchanged (IndexedDB via Dexie, schema version 2). F11 writes no data.

**Testing**: Vitest, React Testing Library (fake timers, mocked `matchMedia`), plus file-based tests of `styles.css` and `logo.svg`. Manual checks on the iPhone ([quickstart.md](quickstart.md)).

**Target Platform**: iOS 17+ home-screen web app (Safari)

**Project Type**: client-only web app (PWA)

**Performance Goals**: no extra taps or waiting in the add flows (SC-001). The animation runs on the compositor only and lasts ≤ 1.5 s (SC-003). The logo SVG is a few kB and is cached by the service worker.

**Constraints**: €0, no runtime network use beyond the app's own files (FR-022), no LinkedIn logo or trademark (M2), light only (M6), WCAG AA text contrast (FR-010), and the QR stays scannable (SC-004).

**Scale/Scope**: 1 logo file + proposal page, 1 palette module, about 20 colours in the CSS turned into tokens, 2 new components (`Logo`, `Flutter`), 6 changed components (`App`, `StartScreen`, `OfflineScreen`, `ComingSoon`, `MyQrTab`, `ActionsTab`), 3 config files (`pwa-assets.config.ts`, `vite.config.ts`, `index.html`), regenerated icons + about 30 launch images, 0 new text keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | No LinkedIn contact. Only the look changes. |
| II | Zero Cost | ✅ Pass | No new dependencies or services. The system font is kept (no font download). The icon generator is already a dev dependency. |
| III | Installable iPhone Web App | ✅ Pass | Uses the standard `apple-touch-icon` and `apple-touch-startup-image`. Same home-screen app. |
| IV | Local Data, Sync-Ready | ✅ Pass | No data change, no network calls. The logo is a same-origin file and is cached offline. |
| V | LinkedIn-Only Identity | ✅ Pass | Untouched. |
| VI | Privacy | ✅ Pass | The butterfly shows only the logo, with no names or notes. My QR is unchanged apart from the logo. |
| VII | Bilingual | ✅ Pass | No new texts. |
| VIII | Speed in the Moment | ✅ Pass | The animation starts after the flow ends and is `pointer-events: none`. Saving and navigation never wait for it (FR-014, FR-016). The launch image is shown by iOS before the app code runs, so it adds no time. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | No data writes. `NoteStep` is unchanged. |
| X | Own Brand, Purposeful Delight, Only v1 | ✅ Pass | Own logo and own blue, not LinkedIn's `#0a66c2`. Delight is limited to the wiki moments, and it never delays input. No animation library (YAGNI). |

**Post-design re-check (after Phase 1)**: all pass. The only accepted gap is research R6: in the
rare B19 case, if iOS closed the app in between, the butterfly can fly once. That is harmless,
and storing a flag for it would add data for no user value. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/010-brand-delight/
├── plan.md                 # This file
├── research.md             # R1–R8
├── data-model.md           # no stored data; brand assets; flutter state
├── quickstart.md           # logo gate, local checks, icon/launch, colours, butterfly, QR scans
├── logo-proposals.html     # created in tasks: 3 proposals + palette swatches (gate, M5)
├── contracts/
│   ├── brand.md            # palette.ts, CSS mirror, logo.svg, generator config, index.html, vite config
│   └── screens.md          # Logo, Flutter, App changes, My QR centre
├── checklists/requirements.md
└── tasks.md                # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/
├── index.html                # logo.svg favicon, color-scheme light, theme-color, startup-image links
├── vite.config.ts            # colours from palette.ts, includeAssets logo.svg, globIgnores apple-splash-*
├── pwa-assets.config.ts      # input logo.svg, backgrounds, padding, appleSplashScreens (iPhones iOS 17+)
├── public/
│   ├── logo.svg              # NEW: the chosen logo (single source)
│   ├── icon.svg              # DELETED (replaced by logo.svg)
│   ├── favicon.ico, pwa-*.png, maskable-icon-512x512.png, apple-touch-icon-180x180.png  # regenerated
│   └── apple-splash-*.png    # NEW: generated launch images
├── src/
│   ├── brand/
│   │   └── palette.ts        # NEW: 12 tokens + TEXT_PAIRS
│   ├── styles.css            # :root = palette; hard-coded colours → tokens; .logo, .flutter + @keyframes, reduced motion
│   ├── ui/
│   │   ├── Logo.tsx          # NEW
│   │   ├── Flutter.tsx       # NEW
│   │   ├── StartScreen.tsx   # 🦋 → Logo
│   │   ├── Banners.tsx       # OfflineScreen: 🦋 → Logo
│   │   ├── ComingSoon.tsx    # 🦋 → Logo
│   │   ├── ActionsTab.tsx    # empty state: 🦋 → Logo
│   │   └── MyQrTab.tsx       # setup: 🦋 → Logo; QR centre: <image href="/logo.svg">; colours from palette; Butterfly removed
│   └── App.tsx               # flutter counter; Flutter on the Add tab after a new Encounter's note step
└── tests/
    ├── brand.test.ts         # NEW: palette ↔ :root, no stray hex in CSS, WCAG AA for TEXT_PAIRS, logo.svg rules
    ├── flutter-ui.test.tsx   # NEW: save/skip → butterfly; gone after end/1.5 s/hidden; not for B19, Reduce Motion, failed save; taps pass through
    ├── logo-ui.test.tsx      # NEW: the 5 screens show the logo image, not the emoji
    ├── qr.test.ts            # unchanged, must stay green
    └── my-qr-ui.test.tsx     # adjusted only where it looked for the emoji
```

**Structure Decision**: same single client project. The brand values get a small folder
`src/brand/`, next to `src/myQr/` and `src/people/`. UI pieces stay in `src/ui/`. Generated
assets stay committed in `public/`, as in F0.

## Open points

None blocking. In order:

- **Gate: logo choice** (quickstart section 0). Britt picks one of 3 proposals and the icon
  background, or delivers her own (M5). Tasks after the gate wait for it.
- **Palette check on the iPhone** (research R3). The values are a proposal and Britt can change
  them. The tests keep `palette.ts` and the CSS in step.
- **iPhone model** (quickstart prerequisites): it must be in the launch-image set. Otherwise
  iOS shows its plain screen and nothing breaks.

## Complexity Tracking

No violations; nothing to justify.
