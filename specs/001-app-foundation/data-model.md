# Data Model: F0 — App Foundation

**Spec**: [spec.md](spec.md) (FR-006 – FR-014, FR-017) | **Research**: [research.md](research.md) R1, R6

All data lives in one on-device database (`sociale-vlinder`, schema version 1). Terms follow
`wiki/begrippen.md`.

## Common fields (every record)

| Field | Type | Rule |
|---|---|---|
| `id` | string (UUID v4) | Primary key. Set on create, never changes. |
| `createdAt` | string (ISO 8601 UTC) | Set on create, never changes. |
| `updatedAt` | string (ISO 8601 UTC) | Set on create; updated on every change. |

The repository layer sets these; UI code never does (FR-013).

## Person

| Field | Type | Required | Rule |
|---|---|---|---|
| `name` | string | yes | Trimmed, not empty. |
| `company` | string | no | Optional (open question #4). Trimmed; empty → `undefined`. |
| `profileUrl` | string | no | Normalized LinkedIn profile URL. **Unique** when present (FR-012). Never `''`. |
| `searchUrl` | string | no | LinkedIn people-search URL; used while `profileUrl` is missing. |
| `connectionStatus` | `'notConnected' \| 'connected'` | yes | Default `'notConnected'`. How it changes is open question #2 (F2/F7). |

- At least one of `profileUrl` or `searchUrl` MUST be present (constitution V: LinkedIn-only).
- No email or phone fields (FR-014).
- F0 rejects a `profileUrl` that is not in normalized form: it must start with `https://www.linkedin.com/in/`, have exactly one path segment after `/in/`, and have no query string, no fragment and no trailing slash.
  Turning user input into this form is F4/F5.

## Encounter

| Field | Type | Required | Rule |
|---|---|---|---|
| `personId` | string | yes | Must reference an existing Person. |
| `eventId` | string | no | References an existing Event, or absent for casual networking (FR-011). |
| `date` | string (ISO date `YYYY-MM-DD`) | yes | The day of the meeting. |
| `note` | string | no | Owner's private note (open question #5). Never shown in `guestMode`. |

## Event

| Field | Type | Required | Rule |
|---|---|---|---|
| `name` | string | yes | Trimmed, not empty. |
| `startDate` | string (ISO date) | yes | First day of the Event. |
| `endDate` | string (ISO date) | yes | Last day. MUST NOT be before `startDate`; MAY equal it (FR-018). |

## Settings (single record, key `settings`)

| Field | Type | Default | Rule |
|---|---|---|---|
| `key` | `'settings'` | `'settings'` | Fixed; the only Settings record. |
| `language` | `'nl' \| 'en'` | `'nl'` | Default Dutch until open question #8 (FR-016). |
| `activeEventId` | string | none | References an Event. Absent means casual networking: new Encounters get no Event. |
| `lastBackupAt` | string (ISO 8601 UTC) | none | Set by the CSV export (F10). Used for the reminder (FR-017, T10). |

Settings has `updatedAt` but no `createdAt`; its key is fixed.

## Relationships

```text
Person 1 ──< Encounter >── 0..1 Event
Settings ── activeEventId ──> Event (optional)
```

- One Person has one or more Encounters; each Encounter belongs to one Person and to one Event
  or none (casual networking).
- A Person with zero Encounters may exist briefly during a flow but is not a goal state.

## Indexes (schema version 1)

| Table | Indexes |
|---|---|
| `persons` | `id` (primary), `&profileUrl` (unique), `name` |
| `encounters` | `id` (primary), `personId`, `eventId`, `date` |
| `events` | `id` (primary), `startDate` |
| `settings` | key `settings` |

## Deletion

- Deleting a Person deletes its Encounters in the same transaction (no orphans).
- Deleting an Event that still has Encounters is refused in F0's repository (no silent loss,
  constitution IX). What the UI offers is decided in F1/F10.

## Schema evolution

- Every change to tables or indexes adds a new schema version with an upgrade step. Existing
  data MUST be carried over (FR-009).
- Future sync: UUIDs and `updatedAt` allow last-write-wins merging. Tombstones (`deletedAt`) can
  be added in a later version (research R6).

## Derived (not stored)

- **Actions** (F8) are computed from Person and Encounter state. Only `dismissed` Actions will
  need storage (open question #3).
- **"Encounters since last backup"** = Encounters with `createdAt > lastBackupAt`.
