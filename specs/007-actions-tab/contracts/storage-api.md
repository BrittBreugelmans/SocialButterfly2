# Contract: Storage API changes (F8)

Additions to [F0](../../001-app-foundation/contracts/storage-api.md) through
[F7](../../006-contacts/contracts/storage-api.md). All earlier functions keep their behaviour,
except the two clean-ups marked CHANGED.

## Types (`app/src/data/types.ts`)

```ts
type ActionType = 'noteMissing' | 'notConnected' | 'profileLinkMissing'

interface Dismissal extends RecordMeta {   // id, createdAt, updatedAt
  personId: string
  type: ActionType
  dismissedAt: string                      // ISO 8601 UTC
}
```

## Database (`app/src/data/db.ts`)

```ts
db.version(2).stores({ dismissals: 'id, personId, &[personId+type]' })
// Version 1 stays as it is. The upgrade adds the empty table only (data-model.md).
```

## Repository (`app/src/data/repository.ts`)

### Dismissals (NEW)

```ts
listDismissals(): Promise<Dismissal[]>

dismissAction(personId: string, type: ActionType): Promise<{ dismissal: Dismissal; previous?: Dismissal }>
// ONE transaction: Person must exist (else ValidationError('personId')); unknown type →
// ValidationError('type'). Upsert on [personId+type]: new record, or the existing one with
// dismissedAt = updatedAt = now. `previous` is the record as it was before (for Undo).

undoDismissal(dismissalId: string, previous?: Dismissal): Promise<void>
// ONE transaction: without `previous`, deletes the record; with it, puts `previous` back.
```

### Change signal (NEW)

```ts
onDataChanged(listener: () => void): () => void
// Called after every successful write (inside withStorageErrors), never after a failed one.
// Returns the unsubscribe function. Same pattern as onStorageFull.
```

### Clean-ups (CHANGED)

| Function | Change |
|---|---|
| `deletePerson(id)` | Also deletes the Person's dismissals, in the same transaction. |
| `mergePersons(input)` | Also deletes the dismissals of `fromPersonId`, in the same transaction. `intoPersonId` keeps its own. |

### Used as they are

| Function | Use in F8 |
|---|---|
| `listPersons()`, `listEncounters()`, `listEvents()` | Load the tab and the badge. |
| `updateEncounter(id, { note })` | "Write note" on the last Encounter (B31). |
| `updatePerson(id, { connectionStatus: 'connected' })` | "I connected". |
| `linkProfileUrl`, `mergePersons` | "Paste LinkedIn link" via F7's `ProfileLinkControl`. |

## Pure helpers (`app/src/people/actions.ts`, NEW, no database)

```ts
const ACTION_TYPES: readonly ActionType[]   // ['noteMissing', 'notConnected', 'profileLinkMissing']

interface ActionCard {
  person: Person
  lastEncounter: Encounter
  actions: ActionType[]          // open ones, in ACTION_TYPES order; never empty
}

openActions(person: Person, encounters: Encounter[], dismissals: Dismissal[]): ActionType[]
// `encounters` and `dismissals` may contain other Persons' records; only this Person's count.

buildActionCards(persons: Person[], encounters: Encounter[], dismissals: Dismissal[]): ActionCard[]
// One card per Person with ≥ 1 open Action and ≥ 1 Encounter. Sorted per data-model.md.

countOpenActions(persons: Person[], encounters: Encounter[], dismissals: Dismissal[]): number
```

## Hook (`app/src/people/useOpenActionCount.ts`, NEW)

```ts
useOpenActionCount(): number | undefined
// undefined until the first load. Reloads after onDataChanged (coalesced per tick).
```
