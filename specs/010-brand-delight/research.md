# Research: F11 — Brand & Delight

**Date**: 2026-10-12 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F11 changes only the look and adds one animation. No data, no new library, no schema change.
Starting point (checked in the code on 2026-10-12):

- `app/public/icon.svg` is the F0 placeholder (ellipses, white background). The icon generator
  (`npm run generate-pwa-assets`, `pwa-assets.config.ts`) makes `favicon.ico`, `pwa-*.png`,
  `maskable-icon-512x512.png` and `apple-touch-icon-180x180.png` from it.
- The same butterfly is copied by hand into `MyQrTab.tsx` (`Butterfly`), with colours inline.
- The start screen, offline screen, "coming soon", My QR setup and the empty Actions tab show the
  emoji 🦋 as their "logo".
- Colours: tokens on `:root` in `styles.css`, but about 20 hard-coded colours in rules below it,
  plus `#0a66c2` in `vite.config.ts` and `index.html`.
- No launch screen: iOS shows a white screen while the app loads.
- No animations, only two 0.15 s transitions on the switch.

## R1. Logo proposals and approval (FR-001–FR-003, M5)

- **Decision**:
  - Draw **3 proposals** as hand-written SVG, each on a 512 × 512 canvas with a transparent
    background. All follow the wiki: a butterfly whose wings suggest two connected network nodes.
    - **A, "Knooppunten"**: each wing pair is a node (circle) with a connecting line through the
      body; the antennae end in small nodes.
    - **B, "Netwerkvleugels"**: the wings are drawn as a small network: 3–4 nodes per side joined
      by lines, with a filled outline around them.
    - **C, "Verfijnd"**: today's placeholder shape, cleaned up: wings touching in one shared node
      in the middle, with the top wings in brand blue and the bottom wings in light blue.
  - Show them side by side on one local page, `specs/010-brand-delight/logo-proposals.html`: each
    proposal at home-screen size (60 px, on white and on brand blue), at start-screen size
    (96 px) and in the middle of a sample QR.
  - **Gate**: Britt picks one proposal. Only then does it go into the app (as `app/public/logo.svg`,
    R2). If she likes none, she delivers her own SVG or PNG (at least 1024 px, transparent
    background), and that becomes `logo.svg` (or `logo.png`, same rules) instead.
- **Rationale**: Britt decides (M5); SVG stays sharp from 48 px to full screen (FR-005); the page
  lets her judge the small sizes, where most logos fail.
- **Alternatives considered**: one proposal only (no real choice); generating images with an AI
  image tool (raster, hard to keep sharp and on-palette, and the result is not editable in the
  repo).

## R2. One logo, used everywhere (FR-004, FR-007)

- **Decision**:
  - **`app/public/logo.svg`** is the single source: the butterfly only, transparent background,
    colours only from the palette (R3).
  - **In the app**: a small `Logo` component renders `<img src="/logo.svg" alt="">` with
    `aria-hidden`. It replaces the 🦋 emoji on the start screen, the offline screen, "coming soon",
    the My QR setup and the empty Actions tab.
  - **In the QR** (`MyQrTab`): the hand-copied `Butterfly` is removed; the cleared centre shows
    `<image href="/logo.svg">` inside the QR's SVG, on the white badge as before.
  - **Icons**: `pwa-assets.config.ts` takes `public/logo.svg` as input instead of `icon.svg`, and
    adds the background itself (R4). `icon.svg` is deleted; `index.html` links `/logo.svg` as the
    SVG favicon.
  - Swapping the logo later = replace `logo.svg`, run `npm run generate-pwa-assets`, commit.
- **Rationale**: one file means Britt's own logo replaces all of them at once (FR-004, M5).
  `/logo.svg` is a same-origin image: allowed by the CSP (`img-src 'self'`) and already in the
  service worker's precache pattern (`*.svg`), so it also works offline (B34).
- **Alternatives considered**: a React component as source (the icon generator cannot read it,
  so two copies again); inlining the SVG text with `?raw` (bigger bundle, and the QR test does not
  need it).

## R3. Palette (FR-009–FR-012a, M2, M6)

