import Dexie, { type EntityTable } from 'dexie'
import type { Dismissal, Encounter, Event, Person, Settings } from './types'

// Only data/repository.ts may use this database (contracts/storage-api.md).
export const db = new Dexie('sociale-vlinder') as Dexie & {
  persons: EntityTable<Person, 'id'>
  encounters: EntityTable<Encounter, 'id'>
  events: EntityTable<Event, 'id'>
  settings: EntityTable<Settings, 'key'>
  dismissals: EntityTable<Dismissal, 'id'>
}

// Schema version 1. Every later change to tables or indexes adds a new version with an
// upgrade step that carries existing data over (FR-009). Never edit this version in place.
db.version(1).stores({
  persons: 'id, &profileUrl, name',
  encounters: 'id, personId, eventId, date',
  events: 'id, startDate',
  settings: 'key',
})

// Schema version 2 (F8, specs/007-actions-tab research R1): adds the empty dismissals table.
// No existing record is read or changed. At most one dismissal per Person and Action type.
db.version(2).stores({
  dismissals: 'id, personId, &[personId+type]',
})
