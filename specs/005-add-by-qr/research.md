# Research: F5 — Add by QR

**Date**: 2026-10-11 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F5 builds on F2 and F4 (see [../003-add-by-name/research.md](../003-add-by-name/research.md) and
[../004-link-profile/research.md](../004-link-profile/research.md)).

## R1. Reading QR codes in Safari on the iPhone (FR-002, SC-002)

- **Facts**:
  - Safari on iOS has the camera API (`navigator.mediaDevices.getUserMedia`) in home-screen web
    apps since iOS 13.4; iOS asks for permission the first time.
  - Safari has **no built-in QR decoder** for web pages (`BarcodeDetector` is not available on
    iOS), so a small library is needed.
  - The app's CSP (`public/_headers`) allows only scripts from the app itself and sets no
    `Permissions-Policy`, so the camera is allowed and a bundled library is fine.
- **Decision**: **jsQR 1.4.0** (npm `jsqr`, Apache-2.0, no dependencies, own TypeScript types).
  - It decodes one `ImageData` per call, on the main thread: no worker, no CSP change.
  - Loaded with a dynamic `import('jsqr')` only when the scan screen opens, so the start of the
    app stays as fast as now. Measured in the build: a separate chunk of 130 kB (47 kB
    gzipped), precached by the PWA.
  - Pinned to the exact version in `package.json`, like the other dependencies.
- **Alternatives considered**: `qr-scanner` (faster with a Web Worker, but a worker file and more
  moving parts); `@zxing/library` (reads many barcode types; much larger); writing a decoder
  ourselves (no).

## R2. The camera loop (FR-002, FR-003, edge cases)

- **Decision**: `startQrScanner(video, onCode)` in `src/platform/camera.ts`:
  1. `getUserMedia({ video: { facingMode: 'environment' }, audio: false })`; the `<video>` gets
     `playsInline`, `muted` and `autoPlay` (needed on iOS to show the stream in the page).
  2. Every ~200 ms (via `requestAnimationFrame`, skipping frames in between), draw the frame on an
     off-screen canvas scaled to at most 720 px on the long side and pass its `ImageData` to jsQR.
  3. Each decoded text goes to `onCode(text)`; the screen decides whether it is a profile code.
  4. Returns `stop()`: cancels the loop and stops every camera track. The screen calls it after a
     profile code is read, on Back, on unmount and when the page becomes hidden
     (`visibilitychange`).
  5. Rejects with `CameraError('denied')` for `NotAllowedError`/`SecurityError`, and
     `CameraError('unavailable')` when there is no camera API or no camera.
- **Rationale**: ~5 decodes per second is enough for a code held in front of the camera
  (SC-002) and saves battery. Frames only exist in memory (FR-003).

## R3. Which codes count (FR-004)

- **Decision**: the decoded text goes through F4's `normalizeProfileUrl`:
  - `ok` → stop scanning, show the confirmation;
  - `shortLink` → message `qr.shortLink`, keep scanning;
  - `notProfile` → message `qr.notProfile`, keep scanning.
  The same refused text read again does not reset the message (no flicker). The first profile code
  wins; later reads are ignored once the camera stops (edge case "read several times").

## R4. A name from the link (FR-005, SC-005)

- **Decision**: a pure `nameFromProfileUrl(url)` next to `normalizeProfileUrl`:
  1. Take the handle after `/in/` and decode it (`zo%C3%AB` → `zoë`).
  2. Split on `-`; drop trailing parts that contain a digit (LinkedIn's uniqueness suffix, e.g.
     `1a2b3c`), repeatedly.
  3. If no part with at least 2 letters remains → `''` (the owner types the name).
  4. Each part: first letter upper case (`toLocaleUpperCase`), rest as is; join with spaces.
  Examples: `jan-peeters-1a2b3c` → "Jan Peeters"; `van-den-broeck` → "Van Den Broeck" (editable);
  `12345` → "".
- **Rationale**: right without editing for the common `first-last[-code]` handles (SC-005);
  editable for the rest.

## R5. Saving: reuse `addByName` (FR-007–FR-010)

- **Decision**: `addByName` gets an optional `profileUrl` (normalized):
  - new Person: stored with `profileUrl`, `searchUrl = buildSearchUrl(name, company)`,
    `connectionStatus = 'notConnected'`;
  - `existingPersonId` with no `profileUrl` yet (same-name question, B15): the scanned
    `profileUrl` is stored on it in the same transaction (FR-009);
  - `existingPersonId` that already has this `profileUrl` (known by link, B8): unchanged;
  - B19 ("met today" → reuse today's Encounter) and the note step work as in F2.
  - A `profileUrl` that belongs to another Person than the one being saved →
    `DuplicateProfileUrlError` (F0), nothing saved; the screen re-checks before the tap, so this
    only guards against a race.
- **Rationale**: one save path for F2 and F5 keeps "no lost contacts" rules in one place.
- **Known Person by link**: the confirmation screen looks it up with the existing
  `findPersonByProfileUrl` as soon as the code is read, plus whether it was met today
  (`findSameNamePersons` already returns `metToday`; for the link match the screen asks
  `findSameNamePersons(person.name)` and picks that Person).

## R6. Confirmation screen details (FR-005, FR-006, FR-008)

- **Decision**:
  - **New Person**: editable name (derived, `maxLength` 100), empty optional company
    (`maxLength` 100), short link (F4 `shortProfileUrl`), context bar (read-only).
  - **Known Person by link**: name and company shown as **text**, not inputs, with `qr.known`.
    FR-008 forbids changing them, so an input would suggest something that is not saved.
  - Same-name check while typing, as in F2 (B20): only Persons **without** a profile link count
    (US2 scenario 4).
  - "Save and open LinkedIn" is a real link to the scanned profile (B20). Met today → a plain
    button `qr.saveMetToday`, no LinkedIn.
  - `SameNameQuestion` (F2) gets two small prop changes: `newPersonUrl` (was `searchUrl`) and an
    optional `linkFor(match)`, so in F5 every choice opens the scanned profile.

## R7. Camera refused or missing (US3 scenario 3)

- **Decision**: `qr.cameraDenied` or `qr.cameraUnavailable`, plus a button "Add by name" that
  opens the F2 form. Where iOS shows the camera setting for a home-screen app differs between iOS
  versions; the text says "in your iPhone settings" and the quickstart checks the exact place.