- **Decision**: one palette, defined in **`app/src/brand/palette.ts`** and mirrored as CSS custom
  properties on `:root` in `styles.css`. Values (contrast measured with the WCAG formula):

  | Token | Value | Used for | Contrast |
  |---|---|---|---|
  | `blue` | `#0d5fb8` | brand: buttons, headings, links, active tab, logo | 6.3:1 on white, 5.8:1 on `surface`; white text on it 6.3:1 |
  | `blueDark` | `#0a3d73` | QR modules, pressed buttons, logo details | 10.9:1 on white |
  | `blueLight` | `#e8f1fb` | tinted backgrounds (selected chip, highlight) | `blue` text on it 5.5:1 |
  | `wing` | `#5aa2ec` | decoration only (logo wings, animation); never text | n/a |
  | `text` | `#1b2430` | body text | 15.7:1 on white |
  | `muted` | `#5a6672` | secondary text | 5.9:1 on white, 5.4:1 on `surface` and `warningBg` |
  | `bg` | `#ffffff` | page background, QR background | — |
  | `surface` | `#f3f6f9` | cards, fields | — |
  | `border` | `#c9d1d8` | borders and dividers | non-text |
  | `warningBg` | `#fff4d6` | warning banners | `text` on it 14.3:1 |
  | `errorBg` | `#fde8e8` | error banners | `text` on it 13.3:1 |
  | `danger` | `#c62828` | delete buttons, errors | 5.6:1 on white; white text on it 5.6:1 |

  - `blue` is LinkedIn-like but not LinkedIn's own `#0a66c2` (M2: "LinkedIn-achtig").
  - Every hard-coded colour in `styles.css` becomes a token (shadows keep `rgb(… / alpha)` of
    `text` or `blueDark`).
  - **Only light**: `color-scheme: light` stays, and `index.html` gets
    `<meta name="color-scheme" content="light">`, so Safari does not darken form controls in dark
    mode (M6).
  - **Status bar**: `theme-color` and the manifest's `theme_color` take `blue` from
    `palette.ts`; `background_color` takes `bg`. `apple-mobile-web-app-status-bar-style` stays
    `default` (dark text on the white page), which matches the light app (FR-011).
  - **Guards**: a unit test reads `styles.css` and checks that each `:root` token equals
    `palette.ts`, and that no other hex colour appears in the CSS. A second test checks the WCAG
    contrast of every text/background pair in the table (SC-005). A third checks that
    `logo.svg` uses only palette colours.
- **Rationale**: one place for values, readable by `vite.config.ts` (Node), the React code (QR
  colours) and, through the test, the CSS. All text pairs pass AA with margin.
- **Alternatives considered**: CSS only (the manifest and the QR SVG need values in JS); keeping
  `#0a66c2` (LinkedIn's exact brand blue; M2 asks for "like", not "the same"); a CSS-in-JS library
  (new dependency, YAGNI).
- **Review**: approved by Britt on 2026-10-12 (wiki M8). Changing a value later = edit `palette.ts` and the `:root`
  line; the test catches a mismatch.

## R4. App icon (FR-006, FR-007)

- **Facts**: iOS draws the home-screen icon from `apple-touch-icon` (180 × 180 PNG) and fills
  transparent parts with black. The generator's `minimal2023Preset` gives the apple and maskable
  icons a white background with 30% padding by default.
- **Decision**: in `pwa-assets.config.ts`, use the preset with the **background from the
  palette** for the apple and maskable icons. Which background (white with a blue butterfly, or
  blue with a light butterfly) is part of the proposal page (R1) and Britt's choice; default
  `bg` (white). Padding stays 0.3 for maskable and becomes 0.15 for apple, so the butterfly fills
  the rounded square better (FR-006: "filling the rounded square"). Generated PNGs stay
  committed in `public/`, as in F0.
- **Blue background**: the generator recolours nothing, so blue wings on a blue background
  would disappear. If Britt picks blue, the generator input becomes `public/icon.svg`: the same
  shapes as `logo.svg`, with the "on blue" colours of the proposal page (white wings, light-blue
  lower wings) and a full-bleed `blue` square behind them. A test checks that both files have the
  same shapes (only the colours may differ), so they cannot drift apart. With a white background,
  `logo.svg` is the only file.
- **Rationale**: no transparent corners on iOS; one input image.
- **Alternatives considered**: drawing a separate icon SVG with background (a second copy of the
  logo).

## R5. Launch screen (FR-008, User Story 4)

- **Facts**:
  - iOS ignores the manifest for launch screens. A home-screen web app shows a launch image only
    for `<link rel="apple-touch-startup-image" media="…">` whose media query matches the device's
    exact screen size and orientation; otherwise it shows a plain screen.
  - The installed generator (`@vite-pwa/assets-generator` 2.0.0) has
    `createAppleSplashScreens(options, devices)`: it renders the image centred on a background,
    per device, portrait and landscape, and prints the matching `<link>` tags
    (`linkMediaOptions.log`).
- **Decision**:
  - Add `appleSplashScreens: createAppleSplashScreens({ padding: 0.35, resizeOptions: {
    background: palette.bg, fit: 'contain' }, linkMediaOptions: { log: true, addMediaScreen:
    true, basePath: '/' } }, IPHONES)` to `pwa-assets.config.ts`. `IPHONES` = every iPhone in the
    generator's list that runs iOS 17 or later (iPhone XS/XR up to iPhone 17, SE 2nd/3rd gen).
  - No dark launch images (M6).
  - Paste the printed `<link>` tags into `index.html` (committed, like the other icons).
  - **Not in the service worker precache**: add `globIgnores: ['**/apple-splash-*']` to the
    Workbox options. iOS reads the launch image when the app is added to the home screen; the
    service worker never needs it, and precaching ~30 PNGs would slow the first install.
- **Rationale**: free, no runtime cost (the image is shown by iOS before any app code runs, so it
  adds no waiting time, FR-008); one input image.
- **Alternatives considered**: a launch screen drawn in HTML/CSS (only appears after the HTML is
  loaded, so after the white flash; adds a step); covering only Britt's iPhone model (unknown in
  the repo, and the quickstart notes it instead); generating at build time with
  `vite-plugin-pwa`'s `pwaAssets` option (runs the image tool on Cloudflare's build machine, a new
  risk for T13).
