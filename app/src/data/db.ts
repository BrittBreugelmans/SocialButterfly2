import Dexie, { type EntityTable } from 'dexie'
import type { Encounter, Event, Person, Settings } from './types'

// Only data/repository.ts may use this database (contracts/storage-api.md).
export const db = new Dexie('sociale-vlinder') as Dexie & {
  persons: EntityTable<Person, 'id'>
  encounters: EntityTable<Encounter, 'id'>
  events: EntityTable<Event, 'id'>
  settings: EntityTable<Settings, 'key'>
}

// Schema version 1. Every later change to tables or indexes adds a new version with an
// upgrade step that carries existing data over (FR-009). Never edit this version in place.
db.version(1).stores({
  persons: 'id, &profileUrl, name',
  encounters: 'id, personId, eventId, date',
  events: 'id, startDate',
  settings: 'key',
})
