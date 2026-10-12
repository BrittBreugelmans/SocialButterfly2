# Contract: storage and helpers for F9

**Data model**: [../data-model.md](../data-model.md) | **Research**: [../research.md](../research.md)

All paths are relative to `app/src/`.

## `data/types.ts`

```ts
export interface Settings {
  // …existing fields
  /** The owner's own normalized profile link, for My QR (F9, B33). Not a Person. */
  ownerProfileUrl?: string
}
```

## `data/repository.ts`

### `setOwnerProfileUrl(url: string): Promise<Settings>` (new)

- Precondition: `normalizeProfileUrl(url)` is `{ ok: true, url }` with exactly the same `url`.
  Otherwise it throws `ValidationError('ownerProfileUrl', …)` and stores nothing.
- It stores `ownerProfileUrl` through `updateSettings()`: sets `updatedAt` and fires
  `onDataChanged`.
- On storage full it throws `StorageFullError`, the F0 banner shows, and the old value stays.
- It does **not** read or change Persons, Encounters or Dismissals.

### `getSettings()` (unchanged signature)

- Returns `ownerProfileUrl` when set; the defaults have no `ownerProfileUrl`.

## `linkedin/pasteProfileUrl.ts` (new, R6)

```ts
export type PasteProfileUrlResult =
  | { ok: true; url: string }                       // normalized
  | { ok: false; messageKey: 'link.invalid' | 'link.shortLink' | 'link.unsupported' }
  | 'dismissed'                                     // iOS bubble dismissed or paste refused

/** Call synchronously inside the tap handler: the clipboard is read before any await (F4 R1). */
export function pasteProfileUrl(): Promise<PasteProfileUrlResult>
```

- Mapping: `readClipboardText()` returns `'unsupported'` → `link.unsupported` and `'dismissed'` →
  `'dismissed'`. For text, `normalizeProfileUrl()` gives `shortLink` → `link.shortLink`,
  `notProfile` → `link.invalid`, and `ok` → `{ ok: true, url }`.
- `ui/ProfileLinkControl` switches to this helper. Its behaviour and messages stay the same; the F4
  and F7 tests stay green.

## `myQr/qr.ts` (new, R1–R3)

```ts
export interface QrCode {
  /** Modules per side, without quiet zone. */
  size: number
  /** dark[y][x]; the butterfly area is already cleared to light. */
  dark: boolean[][]
  /** The cleared centre square, in modules: top-left corner and side. */
  badge: { x: number; y: number; side: number }
}

/** Encodes `text` at error correction level H with uqr, no border, and clears the centre badge. */
export function makeQr(text: string): QrCode

/** The quiet zone around the code, in modules (4). */
export const QUIET_ZONE = 4
```

- `badge.side ≤ floor(size × 0.22)`, centred, odd/even chosen so it is symmetric.
- Pure: no DOM, no network. Tested by decoding the pixels with jsQR (R2).

## `platform/wakeLock.ts` (new, R4)

```ts
/** Keeps the screen on while `active`, where the device allows it. Never throws, never shows an error. */
export function useWakeLock(active: boolean): void
```

- `active` true and page visible: `navigator.wakeLock.request('screen')`. A rejection is
  ignored.
- `visibilitychange` back to visible while `active`: request again.
- `active` false or unmount: release the held lock, if any.
- `navigator.wakeLock` missing: no-op.
