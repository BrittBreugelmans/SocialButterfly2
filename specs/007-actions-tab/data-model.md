# Data Model: F8 — Actions tab

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md),
[../006-contacts/data-model.md](../006-contacts/data-model.md) | **Research**: [research.md](research.md) R1–R3

F8 adds **one table** and moves the database to **schema version 2**. Persons, Encounters, Events
and Settings do not change.

## Dismissal (NEW)

| Field | Type | Required | Rule |
|---|---|---|---|
| `id` | string (UUID v4) | yes | Primary key; set on create, never changes. |
| `createdAt` | string (ISO 8601 UTC) | yes | Set on create, never changes. |
| `updatedAt` | string (ISO 8601 UTC) | yes | Set on create and on every re-dismiss. |
| `personId` | string | yes | Must reference an existing Person. |
| `type` | `'noteMissing' \| 'notConnected' \| 'profileLinkMissing'` | yes | The Action type (B7, B31). |
| `dismissedAt` | string (ISO 8601 UTC) | yes | When the owner last dismissed it; compared with Encounter `createdAt` (B30). |

- **Unique**: at most one Dismissal per `personId` + `type`. Dismissing again updates
  `dismissedAt` and `updatedAt`.
- **Deleted with its Person** (`deletePerson`), and when its Person disappears in a merge
  (`mergePersons`), in the same transaction.

## Indexes (schema version 2)

| Table | Indexes |
|---|---|
| `persons` | unchanged: `id`, `&profileUrl`, `name` |
| `encounters` | unchanged: `id`, `personId`, `eventId`, `date` |
| `events` | unchanged: `id`, `startDate` |
| `settings` | unchanged: key `settings` |
| `dismissals` | **NEW**: `id` (primary), `personId`, `&[personId+type]` (unique) |

**Upgrade 1 → 2**: adds the empty `dismissals` table. No existing record is read or changed.
Version 1 stays declared in `db.ts` as it is (F0 rule).

## Action (derived, not stored)

For each Person, in this order:

| Type | Open when (gap) | Belongs to |
|---|---|---|
| `noteMissing` | **no** Encounter of the Person has a `note` (B31) | Person |
| `notConnected` | `connectionStatus === 'notConnected'` | Person |
| `profileLinkMissing` | `profileUrl` is absent | Person |

An Action is **open** when its gap exists **and**:

- there is no Dismissal for that Person and type, **or**
- the Person's newest Encounter `createdAt` is **later** than the Dismissal's `dismissedAt` (B30).

| Event after dismissing | Action comes back? |
|---|---|
| A new Encounter is saved for the Person (add by name, QR) | Yes, if the gap still exists |
| Today's Encounter is reused (B19) | No (nothing new is saved) |
| An Encounter is deleted (F7) | No |
| Persons are merged (B21): Encounters move, `createdAt` stays | No |
| The gap is solved | The Action is gone anyway; the Dismissal stays but has no effect |

## Card (derived)

| Field | Meaning |
|---|---|
| `person` | The Person. |
| `lastEncounter` | Newest Encounter by `date`, then `createdAt`. Shown on the card; "Write note" writes here (B31). |
| `actions` | Open Action types, in the order above. Only Persons with at least one get a card. |

Sort: `lastEncounter.date` newest first, then `lastEncounter.createdAt`, then name.

**Badge** = the total number of open Actions over all cards.

## Writes F8 makes to existing records

| Record | Field | How |
|---|---|---|
| Encounter | `note` | "Write note": existing `updateEncounter` (trimmed; blank is not saved). |
| Person | `connectionStatus` | "I connected": existing `updatePerson`. |
| Person | `profileUrl` | "Paste LinkedIn link": existing `linkProfileUrl` / `mergePersons` (F4). |
