# Data Model: F2 — Add by Name (Quick Mode)

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md),
[../002-events/data-model.md](../002-events/data-model.md) | **Research**: [research.md](research.md) R2–R5

F2 changes only **Settings**. Person, Encounter and Event stay as in F0. Database schema stays at
**version 1** (no new tables or indexes).

## Settings (changed)

| Field | Type | Default | Rule |
|---|---|---|---|
| `key`, `language`, `activeEventId`, `lastBackupAt`, `contextChosenOn`, `updatedAt` | | | Unchanged (F0, F1). |
| **`noteStepEncounterId`** | string | none | **New.** The Encounter whose note step is open. Set by `addByName`; removed by `finishNoteStep`. Ignored when the Encounter is gone or its `date` is not today (B18). |

## How F2 fills existing fields

**Person** (new, from quick mode):

| Field | Value |
|---|---|
| `name` | Trimmed, not empty (F0 rule). Input `maxLength` 100. |
| `company` | Trimmed; empty → absent (F0 rule, B17). Input `maxLength` 100. |
| `searchUrl` | `buildSearchUrl(name, company)` (research R2). |
| `profileUrl` | Absent (F4 adds it). |
| `connectionStatus` | `'notConnected'`; the note step switch may set `'connected'` (B16). |

**Person** (existing, chosen in the same-name question): unchanged, except `connectionStatus`
via the switch (FR-007).

**Encounter**: `date` = today (local); `eventId` = `activeEventId` or absent (F1); `note` from the
note step, trimmed, empty → absent.

## Derived (not stored)

| Name | Meaning |
|---|---|
| **normalized name** | Trimmed, repeated spaces collapsed, lowercase (research R3). |
| **same-name match** | A stored Person whose normalized name equals the typed one. |
| **same context** | Both Encounters have the same `eventId`, or both have none. |
| **met today** | The Person has an Encounter with `date` = today in the same context as now (B19). |
| **LinkedIn link** | `profileUrl` if present, else `searchUrl` (FR-011). |
| **open note step** | `noteStepEncounterId` points to an existing Encounter dated today. |

## Note step lifecycle

```text
                addByName (new or existing Person, or met today)
   (none) ───────────────────────────────────────────────▶ open
     ▲                                                      │
     ├────── finishNoteStep (save, or skip) ────────────────┤
     └────── a new day (Encounter date ≠ today: ignored) ───┘

   iOS closes the app while open → on reopen the same day: note step shown again
```

While a note step is open, the app shows only that step (save or skip), so quick mode cannot
start for another person; B18's "not started another person" condition holds by design.

```text
```

`connectionStatus` changes are stored at once and do not change the lifecycle.
