# Quickstart: validate F5 — Add by QR

Proves F5 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F4 is live and installed on the iPhone.
- A second phone (or a colleague) with the LinkedIn app, to show a QR code: in LinkedIn, tap the
  QR icon in the search bar → "Mijn code" / "My code".
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm install         # installs jsqr 1.4.0
npm run typecheck   # includes: every new text exists in nl and en
npm test            # earlier tests + name from link, addByName with profileUrl, scan screen (mocked camera)
npm run build
```

Expected: everything passes.

## 2. Scan a new person (User Story 1)

1. Open the installed app. Tap "Scan QR". The first time, iOS asks for camera access: allow.
2. Hold the other phone's LinkedIn QR code in view. **Time it: read within 3 seconds** (SC-002).
3. Expect "Wie heb je gescand?" with the derived name, an empty "Bedrijf (optioneel)" and
   `linkedin.com/in/…`. Correct the name if needed.
4. Tap "Bewaar en open LinkedIn": the **profile** opens (SC-001: 2 taps in total). Tap Connect.
5. Back in the app: the note step, with "Profiel gekoppeld".

## 3. Known person (User Story 2)

1. Scan the same QR code again (same day, same context): "Je kent … al." and the button "Naar de
   notitie"; tap it: the note step, no LinkedIn, no extra Encounter (B19).
2. Switch the context (context bar), scan again: "Bewaar en open LinkedIn" adds a new Encounter.
3. Add `Test Naam` by name (F2), skip the note. Then scan a QR whose derived name you change to
   `Test Naam`: "Is dit dezelfde persoon?" → pick it: the profile opens and Test Naam now has the
   profile link.

## 4. Wrong codes (User Story 3)

1. Scan a QR code of a website (e.g. on a poster or generated online): "Dit is geen
   LinkedIn-profielcode.", the camera keeps scanning, nothing saved.
2. Tap "Terug": the camera light on the iPhone goes off.

## 5. Camera refused

1. iPhone settings: find the camera setting for the app or for Safari websites and set it to
   **Deny**. Write down where it is (iOS version) in `wiki/log.md`.
2. Tap "Scan QR": the refusal message and "Toevoegen via naam". Set it back to Allow.

## 6. Language

Switch to English: scan screen, confirmation and messages are in English.
