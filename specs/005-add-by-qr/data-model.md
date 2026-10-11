# Data Model: F5 — Add by QR

**Spec**: [spec.md](spec.md) | **Base**: [../001-app-foundation/data-model.md](../001-app-foundation/data-model.md),
[../003-add-by-name/data-model.md](../003-add-by-name/data-model.md),
[../004-link-profile/data-model.md](../004-link-profile/data-model.md) | **Research**: [research.md](research.md) R4, R5

F5 adds **no fields** and keeps the database at **version 1**.

## How a scan fills a new Person

| Field | Value |
|---|---|
| `name` | The confirmed name: derived by `nameFromProfileUrl`, edited by the owner. Trimmed, not empty (F0). |
| `company` | Optional field (B22). Trimmed; empty → absent. |
| `profileUrl` | The scanned link after `normalizeProfileUrl` (F4). Unique. |
| `searchUrl` | `buildSearchUrl(name, company)` (F2), kept as a fallback. |
| `connectionStatus` | `'notConnected'` (the note step switch can change it, B16). |

**Encounter**: today, current context, as in F2 (`addByName`).

## Existing Persons

| Case | Result |
|---|---|
| A Person has the scanned `profileUrl` | Reused, unchanged (FR-008). New Encounter, or today's when met today (B19). |
| No link match; a Person **without** `profileUrl` has the same name and the owner picks it (B15) | Reused; gets the scanned `profileUrl`; name and company unchanged. |
| A Person with the same name but another `profileUrl` | Not a match; a new Person is saved. |

## Derived name (`nameFromProfileUrl`)

| Handle | Name |
|---|---|
| `jan-peeters` | Jan Peeters |
| `jan-peeters-1a2b3c` | Jan Peeters |
| `zo%C3%AB-peeters-42` | Zoë Peeters |
| `van-den-broeck` | Van Den Broeck |
| `jpeeters` | Jpeeters |
| `12345`, `j-1` | (empty) |
