# Quickstart: validate F10 — Settings & Data

Proves F10 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F9 is live and installed on the owner's iPhone.
- Numbers on the iPhone. Excel with Belgian settings on a laptop (for SC-002).
- Laptop with the Node version from `app/.nvmrc`.
- **Make a backup another way first?** Not possible yet. So in section 6, use test data only
  (Diagnostics → "Add test data"), or do section 6 last, after a real backup from section 3.

## 1. Local checks

```bash
cd app
npm install
npm run typecheck   # includes: every new text exists in nl and en
npm test            # earlier tests + CSV, reminder rule, deleteEvent keeps Encounters, deleteAllData, Settings screens
npm run build       # no new dependency, so the bundle grows only a little
```

Expected: everything passes. The old test "refuses to delete an Event that still has Encounters"
is replaced by "keeps its Encounters without an Event" (B38).

## 2. Settings tab (FR-001, FR-002)

1. Tap **Instellingen**: Back-up, Evenementen, Taal, "Alle data wissen" and the version. No
   "binnenkort" any more.
2. The **Toevoegen** tab no longer shows the language switch or the version.
3. Long press on the version in Settings: Diagnostics opens, as before.
4. Switch to **EN**: all texts change; close and reopen the app: still English. Switch back.

## 3. CSV backup (User Story 1)

1. Diagnostics → "Add test data". Add one contact by name with a note that has a comma, a
   semicolon, a line break, "é" and an emoji, and one note that starts with "- ".
2. Settings → **Maak CSV-back-up**: the share sheet opens at once (no error, research R2).
3. **Bewaar in Bestanden** → Save. Settings shows "Laatste back-up: <today, now>".
4. Open the file in Numbers: one row per Encounter, 10 columns, accents and emoji intact, the note
   with a line break in one cell, the "- " note shown as `'- …`.
5. AirDrop or mail the file to the laptop, and open it in Excel with Belgian settings: the columns
   are split right away (B39), and nothing shows `#NAME?`.
6. **Cancel checks** (research R2):
   - Open the share sheet and close it with ✕: the last backup time does not change.
   - Choose "Bewaar in Bestanden", then Cancel in the Files picker: write down whether the time
     changed. Both outcomes are acceptable; note it in the log.
7. With an empty app (after section 6): the backup still works and holds only the header row.

## 4. Backup reminder (User Story 2)

The rule is tested in `npm test` for every case. On the phone, check the visible behaviour:

1. Create an Event that ends **today**, add someone, make no backup. Today: no reminder.
2. The next day (or set the iPhone date one day ahead): the first open shows the reminder on
   **Toevoegen**.
3. **Later**: the banner goes. Reopen the app the same day: still gone.
4. Next day again: it is back. **Maak back-up** → save: the banner goes and does not come back.
5. B40: after a backup, write a note on the Acties tab. The same day: no reminder. The next day:
   the reminder appears.

Set the date back to automatic afterwards.

## 5. Manage Events (User Story 3)

1. Settings → Evenementen: each Event with its dates and number of encounters; the active one is
   marked "actief".
2. Rename the active Event: the context bar on Toevoegen shows the new name (research R8).
3. Set the end date before the start date: not possible (the end date moves along, as in F1).
4. Delete an Event **with** encounters: the confirmation says "De N ontmoetingen blijven
   bewaard". After confirming, Contacten → "Zonder evenement" shows them, with their notes (B38).
5. Delete the active Event: the context bar shows networking without an Event.

## 6. Delete all data (User Story 5)

1. Settings → **Alle data wissen**: the counts appear. "Alles wissen" is disabled.
2. Type `wissen` (lower case): the button is enabled (B41). Clear the field: disabled again.
3. "Maak eerst een back-up" opens the share sheet; afterwards the panel is still open.
4. Confirm: the daily choice appears, as on a first start. Contacten, Acties and the event list
   are empty. Mijn QR asks for the link again. The language stays as it was.

## 7. Not reachable from guest mode

When F3 exists: guest mode never shows the tab bar, so Settings, backup and delete-all are out of
reach (FR-020). Until then, nothing to check.
