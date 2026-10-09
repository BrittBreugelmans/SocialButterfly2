# Contract: Screens and texts (F2)

What the owner sees. All texts come from the dictionaries ([F0 i18n contract](../../001-app-foundation/contracts/i18n.md)).

## Screen flow

```text
app opens / comes back to the foreground
   │
   ├─ F0 offline screen / F1 daily choice (unchanged, they come first)
   │
   ├─ getNoteStep() returns a step? ──▶ Note step   (B18: same day only)
   └─ otherwise ──▶ Start

Start ──"Add by name"──▶ Form
Form ──"Search on LinkedIn"──┬─ no name match ─────────────────────────────▶ save ─▶ Note step + LinkedIn opens
                             └─ match ─▶ Same-name question ─┬─ pick Person ──▶ save ─▶ Note step + LinkedIn opens
                                                             │                    (met today: Note step only, no LinkedIn)
                                                             ├─ "No, new person" ─▶ save ─▶ Note step + LinkedIn opens
                                                             └─ back ─▶ Form (input kept, nothing saved)
Form ──back──▶ Start (nothing saved)
Note step ──save / skip──▶ Start
```

- "save" = one `addByName` call; LinkedIn opens only after it resolves (FR-009).
- Banners (F0) stay visible above every screen.

## Start screen (changed)

| Element | Behaviour |
|---|---|
| Context bar | Unchanged (F1). |
| "Add by name" (`start.addByName`) | Big primary button; one tap opens the form (FR-001). Replaces the `app.comingSoon` text. |
| Title, language switch, version label | Unchanged. |

## Quick mode form

| Element | Rule |
|---|---|
| Context (FR-002) | The F1 context bar, read-only (no `onChange`). |
| Name (`add.name`) | Focused; `maxLength` 100; required. |
| Company (`add.company`) | Optional; `maxLength` 100. |
| "Search on LinkedIn" (`add.search`) | Disabled while the name is blank or while saving. |
| Back (`add.back`) | To Start, nothing saved. |

## Same-name question

| Element | Rule |
|---|---|
| Title | `same.title` |
| One button per match | Name, company (or `same.noCompany`), `same.lastMet` with the date of the last Encounter in the app language. Tap = "yes, this Person". |
| "No, new person" (`same.newPerson`) | Saves a new Person. |
| Back (`add.back`) | Back to the form, input kept. |

## Note step

| Element | Rule |
|---|---|
| Title | `note.title` with the Person's name. |
| Already met | When `alreadyMetToday`: `note.alreadyMet` above the note. LinkedIn was not opened. |
| Note (`note.label`) | `<textarea>`, pre-filled with the Encounter's existing note. Placeholder `note.placeholder`. |
| "I connected" (`note.connected`) | Switch; starts at the Person's status; each change is stored at once (FR-018). |
| Save (`note.save`) | `finishNoteStep` with the note → Start. |
| Skip (`note.skip`) | `finishNoteStep` without a note → Start; an existing note stays. |
| "Open LinkedIn" (`note.openLinkedIn`) | Small link to `linkedInUrlFor(person)`, always present (research R1). |
| Opening failed | When `openLinkedIn` returned false: `note.openFailed` next to the link. |

Notes are only ever shown on this owner screen, never in guest mode (FR-017).

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `start.addByName` | Toevoegen via naam | Add by name |
| `add.title` | Wie heb je ontmoet? | Who did you meet? |
| `add.name` | Naam | Name |
| `add.namePlaceholder` | bv. Jan Peeters | e.g. Jan Peeters |
| `add.company` | Bedrijf (optioneel) | Company (optional) |
| `add.companyPlaceholder` | bv. Elmos | e.g. Elmos |
| `add.search` | Zoek op LinkedIn | Search on LinkedIn |
| `add.back` | Terug | Back |
| `same.title` | Is dit dezelfde persoon? | Is this the same person? |
| `same.lastMet` | Laatst ontmoet: {date} | Last met: {date} |
| `same.noCompany` | Geen bedrijf | No company |
| `same.newPerson` | Nee, nieuwe persoon | No, new person |
| `note.title` | Notitie bij {name} | Note for {name} |
| `note.label` | Notitie | Note |
| `note.placeholder` | Waarover hebben jullie gepraat? | What did you talk about? |
| `note.connected` | Ik heb geconnecteerd | I connected |
| `note.save` | Opslaan | Save |
| `note.skip` | Overslaan | Skip |
| `note.alreadyMet` | Je hebt {name} vandaag al ontmoet. | You already met {name} today. |
| `note.openLinkedIn` | Open LinkedIn | Open LinkedIn |
| `note.openFailed` | LinkedIn ging niet open. Tik hier: | LinkedIn didn't open. Tap here: |

Removed: `app.comingSoon` (replaced by the button). Tone per `wiki/merk-en-stijl.md`: friendly,
short. Final wording can be tuned in F11.
