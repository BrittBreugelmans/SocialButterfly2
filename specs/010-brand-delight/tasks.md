---

description: "Task list for F11 — Brand & Delight"
---

# Tasks: F11 — Brand & Delight

**Input**: Design documents from `specs/010-brand-delight/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included, as in F0–F9 (plan: `brand.test.ts`, `logo-ui.test.tsx`,
`flutter-ui.test.tsx`). The icon, launch screen, animation feel and QR scans are checked on the
iPhone with [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: US1–US4 from spec.md
- All paths are under `app/` unless they start with `specs/` or `wiki/`

## Ground rules for every task

- F0–F9 rules still apply ([../008-my-qr/tasks.md](../008-my-qr/tasks.md), "Ground rules").
- **No data change** (FR-021): `app/src/data/` is not edited. No new text keys; `nl.ts`/`en.ts`
  are not edited.
- **No new dependencies** (plan). `package.json` changes only if a script needs it (none planned).
- **Colours only from the palette** (contract [brand.md](contracts/brand.md)): in TS/TSX import
  `palette` from `src/brand/palette.ts`; in CSS use `var(--…)`. No hex colour outside `:root`.
- **The logo exists once**: `/logo.svg` (plus `public/icon.svg` only if Britt picks a blue icon
  background, research R4). No inline copies of the butterfly in components.
- **Nothing waits for the animation** (FR-014, FR-016): no `await`, no delayed navigation, no
  disabled buttons because of it.
- `window.matchMedia` does not exist in jsdom: guard it with `typeof window.matchMedia ===
  'function'` (as `src/platform/standalone.ts` does), and mock it in tests that need it.
- UI tests follow `tests/add-by-name-ui.test.tsx` (helpers `renderApp`, `mockOpen`, `addJan`) and
  `tests/actions-ui.test.tsx`: render `<LanguageProvider><App /></LanguageProvider>`, call
  `updateSettings({ contextChosenOn: todayLocal() })` in `beforeEach`, get texts via `nl['…']`.

---

## Phase 1: Setup

- [ ] T001 Run `npm run typecheck && npm test` in `app/` and confirm the F9/F10 baseline is green before changing anything. Note the test count in this task.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the palette module (needed by US1, US2, US4) and the logo choice (needed by US1,
US3, US4).

- [ ] T002 [P] Create `app/src/brand/palette.ts` per [contracts/brand.md](contracts/brand.md): `export const palette = { blue: '#0d5fb8', blueDark: '#0a3d73', blueLight: '#e8f1fb', wing: '#5aa2ec', text: '#1b2430', muted: '#5a6672', bg: '#ffffff', surface: '#f3f6f9', border: '#c9d1d8', warningBg: '#fff4d6', errorBg: '#fde8e8', danger: '#c62828' } as const` (wiki M8), `export type PaletteToken = keyof typeof palette`, and `export const TEXT_PAIRS` with these `[fg, bg]` pairs: `[text,bg]`, `[text,surface]`, `[text,warningBg]`, `[text,errorBg]`, `[muted,bg]`, `[muted,surface]`, `[muted,warningBg]`, `[blue,bg]`, `[blue,surface]`, `[blue,blueLight]`, `[bg,blue]`, `[bg,blueDark]`, `[danger,bg]`, `[danger,surface]`, `[bg,danger]`. Add a one-line comment per group (brand, text, surfaces, status). No other exports.
- [X] T003 **Gate (manual, Britt)**: on `specs/010-brand-delight/logo-proposals.html` choose proposal A, B or C (or deliver her own logo, M5) and the icon background (white or blue). Record it as decision **M9** in `wiki/beslissingen.md` (date, choice, reason, rejected options) and add a line to `wiki/log.md`. Tasks marked "needs T003" wait for this. *(2026-10-12: M9 = proposal B for now; Britt will deliver her own logo, which then replaces `logo.svg` (T004 rules). M10 = white icon background, so T005 is skipped and `logo.svg` is the only logo file.)*
- [ ] T004 (needs T003) Create `app/public/logo.svg` from the chosen `<symbol id="logo-…">` in `specs/010-brand-delight/logo-proposals.html`: a standalone `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">`, no background rect, no `<text>`, no `<script>`, no external references. Replace the colour roles with palette hex values for a white background: `--main` → `#0d5fb8`, `--soft` → `#5aa2ec`, `--deep` → `#0a3d73`, `--hole` → `#ffffff`. Write out any `<use href>` mirror (proposal B) as explicit, mirrored elements, because the icon generator must not depend on `<use>`. Add an XML comment: "De Sociale Vlinder logo (F11, wiki M9). Single source: icons, launch images, app and My QR." If Britt delivered her own logo, use her file instead and only check the same rules (or `logo.png` ≥ 1024 px, transparent, and update the references in later tasks).
- [X] T005 *(Skipped: M10 = white background.)* (needs T003, only if Britt chose a **blue** icon background) Create `app/public/icon.svg`: the same shapes as `logo.svg`, in the same order, with the "on blue" colours (`--main` → `#ffffff`, `--soft` → `#e8f1fb`, `--deep` → `#0a3d73`, `--hole` → `#0d5fb8`), plus a full-bleed `<rect width="512" height="512" fill="#0d5fb8"/>` as the first element (research R4). With a white background, skip this task and delete the old `app/public/icon.svg` in T013 instead.
- [ ] T006 [P] Create `app/src/ui/Logo.tsx` per [contracts/screens.md](contracts/screens.md): `export function Logo({ size = 96, className }: LogoProps)` renders `<img src="/logo.svg" alt="" aria-hidden="true" width={size} height={size} draggable={false} className={['logo', className].filter(Boolean).join(' ')} />`. Doc comment: "The app's logo (F11). Decorative: the screen's heading names the app."

