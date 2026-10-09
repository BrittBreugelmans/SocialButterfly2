# Quickstart: validate F2 — Add by Name (Quick Mode)

Proves F2 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F1 is live and installed on the iPhone (see [../002-events/quickstart.md](../002-events/quickstart.md)).
- The LinkedIn app is installed and logged in; LinkedIn is also logged in in Safari.
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm run typecheck   # includes: every new text exists in nl and en
npm test            # F0 + F1 tests + search link, name match, addByName, note step
npm run build
```

Expected: everything passes.

## 2. Add someone (User Story 1)

After the F2 deploy, open the installed app and choose an Event (e.g. `Devoxx 2026`).

1. Tap "Toevoegen via naam". The form shows "Je bent op Devoxx 2026".
2. "Zoek op LinkedIn" is greyed out. Type spaces only: still greyed out.
3. Type `Jan Peeters`, company `Elmos`, tap "Zoek op LinkedIn". **Count: typing + 2 taps**
   (SC-001). LinkedIn shows a people search for "Jan Peeters Elmos".
4. Add a second person with an empty company: the search is for the name only.

## 3. How LinkedIn opens (research R1)

During section 2, write down which of these happened. All three are fine:

- the **LinkedIn app** opened;
- **Safari** opened;
- a **browser view** slid over the app (with "Done" / "Gereed").

If **nothing** opened: the note step shows "LinkedIn ging niet open" with an "Open LinkedIn"
link; tap it and LinkedIn opens. Note the result in `wiki/log.md`.

## 4. Note step and "I connected" (User Story 3)

1. Return to the app: the note step for Jan Peeters is shown.
2. Turn on "Ik heb geconnecteerd", type a note, tap "Opslaan": the start screen appears.
3. Add another person, return, tap "Overslaan" without touching the switch.
4. **Time the whole flow with skip: under 30 s in the app** (SC-002).
5. Check the stored data (see "Looking at the data" below): Jan Peeters has
   `connectionStatus: 'connected'` and the note on his Encounter; the other person is
   `'notConnected'`, no note.

## 5. iOS closes the app (B18)

1. Add `Test Kill`, tap "Zoek op LinkedIn".
2. In the app switcher, swipe the Sociale Vlinder away. Reopen it: the note step for Test Kill
   comes back. Skip it. Reopen again: the start screen, no note step.
3. Add `Test Kill 2`, swipe the app away. Set the iPhone date to tomorrow (Settings → General →
   Date & Time). Open the app: the F1 choice appears, and after choosing, the start screen; the
   note step does **not** come back. Turn "Set Automatically" back on.

## 6. Same name (User Story 2)

1. Add `jan  peeters` (lowercase, two spaces). Expect "Is dit dezelfde persoon?" with Jan Peeters,
   Elmos and today's date.
2. Tap "Terug": back at the form, the text is still there, nothing saved.
3. Tap "Zoek op LinkedIn" again → pick Jan Peeters: "Je hebt Jan Peeters vandaag al ontmoet." and
   the note step with the earlier note; LinkedIn does **not** open (B19).
4. Switch to casual networking (context bar), add `Jan Peeters` → pick the stored Jan Peeters: a
   **new** Encounter, LinkedIn opens (different context).
5. Add `Jan Peeters` → "Nee, nieuwe persoon": a second Jan Peeters exists (only because you chose it).

## 7. Encounters under the Event (F1 FR-009, SC-004)

The contacts from section 2 have today's date and Devoxx 2026's id as `eventId`; the Encounter
from section 6.4 has no `eventId`. Diagnostics (long press on the version) shows the counts going
up; the details are checked as below.

## Looking at the data

There is no contact list until F7. Connect the iPhone to a Mac with a cable, open Safari on the
Mac → Develop → *iPhone* → the Sociale Vlinder → Storage → IndexedDB → `sociale-vlinder`, and
look at `persons`, `encounters` and `settings`. Afterwards, remove the test persons via
Diagnostics only if their names start with `[test]`; otherwise they stay until F7 can delete them.

## 8. Language

Switch to English: start button, form, question and note step are in English; the last-meeting
date is in English.
