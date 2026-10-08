# Contract: Storage API

The interface that F1–F11 use to read and write data. UI code MUST NOT talk to the database
directly. Shapes are TypeScript-style signatures; all methods are async.

Entity shapes: see [../data-model.md](../data-model.md).

## Persons

```ts
createPerson(input: { name; company?; profileUrl?; searchUrl? }): Promise<Person>
updatePerson(id: string, changes: Partial<PersonInput & { connectionStatus }>): Promise<Person>
getPerson(id: string): Promise<Person | undefined>
findPersonByProfileUrl(profileUrl: string): Promise<Person | undefined>
listPersons(): Promise<Person[]>
deletePerson(id: string): Promise<void>        // also deletes the Person's Encounters
```

## Encounters

```ts
createEncounter(input: { personId; eventId?; date; note? }): Promise<Encounter>  // no eventId = casual networking
updateEncounter(id: string, changes: { note?; date? }): Promise<Encounter>
listEncountersByPerson(personId: string): Promise<Encounter[]>   // newest first
listEncountersByEvent(eventId: string): Promise<Encounter[]>
listCasualEncounters(): Promise<Encounter[]>                     // Encounters without an Event
countEncountersSince(isoTime: string | undefined): Promise<number>  // FR-017
deleteEncounter(id: string): Promise<void>
```

## Events

```ts
createEvent(input: { name; startDate; endDate }): Promise<Event>
updateEvent(id: string, changes: { name?; startDate?; endDate? }): Promise<Event>
listEvents(): Promise<Event[]>                 // newest startDate first
deleteEvent(id: string): Promise<void>         // rejects with EventInUseError if Encounters exist
```

## Settings

```ts
getSettings(): Promise<Settings>               // returns defaults if never saved
updateSettings(changes: Partial<Settings>): Promise<Settings>
```

## Storage status

```ts
requestPersistentStorage(): Promise<'persisted' | 'not-persisted' | 'unsupported'>
```

## Errors

| Error | When |
|---|---|
| `ValidationError` | Required field empty, `profileUrl === ''`, neither `profileUrl` nor `searchUrl`, unknown `personId`/`eventId`, Event `endDate` before `startDate`, or a `profileUrl` that is not in normalized form (see data-model.md). |
| `DuplicateProfileUrlError` | `profileUrl` already belongs to another Person (FR-012). Carries the existing Person's `id`, so F4/F5 can merge instead of failing. |
| `EventInUseError` | Deleting an Event that has Encounters. |
| `StorageFullError` | The device refuses to store more data (edge case "storage full"). Existing data is untouched. |

## Guarantees

- Every write sets `updatedAt`; creates also set `id` and `createdAt`.
- Multi-record writes (delete Person + Encounters) are atomic.
- No method sends data over the network (FR-008).
- Every `StorageFullError` is also reported through `onStorageFull(listener)`, so the UI can show
  it wherever the write happened.
