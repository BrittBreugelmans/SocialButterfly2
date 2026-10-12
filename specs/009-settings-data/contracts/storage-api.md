# Contract: storage and helpers for F10

**Data model**: [../data-model.md](../data-model.md) | **Research**: [../research.md](../research.md)

All paths are relative to `app/src/`.

## `data/types.ts`

```ts
export interface Settings {
  // …existing fields
  /** Local date (YYYY-MM-DD) on which the owner tapped "Later" on the backup reminder (F10). */
  backupReminderLaterOn?: string
}
```

## `data/dates.ts`

### `localDateOf(iso: string): string` (new)

- The local date (`YYYY-MM-DD`) of an ISO 8601 UTC time. Used by the reminder rule (R4).

## `data/repository.ts`

### `readBackupSnapshot(): Promise<BackupSnapshot>` (new, R3)

- `takenAt = nowIso()`, then one read transaction over `persons`, `encounters` and `events`.
- No write, so it fires no `onDataChanged`.

### `recordBackup(takenAt: string): Promise<Settings>` (new)

- Sets `lastBackupAt` to `takenAt`, unless the stored value is already later. Goes through
  `updateSettings` (sets `updatedAt` and fires `onDataChanged`).

### `postponeBackupReminder(): Promise<Settings>` (new)

- Sets `backupReminderLaterOn = todayLocal()`.

### `deleteEvent(id: string): Promise<void>` (changed, R5)

- One transaction over `events`, `encounters` and `settings`:
  1. every Encounter with this `eventId` is put back without `eventId`, with `updatedAt = now`;
  2. the Event is deleted;
  3. if `settings.activeEventId === id`, it is cleared.
- An unknown id throws `ValidationError('id', …)`. Today this is a silent no-op; the change makes
  a stale Settings screen visible.
- No longer throws `EventInUseError`. The class is removed from `data/errors.ts`.

### `countData(): Promise<{ persons: number; encounters: number; events: number }>` (new)

- For the "Delete all data" confirmation (FR-018). Diagnostics may use it instead of its own
  counting.

### `deleteAllData(): Promise<void>` (new, R6)

- One transaction over all five tables. It clears `persons`, `encounters`, `events` and
  `dismissals`, and puts `{ key: 'settings', language: current.language, updatedAt: now }`.
- On storage full it throws `StorageFullError` and nothing changes. Fires `onDataChanged`.

### `updateEvent(id, changes)` (unchanged)

- Already validates as B11. Used by the edit form.

## `backup/csv.ts` (new, pure, R1)

```ts
export const CSV_COLUMNS: readonly string[]   // the 10 headers of FR-004, in order
export function buildBackupCsv(snapshot: BackupSnapshot): string  // BOM + header + rows, CRLF
export function backupFileName(today: string): string             // 'sociale-vlinder-2026-10-12.csv'
```

- `buildBackupCsv` follows R1: `;`, quoting, the formula guard and the row order.
- With no data, it returns the BOM + header + CRLF (US1 scenario 4).

## `backup/reminder.ts` (new, pure, R4)

```ts
export function isBackupReminderDue(snapshot: BackupSnapshot, settings: Settings, today: string): boolean
```

## `backup/useBackup.ts` (new hook, R2–R3)

```ts
export type BackupResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

export function useBackup(): {
  /** False until the first snapshot and file are ready. */
  ready: boolean
  /** Reminder rule on the current snapshot (R4). */
  reminderDue: boolean
  /** Call synchronously in the tap handler: share() starts before any await (R2). */
  makeBackup(): Promise<BackupResult>
}
```

- It prepares the snapshot + `File` (`text/csv;charset=utf-8`, name from `backupFileName`) on
  mount, after `onDataChanged` (one rebuild per burst) and on `visibilitychange` to visible.
- `makeBackup()` calls `shareFile(file)`. On `'shared'` or `'downloaded'` it awaits
  `recordBackup(snapshot.takenAt)`.

## `platform/shareFile.ts` (new, R2)

```ts
export function shareFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>
```

- When `navigator.canShare?.({ files: [file] })` is true, it calls `navigator.share({ files: [file] })`
  with no `await` before it. A resolve gives `'shared'`, an `AbortError` gives `'cancelled'`, and
  anything else gives `'failed'`.
- Otherwise it downloads through a temporary object URL and `<a download>`, and returns
  `'downloaded'`.

## `settings/eventList.ts` (new, pure)

```ts
export interface EventListRow { event: Event; encounterCount: number; isActive: boolean }
export function eventListRows(events: Event[], encounters: Encounter[], activeEventId?: string): EventListRow[]
```

- Keeps the order of `events` (`listEvents`: newest `startDate` first).
