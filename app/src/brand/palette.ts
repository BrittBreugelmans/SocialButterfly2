/**
 * The brand palette (F11, wiki M8). The single source for colours in TS; `:root` in styles.css
 * mirrors it and tests/brand.test.ts keeps both in sync. Light only (M6).
 */
export const palette = {
  // Brand: LinkedIn-like, but our own blue (M2).
  blue: '#0d5fb8',
  blueDark: '#0a3d73',
  blueLight: '#e8f1fb',
  wing: '#5aa2ec', // decoration only (logo, animation), never text
  // Text
  text: '#1b2430',
  muted: '#5a6672',
  // Surfaces
  bg: '#ffffff',
  surface: '#f3f6f9',
  border: '#c9d1d8',
  // Status
  warningBg: '#fff4d6',
  errorBg: '#fde8e8',
  danger: '#c62828',
} as const

export type PaletteToken = keyof typeof palette

/** Text/background pairs used in the app; each must reach WCAG AA (4.5:1, FR-010). */
export const TEXT_PAIRS: ReadonlyArray<readonly [fg: PaletteToken, bg: PaletteToken]> = [
  // Body text on every surface
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'warningBg'],
  ['text', 'errorBg'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'warningBg'],
  // Brand blue as text, and white on brand blue
  ['blue', 'bg'],
  ['blue', 'surface'],
  ['blue', 'blueLight'],
  ['bg', 'blue'],
  ['bg', 'blueDark'],
  // Status
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['bg', 'danger'],
]
