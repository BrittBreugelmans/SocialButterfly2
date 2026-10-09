# Data Model: F4 — Link the Profile URL

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md),
[../003-add-by-name/data-model.md](../003-add-by-name/data-model.md) | **Research**: [research.md](research.md) R2–R4

F4 adds **no fields** and keeps the database at **version 1**. It sets and moves existing data.

## Person.profileUrl (rules used by F4)

| Rule | Source |
|---|---|
| Normalized: `https://www.linkedin.com/in/<handle>`, no query, fragment or trailing slash | F0 |
| `<handle>`: decoded, trimmed, lowercase, then percent-encoded again | F4 research R2 |
| Unique over all Persons (index `&profileUrl`) | F0 FR-012 |
| Set or replaced by `linkProfileUrl`; never removed in F4 | F4 FR-004 |

`searchUrl` stays when a profile link is added. `linkedInUrlFor` prefers `profileUrl` (F2).

## Merge rules (`mergePersons`, B21)

| Field / record | Result |
|---|---|
| `into.name`, `into.profileUrl`, `into.searchUrl` | Kept. |
| `into.company` | Kept; `from.company` when `into` had none. |
| `into.connectionStatus` | `'connected'` if either Person was connected. |
| `into.updatedAt` | Now. |
| Encounter of `from`, no clash | `personId` → `into.id`, `updatedAt` now. |
| Encounter of `from` with a clash (same `date`, same `eventId` or both absent) | Its note is appended to `into`'s Encounter (new line; empty notes skipped); the `from` Encounter is deleted. |
| `Settings.noteStepEncounterId` | Points to the Encounter that now holds the note step. |
| `from` Person | Deleted. |

All in one transaction (FR-007).

## Derived (not stored)

| Name | Meaning |
|---|---|
| **profile linked** | `profileUrl` is present. The Action "profile link missing" (F8) is the opposite (FR-009). |
| **short form** | `linkedin.com/in/<handle>`, shown on the note step. |
