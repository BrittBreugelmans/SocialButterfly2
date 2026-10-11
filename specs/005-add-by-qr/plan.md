# Implementation Plan: F5 — Add by QR

**Branch**: `005-add-by-qr` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-add-by-qr/spec.md`

## Summary

"Scan QR" on the start screen opens the back camera. When a LinkedIn profile code is read, the
camera stops and a confirmation screen shows the name derived from the link (editable), an optional
company (B22) and the short link. One tap on "Save and open LinkedIn" opens the profile and saves
the Person and an Encounter at the same moment (B20); then the F2 note step follows. A Person with
the same profile link is reused (B8, B19); a Person with the same name but no link triggers the F2
same-name question (B15).

Technical approach:

- **Camera + decoding:** `getUserMedia` (back camera) into a `<video>`, frames copied to a canvas
  and decoded with the small open-source library **jsQR 1.4.0**, loaded only on the scan screen.
- **Logic:** reuse F4's `normalizeProfileUrl`; new pure `nameFromProfileUrl`.
- **Data:** no new fields, no schema change. `addByName` gets an optional `profileUrl`, so F5 reuses
  F2's save, "met today" and note-step logic in one transaction.
- **Screens:** one new screen `AddByQr` (scanning → confirming → same-name question), reusing F2's
  `SameNameQuestion` and `NoteStep`.

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: F0 stack + **jsqr 1.4.0** (Apache-2.0, no dependencies, ships its own types)

**Storage**: IndexedDB via Dexie, schema version 1 unchanged

**Testing**: Vitest, React Testing Library, fake-indexeddb; the camera module is mocked in UI tests; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (camera in home-screen apps works since iOS 13.4)

**Project Type**: client-only web app (PWA)

**Performance Goals**: a profile code read within 3 s (SC-001, SC-002); scanning at most ~5 decodes per second to save battery

**Constraints**: €0; camera images never stored or sent (FR-003); existing CSP (`script-src 'self'`) unchanged: jsQR is bundled, no worker, no external script

**Scale/Scope**: 1 new screen, 1 changed start screen, one extra chunk of 130 kB (47 kB gzipped) loaded only when scanning

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | Reads only the QR code the other person shows; opens the profile for the owner to tap Connect herself. No scraping, no API. |
| II | Zero Cost | ✅ Pass | jsQR is free and open source (Apache-2.0); no services. |
| III | Installable iPhone Web App | ✅ Pass | Standard camera API in the home-screen app; checked on the iPhone (quickstart section 2). |
| IV | Local Data, Sync-Ready | ✅ Pass | Same records and ids as F2; nothing new outside the device. |
| V | LinkedIn-Only Identity | ✅ Pass | Every scanned Person has a normalized, unique `profileUrl`. |
| VI | Privacy | ✅ Pass | Frames live only in memory for decoding; the camera stops when leaving the screen (FR-002, FR-003). |
| VII | Bilingual | ✅ Pass | 12 new keys in NL and EN (contracts/screens.md). |
| VIII | Speed in the Moment | ✅ Pass | 2 taps for a new person (SC-001); scanning starts without a tap; derived name usually right. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Link match reuses the Person; name match asks (B15); one transaction per save; same-day Encounter reused (B19). |
| X | Only v1 | ✅ Pass | No photo or screenshot scanning, no torch or zoom controls, no own QR (F9). One small library instead of a larger scanner toolkit. |

**Post-design re-check (after Phase 1)**: all pass. One new dependency (jsQR), justified in research
R1; no Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-add-by-qr/
├── plan.md              # This file
├── research.md          # R1–R7
├── data-model.md        # name derivation, how addByName fills fields for a scan
├── quickstart.md        # laptop + iPhone checks
├── contracts/
│   ├── storage-api.md   # addByName + profileUrl, nameFromProfileUrl, startQrScanner
│   └── screens.md       # scan screen, confirmation, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/
├── package.json             # + jsqr 1.4.0 (exact version)
└── src/
    ├── linkedin/
    │   └── profileUrl.ts    # + nameFromProfileUrl(url)
    ├── data/
    │   └── repository.ts    # addByName: + optional profileUrl
    ├── platform/
    │   └── camera.ts        # NEW: startQrScanner(video, onCode) → stop()
    ├── i18n/nl.ts, en.ts    # + start.scanQr, qr.* keys
    ├── ui/
    │   ├── AddByQr.tsx      # NEW: scanning → confirming → same-name question
    │   ├── SameNameQuestion.tsx # links can point to the scanned profile
    │   ├── AddByNameForm.tsx    # passes the renamed SameNameQuestion prop
    │   └── StartScreen.tsx  # + "Scan QR" button
    ├── App.tsx              # + screen 'addByQr' → note step
    └── styles.css           # + camera view, confirmation
app/tests/
├── name-from-url.test.ts    # NEW: nameFromProfileUrl table
├── add-by-name.test.ts      # + addByName with profileUrl
└── add-by-qr-ui.test.tsx    # NEW: scan (mocked camera) → confirm → note step; known; same name; wrong code; denied
```

**Structure Decision**: same single client project. Camera access sits in `src/platform/` like
the clipboard (F4); the screen reuses F2's components.

## Open points

None blocking. Checked on the iPhone: camera permission prompt in the home-screen app, scan speed,
and where iOS lists the camera setting when access was refused (quickstart sections 2 and 5).
