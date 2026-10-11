# Data Model: F7 — Contacts

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md),
[../003-add-by-name/data-model.md](../003-add-by-name/data-model.md),
[../004-link-profile/data-model.md](../004-link-profile/data-model.md),
[../005-add-by-qr/data-model.md](../005-add-by-qr/data-model.md) | **Research**: [research.md](research.md) R3, R8, R9

F7 adds **no fields** and keeps the database at **version 1**. It reads Persons, Encounters and
Events, and changes or deletes Persons and Encounters.

## What F7 changes

| Record | Field | Change in F7 | Rule |
|---|---|---|---|
| Person | `name` | Edit (B27) | Trimmed, not empty (F0). |
| Person | `company` | Edit (B27) | Trimmed; empty → absent. |
| Person | `searchUrl` | Follows name and company | Recomputed with `buildSearchUrl(name, company)` on every edit (R8). |
| Person | `connectionStatus` | Switch (B16) | `'notConnected'` ↔ `'connected'`, saved at once. |
| Person | `profileUrl` | Set by "Paste LinkedIn link" only when missing (F4) | Unique; never changed by editing name or company. |
| Person | `updatedAt` | Every change | Set by the repository (F0 FR-013). |
| Person + Encounters | — | Delete Person | One transaction (F0 `deletePerson`). |
| Encounter | — | Delete one (B25) | Refused when it is the Person's only Encounter (`LastEncounterError`). |
| Encounter | `note` | Edit mode (B28, B29) | Trimmed; empty → absent. Saved in the same transaction as name and company. |
| Encounter | `updatedAt` | Only when its note changed | Set by the repository. |

Notes belong to an **Encounter**, not to a Person (B28, open question #5 closed).

## Delete rules

| Case | Result |
|---|---|
| Delete Person | The Person and all their Encounters (with notes) are gone, or nothing changed (constitution IX). |
| Delete an Encounter; the Person has 2 or more | Only that Encounter and its note are gone. |
| Delete an Encounter; it is the only one | Not allowed on its own; the screen offers "Delete Person" instead. The repository refuses as a safety net. |
| The deleted Encounter was the open note step (B18) | Nothing to clean up: `getNoteStep()` ignores an id whose Encounter is gone (F2). |
| An Event loses its last Encounter | The Event stays (managing Events is F10, B14). |

## Derived (not stored): a contact row

Built in memory by `buildContactRows` (research R3) every time Contacts loads or the view or
search changes.

| Field | Meaning |
|---|---|
| `person` | The Person. |
| `lastMet` | Newest `date` among the Person's Encounters **in the chosen view**. |
| `encounterCount` | Number of the Person's Encounters in the chosen view. |

### Views

| View | A Person is in it when… | Default |
|---|---|---|
| Event *X* | at least one Encounter has `eventId = X` | when *X* is the active Event |
| Without event | at least one Encounter has no `eventId` (casual networking, B12) | — |
| All contacts | always (also a Person without Encounters, which should not exist) | during casual networking |

Sort: `lastMet` newest first, then name. Each Person appears at most once per view.

### Search key

`searchKey(text)`: Unicode NFD, combining marks removed, lower case, repeated spaces collapsed,
trimmed. A Person matches when `searchKey(name)` contains `searchKey(query)` (research R4).
Different from F2's `normalizeName`, which keeps accents for the same-name question.

## Timeline (detail screen)

All of the Person's Encounters, from every view, newest first by `date` then `createdAt`
(existing `listEncountersByPerson`). Each shows `date`, the Event's `name` or "Without event",
and the `note` (or "No note").