- **Limitation**: iOS caches the icon and launch image when the app is added. To see the new ones,
  Britt removes the app from the home screen and adds it again. Data stays (same address, T12).
  The quickstart says so.

## R6. The butterfly animation: moment and state (FR-013, FR-017, M7)

- **Facts**:
  - `App.tsx` holds the open note step as `noteStep` (`SavedByName`: `person`, `encounter`,
    `alreadyMetToday`, `opened`). `NoteStep` calls `onDone()` after saving the note or skipping;
    a failed save (storage full) does not call it.
  - `alreadyMetToday` is `true` in the B19 case (no new Encounter).
  - A note step restored after iOS closed the app (B18) is rebuilt from
    `Settings.noteStepEncounterId` with `alreadyMetToday: false`; the B19 flag is not stored.
- **Decision**:
  - In `App`, the `onDone` of `NoteStep` sets a state `flutter` (a counter) **only when
    `noteStep.alreadyMetToday` is false**, then goes to the start screen as before.
  - The start screen branch renders `<Flutter key={flutter} />` while `flutter > 0` and the screen
    is `start`. Leaving the start screen (for example "Add by name") unmounts it: the butterfly
    stops at once (spec edge case).
  - `Flutter` removes itself after `animationend`, with a timeout of 1.5 s as a fallback (FR-015).
    When the page becomes hidden (`visibilitychange`), it removes itself too; it never replays.
  - Notes written later in Contacts or Actions do not go through `NoteStep`, so they never trigger
    it (FR-017).
- **Known limitation**: after an iOS restart in the rare B19 case (same person twice on one day,
  and iOS closed the app in between), the restored note step cannot tell that no Encounter was
  added, so the butterfly flies once. Storing the flag would mean a new settings field for a
  harmless, very rare case (simplicity). Accepted; listed in the plan.
- **Rationale**: no data change; the trigger sits exactly where M7 puts it.
- **Alternatives considered**: an event bus or context for "contact saved" (more code for one
  listener); triggering in `NoteStep` itself (it unmounts at the same moment).

## R7. The butterfly animation: how it moves (FR-014–FR-016, FR-018, FR-019)

- **Decision**:
  - `Flutter` is a `position: fixed` layer with **`pointer-events: none`** and `aria-hidden`,
    holding the logo (`/logo.svg`, 48 px). Taps go straight through to the buttons below
    (FR-014).
  - One CSS `@keyframes` animation of **1.2 s**: the butterfly enters at the bottom left, follows a
    gentle curve to the upper right and leaves the screen, with a slight wing "flap" (a
    `scaleX` wobble). Only `transform` and `opacity` change, so the phone's compositor runs it
    without blocking the page.
  - **Reduce Motion**: when `matchMedia('(prefers-reduced-motion: reduce)')` matches, `Flutter`
    renders nothing (FR-018). A CSS `@media (prefers-reduced-motion: reduce)` rule hides it too,
    as a second guard.
  - Nothing is awaited: saving, the note step and the switch to the start screen happen exactly as
    before; the layer only appears afterwards (FR-016).
  - No sound, no vibration.
- **Rationale**: compositor-only CSS is the cheapest way to animate on iOS; `pointer-events: none`
  makes "never blocks input" true by construction.
- **Alternatives considered**: an animation library (new dependency, YAGNI); the Web Animations
  API (same result, more code); a small calm fade instead of movement under Reduce Motion (the
  spec only asks for no movement; showing nothing is simpler).

## R8. Testing approach

- **Unit (Vitest)**: palette ↔ CSS in sync, no stray hex colours in CSS, WCAG contrast of every
  text pair, `logo.svg` uses only palette colours and contains no "linkedin" text.
- **UI (Testing Library)**:
  - Closing the note step (save and skip) shows the flutter layer; it has `aria-hidden` and the
    class with `pointer-events: none`.
  - It is gone after `animationend` or 1.5 s (fake timers).
  - It does not appear for `alreadyMetToday`, under Reduce Motion (mocked `matchMedia`), or after
    a failed note save.
  - Tapping "Add by name" during the animation opens the form and removes the layer.
  - The start, offline, coming-soon, My QR setup and empty Actions screens show the logo image,
    not the emoji.
- **Existing**: `qr.test.ts` keeps proving the QR decodes with the centre cleared; the butterfly
  is drawn over the cleared area only, so the logo cannot break it. The iPhone scan check stays in
  the quickstart (SC-004).
- **Manual (quickstart)**: icon, launch screen, animation feel, Reduce Motion, 10 scans.
