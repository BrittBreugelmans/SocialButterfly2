# Quickstart: validate F0 — App Foundation

Run these checks to prove F0 works end to end. Details: [data-model.md](data-model.md),
[contracts/](contracts/).

## Prerequisites

- Node.js with the exact version in `app/.nvmrc` (Node 24; e.g. `nvm use` in `app/`) and npm on the laptop.
- The GitHub repo `BrittBreugelmans/SocialButterfly2` connected to Cloudflare Pages as in
  [contracts/hosting.md](contracts/hosting.md).
- Britt's iPhone with Safari, on **mobile data** (not Wi-Fi) for the timing checks.

## 1. Local checks (laptop)

```bash
cd app
npm install
npm run typecheck   # fails if an English text is missing (FR-015)
npm test            # storage, language and banner tests
npm run build       # production build in app/dist
npm run preview     # open the printed URL in a browser
```

Expected: all commands succeed; the start screen shows in Dutch.

## 2. Install (User Story 1, SC-001, SC-002)

1. The first time: follow "Rollout" in [plan.md](plan.md). The Cloudflare build settings change
   in the same push that adds `app/package.json`. Later: push to `main`. Wait for the build to
   finish. If a build fails, the previous version (at first the placeholder) stays online.
2. On the iPhone, open `https://socialbutterfly2.pages.dev/` in Safari. Expect: start screen plus
   an "Add to Home Screen" hint (because this is a Safari tab).
3. Share → Add to Home Screen → Add. Time it: **under 1 minute** from opening the address.
   Expect: butterfly icon (no LinkedIn logo), labelled "SB".
4. Close Safari. Tap the icon. Expect: full screen, no address bar, no install hint, usable start
   screen within **3 seconds**.

## 3. Data stays (User Story 2, SC-003)

1. In the installed app, open **Diagnostics** (long-press the version number on the start
   screen). Check "Storage: persistent". If it says "not persistent", the warning banner must
   also be visible (FR-007). Note the result for research R2.
2. Tap **Add test data**. Expect: 1 Person with 3 Encounters: one at a one-day Event, one at a
   multi-day Event, and one casual (no Event). All test records are named `[test] …`.
3. Swipe the app away; reopen. Expect: same counts.
4. Restart the iPhone; reopen. Expect: same counts.
5. Change a visible text, push to `main`, wait for the build. Open the app, swipe it away,
   reopen. Expect: the new text **and** the same counts (FR-009).
6. Tap **Remove test data**. Expect: counts back to what they were before step 2.

## 4. No personal data leaves the device (SC-004)

1. Connect the iPhone to the Mac; Safari → Develop → [iPhone] → the app → Network.
2. Add and remove test data; switch language; reload.
3. Expect: only requests to `socialbutterfly2.pages.dev`, for app files. No request body
   or URL contains names, companies, URLs or notes.

## 5. Language (User Story 3, SC-005)

1. Switch to English. Expect: every visible text on the start screen, banners and Diagnostics
   changes at once; the title changes from "De Sociale Vlinder" to "The Social Butterfly".
2. Swipe the app away; reopen. Expect: English.
3. Switch back to Dutch.

## 6. Edge cases

| Check | How | Expected |
|---|---|---|
| No internet | Airplane mode, open the app | Friendly "needs internet" screen, not an iOS error |
| Connection drops while open | Turn on airplane mode with the app open | Banner; start screen and Diagnostics still work |
| Safari tab | Open the address in Safari | Install hint shown; data there is separate from the installed app |
| Someone else | Open the address on another phone | Empty app; none of Britt's data |
| Cost | Cloudflare dashboard | Free plan, €0 (SC-006) |
