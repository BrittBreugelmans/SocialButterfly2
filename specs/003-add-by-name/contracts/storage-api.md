# Contract: Storage API additions (F2)

Adds to [../../001-app-foundation/contracts/storage-api.md](../../001-app-foundation/contracts/storage-api.md)
and [../../002-events/contracts/storage-api.md](../../002-events/contracts/storage-api.md).
All earlier rules stay valid: UI code uses only `app/src/data/repository.ts`, every write goes
through the storage-full handling, nothing in the repository uses the network.

## Add by name

```ts
findSameNamePersons(name: string):
  Promise<Array<{ person: Person; lastEncounterDate?: string; metToday: boolean }>>
// Persons whose normalized name equals normalizeName(name) (research R3).
// Sorted by lastEncounterDate, newest first. Empty array when there is no match.
// metToday: an Encounter today in the current context (B19). The form calls this while the
// owner types, so the tap can open LinkedIn directly (B20).

addByName(input: { name: string; company?: string; existingPersonId?: string }):
  Promise<{ person: Person; encounter: Encounter; alreadyMetToday: boolean }>
// ONE transaction (research R4):
// - no existingPersonId → new Person: F0 validation, searchUrl = buildSearchUrl(name, company),
//   connectionStatus 'notConnected'; plus a new Encounter (today, current context).
// - existingPersonId → that Person, unchanged. If it already has an Encounter today in the
//   current context: reuse it, alreadyMetToday = true. Otherwise a new Encounter.
// - Settings.noteStepEncounterId = the Encounter's id.
// On any error nothing is saved. Rejects with ValidationError (empty name, unknown
// existingPersonId) or StorageFullError.
```

## Note step

```ts
getNoteStep(): Promise<{ person: Person; encounter: Encounter } | undefined>
// The open note step, only if noteStepEncounterId points to an existing Encounter dated today.

finishNoteStep(encounterId: string, note: string | undefined): Promise<void>
// ONE transaction: if the trimmed note is not empty, store it on the Encounter (replaces the
// existing note); an empty note keeps the existing one (skip). Removes noteStepEncounterId.
```

## Connection status

No new function. The note step calls the existing
`updatePerson(id, { connectionStatus: 'connected' | 'notConnected' })` on each switch change.

## Settings

`Settings` gains `noteStepEncounterId?: string` (see [../data-model.md](../data-model.md)).

## Pure helpers (no database)

```ts
// app/src/linkedin/links.ts
buildSearchUrl(name: string, company?: string): string
// 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(keywords)
// keywords = trimmed name, plus ' ' + trimmed company when not empty.
linkedInUrlFor(person: Pick<Person, 'profileUrl' | 'searchUrl'>): string | undefined
// profileUrl ?? searchUrl

// app/src/people/nameMatch.ts
normalizeName(name: string): string   // trim, collapse spaces, lowercase

// app/src/platform/openExternal.ts (browser, not the repository)
openLinkedIn(url: string): boolean    // window.open(url, '_blank'), then opener = null; true if it opened
```

## Errors

No new error types. `ValidationError` and `StorageFullError` as in F0.
