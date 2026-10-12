# Research: F9 — My QR

**Date**: 2026-10-12 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F9 builds on F0–F8. It adds one small library (to make QR codes) and one browser API (keep the
screen on). No schema change.

## R1. Making the QR code on the device (FR-007, B32, constitution II)

- **Facts**:
  - Encoding a QR code means Reed-Solomon error correction, version choice and mask scoring. That
    is easy to get subtly wrong by hand.
  - The app already reads QR codes with jsQR (F5); it cannot make them.
  - Candidates on npm (checked 2026-10-12): `uqr` 0.1.3 (MIT, no dependencies, ESM, own types,
    published 2026-04-03), `qrcode-generator` 2.0.4 (MIT, larger package), `qrcode` 1.5.4 (MIT,
    pulls in `pngjs`, `yargs`, `dijkstrajs`), `lean-qr` 2.7.4 (MIT, small).
- **Decision**: **`uqr` 0.1.3**, pinned exactly like the other dependencies. Only its `encode()`
  is used: it returns the QR as a grid of dark/light modules. The app draws that grid itself as an
  SVG (R3), so the butterfly and the colours stay under its control.
- **Rationale**: free, tiny, no dependencies, typed, tree-shakable; the grid output fits drawing
  our own SVG.
- **Alternatives considered**: `qrcode` (extra Node-oriented dependencies); `qrcode-generator`
  (works, but bigger and an older API); `lean-qr` (also fine; `uqr` has the simpler `encode` API);
  writing an encoder ourselves (error-prone, no benefit).

## R2. Butterfly in the middle, still scannable (FR-009, SC-002)

- **Facts**:
  - A QR code has 4 error correction levels; level **H** recovers about 30% damaged codewords.
  - The three corner squares (finder patterns) and the timing lines must stay visible; the
    centre may be covered within the error correction budget.
  - A normalized profile link is short (`https://www.linkedin.com/in/` + handle): at level H it
    fits a small QR version, so the modules stay large on screen.
- **Decision**:
  - Encode with **error correction level H** and no built-in border.
  - Clear a **square in the centre of at most 22% of the QR width** (about 5% of the area) to
    light, and draw the butterfly there on a white rounded badge.
  - Add a light **quiet zone of 4 modules** around the code.
  - **Automated check**: a unit test turns the final grid (centre cleared) into pixels and decodes
    it with jsQR, which the app already has. It runs for short, long (100 characters), accented
    and emoji handles, and must return exactly the normalized link.
- **Rationale**: the covered area is far below what level H recovers; the jsQR test catches a
  regression without a phone. The iPhone check in the quickstart confirms it with real scanners.
- **Alternatives considered**: level Q (25%, smaller code, less margin for the butterfly);
  drawing the butterfly over the modules without clearing (harder for scanners).

## R3. Drawing the QR (FR-008, FR-010)

- **Decision**:
  - One inline **SVG**: `viewBox` in modules, all dark modules in one `<path>`,
    `shape-rendering="crispEdges"`, the butterfly as a nested group based on the shapes in
    `public/icon.svg`.
  - Dark modules in **`--blue-dark` `#004182`** on **`#ffffff`**. Contrast is about 10:1, well
    above what scanners need. The QR panel always has its own white background, so the dark mode
    of the phone does not change it.
  - The butterfly uses `--blue`; no LinkedIn logo (M2).
  - Size: square, width `min(86vw, available height)`. The available height is the screen minus
    the caption, "Change link" and the tab bar. In portrait on an iPhone this gives at least 80%
    of the width (FR-008). In landscape the height limits it and it stays fully visible.
- **Rationale**: an SVG stays sharp at every size and on Retina screens; no canvas or image file
  is needed.
- **Alternatives considered**: `uqr`'s own `renderSVG` (one rect per module, no room for the
  butterfly badge); a canvas (blurry when scaled, harder to test); pure black (works too, but dark
  brand blue is a nice showcase detail and scans equally well).

## R4. Keeping the screen on (FR-012, FR-013, SC-004)

- **Facts**:
  - The **Screen Wake Lock API** (`navigator.wakeLock.request('screen')`) keeps the screen from
    dimming and locking. Safari supports it since 16.4. In **home-screen web apps** it works on
    iOS only from **18.4**; on older iOS the request fails or does nothing.
  - The browser releases the lock by itself when the page is hidden (other app, locked phone).
    It must be requested again when the page becomes visible.
  - A web app cannot change the screen brightness (spec Assumptions).
