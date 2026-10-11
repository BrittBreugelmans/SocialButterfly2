# Quickstart: validate F7 — Contacts

Proves F7 works end to end. Details: [contracts/screens.md](contracts/screens.md),
[contracts/storage-api.md](contracts/storage-api.md), [data-model.md](data-model.md).

## Prerequisites

- F5 is live and installed on the iPhone, with a few real or test contacts.
- Laptop with the Node version from `app/.nvmrc`.

## 1. Local checks

```bash
cd app
npm install
npm run typecheck   # includes: every new text exists in nl and en
npm test            # earlier tests + contact rows, search key, edit/delete in the repository, tabs, list, detail
npm run build
```

Expected: everything passes, including the existing note-step and link-profile tests (the paste
button moved into a shared component).

## 2. Tabs (FR-001–FR-001c)

1. Open the installed app: it opens on **Toevoegen** with the tab bar at the bottom, not hidden
   behind the home indicator.
2. Tap Acties, Mijn QR, Instellingen: each shows "Binnenkort" with one line.
3. Tap "Toevoegen via naam": the form has **no** tab bar. Add someone; after the note step the app
   is back on Toevoegen.
4. Count taps to add a person: the same as before F7 (SC-007).

## 3. List and search (User Stories 1 and 2, SC-002)

1. Tap Contacten: the list shows the people of the active Event, newest first, with company,
   status and date.
2. Pick "Alle contacten", "Zonder evenement" and another Event in "Toon": the list changes.
3. Type part of a name, with other capitals or without accents (e.g. "zoe" for "Zoë"): the list
   narrows while typing. Type nonsense: "Niemand gevonden…" and "Wis zoekopdracht".
4. **500 contacts**: long-press the version label on Toevoegen → Diagnostics → "500 testcontacten
   toevoegen". Back in Contacten → "Alle contacten": scroll and type in the search field.
   **Expect no noticeable wait** (under half a second). Then Diagnostics → "Testdata verwijderen".

## 4. Detail and LinkedIn (User Story 3)

1. Tap a person with a profile link: name, company, status, all encounters with Event and note.
   Tap "Open in LinkedIn": the **profile** opens.
2. Tap a person without a profile link: "Zoek op LinkedIn" and the line that it opens a search.
   Tap it: the LinkedIn search opens.
3. On that person, in LinkedIn copy the profile link (Share → Copy link), back in the app tap
   "Plak LinkedIn-link": "Profiel gekoppeld". The button now opens the profile.
4. Scroll down the list, open a person, tap "Terug": same view, search and scroll position.

## 5. Status, edit, delete (User Stories 4–7)

1. Flip "Ik heb geconnecteerd"; go back: the row shows the new status. Close the app completely
   and reopen: still changed (SC-005).
2. "Aanpassen": change name and company, Bewaar. Search for the new name: found. For a person
   without profile link, "Zoek op LinkedIn" now searches the new name.
3. Add a `[test]` person twice in two contexts (two encounters). Delete one encounter: one
   remains. Delete the last one: the app asks to delete the whole person; Annuleren keeps it.
4. "Verwijder persoon" on the test person: the confirmation names the person and the number of
   encounters. Confirm: back in the list with "… is verwijderd."; searching finds nothing (SC-004).

## 6. Language

Switch to English on Toevoegen: tabs, list, detail and confirmations are in English.
