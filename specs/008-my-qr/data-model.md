# Data model: F9 — My QR

**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md) (R5)

F9 adds **one optional field** to `Settings`. No new table, **no schema version change**: the
database stays at version 2 (F8). Person, Encounter, Event and Dismissal are unchanged.

## Settings (changed)

| Field | Type | Rule |
|---|---|---|
| `ownerProfileUrl` | `string`, optional | **New.** The owner's own profile link (B33). Absent = not set up yet. When present it MUST be a normalized profile link: `normalizeProfileUrl(value)` returns exactly `value` (`https://www.linkedin.com/in/<handle>`). |
| `updatedAt` | ISO 8601 UTC | Existing. Set on every change, including the own link (constitution IV). |
| other fields | — | Unchanged (`language`, `activeEventId`, `lastBackupAt`, `contextChosenOn`, `noteStepEncounterId`). |

Term: `ownerProfileUrl` = "Eigen profiel-URL" in `wiki/begrippen.md`.

### Not a Person

- `ownerProfileUrl` is never compared with `Person.profileUrl`. Pasting the own link creates no
  Person, no Encounter and no Action, and asks no merge question (FR-001).
- A stored Person with the same link may exist (for example after scanning her own QR in F5). The
  two stay unrelated.

### Lifecycle

```text
absent ──(valid paste on My QR)──► set ──(valid paste via "Change link")──► set (replaced)
  ▲                                  │
  └──────(F10 "delete all data")─────┘
```

- An invalid or refused paste never changes the stored value (FR-004, User Story 3).
- F9 has no way to clear it on its own (spec Assumptions).

## Derived, not stored

- **QR grid**: computed from `ownerProfileUrl` each time My QR is shown (`makeQr`, see
  [contracts/storage-api.md](contracts/storage-api.md)). Never stored, so it can never go out of
  sync with the link.

## Sync and export

- Sync-ready: `Settings` already carries `updatedAt`; last write wins later (constitution IV).
- CSV export: not decided. This belongs to open question #6 (F10).
