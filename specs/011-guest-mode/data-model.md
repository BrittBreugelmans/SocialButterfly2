# Data Model: F3 — Guest Mode

No new entities, no new table, **still schema version 2**. Guest mode never creates or changes a
Person, Encounter or Event (FR-010).

## Settings (changed)

| Field | Type | Rule |
|---|---|---|
| `guestModeOn` | `true`, optional | Present while guest mode is on. Set by "Hand over", removed when the owner ends guest mode with the 2-second hold. Absent = off. Not indexed, so no schema version (research R1). |

- Read once on start, before any screen is shown (FR-018).
- `deleteAllData` (F10) resets Settings to the language only, so it also clears this field. In
  practice guest mode is off then: Settings is not reachable from guest mode.
- Not part of the CSV backup (Settings never are, B35).
- Sync-ready (constitution IV): device state, like `noteStepEncounterId`; it must not be synced
  between devices later.

## Guest input (in memory only)

| Field | Type | Rule |
|---|---|---|
| `name` | string | Required for "Done": not empty after trimming (FR-007). Max 100 characters (F2). |
| `company` | string | Optional. Max 100 characters (F2). |
| `language` | `'nl' \| 'en'` | Starts at the app language (B37). Changed by the guest switch only (FR-016). |

Lives in the guest screen's state. On exit, `name` and `company` go to the quick mode form as
initial values (research R2, R6). Lost on a reload (spec Assumptions).

## State transitions

```text
              "Hand over" (start screen)
 off ───────────────────────────────────────▶ on: form
                                               │  ▲
                                         Done  │  │ Back (input kept)
                                               ▼  │
                                              on: thanks
 on (form or thanks) ── hold logo 2 s ──▶ off ──┬─ daily choice due ──▶ choice ─▶ quick mode form (with input, if any)
                                                ├─ name typed ─────────▶ quick mode form (with input)
                                                └─ no name ────────────▶ Add tab
 on ── app closed / reloaded ──▶ on: form (input empty)
```

A short press on the logo never changes the state (FR-012).
