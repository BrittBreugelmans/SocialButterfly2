# Quickstart: validate F1 — Events

Proves F1 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F0 is live and installed on the iPhone (see [../001-app-foundation/quickstart.md](../001-app-foundation/quickstart.md)).
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm run typecheck   # includes: every new text exists in nl and en
npm test            # F0 tests + choice ordering, daily choice, context functions
npm run build
```

Expected: everything passes.

## 2. First opening (User Story 1 and 2)

After the F1 deploy, open the installed app on the iPhone.

1. Expect the choice ("Waar ben je vandaag?") with only "Nieuw evenement" and "Netwerken zonder
   evenement" (assuming only `[test]` data was removed in F0).
2. Tap "Nieuw evenement", type `Devoxx 2026`, keep the dates, tap "Opslaan en starten".
   **Time it: under 20 seconds** (SC-001). Expect the start screen with "Je bent op Devoxx 2026"
   and today's date.
3. Tap the context bar → choice → "Nieuw evenement". Set the start date after the end date: the
   end date moves along. Try to set the end date before the start date: not possible / save
   refused with a message (SC-004). Tap "Terug".
4. Create a three-day Event (start today, end today + 2). Expect the start screen with a date
   range.

## 3. Same day, next day (FR-005, B13)

1. Swipe the app away and reopen. Expect the **start screen directly**, no choice.
2. iPhone Settings → General → Date & Time → turn off "Set Automatically" → set tomorrow.
3. Open the app. Expect the choice with **"Verder met <three-day Event>"** on top. Tap it:
   start screen (at most 2 taps, SC-002).
4. Set the date to 3 days later (the Event has ended). Open the app: the choice appears, the
   Event is under "Voorbij", no "Verder met" button.
5. Turn "Set Automatically" back on.

## 4. Casual networking and switching (User Story 3)

1. Tap the context bar → "Netwerken zonder evenement". Expect "Netwerken zonder evenement" on the
   start screen.
2. Reopen the app the same day: still casual.
3. Switch back to an Event via the context bar: the start screen shows it.

## 5. Language

Switch to English: the choice, the form and the context bar are in English, dates are formatted
in English (e.g. "6–8 Oct 2026").

## 6. Linking Encounters (FR-009, SC-003)

Covered by automated tests in `npm test` (no screen adds contacts until F2). In F2's quickstart,
check that a contact added during an Event appears under that Event.
