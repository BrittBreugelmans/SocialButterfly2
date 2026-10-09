# Quickstart: validate F4 — Link the Profile URL

Proves F4 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F2 is live and installed on the iPhone (see [../003-add-by-name/quickstart.md](../003-add-by-name/quickstart.md)).
- The LinkedIn app is installed and logged in.
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm run typecheck   # includes: every new text exists in nl and en
npm test            # F0–F2 tests + normalization, linkProfileUrl, mergePersons, note step
npm run build
```

Expected: everything passes.

## 2. Paste a profile link (User Story 1)

1. Add a person you can find on LinkedIn (F2). LinkedIn opens.
2. In LinkedIn, open the profile → Share → Copy link. Return to the app (note step).
3. Tap "Plak LinkedIn-link". iOS shows a "Plakken" bubble; tap it. **Count: 2 taps** (SC-001).
4. Expect "Profiel gekoppeld: linkedin.com/in/…". Tap "Open LinkedIn": the **profile** opens, not
   the search.
5. Tap "Andere link plakken" with the same link on the clipboard: nothing changes.
6. Tap "Plak LinkedIn-link" and tap next to the iOS bubble: nothing happens, no error.

## 3. Wrong content

1. Copy some text (e.g. from Notes) and paste: "Geen LinkedIn-profiel-link gevonden".
2. Copy a LinkedIn company page link and paste: the same message.
3. If you have one, a `lnkd.in/…` link: "Korte lnkd.in-links werken niet".

## 4. Merge (User Story 2, B21)

1. Person A: add `Test Jan`, paste the profile link of someone (e.g. a colleague), type the note
   `eerste`, save.
2. Person B: add `Test Jan B` (different name, so no same-name question), type the note `tweede`
   (do not save yet).
3. Paste the **same** profile link. Expect "Dit profiel hoort bij Test Jan. Samenvoegen?".
4. Tap "Annuleren": no link on Test Jan B, nothing changed.
5. Paste again → "Samenvoegen". Expect "Samengevoegd met Test Jan." and the note step now for
   Test Jan, with `eerste` and `tweede` on two lines. Tap "Opslaan".
6. Check the data (F2 quickstart, "Looking at the data"): one Person `Test Jan`, Test Jan B is
   gone; Test Jan has **one** Encounter today with both notes (same day and context, B19).

## 5. After an iOS kill

Paste a link, swipe the app away, reopen (same day): the note step comes back with "Profiel
gekoppeld".

## 6. Language

Switch to English: the paste button, messages and merge question are in English.
