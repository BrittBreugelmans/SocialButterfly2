# Contract: Storage API additions (F1)

Adds to [../../001-app-foundation/contracts/storage-api.md](../../001-app-foundation/contracts/storage-api.md).
All F0 rules stay valid: UI code uses only `app/src/data/repository.ts`, every write goes through
the storage-full handling, nothing uses the network.

## Context

```ts
chooseContext(eventId: string | undefined): Promise<Settings>
// Sets activeEventId (undefined = casual networking) and contextChosenOn = today (local),
// in one write. Rejects with ValidationError if eventId is unknown.

createAndActivateEvent(input: { name; startDate; endDate }): Promise<Event>
// Creates the Event (F0 validation rules) and makes it active, with contextChosenOn = today,
// in ONE transaction. On any error nothing is saved.
```

## Encounters

```ts
createEncounterInContext(input: { personId; note? }): Promise<Encounter>
// date = today (local); eventId = Settings.activeEventId read inside the same transaction,
// or absent during casual networking (FR-009). Used by F2, F3 and F5 instead of createEncounter.
```

## Settings

`Settings` gains `contextChosenOn?: string` (see [../data-model.md](../data-model.md)).
`updateSettings` accepts it like the other fields.

## Pure helpers (no database)

```ts
// app/src/data/dates.ts
todayLocal(): string                              // 'YYYY-MM-DD' in local time
addDaysLocal(date: string, days: number): string  // 'YYYY-MM-DD'

// app/src/events/choice.ts
needsDailyChoice(settings: Settings, today: string): boolean
orderEventsForChoice(events: Event[], today: string, previousEventId?: string):
  { current: Event[]; upcoming: Event[]; past: Event[] }
```

## Errors

No new error types. `ValidationError` (empty name, end before start, unknown eventId) and
`StorageFullError` as in F0.
