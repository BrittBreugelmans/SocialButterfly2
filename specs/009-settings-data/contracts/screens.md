# Contract: screens for F10

**Spec**: [../spec.md](../spec.md) | **Research**: [../research.md](../research.md) (R2, R4, R7–R10)

## Settings tab (`ui/SettingsTab.tsx`, replaces `ComingSoon`)

Props: `storageStatus` (for Diagnostics) and `onAllDataDeleted()`. `App` uses the callback to
call `recheck()` and go to the Add tab (R6).

### Main view (FR-001)

```text
┌───────────────────────────────┐
│ Instellingen                  │  settings.title
│                               │
│ Back-up                       │  backup.title
│  [ Maak CSV-back-up ]         │  backup.make (disabled until ready)
│  Laatste back-up: 12 okt.     │  backup.last {time} / backup.never
│  2026, 14:05                  │
│  <status line>                │  backup.done / backup.failed
│                               │
│ Evenementen                   │  settings.events
│  Devoxx 2026      actief  ›   │  settings.eventActive
│  6–8 okt. 2026 · 12 ontm.     │  settings.encounterCountOne / …Many
│  Techorama        ›           │
│  (Nog geen evenementen.)      │  settings.eventsEmpty
│                               │
│ Taal        [NL] [EN]         │  LanguageSwitch (app.languageSwitch, existing keys)
│                               │
│ [ Alle data wissen ]          │  deleteAll.button (danger style)
│                               │
│            v0.x.y             │  version label, long press → Diagnostics
└───────────────────────────────┘
```

- Order: Backup, Events, Language, Delete all data, version (R7).
- "Maak CSV-back-up": `makeBackup()` from `useBackup` (contract storage-api). `'cancelled'` shows
  nothing.

### Edit event view (`ui/EditEventForm.tsx`, FR-013–FR-015)

```text
┌───────────────────────────────┐
│ Evenement aanpassen           │  event.editTitle
│ Naam      [Devoxx 2026     ]  │  event.name (existing)
│ Van       [06-10-2026]        │  event.startDate (existing)
│ Tot       [08-10-2026]        │  event.endDate (existing)
│ <error>                       │  event.errorName / event.errorDates (existing)
│ [ Bewaren ]                   │  event.saveChanges
│ [ Terug ]                     │  event.back (existing)
│ [ Evenement verwijderen ]     │  event.delete (danger)
└───────────────────────────────┘
```

- The start date pushes the end date along, as in `NewEventForm` (F1 FR-002).
- Delete → `ConfirmPanel`:
  - with Encounters: `event.deleteQuestion` + detail `event.deleteKeepsOne` /
    `event.deleteKeepsMany` (B38);
  - without: `event.deleteQuestion` only.
  - Confirm label: `event.deleteConfirm`.
- After saving or deleting: back to the main view, with the list read again.

### Delete all data panel (FR-018, B41)

```text
┌───────────────────────────────┐
│ Alles wissen? Dit kan niet    │  deleteAll.question
│ ongedaan gemaakt worden.      │
│ Personen: 142 · Ontmoetingen: │  deleteAll.counts {persons} {encounters} {events}
│ 160 · Evenementen: 5          │
│ [ Maak eerst een back-up ]    │  deleteAll.backupFirst → makeBackup(), panel stays open
│ Typ WISSEN om te bevestigen   │  deleteAll.typeWord {word}
│ [__________]                  │
│ [ Alles wissen ]  (disabled)  │  deleteAll.confirm (danger), enabled per R9
│ [ Annuleren ]                 │  link.cancel (existing)
└───────────────────────────────┘
```

- On confirm: `deleteAllData()`, then `onAllDataDeleted()`. Storage full: the F0 banner shows and
  the panel stays open.

## Add tab (`ui/StartScreen.tsx`, changed)

- **Removed**: the language switch and the version label with Diagnostics (now in Settings,
  FR-002). The `storageStatus` prop goes with them.
- **Added**: the backup reminder banner (FR-009–FR-011), under the context bar, when
  `useBackup().reminderDue`:

```text
┌───────────────────────────────┐
│ Je ontmoette nieuwe mensen 🦋 │  reminder.text
│ Maak nu een back-up, zo ben   │
│ je niemand kwijt.             │
│ [ Maak back-up ]  [ Later ]   │  reminder.make / reminder.later
└───────────────────────────────┘
```

- "Maak back-up": `makeBackup()`. After `'shared'`/`'downloaded'` the banner disappears, because
  the rule is false again. `'failed'` shows `backup.failed` in the banner.
- "Later": `postponeBackupReminder()`.
- Role `status` (not `alert`): it must not interrupt.

## `App.tsx` (changed)

- The `settings` tab renders `SettingsTab`. `ComingSoon` is removed.
- The active Event is also reloaded when the tab changes (R8).
- `onAllDataDeleted`: `recheck()` + `toStart()`. The daily choice then appears.

## Text keys

New (nl / en). `{…}` are parameters.

| Key | nl | en |
|---|---|---|
| `settings.title` | Instellingen | Settings |
| `settings.events` | Evenementen | Events |
| `settings.eventsEmpty` | Nog geen evenementen. | No events yet. |
| `settings.eventActive` | actief | active |
| `settings.encounterCountOne` | 1 ontmoeting | 1 encounter |
| `settings.encounterCountMany` | {count} ontmoetingen | {count} encounters |
| `event.editTitle` | Evenement aanpassen | Edit event |
| `event.saveChanges` | Bewaren | Save |
| `event.delete` | Evenement verwijderen | Delete event |
| `event.deleteQuestion` | {name} verwijderen? | Delete {name}? |
| `event.deleteKeepsOne` | De ontmoeting blijft bewaard, zonder evenement. | The encounter stays, without an event. |
| `event.deleteKeepsMany` | De {count} ontmoetingen blijven bewaard, zonder evenement. | The {count} encounters stay, without an event. |
| `event.deleteConfirm` | Verwijderen | Delete |
| `backup.title` | Back-up | Backup |
| `backup.make` | Maak CSV-back-up | Make CSV backup |
| `backup.last` | Laatste back-up: {time} | Last backup: {time} |
| `backup.never` | Nog geen back-up gemaakt. | No backup made yet. |
| `backup.done` | Back-up bewaard. | Backup saved. |
| `backup.failed` | De back-up is niet gelukt. Probeer opnieuw. | The backup didn't work. Try again. |
| `reminder.text` | Je ontmoette nieuwe mensen 🦋 Maak nu een back-up, zo ben je niemand kwijt. | You met new people 🦋 Make a backup now, so you never lose anyone. |
| `reminder.make` | Maak back-up | Make backup |
| `reminder.later` | Later | Later |
| `deleteAll.button` | Alle data wissen | Delete all data |
| `deleteAll.question` | Alles wissen? Dit kan niet ongedaan gemaakt worden. | Delete everything? This can't be undone. |
| `deleteAll.counts` | Personen: {persons} · Ontmoetingen: {encounters} · Evenementen: {events} | People: {persons} · Encounters: {encounters} · Events: {events} |
| `deleteAll.backupFirst` | Maak eerst een back-up | Make a backup first |
| `deleteAll.typeWord` | Typ {word} om te bevestigen | Type {word} to confirm |
| `deleteAll.word` | WISSEN | DELETE |
| `deleteAll.confirm` | Alles wissen | Delete everything |

Removed: `soon.title`, `soon.settings`.
