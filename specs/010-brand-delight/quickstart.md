# Quickstart: validate F11 — Brand & Delight

Proves F11 works end to end. Details: [contracts/brand.md](contracts/brand.md),
[contracts/screens.md](contracts/screens.md), [research.md](research.md).

## Prerequisites

- F9 is live and installed on the owner's iPhone, with her own link set on My QR.
- Britt has picked a logo on `specs/010-brand-delight/logo-proposals.html` (or delivered her own),
  and it is in `app/public/logo.svg` (research R1, M5).
- A second phone with a camera and the LinkedIn app, to scan.
- Laptop with the Node version from `app/.nvmrc`.
- Note the iPhone model (Settings → General → About). Its launch image must be in the generated
  set (research R5).

## 0. Pick the logo (gate)

```bash
open specs/010-brand-delight/logo-proposals.html
```

Expected: 3 proposals, each at 60 px on white and on blue, at 96 px, and in the middle of a
sample QR, plus the palette as swatches. Britt picks one (and the icon background). Nothing goes
into the app before this.

## 1. Local checks

```bash
cd app
npm install
npm run generate-pwa-assets   # icons + launch images from public/logo.svg; prints the <link> tags
npm run typecheck
npm test                      # earlier tests + palette sync, contrast, logo rules, flutter, logo on screens
npm run build
```

Expected: everything passes. `qr.test.ts` is unchanged and green. The build output has no
`apple-splash-*` entries in the precache manifest (`dist/sw.js`).

## 2. Icon and launch screen (User Stories 1 and 4)

1. On the iPhone, **remove the app from the home screen** (data stays: same address, T12). Open
   https://socialbutterfly2.pages.dev/ in Safari → Share → Add to Home Screen.
2. Expected: the icon shows the chosen logo, sharp, no black or white corners, label "SB".
3. Put it next to the LinkedIn app: no shared logo, "in" mark or letters (SC-007: also ask one
   person who does not know the app what they see).
4. Close the app fully (swipe up) and open it from the icon. Expected: the logo on the brand
   background, then the app. Opening feels no slower than before.
5. Check the data is still there (Contacts).

## 3. Colours and logo in the app (User Stories 1 and 2)

1. Walk every tab and flow: Add, Contacts (list, detail, edit mode), Actions (with items and
   empty), My QR (setup and QR), Settings, add by name, add by QR, note step, offline screen
   (airplane mode, then start the app).
2. Expected: the logo instead of 🦋 on the start, offline, coming-soon, My QR setup and empty
   Actions screens; no leftover old blue; text easy to read everywhere (SC-006).
3. Turn on dark mode (Control Centre). Expected: the app stays light; form fields are not dark
   (M6).

## 4. The butterfly (User Story 3)

1. Add by name, return from LinkedIn, write a note, tap Save. Expected: the butterfly flutters
   over the start screen once and is gone within 1.5 s.
2. Again, but tap Skip. Expected: same.
3. Again, and tap "Voeg toe via naam" while it flies. Expected: the form opens at once; the
   butterfly is gone (SC-002: 10 out of 10).
4. Add by QR, close the note step. Expected: the butterfly flies.
5. Add the same person by name again on the same day (B19), close the note step. Expected: no
   butterfly.
6. Write a note later from Contacts or Actions. Expected: no butterfly.
7. Settings → Accessibility → Motion → **Reduce Motion** on; add someone and close the note step.
   Expected: no butterfly. Turn it off again.
8. Count taps in each add flow: the same as before F11 (SC-001).

## 5. My QR still scans (SC-004)

1. Open My QR: the chosen logo sits in the middle on its white badge.
2. Scan 10 times with the second phone (camera app and LinkedIn app) at arm's length. Expected:
   10 out of 10 open the owner's profile.
3. Repeat once from the offline screen ("Toon mijn QR", airplane mode).

## Done

- Tick F11 in `specs/features.md`; add a line to `wiki/log.md` with the chosen logo and the iPhone
  model.
