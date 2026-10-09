# Data Model: F1 — Events

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md)
| **Research**: [research.md](research.md) R1, R4

F1 changes only **Settings**. Event, Encounter and Person stay as in F0. Database schema stays at
**version 1** (no new tables or indexes).

## Settings (changed)

| Field | Type | Default | Rule |
|---|---|---|---|
| `key` | `'settings'` | `'settings'` | Unchanged. |
| `language` | `'nl' \| 'en'` | `'nl'` | Unchanged. |
| `activeEventId` | string | none | References an Event. Absent means casual networking. |
| `lastBackupAt` | string (ISO 8601 UTC) | none | Unchanged (F10). |
| **`contextChosenOn`** | string (ISO date `YYYY-MM-DD`, local) | none | **New.** Local date on which the owner last chose an Event or casual networking. Set together with `activeEventId` (FR-005, FR-007). |
| `updatedAt` | string (ISO 8601 UTC) | | Unchanged. |

## Rules used by F1 (unchanged from F0)

- **Event**: `name` trimmed, not empty; `startDate` and `endDate` are ISO dates; `endDate` MUST NOT
  be before `startDate` and MAY equal it (FR-003, B11). Names need not be unique.
- **Encounter**: `eventId` optional; absent means casual networking.

## Derived (not stored)

| Name | Meaning |
|---|---|
| **needs daily choice** | `contextChosenOn` is missing or not equal to today's local date (B13). |
| **current Event** | `startDate ≤ today ≤ endDate`. |
| **upcoming Event** | `startDate > today`. |
| **past Event** | `endDate < today`. |
| **previous choice still running** | `activeEventId` points to a current Event; it goes on top of the choice (FR-005). |

## State transitions of the context

```text
           choose Event / create Event            choose casual
 (none) ───────────────────────────────▶ Event ◀──────────────▶ casual
   │                                       ▲  │                   ▲
   └──────────── choose casual ────────────┼──┘                   │
                                           │                      │
   new day (contextChosenOn ≠ today) ──▶ ask again; previous choice offered on top if still current
```

Every transition sets `contextChosenOn` to today in the same write (research R5).
