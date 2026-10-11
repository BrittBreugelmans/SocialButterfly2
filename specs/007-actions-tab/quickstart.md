# Quickstart: validate F8 — Actions tab

Proves F8 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F7 is live and installed on the iPhone, **with existing contacts** (to check the database
  upgrade keeps them).
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm install
npm run typecheck   # includes: every new text exists in nl and en
npm test            # earlier tests + actions rules, dismissals, schema upgrade, Actions tab, badge
npm run build
```

Expected: everything passes.

## 2. Upgrade keeps the data

1. Before installing F8, count the contacts in Contacten → "Alle contacten".
2. Open the app after the F8 deploy (close it fully first, so the new version loads).
3. Expect the same contacts, notes and events. Diagnostics shows the same counts.

## 3. The list and the badge (User Stories 1 and 4)

1. The Acties tab shows a number. Open it: one card per person with open actions, newest first;
   people with a note, connected and a profile link have no card.
2. Add someone by name and skip the note: the number goes up by 3 (note, not connected, link).
3. A person with a note on an older encounter but none on the newest: **no** "Notitie ontbreekt"
   (B31).

## 4. Solve from the card (User Story 2)

1. "Schrijf notitie": type a note, Opslaan: the row disappears; the badge goes down.
2. Tap the LinkedIn link, tap Connect in LinkedIn, come back, "Ik heb geconnecteerd": the row
   disappears (SC-002: 2 taps in the app).
3. In LinkedIn copy the profile link (Delen → Link kopiëren), "Plak LinkedIn-link": the row
   disappears. When the card has no rows left, it disappears.
4. Tap a name: the person's detail; Terug: back on Acties.

## 5. Dismiss (User Story 3)

1. "Afwijzen" on "Nog niet geconnecteerd": gone, with "Ongedaan maken"; tap it: back. Dismiss
   again.
2. Close the app fully and reopen: still dismissed (SC-006).
3. Meet that person again (add by name in another context; at "Is dit dezelfde persoon?" tap
   that person):
   "Nog niet geconnecteerd" is back (B30).

## 6. Empty state and language

1. Solve or dismiss everything: "Alles gedaan, tijd om verder te fladderen." and no badge.
2. Switch to English: tab, cards and messages are in English ("All done — time to flutter on.").
