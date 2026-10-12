# Implementation Plan: F9 — My QR

**Branch**: `008-my-qr` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-my-qr/spec.md`

## Summary

The My QR tab replaces F7's "coming soon" screen. The first time, the owner pastes her own
LinkedIn profile link with F4's rules (B33). After that the tab shows her QR code, large and made
on the device (B32), with a butterfly in the middle and below it "Scan mij om te connecteren" /
"Scan me to connect". She can change the link there. While the QR is shown, the screen stays on
where iOS allows it. When the app starts without internet, F0's offline screen offers "Show my
QR" (B34).

Technical approach:

- **Data:** one optional field `Settings.ownerProfileUrl`, set by `setOwnerProfileUrl()`. No new
  table and no schema version change (research R5).
- **QR:** the `uqr` library encodes the link at error correction level H. The app draws the grid
  as its own SVG in dark brand blue on white, with the centre cleared for a butterfly badge. A
  unit test decodes the result with jsQR, which the app already has (R1–R3).
- **Paste:** F4's clipboard + normalize step moves into a shared `pasteProfileUrl()`, used by
  `ProfileLinkControl` and My QR (R6).
- **Screen on:** a `useWakeLock(active)` hook on the Screen Wake Lock API. It does nothing where
  the API is unsupported (R4).
- **Offline:** `OfflineScreen` gets a "Show my QR" button. `App` shows `MyQrTab` with Back and no
  tab bar, and continues on the My QR tab when the connection comes back (R7).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack (React 19, Dexie 4, Vite, vite-plugin-pwa), jsqr (F5, also used in tests here). **New: `uqr` 0.1.3** (MIT, no dependencies) to encode QR codes.

**Storage**: IndexedDB via Dexie, **still schema version 2**. `Settings` gets an optional field and no index.

**Testing**: Vitest, React Testing Library, fake-indexeddb; QR scannability by decoding with jsQR; manual checks on the iPhone with a second phone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (Safari). Keeping the screen on works from iOS 18.4; on older versions it is skipped quietly (FR-013).

**Project Type**: client-only web app (PWA)

**Performance Goals**: QR on screen in 1 tap, under half a second (SC-001); encoding takes well under 1 ms

**Constraints**: €0; no network use (FR-014); works offline (B34); scannable by the iPhone camera and the LinkedIn app (SC-002); no LinkedIn logo (M2)

**Scale/Scope**: 1 settings field + 1 repository function, 1 new library, 3 small modules (`qr.ts`, `pasteProfileUrl.ts`, `wakeLock.ts`), 1 new screen, 2 changed components (`OfflineScreen`, `ProfileLinkControl`), 8 text keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | The QR only holds the owner's profile link. The person scanning opens LinkedIn and taps Connect themselves. The app never contacts LinkedIn. |
| II | Zero Cost | ✅ Pass | `uqr` is free (MIT); the wake lock is a browser API. |
| III | Installable iPhone Web App | ✅ Pass | Same home-screen app. The wake lock is the web standard and is skipped where iOS lacks it. |
| IV | Local Data, Sync-Ready | ✅ Pass | The own link stays in `Settings` on the device, with `updatedAt`. The QR is made on the device; no network. |
| V | LinkedIn-Only Identity | ✅ Pass | The own link is normalized with F4's rules. It is not a Person, so Person identity rules are untouched (FR-001). |
| VI | Privacy | ✅ Pass | My QR shows no notes, Persons or Actions (FR-011). The tab bar never appears in guest mode. From the offline screen only My QR opens. |
| VII | Bilingual | ✅ Pass | 8 new keys in NL and EN. The caption for the person scanning shows both languages at once (FR-010a). |
| VIII | Speed in the Moment | ✅ Pass | The add flows are unchanged. The QR is 1 tap away, also when offline (B34). |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | No schema change and no Person writes. An invalid paste never overwrites the link. |
| X | Own Brand, Only v1 | ✅ Pass | Own butterfly and brand blue, no LinkedIn logo. No full-screen mode and no "NoSleep" video trick (YAGNI). One small library, justified in R1. |

**Post-design re-check (after Phase 1)**: all pass. The new dependency is free, tiny and needed
(R1). The change to F0's offline screen is Britt's decision B34. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-my-qr/
├── plan.md              # This file
├── research.md          # R1–R9
├── data-model.md        # Settings.ownerProfileUrl, lifecycle, not a Person
├── quickstart.md        # laptop + iPhone checks, scanning with a second phone, offline
├── contracts/
│   ├── storage-api.md   # setOwnerProfileUrl, pasteProfileUrl, makeQr, useWakeLock
│   └── screens.md       # My QR states, offline button, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/
├── package.json             # + uqr 0.1.3 (exact)
├── src/
│   ├── data/
│   │   ├── types.ts         # + Settings.ownerProfileUrl
│   │   └── repository.ts    # + setOwnerProfileUrl
│   ├── linkedin/
│   │   └── pasteProfileUrl.ts # NEW: clipboard + normalize + message key (from ProfileLinkControl)
│   ├── myQr/
│   │   └── qr.ts            # NEW: makeQr (uqr, level H, centre badge), QUIET_ZONE
│   ├── platform/
│   │   └── wakeLock.ts      # NEW: useWakeLock(active)
│   ├── i18n/nl.ts, en.ts    # + myQr.*, offline.showMyQr; − soon.myQr
│   ├── ui/
│   │   ├── MyQrTab.tsx      # NEW: setup, QR + butterfly + caption, change link, optional Back
│   │   ├── ProfileLinkControl (ProfileLink.tsx) # uses pasteProfileUrl; same behaviour
│   │   ├── Banners.tsx      # OfflineScreen: + "Show my QR" button
│   │   └── ComingSoon.tsx   # only 'soon.settings' left
│   ├── App.tsx              # myQr tab → MyQrTab; qrWhileOffline; continue on myQr when back online
│   └── styles.css           # + my-qr panel, badge, caption, offline button
└── tests/
    ├── my-qr.test.ts        # NEW: makeQr decodes with jsQR (short, long, accents, emoji); badge ≤ 22%; setOwnerProfileUrl
    ├── paste-profile-url.test.ts # NEW: all helper outcomes
    ├── wake-lock.test.ts    # NEW: request, re-request on visible, release, unsupported, rejected
    ├── my-qr-ui.test.tsx    # NEW: setup, paste cases, QR shown, caption in both languages, change link, nothing private, offline flow
    ├── link-profile-ui.test.tsx # unchanged, must stay green
    └── tabs-ui.test.tsx     # My QR no longer "coming soon"
```

**Structure Decision**: same single client project. The QR logic gets its own small folder
`src/myQr/`, like `src/people/` and `src/events/`. Browser APIs stay in `src/platform/`; LinkedIn
link rules stay in `src/linkedin/`.

## Open points

None blocking. To check on the iPhone (quickstart):

- **iOS version** (section 4): keeping the screen on needs iOS 18.4+ in a home-screen app.
- **Real scanners** (section 3): the camera app and the LinkedIn app, 10 out of 10.

## Complexity Tracking

No violations; nothing to justify.
