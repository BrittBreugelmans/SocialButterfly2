# Data model: F10 — Settings & Data

**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md) (R3–R6, R11)

F10 adds **one optional field** to `Settings`, and changes how an Event is deleted. No new table,
**no schema version change**: the database stays at version 2 (F8).

## Settings (changed)

| Field | Type | Rule |
|---|---|---|
| `backupReminderLaterOn` | `YYYY-MM-DD`, optional | **New.** The local date on which the owner tapped "Later" on the backup reminder (FR-011). The reminder stays hidden while this equals today. |
| `lastBackupAt` | ISO 8601 UTC, optional | Exists since F0 (FR-017), **first written by F10**. The `takenAt` of the snapshot that went into the last finished backup (R3). It never moves back in time. |
| `language` | `'nl' \| 'en'` | Unchanged. Default `'nl'` (B37). It is the **only** field kept by "Delete all data". |
| other fields | — | Unchanged (`activeEventId`, `contextChosenOn`, `noteStepEncounterId`, `ownerProfileUrl`, `updatedAt`). |

## Event (changed lifecycle)

```text
created (F1) ──(edit name/dates, FR-013)──► changed ──► …
   │                                           │
   └──────────────(delete, FR-014/015)─────────┴──► gone
                                                    its Encounters stay, without eventId (B38)
                                                    activeEventId cleared if it was active
```

- Edit rules = create rules (B11): name not empty after trimming, `endDate ≥ startDate`.
- Editing never changes which Event is active (spec edge case).
- Deleting runs in one transaction (R5).

## Encounter (changed by one transition)

- When its Event is deleted: `eventId` is removed and `updatedAt` is set to now. `date`, `note`
  and `personId` stay. In Contacts it now shows under "without an event".
- Two casual Encounters of one Person on the same day can arise this way. Both stay (R5).

## Delete all data (R6)

| Table | After |
|---|---|
| `persons`, `encounters`, `events`, `dismissals` | empty |
| `settings` | `{ key: 'settings', language: <kept>, updatedAt: now }` |

So `activeEventId`, `contextChosenOn`, `noteStepEncounterId`, `ownerProfileUrl` (B33),
`lastBackupAt` and `backupReminderLaterOn` are all gone.

## Derived, not stored

### Backup snapshot (R3)

```ts
interface BackupSnapshot {
  takenAt: string        // ISO 8601 UTC, just before the read transaction
  persons: Person[]
  encounters: Encounter[]
  events: Event[]
}
```

Used for the CSV file and for the reminder rule (R4).

### CSV row (FR-004, R1)

| Column | From | Empty when |
|---|---|---|
| `name` | `Person.name` | event-only row |
| `company` | `Person.company` | no company |
| `profileUrl` | `Person.profileUrl` | no profile link yet |
| `searchUrl` | `Person.searchUrl` | none stored |
| `connectionStatus` | `Person.connectionStatus` | event-only row |
| `encounterDate` | `Encounter.date` | event-only row |
| `eventName` | `Event.name` | casual Encounter |
| `eventStartDate` | `Event.startDate` | casual Encounter |
| `eventEndDate` | `Event.endDate` | casual Encounter |
| `note` | `Encounter.note` | no note |

- One row per Encounter. Every Person is in the file, since every Person has at least one
  Encounter (B25).
- One extra row for each Event without Encounters, with only the event columns filled.
- Not in the file: IDs, timestamps, dismissed Actions, Settings and `ownerProfileUrl` (spec
  Assumptions). There is no import (B36), so the file does not need them.

### Reminder due (R4)

`isBackupReminderDue(snapshot, settings, today)`. It holds when `backupReminderLaterOn ≠ today`
and either:

- a new Encounter (`createdAt > lastBackupAt`) belongs to an Event that ended before today, or
  has no Event and a date before today; or
- the active Event is not running today, and a record that existed at the last backup was
  changed on an earlier day (`createdAt ≤ lastBackupAt < updatedAt`).

### Event list row (FR-012)

`{ event, encounterCount, isActive }`, sorted by `startDate`, newest first (as `listEvents`).

## Sync

- Sync-ready (constitution IV): every changed record gets a new `updatedAt`, including Encounters
  that lose their Event.
- A delete leaves no trace (no tombstones). That is the same as `deletePerson` in F7. Sync is
  out of scope for v1.
