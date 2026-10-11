# Contract: Screens and texts (F7)

What the owner sees. Reuses F2's form labels, F4's link texts and merge question, and the note
step's "I connected" switch.

## Screen flow

```text
                ┌──────────── tab bar (only on these five) ────────────┐
                │ Add │ Contacts │ Actions │ My QR │ Settings          │
                └──┬──────┬──────────┬────────┬────────┬───────────────┘
                   │      │          └────────┴────────┴─▶ Coming soon (F8–F10)
                   │      ▼
                   │   Contact list ──tap row──▶ Person detail ──Back──▶ Contact list
                   │      │                         ├─ Edit ─▶ edit form (Save / Cancel)
                   │      │                         ├─ Delete encounter ─▶ confirm
                   │      │                         │     (only one left ─▶ confirm delete Person)
                   │      │                         └─ Delete person ─▶ confirm ─▶ Contact list
                   │      └─ empty: "Add someone" ─▶ Add tab
                   ▼
                 Start screen (F1/F2/F5) ─▶ add flows and note step (no tab bar) ─▶ back to Add
```

The app opens on **Add** (FR-001b). Daily choice, new Event, add by name, scan, note step and
(later) guest mode never show the tab bar (FR-001c).

## Tab bar

| Element | Behaviour |
|---|---|
| `<nav aria-label={tabs.label}>` | Fixed at the bottom, above the iPhone home indicator (safe area). |
| Five buttons | Icon + label: `tab.add`, `tab.contacts`, `tab.actions`, `tab.myQr`, `tab.settings`. Chosen one: `aria-current="page"`, blue. |
| Tap | Switches tab at once. Tapping the chosen tab again does nothing. |

## Coming soon (Actions, My QR, Settings)

| Element | Behaviour |
|---|---|
| Butterfly + title | `soon.title` |
| One line | `soon.actions` / `soon.myQr` / `soon.settings` |

Nothing else; no buttons.

## Add tab

The current start screen, unchanged: context bar, "Add by name", "Scan QR", language switch,
version label (long press → Diagnostics).

## Contact list

| Element | Behaviour |
|---|---|
| Title | `contacts.title` |
| View picker | Native select, label `contacts.show`. Options: `contacts.all`, `contacts.casual`, then every Event newest first by start date (name + dates). Starts on the active Event, or `contacts.all` during casual networking. |
| Search field | `type="search"`, placeholder `contacts.search`, filters while typing; the clear button (×) empties it. Stays when the view changes. |
| Row (button, whole row tappable) | Name (bold, one line, shortened with …), company (one line, or nothing), status chip `contacts.connected` / `contacts.notConnected`, date of last Encounter in the view. Accessible name "name, company, status, date" for VoiceOver. |
| Status line (`role="status"`) | `contacts.deleted` after deleting a Person; cleared on the next change. |
| Empty view | `contacts.empty` + button `contacts.emptyAdd` → Add tab. |
| No search results | `contacts.noMatch` + button `contacts.clearSearch`. |

## Person detail

| Element | Behaviour |
|---|---|
| Back (`add.back`) | To the list, same view, search and scroll position. |
| Name, company | Full text. |
| Edit (`person.edit`) | Turns name and company into inputs (`add.name`, required; `add.company`; `maxLength` 100) with `person.save` and `link.cancel`. Empty name: `person.errorName`, not saved. |
| LinkedIn link | Profile known: link `person.openProfile` + `link.linked` *linkedin.com/in/…*. Not known: link `person.searchLinkedIn` + line `person.noProfile`. Always `target="_blank" rel="noopener"`. |
| Paste LinkedIn link | Only without a profile link: F4's `link.paste` button, messages and merge question (`ProfileLinkControl`). After a merge the detail shows the remaining Person. |
| Status switch | `note.connected`, `role="switch"`, saved at once. |
| Timeline title | `person.timeline` |
| Timeline item | Date; Event name or `contacts.casual`; the note in full (line breaks kept) or `person.noNote` (muted); a small button `encounter.delete`. |
| Delete person (`person.delete`) | Red text button at the bottom. |

### Confirm panels (in the page, focus moves to them)

