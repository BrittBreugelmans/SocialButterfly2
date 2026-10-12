# Contract: screens and components

**Feature**: F11 — Brand & Delight | Research: [R2, R6, R7](../research.md)

No new texts and no new text keys: F11 adds no visible words (FR-021).

## `Logo` (new, `app/src/ui/Logo.tsx`)

```ts
interface LogoProps {
  /** Width and height in CSS pixels. Default 96. */
  size?: number
  className?: string
}
export function Logo(props: LogoProps): JSX.Element
// <img src="/logo.svg" alt="" aria-hidden="true" width={size} height={size} draggable={false} />
```

Replaces the 🦋 emoji `<p className="butterfly">` on:

| Screen | File | Size |
|---|---|---|
| Start screen (Add tab) | `StartScreen.tsx` | 96 |
| Offline screen | `Banners.tsx` (`OfflineScreen`) | 96 |
| "Coming soon" | `ComingSoon.tsx` | 96 |
| My QR, setup (no link yet) | `MyQrTab.tsx` | 96 |
| Actions, empty state | `ActionsTab.tsx` | 72 |

The 🦋 inside the guest greeting text (wiki fixed text) stays: it is text, not the logo.

## My QR centre (changed, `MyQrTab.tsx`)

- The inline `Butterfly` component is removed.
- In the QR's SVG, after the white badge: `<image href="/logo.svg" x y width height>` covering
  the badge minus 0.5 module on each side (same box as today).
- QR modules use `palette.blueDark`, the background and badge `palette.bg` (no inline hex).
- `makeQr` and the cleared badge area do not change, so `qr.test.ts` stays valid.

## `Flutter` (new, `app/src/ui/Flutter.tsx`)

```ts
interface FlutterProps {
  /** Called when the butterfly is gone (animation end, 1.5 s fallback, or page hidden). */
  onDone(): void
}
export function Flutter(props: FlutterProps): JSX.Element | null
```

- Renders `null` when `prefers-reduced-motion: reduce` matches.
- Otherwise: `<div className="flutter" aria-hidden="true"><img src="/logo.svg" alt="" /></div>`.
- CSS: `.flutter { position: fixed; inset: 0; pointer-events: none; z-index: above content,
  below dialogs }`; the image runs `@keyframes flutter` (1.2 s, `transform`/`opacity` only).
  `@media (prefers-reduced-motion: reduce) { .flutter { display: none } }`.
- Calls `onDone` once: on `animationend`, or after 1500 ms, or on `visibilitychange` to hidden,
  whichever comes first.

## `App` (changed)

- New state: `const [flutter, setFlutter] = useState(0)`.
- `NoteStep onDone`: if `!noteStep.alreadyMetToday` → `setFlutter((n) => n + 1)`; then as
  before (`setNoteStep(undefined)`, `toStart()`).
- In the tabs branch, only while `tab === 'add'`: `{flutter > 0 && <Flutter key={flutter}
  onDone={() => setFlutter(0)} />}`.
- Any other screen or tab change unmounts it. `flutter` is reset to 0 by `onDone`, so it never
  shows again on a later return to the start screen.

## Unchanged behaviour (regression guard)

- Same taps and the same screens in every add flow (FR-020, SC-001).
- `NoteStep` itself does not change.
- The tab bar, banners, dialogs and guest mode texts do not change.
