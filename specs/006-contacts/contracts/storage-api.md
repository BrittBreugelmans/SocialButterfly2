# Contract: Storage API changes (F7)

Additions to [F0](../../001-app-foundation/contracts/storage-api.md),
[F2](../../003-add-by-name/contracts/storage-api.md),
[F4](../../004-link-profile/contracts/storage-api.md) and
[F5](../../005-add-by-qr/contracts/storage-api.md). All earlier functions keep their behaviour.

## Repository (`app/src/data/repository.ts`)

### Edit name and company (NEW)

```ts
updatePersonDetails(
  id: string,
  changes: { name: string; company?: string; notes?: { encounterId: string; note: string }[] },
): Promise<Person>
// ONE transaction on persons + encounters (research R8, B27, B29):
// - name: trimmed, required → ValidationError('name') when empty.
// - company: trimmed; empty or missing → removed.
// - searchUrl = buildSearchUrl(name, company).
// - profileUrl, connectionStatus, id, createdAt: unchanged. updatedAt: now.
// - notes: each Encounter must belong to this Person (else ValidationError('notes'));
//   note trimmed, empty → removed; updatedAt only on Encounters whose note changed.
// Unknown id → ValidationError('id'). Storage full → StorageFullError, nothing changed.
```

### Delete one Encounter (NEW)

```ts
deleteEncounterFromTimeline(id: string): Promise<void>
// ONE transaction (research R9, B25):
// - the Person has 2+ Encounters → only this Encounter (and its note) is deleted.
// - it is the Person's only Encounter → LastEncounterError, nothing deleted.
// Unknown id → ValidationError('id').
```

### Used as they are

| Function | Use in F7 |
|---|---|
| `listPersons()`, `listEvents()`, `getSettings()` | Load the list and the default view. |
| `listEncountersByPerson(id)` | Timeline, newest first. |
| `getPerson(id)` | Reload the detail after a change. |
| `updatePerson(id, { connectionStatus })` | Status switch (R7). |
| `deletePerson(id)` | Delete Person with all Encounters (F0). |
| `linkProfileUrl`, `mergePersons` | "Paste LinkedIn link" and merge (F4), via `ProfileLinkControl`. |

A new read of all Encounters is needed for the list:

```ts
listEncounters(): Promise<Encounter[]>   // NEW: every Encounter, no order guaranteed (research R3)
```

## Errors (`app/src/data/errors.ts`)

```ts
class LastEncounterError extends Error   // NEW: "This is the Person's only Encounter"
```

## Pure helpers (`app/src/people/contacts.ts`, NEW, no database)

```ts
type ContactView = { kind: 'all' } | { kind: 'casual' } | { kind: 'event'; eventId: string }

interface ContactRow {
  person: Person
  lastMet?: string          // ISO date; absent only for a Person without Encounters in 'all'
  encounterCount: number    // in the chosen view
}

buildContactRows(
  persons: Person[],
  encounters: Encounter[],
  view: ContactView,
  query: string,
): ContactRow[]
// Rows for the view (data-model.md "Views"), filtered by searchKey, sorted by lastMet desc, name.

searchKey(text: string): string
// NFD, combining marks removed, lower case, spaces collapsed, trimmed (research R4).

defaultView(activeEventId: string | undefined): ContactView
// The active Event, or 'all' during casual networking (FR-003).
```

## Shared UI component (`app/src/ui/ProfileLink.tsx`, NEW, moved from NoteStep)

```ts
interface ProfileLinkControlProps {
  person: Person
  /** Show "Paste another link" when a link is already stored (note step: true; detail: false). */
  allowReplace: boolean
  /** A line to show on arrival, e.g. "Merged with …" after a merge (note step). */
  initialMessage?: string
  onLinked(person: Person): void
  /** The owner chose Merge in F4's question; the parent runs mergePersons. */
  onMerge(other: Person): Promise<void>
}
```

Behaviour is F4's, unchanged: clipboard read in the tap handler, `normalizeProfileUrl`,
`linkProfileUrl`, messages `link.*`, `MergeQuestion` on a conflict.

## Diagnostics (test data only)

`Add 500 test contacts`: creates 500 `[test] `-prefixed Persons, each with 1–3 Encounters spread
over the `[test]` Events and casual networking (research R12). Removed by the existing "Remove
test data".
