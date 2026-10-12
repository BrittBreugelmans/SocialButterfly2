# Data Model: F11 — Brand & Delight

**Date**: 2026-10-12 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Stored data

**No change.** F11 adds no table, no field and no schema version (still version 2). `Person`,
`Encounter`, `Event`, `Action` and `Settings` (including `ownerProfileUrl` and
`noteStepEncounterId`) stay as they are (spec FR-021). Nothing is written to IndexedDB by F11.

## Brand assets (files in the repo, not user data)

These are not records, but they are the "things" F11 defines. Their rules are in
[contracts/brand.md](contracts/brand.md).

| Asset | Where | Rules |
|---|---|---|
| **Palette** | `app/src/brand/palette.ts`, mirrored on `:root` in `app/src/styles.css` | 12 named colours (research R3). The CSS mirror must match exactly. Text pairs meet WCAG AA. |
| **Logo** | `app/public/logo.svg` | The single source of the butterfly. Transparent background, palette colours only, no LinkedIn mark. |
| **Generated icons** | `app/public/` (`favicon.ico`, `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`) | Made from `logo.svg` by `npm run generate-pwa-assets`; committed. |
| **Launch images** | `app/public/apple-splash-*.png` + `<link>` tags in `app/index.html` | Made from `logo.svg` by the same command; not precached by the service worker. |

## In-memory state (not stored)

- **`flutter`** (in `App`): a counter. It goes up by one when a note step of a new Encounter is
  closed (saved or skipped, `alreadyMetToday === false`). While it is above 0 and the start
  screen is shown, one `Flutter` layer is rendered with `key={flutter}`. It is never persisted,
  so a restart never replays the butterfly.

```text
note step open ──(save note | skip, new Encounter)──▶ flutter += 1 ──▶ start screen + butterfly
       │                                                                  │
       └──(B19: alreadyMetToday)──▶ start screen, no butterfly            ├─ animationend / 1.5 s ─▶ gone
                                                                          ├─ page hidden ─▶ gone
                                                                          └─ leave start screen ─▶ gone
```
