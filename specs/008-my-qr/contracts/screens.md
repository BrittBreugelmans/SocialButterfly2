# Contract: screens for F9

**Spec**: [../spec.md](../spec.md) | **Research**: [../research.md](../research.md) (R3, R7, R8)

## My QR tab (`ui/MyQrTab.tsx`, replaces `ComingSoon` for `myQr`)

Props: `onBack?: () => void`. It is only passed from the offline screen; then a Back button is
shown at the top.

### State A: no own link (FR-002)

```text
┌───────────────────────────────┐
│ [Terug]   (only from offline) │
│              🦋               │
│        Jouw LinkedIn-QR       │  myQr.setupTitle
│  In LinkedIn: je profiel →    │  myQr.setupHint
│  Delen → Link kopiëren. Kom   │
│  terug en plak hier.          │
│   [ Plak LinkedIn-link ]      │  link.paste (existing)
│  <status line>                │  link.invalid / link.shortLink / link.unsupported
└───────────────────────────────┘
```

- A valid paste goes to `setOwnerProfileUrl` and then State B. "Dismissed" changes nothing.
- No wake lock in this state (spec edge case).

### State B: QR shown (FR-007–FR-011)

```text
┌───────────────────────────────┐
│ [Terug]   (only from offline) │
│  ┌─────────────────────────┐  │
│  │ ▓▓ ▓ ▓▓▓  ▓  ▓▓ ▓▓▓ ▓▓  │  │  white panel, quiet zone 4 modules
│  │ ▓ ▓▓  ┌─────┐ ▓ ▓▓ ▓   │  │  dark modules #004182
│  │ ▓▓▓ ▓ │ 🦋  │ ▓▓ ▓ ▓▓  │  │  butterfly badge ≤ 22% width
│  │ ▓ ▓ ▓ └─────┘▓ ▓▓▓ ▓ ▓  │  │
│  └─────────────────────────┘  │  ≥ 80% of the width in portrait
│   Scan mij om te connecteren  │  nl['myQr.scanMe']
│   Scan me to connect          │  en['myQr.scanMe']
│         Link aanpassen        │  myQr.change (small, text style)
│  <status line>                │
├───────────────────────────────┤
│ tab bar (not from offline)    │
└───────────────────────────────┘
```

- The QR is an `<svg role="img">` with an accessible name `myQr.alt`, followed by the short link
  (`linkedin.com/in/<handle>`).
- "Change link" uses `pasteProfileUrl`; only a valid result replaces the link (FR-004). A
  successful change shows `myQr.changed` in the status line.
- `useWakeLock(true)` while this state is mounted (FR-012).
- Nothing else: no notes, Persons, Actions or Event (FR-011).

## Offline screen (`ui/Banners.tsx` → `OfflineScreen`)

- New prop `onShowMyQr: () => void`, and below the message a button `offline.showMyQr` (FR-010b).
- `App`: `qrWhileOffline` → `<MyQrTab onBack={() => setQrWhileOffline(false)} />`, without tab
  bar. When the connection comes back while the flag is set, the app continues on tab `myQr`
  (R7).

## `ui/ComingSoon.tsx`

- `textKey` narrows to `'soon.settings'`; the key `soon.myQr` is removed from `nl` and `en`.

## Text keys (new, NL / EN)

| Key | NL | EN |
|---|---|---|
| `myQr.setupTitle` | Jouw LinkedIn-QR | Your LinkedIn QR |
| `myQr.setupHint` | In LinkedIn: tik op je profiel → Delen → Link kopiëren. Kom dan terug en plak hier. | In LinkedIn: tap your profile → Share → Copy link. Then come back and paste it here. |
| `myQr.scanMe` | Scan mij om te connecteren | Scan me to connect |
| `myQr.change` | Link aanpassen | Change link |
| `myQr.changed` | Nieuwe link bewaard. | New link saved. |
| `myQr.alt` | QR-code naar mijn LinkedIn-profiel | QR code to my LinkedIn profile |
| `myQr.back` | Terug | Back |
| `offline.showMyQr` | Toon mijn QR | Show my QR |

Reused: `link.paste`, `link.invalid`, `link.shortLink`, `link.unsupported`, `tab.myQr`.
`myQr.scanMe` is the fixed text in `wiki/merk-en-stijl.md`.