| Trigger | Text | Buttons |
|---|---|---|
| Delete person | `person.deleteQuestionOne` / `person.deleteQuestionMany` (name, count) | `person.deleteConfirm` (red), `link.cancel` |
| Delete encounter (2+ left) | `encounter.deleteQuestion` (date, Event) + `encounter.deleteNote` when it has a note | `person.deleteConfirm` (red), `link.cancel` |
| Delete encounter (the only one) | `encounter.deleteLast` (name) | `person.deleteConfirmPerson` (red), `link.cancel` |

While a delete runs, both buttons are disabled.

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `tabs.label` | Menu | Menu |
| `tab.add` | Toevoegen | Add |
| `tab.contacts` | Contacten | Contacts |
| `tab.actions` | Acties | Actions |
| `tab.myQr` | Mijn QR | My QR |
| `tab.settings` | Instellingen | Settings |
| `soon.title` | Binnenkort | Coming soon |
| `soon.actions` | Hier verschijnen straks je openstaande acties. | Your open actions will show up here soon. |
| `soon.myQr` | Hier komt straks jouw LinkedIn-QR, met vlinder. | Your LinkedIn QR code, with butterfly, is coming here soon. |
| `soon.settings` | Hier kan je straks evenementen beheren, de taal kiezen en een back-up maken. | Soon you can manage events, choose the language and make a backup here. |
| `contacts.title` | Contacten | Contacts |
| `contacts.show` | Toon | Show |
| `contacts.all` | Alle contacten | All contacts |
| `contacts.casual` | Zonder evenement | Without event |
| `contacts.search` | Zoek op naam | Search by name |
| `contacts.connected` | Geconnecteerd | Connected |
| `contacts.notConnected` | Nog niet geconnecteerd | Not connected yet |
| `contacts.empty` | Nog niemand hier. Tijd om te fladderen! | Nobody here yet. Time to flutter! |
| `contacts.emptyAdd` | Iemand toevoegen | Add someone |
| `contacts.noMatch` | Niemand gevonden voor "{query}". | Nobody matches "{query}". |
| `contacts.clearSearch` | Wis zoekopdracht | Clear search |
| `contacts.deleted` | {name} is verwijderd. | {name} was deleted. |
| `person.edit` | Aanpassen | Edit |
| `person.save` | Bewaar | Save |
| `person.errorName` | Geef een naam in. | Enter a name. |
| `person.openProfile` | Open in LinkedIn | Open in LinkedIn |
| `person.searchLinkedIn` | Zoek op LinkedIn | Search on LinkedIn |
| `person.noProfile` | Profiel-link nog niet gekend: dit opent een zoekopdracht. | Profile link not known yet: this opens a search. |
| `person.timeline` | Ontmoetingen | Encounters |
| `person.noNote` | Geen notitie | No note |
| `person.delete` | Verwijder persoon | Delete person |
| `person.deleteQuestionOne` | {name} en 1 ontmoeting verwijderen? Dit kan niet ongedaan gemaakt worden. | Delete {name} and 1 encounter? This can't be undone. |
| `person.deleteQuestionMany` | {name} en {count} ontmoetingen verwijderen? Dit kan niet ongedaan gemaakt worden. | Delete {name} and {count} encounters? This can't be undone. |
| `person.deleteConfirm` | Verwijder | Delete |
| `person.deleteConfirmPerson` | Verwijder persoon | Delete person |
| `encounter.delete` | Verwijder ontmoeting | Delete encounter |
| `encounter.deleteQuestion` | Ontmoeting van {date} ({event}) verwijderen? | Delete the encounter of {date} ({event})? |
| `encounter.deleteNote` | De notitie wordt ook verwijderd. | The note will be deleted too. |
| `encounter.deleteLast` | Dit is de enige ontmoeting met {name}. De hele persoon verwijderen? Dit kan niet ongedaan gemaakt worden. | This is the only encounter with {name}. Delete the whole person? This can't be undone. |
| `diagnostics.addManyTestData` | 500 testcontacten toevoegen | Add 500 test contacts |

Reused: `add.back`, `add.name`, `add.company`, `link.*`, `note.connected`.
Tone per `wiki/merk-en-stijl.md`: friendly, short.
