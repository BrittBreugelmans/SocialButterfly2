# Contract: brand assets

**Feature**: F11 — Brand & Delight | Research: [R1–R5](../research.md)

## `app/src/brand/palette.ts`

```ts
export const palette = {
  blue: '#0d5fb8',
  blueDark: '#0a3d73',
  blueLight: '#e8f1fb',
  wing: '#5aa2ec',
  text: '#1b2430',
  muted: '#5a6672',
  bg: '#ffffff',
  surface: '#f3f6f9',
  border: '#c9d1d8',
  warningBg: '#fff4d6',
  errorBg: '#fde8e8',
  danger: '#c62828',
} as const

export type PaletteToken = keyof typeof palette

/** Text/background pairs used in the app; each must reach WCAG AA (4.5:1). */
export const TEXT_PAIRS: ReadonlyArray<readonly [fg: PaletteToken, bg: PaletteToken]>
```

- Values are lower-case `#rrggbb`. `wing` and `border` are never used for text.
- Imported by `vite.config.ts` (`theme_color`, `background_color`), `pwa-assets.config.ts`
  (icon and launch backgrounds) and `MyQrTab.tsx` (QR modules and badge).
- Changing a value = change it here **and** on `:root` in `styles.css`; tests fail otherwise.

## CSS mirror (`app/src/styles.css`)

- `:root` declares one custom property per token, kebab-case: `--blue`, `--blue-dark`,
  `--blue-light`, `--wing`, `--text`, `--muted`, `--bg`, `--surface`, `--border`,
  `--warning-bg`, `--error-bg`, `--danger`. `--radius` and fonts stay.
- Outside `:root`, the CSS uses **no hex colours**, only `var(--…)`. White (`#fff`, `#ffffff`)
  becomes `var(--bg)`. Shadows keep `rgb(r g b / alpha)` with the RGB of `text` or `blueDark`
  (for example `rgb(27 36 48 / 0.15)`), since iOS 17 lacks relative colour syntax.
  `transparent`, `currentColor` and `inherit` are fine.
- `color-scheme: light` stays (M6).

## `app/public/logo.svg`

- The butterfly only: square `viewBox` (`0 0 512 512`), **transparent background**, no `<text>`,
  no external references, no scripts.
- Fill and stroke colours only from the palette.
- Must contain no LinkedIn logo, "in" mark or the word "LinkedIn" (FR-002).
- Must read as a butterfly at 48 px (favicon) and stay sharp at full screen.
- Replacing it (Britt's own design, M5): same rules; a PNG of at least 1024 × 1024 with a
  transparent background is also accepted, as `logo.png`, with the references in this contract
  updated in the same change.

## `app/pwa-assets.config.ts`

- Input: `public/logo.svg` with a white icon background (chosen: wiki M10, so there is no
  `icon.svg`). Only with a blue icon background would `public/icon.svg` be needed (research R4).
- `transparent`: sizes 64, 192, 512 + `favicon.ico` 48 (as F0), padding 0.05.
- `maskable`: 512, padding 0.3, background `palette.bg` (or the background Britt picks, R4).
- `apple`: 180, padding 0.15, same background.
- `appleSplashScreens`: `createAppleSplashScreens` with padding 0.35, background `palette.bg`,
  `linkMediaOptions: { log: true, addMediaScreen: true, basePath: '/' }`, devices = iPhones on
  iOS 17+ (research R5). No dark variant.
- Output file names stay as F0's, so the manifest in `vite.config.ts` does not change.

## `app/index.html`

- `<link rel="icon" href="/logo.svg" type="image/svg+xml">` (was `/icon.svg`).
- `<meta name="theme-color">` uses `palette.blue`.
- `<meta name="color-scheme" content="light">`.
- `apple-mobile-web-app-title` stays "SB" (M4); `apple-mobile-web-app-status-bar-style` stays
  `default`.
- The `apple-touch-startup-image` links printed by the generator, one per device and orientation.

## `app/vite.config.ts`

- `themeColor` comes from `palette.blue`; `background_color` from `palette.bg`.
- `includeAssets`: `logo.svg` instead of `icon.svg`.
- Workbox: `globIgnores: ['**/apple-splash-*']` (launch images are not precached).