**Checkpoint**: palette module, logo file and `Logo` component exist. User stories can start.

---

## Phase 3: User Story 1 - Recognisable logo and app icon (Priority: P1) 🎯 MVP

**Goal**: the chosen logo is the app icon and replaces every placeholder butterfly, also in the
middle of My QR.

**Independent Test**: run `npm run generate-pwa-assets`, install on the iPhone (quickstart
section 2): the icon shows the logo, sharp, label "SB". The start, offline, coming-soon, My QR
setup and empty Actions screens show the logo; My QR still scans 10/10.

### Tests for User Story 1

- [ ] T007 [P] [US1] Create `app/tests/brand.test.ts` with a `describe('logo.svg (FR-001, FR-002)')` block. Read `public/logo.svg` with `readFileSync(new URL('../public/logo.svg', import.meta.url), 'utf8')`. Check: it has a square `viewBox` (`0 0 512 512`); it contains no `<text`, `<script`, `<image`, `href="http`, or `xlink:href="http`; it contains no "linkedin" (case-insensitive); every `fill="#…"`/`stroke="#…"` value (lower-cased) is one of `Object.values(palette)`; it has no `<rect` covering the full canvas (transparent background). If `public/icon.svg` exists (blue icon background, T005): strip all `fill`/`stroke` attribute values from both files and the extra first background `<rect>` from `icon.svg`, then expect the remaining markup of the shapes to be equal (research R4).
- [ ] T008 [P] [US1] Create `app/tests/logo-ui.test.tsx`. Cases, each asserting that the screen contains an `img` with `src="/logo.svg"` (query `container.querySelector('img[src="/logo.svg"]')`) and that the text `🦋` does not appear in that `main`: (1) start screen (Add tab); (2) offline screen (set `navigator.onLine` to false before render, as in `tests/banners.test.tsx`); (3) "coming soon" (Settings tab, only while F10 has not replaced it: skip the case with a comment if `soon.settings` no longer exists); (4) My QR without an own link (setup); (5) Actions tab with no open Actions (empty state, `nl['actions.empty']` visible). Also (6): My QR with an own link set (`setOwnerProfileUrl`) renders an SVG `image` element with `href="/logo.svg"` inside the QR's `svg[role="img"]`.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Replace the emoji placeholder with `<Logo />` in `app/src/ui/StartScreen.tsx` (remove `<p className="butterfly">🦋</p>`; put `<Logo />` in the same place, above the `h1`).
- [ ] T010 [P] [US1] Replace the emoji placeholders with `<Logo />` in `app/src/ui/Banners.tsx` (`OfflineScreen`, remove `<p className="offline-butterfly">`), `app/src/ui/ComingSoon.tsx`, and with `<Logo size={72} />` in `app/src/ui/ActionsTab.tsx` (empty state). Keep the 🦋 inside text strings (guest greeting, reminder texts): those are text, not the logo.
- [ ] T011 [US1] Update `app/src/ui/MyQrTab.tsx`: (a) setup state: `<p className="butterfly">🦋</p>` → `<Logo />`; (b) delete the `Butterfly` component; (c) in `QrImage`, after the white badge `rect`, render `<image href="/logo.svg" x={x + QUIET_ZONE + 0.5} y={y + QUIET_ZONE + 0.5} width={side - 1} height={side - 1} preserveAspectRatio="xMidYMid meet" />`; (d) replace the inline colours: background and badge `fill={palette.bg}`, modules `fill={palette.blueDark}`; (e) update the `QrImage` doc comment ("dark brand blue on white, the logo in the cleared centre"). `makeQr` and `qr.ts` stay unchanged.
- [ ] T012 [US1] In `app/src/styles.css`, replace the `.butterfly, .offline-butterfly { font-size: 3.5rem }` rule with a `.logo { display: block; margin: 0 auto; }` rule. Remove now-unused selectors (`.butterfly`, `.offline-butterfly`) after checking with a search in `app/src/`. Keep the layout of each screen (spacing around the logo similar to the emoji's).
- [ ] T013 [US1] Update `app/pwa-assets.config.ts` per [contracts/brand.md](contracts/brand.md): input `public/logo.svg` (white background) or `public/icon.svg` (blue, T005); a preset based on `minimal2023Preset` with `transparent` unchanged (64/192/512 + `favicon.ico` 48, padding 0.05), `maskable: { sizes: [512], padding: 0.3, resizeOptions: { background: <chosen background from palette>, fit: 'contain' } }`, `apple: { sizes: [180], padding: 0.15, resizeOptions: { background: <same>, fit: 'contain' } }`. Import the colour from `./src/brand/palette`. Update the header comment. With a white background, delete the old placeholder `app/public/icon.svg`.
- [ ] T014 [US1] Update `app/vite.config.ts` and `app/index.html` for the logo: `includeAssets` lists `logo.svg` (and `icon.svg` only if it exists) instead of the old `icon.svg`; in `index.html` the SVG favicon becomes `<link rel="icon" href="/logo.svg" type="image/svg+xml" />`. Remove the "final brand values come in F11" comment in `vite.config.ts`.
- [ ] T015 [US1] Run `npm run generate-pwa-assets` in `app/`. Check that `public/favicon.ico`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` and `apple-touch-icon-180x180.png` are regenerated (same names, so the manifest does not change), and look at each PNG: logo visible, no black corners.
- [ ] T016 [US1] Run `npm test` in `app/`. Fix `app/tests/my-qr-ui.test.tsx` only where it looked for the emoji or the old `Butterfly`; `app/tests/qr.test.ts` must pass unchanged. T007 and T008 must pass.

**Checkpoint**: US1 complete. The logo is everywhere and the icons are regenerated.

---

## Phase 4: User Story 2 - One consistent colour palette (Priority: P1)

**Goal**: every screen takes its colours from the approved palette (M8); text reaches WCAG AA;
the app stays light (M6).

**Independent Test**: `npm test` (palette sync, no stray hex, contrast) passes; quickstart
section 3 on the iPhone: no old blue left, dark mode keeps the app light.

### Tests for User Story 2

- [ ] T017 [US2] Extend `app/tests/brand.test.ts` with `describe('palette (FR-009–FR-012a)')`: (1) parse the `:root { … }` block of `src/styles.css` and expect, for every token, `--kebab-name: value;` equal to `palette[token]` (camelCase → kebab-case: `blueDark` → `--blue-dark`, `warningBg` → `--warning-bg`); (2) outside the `:root` block, expect no match of `/#[0-9a-fA-F]{3,8}\b/`; (3) for each pair in `TEXT_PAIRS`, compute the WCAG 2.x contrast ratio (relative luminance with the sRGB formula; write the small helper in the test file) and expect ≥ 4.5; (4) `index.html` contains `<meta name="theme-color" content="${palette.blue}"` and `<meta name="color-scheme" content="light"`; (5) `styles.css` `:root` contains `color-scheme: light`.

### Implementation for User Story 2

- [ ] T018 [US2] Rewrite the `:root` block of `app/src/styles.css` with the 12 tokens of [contracts/brand.md](contracts/brand.md) (`--blue: #0d5fb8; --blue-dark: #0a3d73; --blue-light: #e8f1fb; --wing: #5aa2ec; --text: #1b2430; --muted: #5a6672; --bg: #ffffff; --surface: #f3f6f9; --border: #c9d1d8; --warning-bg: #fff4d6; --error-bg: #fde8e8; --danger: #c62828;`), keeping `--radius`, `color-scheme: light` and the font. Replace the header comment ("Placeholder styling for F0 …") with "Brand palette (F11, wiki M8). Values mirror src/brand/palette.ts; tests/brand.test.ts keeps them in sync."
- [ ] T019 [US2] Replace every hard-coded colour below `:root` in `app/src/styles.css` (search `#[0-9a-fA-F]`): `#fff`/`#ffffff` → `var(--bg)`; `#c9d1d8`, `#dfe4e8`, `#e6eaee` → `var(--border)`; `#e3effb` → `var(--blue-light)`; `#000` (camera view `.qr-video`) → the keyword `black` (not a brand colour); the shadow `rgb(0 65 130 / 0.15)` → `rgb(10 61 115 / 0.15)` (`blueDark`); `rgb(0 0 0 / …)` shadows and `rgb(255 255 255 / 0.85)` may stay (no hex). Check every place that used the old `--warning-bg`, `--error-bg` and `--danger` still looks right.
- [ ] T020 [US2] In `app/vite.config.ts`, import `palette` from `./src/brand/palette` and use `theme_color: palette.blue`, `background_color: palette.bg` (remove `const themeColor`). In `app/index.html`, set `<meta name="theme-color" content="#0d5fb8" />` and add `<meta name="color-scheme" content="light" />`; keep `apple-mobile-web-app-status-bar-style` `default` and the title "SB" (M4).
- [ ] T021 [US2] Run `npm run typecheck && npm test` in `app/`; T017 must pass. Then `npm run dev` and walk all tabs and flows in a desktop browser at iPhone size (Safari responsive mode): nothing looks broken or unstyled.

**Checkpoint**: US1 + US2 complete. The app has its final look.

---

## Phase 5: User Story 3 - Butterfly flutters after adding a contact (Priority: P2)

**Goal**: closing the note step of a new Encounter (save or skip) makes the logo flutter once
over the start screen (M7), without ever blocking input.

**Independent Test**: quickstart section 4: save and skip both show it; taps go through; gone
within 1.5 s; not for B19, not under Reduce Motion, not for notes written later.

### Tests for User Story 3

- [ ] T022 [US3] Create `app/tests/flutter-ui.test.tsx` (copy `renderApp`, `mockOpen` and `addJan` from `tests/add-by-name-ui.test.tsx`; add a `mockReducedMotion(matches: boolean)` helper that defines `window.matchMedia` with `vi.fn()` returning `{ matches, media, addEventListener() {}, removeEventListener() {} }`, and deletes it in `afterEach`). Cases: (1) add Jan, save a note → start screen shows `.flutter` with `aria-hidden="true"` and an `img[src="/logo.svg"]`; (2) same with Skip; (3) the layer disappears after `fireEvent.animationEnd` on its image; (4) with fake timers (`vi.useFakeTimers({ shouldAdvanceTime: true })`), it disappears after 1500 ms without `animationend`; (5) it disappears when `document.visibilityState` becomes `'hidden'` (`Object.defineProperty` + `document.dispatchEvent(new Event('visibilitychange'))`); (6) clicking `nl['start.addByName']` while it shows opens the form at once (the name field is visible) and the layer is gone; (7) B19: add Jan twice on the same day (see the existing `note.alreadyMet` test), close the second note step → no `.flutter`; (8) with `mockReducedMotion(true)` → no `.flutter`; (9) when saving the note throws `StorageFullError` (spy on `finishNoteStep` in `src/data/repository` as the existing storage-full tests do), the note step stays and no `.flutter` exists; (10) writing a note from the Actions tab ("Schrijf notitie" flow) shows no `.flutter`; (11) the class `.flutter` is the only element added (it is removed fully: `document.querySelector('.flutter')` is `null` after (3)).

### Implementation for User Story 3

- [ ] T023 [P] [US3] Create `app/src/ui/Flutter.tsx` per [contracts/screens.md](contracts/screens.md): `export function Flutter({ onDone }: FlutterProps)`. On first render, read `prefersReducedMotion()` (a small local function: `typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches`); if true, call `onDone()` in an effect and render `null`. Otherwise render `<div className="flutter" aria-hidden="true"><img src="/logo.svg" alt="" draggable={false} onAnimationEnd={finish} /></div>`. `finish` calls `onDone` once (guard with a ref). An effect sets a 1500 ms `setTimeout(finish)` and a `visibilitychange` listener that calls `finish` when `document.visibilityState === 'hidden'`; clean both up on unmount. Doc comment: "The butterfly after adding a contact (F11, wiki M7). Decorative and never blocks input: pointer-events none, removed after 1.5 s at most."
- [ ] T024 [P] [US3] Add the animation styles to `app/src/styles.css` (research R7): `.flutter { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 5; }` (above content and the tab bar, below dialogs: check the existing `z-index` values in the file and pick one between them); `.flutter img { position: absolute; left: 0; bottom: 0; width: 48px; height: 48px; animation: flutter 1.2s ease-in-out forwards; }`; `@keyframes flutter` using only `transform` and `opacity`: start off-screen bottom left (`translate(-20vw, 10vh)`), curve via about `translate(35vw, -35vh)` to off-screen top right (`translate(110vw, -95vh)`), with a slight wing flap via alternating `scaleX(1)`/`scaleX(0.75)` at 4–5 keyframes and `opacity` 0 → 1 → 1 → 0; `@media (prefers-reduced-motion: reduce) { .flutter { display: none; } }`. No hex colours.
- [ ] T025 [US3] Wire it into `app/src/App.tsx` per [contracts/screens.md](contracts/screens.md): add `const [flutter, setFlutter] = useState(0)` with a comment "F11 (M7): the butterfly after the note step of a new Encounter"; in `NoteStep onDone`, call `if (!noteStep.alreadyMetToday) setFlutter((n) => n + 1)` before `setNoteStep(undefined)` and `toStart()`; inside the tabs branch, render `{tab === 'add' && flutter > 0 && <Flutter key={flutter} onDone={() => setFlutter(0)} />}` next to `StartScreen`. Note in a comment the accepted limitation of research R6 (a restored note step after iOS closed the app cannot tell B19). `NoteStep.tsx` is not edited.
- [ ] T026 [US3] Run `npm test` in `app/`; T022 and all earlier note-step tests (`add-by-name-ui`, `add-by-qr-ui`, `link-profile-ui`) must pass.

**Checkpoint**: US3 complete. Delight without any extra tap or wait.

---

## Phase 6: User Story 4 - Branded launch screen (Priority: P3)

**Goal**: while the home-screen app loads, iOS shows the logo on the brand background instead of
a white screen.

**Independent Test**: quickstart section 2, steps 4–5: close the app fully and reopen it; the
launch image appears; opening is not slower.

### Implementation for User Story 4

- [ ] T027 [US4] (needs T013) Extend `app/pwa-assets.config.ts` with `appleSplashScreens: createAppleSplashScreens({ padding: 0.35, resizeOptions: { background: palette.bg, fit: 'contain' }, linkMediaOptions: { log: true, addMediaScreen: true, basePath: '/', xhtml: false } }, IPHONES)` (import `createAppleSplashScreens` from `@vite-pwa/assets-generator/config`). Define `const IPHONES: AppleDeviceName[]` with the iPhones on iOS 17+ from the generator's list: `'iPhone XS'`, `'iPhone XS Max'`, `'iPhone XR'`, `'iPhone 11'`, `'iPhone 11 Pro'`, `'iPhone 11 Pro Max'`, `'iPhone 12 mini'`, `'iPhone 12'`, `'iPhone 12 Pro'`, `'iPhone 12 Pro Max'`, `'iPhone 13 mini'`, `'iPhone 13'`, `'iPhone 13 Pro'`, `'iPhone 13 Pro Max'`, `'iPhone 14'`, `'iPhone 14 Plus'`, `'iPhone 14 Pro'`, `'iPhone 14 Pro Max'`, `'iPhone 15'`, `'iPhone 15 Plus'`, `'iPhone 15 Pro'`, `'iPhone 15 Pro Max'`, `'iPhone 16e'`, `'iPhone 16'`, `'iPhone 16 Plus'`, `'iPhone 16 Pro'`, `'iPhone 16 Pro Max'`, `'iPhone 17'`, `'iPhone Air'`, `'iPhone 17 Pro'`, `'iPhone 17 Pro Max'`, `'iPhone SE 4.7"'`. Use `logo.svg` on `palette.bg` for the launch images, also when the icon background is blue (light app, M6). No `darkResizeOptions`.
- [ ] T028 [US4] Run `npm run generate-pwa-assets` in `app/`. Note the file-name prefix of the generated launch images (expected `apple-splash-…`). Copy the printed `<link rel="apple-touch-startup-image" …>` tags into the `<head>` of `app/index.html`, below the `apple-touch-icon` link, under a comment `<!-- F11: iOS launch images, generated by npm run generate-pwa-assets -->`. Open two of the PNGs (one portrait, one landscape) and check that the logo is centred and not stretched.
- [ ] T029 [US4] In `app/vite.config.ts`, add `globIgnores: ['**/apple-splash-*']` (use the prefix found in T028) to the `workbox` options, with a comment "iOS reads launch images at install; the service worker never needs them (research R5)". Run `npm run build` and check that `dist/sw.js` contains no `apple-splash` entry, and that `dist/index.html` keeps the startup-image links.
- [ ] T030 [US4] Extend `app/tests/brand.test.ts` with `describe('launch images (FR-008)')`: `index.html` has at least one `apple-touch-startup-image` link whose `media` contains `orientation: portrait`, and every such link's `href` points to a file that exists in `public/`. Do not import `pwa-assets.config.ts` in the test (it loads the image tool).

**Checkpoint**: all four stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T031 Run `npm run typecheck && npm test && npm run build` in `app/`. Everything is green; compare the test count with T001. Note the size change of `dist/` (launch images are not precached).
- [ ] T032 [P] Accessibility check: the `Logo` image is `aria-hidden` with empty `alt` on every screen; each screen still has its `h1`; the `Flutter` layer is `aria-hidden` and never takes focus; with VoiceOver on the iPhone, the start screen reads the same as before F11.
- [ ] T033 [P] Update the docs if the implementation deviated: [research.md](research.md) (R4, R5: file-name prefix, final device list), [contracts/brand.md](contracts/brand.md) (input file, background), [quickstart.md](quickstart.md). Fix the stale comment "F11 makes the final logo" wherever it remains (`grep -rn "F11" app/src app/public`).
- [ ] T034 Commit and push to `main` (manual, Britt). Cloudflare deploys automatically.
- [ ] T035 Validate on the iPhone with [quickstart.md](quickstart.md) sections 2–5 (manual, Britt): remove and re-add the app to the home screen, check the icon and launch screen, the colours in light and dark mode, the butterfly (including Reduce Motion), and scan My QR 10 times with a second phone. Note the iPhone model.
- [ ] T036 Tick the F11 items in `specs/features.md` (and F9's "Vlinder in het midden, QR blijft scanbaar" once T035 scans 10/10), and add a line to `wiki/log.md` with the chosen logo, the iPhone model and the result, per CLAUDE.md.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)**.
- **T003 (logo gate) blocks** T004, T005 and therefore US1, US3 (uses `/logo.svg`) and US4.
- **US2 (Phase 4)** needs only T002. It can be built **before the logo choice**, so it is the
  natural first work while Britt decides.
- **US1 (Phase 3)**: needs T002–T006.
- **US3 (Phase 5)**: needs T004 (logo file). It can run in parallel with US1, except for the
  shared files below.
- **US4 (Phase 6)**: needs T013 (generator config) and T015.
- **Polish (Phase 7)**: after all stories.

### Shared files (their tasks run one at a time)

- `styles.css`: T012, T018, T019, T024.
- `brand.test.ts`: T007, T017, T030.
- `pwa-assets.config.ts`: T013, T027.
- `vite.config.ts`: T014, T020, T029.
- `index.html`: T014, T020, T028.
- `MyQrTab.tsx`: T011 only. `App.tsx`: T025 only.

### Parallel Opportunities

- Foundational: T002 and T006 together (T006 needs no logo file to compile).
- Before the gate: all of US2 (T017–T021) after T002.
- US1: T007, T008, T009, T010 together (four different files); T011 alongside them.
- US3: T022, T023 and T024 together (test file, component, CSS; T024 after any running CSS task).

## Parallel Example: Before the logo choice

```text
Task: "T002 Create app/src/brand/palette.ts"
Task: "T006 Create app/src/ui/Logo.tsx"
then
Task: "T017 Palette tests in app/tests/brand.test.ts"
Task: "T018–T019 Palette tokens in app/src/styles.css"
```

## Parallel Example: User Story 1

```text
Task: "T007 logo.svg rules in app/tests/brand.test.ts"
Task: "T008 Create app/tests/logo-ui.test.tsx"
Task: "T009 Logo on the start screen (StartScreen.tsx)"
Task: "T010 Logo on offline, coming-soon and empty Actions screens"
```

## Implementation Strategy

### MVP (User Stories 1–2)

1. Phase 1 → T002 → **US2** (palette) while Britt chooses the logo (T003).
2. T004–T006 → **US1** (logo everywhere + icons).
3. **Stop and validate**: quickstart sections 2, 3 and 5 on the iPhone (icon, colours, QR scans).
   This is the whole new look and can be pushed.

### Incremental Delivery

1. US2 → push (final colours).
2. US1 → push (logo + icon; re-add the app to the home screen).
3. US3 → push (the butterfly).
4. US4 → push (launch screen; re-add the app once more).
5. Polish: docs, full quickstart, features list, wiki log.
