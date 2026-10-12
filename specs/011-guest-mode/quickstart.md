# Quickstart: F3 — Guest Mode

How to check that guest mode works. Screens and texts: [contracts/screens.md](contracts/screens.md).
State and routing: [data-model.md](data-model.md).

## 1. Prerequisites

- F11 logo in place (`app/public/logo.svg`, `ui/Logo.tsx`): the hold button uses it.
- From `app/`: `npm install`, then `npm run typecheck` and `npm test` pass.

## 2. Automated tests

```sh
cd app
npm test
```

Expected: all tests pass, including the new ones (see plan, Source Code):

- `guest-mode-ui.test.tsx`: greeting, privacy, "Done" disabled on blank, thank-you and back,
  language switch keeps input and does not write Settings, no tab bar / context bar / banners,
  hold under 2 s does nothing, hold 2 s exits, exit routing (name → filled form, no name → Add
  tab, daily choice first), same-name match gives no hint in guest mode.
- `settings-repository.test.ts`: `setGuestMode(true/false)`; nothing else changes.
- `add-by-name-ui.test.tsx`: initial values and the same-name question for a handed-over name.

## 3. Laptop (dev server)

`npm run dev`, open the app in a narrow window.

1. Add tab → "Geef door". Greeting, two fields, privacy line, NL/EN. No tab bar, no Event name.
2. Type "Jan Peeters" → "Klaar" → thank-you screen → "Terug": name still there.
3. Tap "EN": all texts English, name kept. Exit (step 5): owner screens are still Dutch.
4. Click the logo shortly: nothing. Hold it, let go after 1 s: ring resets, nothing.
5. Hold 2 s: the quick mode form shows "Jan Peeters" with the context bar.
6. Open guest mode, reload the page: guest mode again, fields empty. Hold 2 s with an empty name:
   Add tab.
7. With a stored "Jan Peeters": guest types "Jan Peeters" → no hint. After the hold, "Zoek op
   LinkedIn" shows "Is dit dezelfde persoon?" (F2).

## 4. iPhone (home-screen app, after deploy)

1. Steps 1–5 above, with a finger: holding the logo shows no image menu, no loupe, no text
   selection. A small finger move during the hold does not cancel it.
2. The keyboard opens on the name field after "Geef door" (as in F2). Fields do not zoom in.
3. Guest mode on → swipe the app away in the app switcher → open again: guest mode, not the tabs.
4. Guided Access (Settings → Accessibility → Guided Access): start it in guest mode. The guest
   cannot leave the app. Hold the logo, end Guided Access (triple-click), tap "Zoek op LinkedIn":
   LinkedIn opens.
5. Hand the phone to someone else (features.md, "Doorgeef-modus getest met iemand anders"): they
   type their name without help in under 30 s (SC-003).