- **Decision**: a small hook **`useWakeLock(active)`** in `src/platform/wakeLock.ts`:
  - requests the lock while `active`, which is true while My QR shows a QR;
  - requests it again on `visibilitychange` when the page is visible again;
  - releases it when `active` turns false or the screen unmounts;
  - when the feature is missing or a request fails, it does nothing and shows no error (FR-013).
- **Rationale**: the standard API, no dependency, nothing to show when unsupported.
- **Alternatives considered**: a hidden looping video ("NoSleep" trick: hacky, costs battery,
  depends on autoplay rules; constitution X, YAGNI); a hint to change Auto-Lock in iOS settings
  (not needed when the API works).
- **To check**: the iOS version on the owner's iPhone (quickstart section 4).

## R5. Storing the own profile link (FR-001, FR-005, constitution IV)

- **Facts**:
  - `Settings` is one record in the `settings` table, keyed by `'settings'`. It is updated with
    `updateSettings()`, which sets `updatedAt` and fires `onDataChanged`.
  - Adding a non-indexed field to a record needs no new Dexie schema version.
- **Decision**: a new optional field **`Settings.ownerProfileUrl`**, set through a new repository
  function **`setOwnerProfileUrl(url)`**:
  - it refuses a link that is not already normalized (`ValidationError`), as F0 does for a
    Person's `profileUrl`;
  - it does **not** check the link against stored Persons, because the owner is not a Person
    (spec FR-001, edge case);
  - storage full gives F0's `StorageFullError` through `withStorageErrors()`.
- **Rationale**: one value, part of the device settings as the spec says; no schema change, no
  upgrade risk.
- **Alternatives considered**: a new table (overkill for one value); a Person flagged "me" (would
  show up in Contacts, Actions and duplicate checks: against FR-001).
- **Open**: whether the link goes into the CSV export stays with open question #6 (F10).

## R6. Pasting the link with F4's rules (FR-003, FR-004)

- **Facts**:
  - `ProfileLinkControl` (F4/F7) reads the clipboard, normalizes the link and picks the message.
    It is tied to a Person: it calls `linkProfileUrl()` and the merge question.
  - The clipboard must be read inside the tap handler, before any `await` (F4 R1).
- **Decision**: extract the shared first half into **`pasteProfileUrl()`** in
  `src/linkedin/pasteProfileUrl.ts`:
  - it calls `readClipboardText()` synchronously and returns a promise;
  - the result is `{ ok: true, url }`, `{ ok: false, messageKey }` with
    `'link.invalid' | 'link.shortLink' | 'link.unsupported'`, or `'dismissed'`.
  - `ProfileLinkControl` and My QR both use it, so the rules and messages are the same (FR-003).
- **Rationale**: one place for F4's paste rules; no change in F4's behaviour (its tests stay
  green).
- **Alternatives considered**: copying the 15 lines into My QR (two places to keep in sync);
  making `ProfileLinkControl` generic (mixes Person merging with the owner's link).

## R7. "Show my QR" on the offline screen (FR-010b, B34)

- **Facts**:
  - `App.tsx` returns `<OfflineScreen />` while `offlineAtStart` is true. It clears that as soon
    as the connection comes back.
  - The app shell is precached by the PWA service worker, so it opens without internet. The
    settings are in IndexedDB on the device.
- **Decision**:
  - `OfflineScreen` gets an `onShowMyQr` prop and a "Show my QR" button.
  - `App` keeps a flag `qrWhileOffline`. When it is set, it renders `MyQrTab` with a **Back**
    button and **no tab bar**. Back clears the flag.
  - When the connection comes back while the flag is set, `App` selects the `myQr` tab, so the
    owner stays on her QR, now with the tab bar (spec edge case).
- **Rationale**: the smallest change to F0's offline behaviour; everything else stays blocked.
- **Alternatives considered**: showing the tab bar offline (would open the rest of the app,
  against B34).

## R8. The caption in two languages (FR-010a, FR-015)

- **Decision**: one key **`myQr.scanMe`**, read from **both** dictionaries (`nl` and `en`) and
  shown as two lines, whatever the app language. All other new texts use `t()` as usual.
- **Rationale**: the existing check that every key exists in both languages still covers it;
  the fixed texts are in `wiki/merk-en-stijl.md`.

## R9. Speed and bundle (SC-001)

- **Decision**:
  - The grid is computed once per link (`useMemo`); encoding a short link takes well under a
    millisecond.
  - `uqr` is imported statically: it is small (a few kB compressed) and must work offline. It is
    then simply part of the precached app.
  - The build size is compared before and after in the quickstart.
- **Alternatives considered**: a separate lazy chunk like jsQR in F5 (jsQR is about 10× larger;
  for `uqr` a split adds a load step and gains nothing).
