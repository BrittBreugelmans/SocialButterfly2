# Quickstart: validate F9 — My QR

Proves F9 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F8 is live and installed on the owner's iPhone.
- A second phone with a camera and the LinkedIn app, to scan.
- Laptop with the Node version from `app/.nvmrc`.
- Write down the iOS version of the owner's iPhone (Settings → General → About). Keeping the
  screen on needs iOS 18.4 or later in a home-screen app (research R4).

## 1. Local checks

```bash
cd app
npm install
npm run typecheck   # includes: every new text exists in nl and en
npm test            # earlier tests + makeQr decodes with jsQR, own link, paste helper, My QR screen, wake lock, offline button
npm run build       # note the bundle size; uqr should add only a few kB
```

Expected: everything passes. F4/F7 paste tests are unchanged and green.

## 2. Set up and show (User Stories 1 and 2)

1. Tap **Mijn QR**: the explanation and "Plak LinkedIn-link"; no QR.
2. In LinkedIn: your profile → Delen → Link kopiëren. Back in the app, "Plak LinkedIn-link" →
   tap "Plakken" in the iOS bubble: the QR appears with the butterfly in the middle and both
   lines below it (SC-003: 2 taps).
3. Close the app fully and reopen, tap Mijn QR: the QR is there at once (SC-005).
4. Switch the iPhone to dark mode: the QR stays dark on white.
5. Look for privacy: no notes, names or events on the screen.

## 3. Scan it (SC-002)

1. From arm's length in normal indoor light, scan with the second phone's **camera app**, 5 times:
   each time it offers your LinkedIn profile.
2. The same 5 times with the **LinkedIn app's QR scanner**: it opens your profile.
3. Expect 10 out of 10.

## 4. Screen stays on (User Story 4, SC-004)

1. iOS Settings → Display → Auto-Lock: 30 seconds.
2. Open Mijn QR and do not touch the phone for 2 minutes: the screen stays on (iOS 18.4+).
3. Go to Contacten and wait: the phone dims and locks as usual.
4. On older iOS: no error appears; the QR works as usual.
5. Put Auto-Lock back as it was.

## 5. Change the link (User Story 3)

1. Copy something that is not a profile link (for example a company page), tap "Link aanpassen":
   the F4 message appears and the QR is unchanged.
2. Copy your own profile link again and tap "Link aanpassen": "Nieuwe link bewaard." and the QR
   still opens your profile.

## 6. Without internet (B34)

1. Close the app fully, turn on airplane mode and open the app: the "no internet" screen shows
   **"Toon mijn QR"**.
2. Tap it: your QR, without tab bar, with "Terug". "Terug" returns to the offline screen.
3. Open the QR again, turn airplane mode off: the app continues on Mijn QR, now with the tab bar.

## 7. Language

1. Switch the app to English: tab, setup texts and "Change link" are in English; the two caption
   lines stay **both** visible.
