// The storage API from specs/001-app-foundation/contracts/storage-api.md.
// UI code reads and writes data only through this file. Nothing here uses the network (FR-008).

import { todayLocal } from './dates'
import { db } from './db'
import {
  DuplicateProfileUrlError,
  LastEncounterError,
  StorageFullError,
  ValidationError,
} from './errors'
import { buildSearchUrl } from '../linkedin/links'
import { normalizeProfileUrl } from '../linkedin/profileUrl'
import { ACTION_TYPES } from '../people/actions'
import { normalizeName } from '../people/nameMatch'
import type { ActionType, ConnectionStatus, Dismissal, Encounter, Event, Language, Person, Settings } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

type StorageFullListener = () => void
const storageFullListeners = new Set<StorageFullListener>()

/** Called after every StorageFullError, so the UI can show it wherever the write happened. */
export function onStorageFull(listener: StorageFullListener): () => void {
  storageFullListeners.add(listener)
  return () => {
    storageFullListeners.delete(listener)
  }
}

function isQuotaError(error: unknown): boolean {
  // Dexie wraps the browser error; look a few levels deep.
  let current: unknown = error
  for (let depth = 0; depth < 5 && typeof current === 'object' && current !== null; depth++) {
    if ((current as { name?: unknown }).name === 'QuotaExceededError') return true
    current = (current as { inner?: unknown }).inner
  }
  return false
}

type DataChangedListener = () => void
const dataChangedListeners = new Set<DataChangedListener>()

/**
 * Called after every successful write (F8 research R4), so the Actions badge stays current
 * wherever the change happened. Returns the unsubscribe function.
 */
export function onDataChanged(listener: DataChangedListener): () => void {
  dataChangedListeners.add(listener)
  return () => {
    dataChangedListeners.delete(listener)
  }
}

/** Every write goes through here: storage-full handling and the change signal (F8). */
async function withStorageErrors<T>(write: () => Promise<T>): Promise<T> {
  try {
    const result = await write()
    dataChangedListeners.forEach((listener) => listener())
    return result
  } catch (error) {
    if (isQuotaError(error)) {
      storageFullListeners.forEach((listener) => listener())
      throw new StorageFullError()
    }
    throw error
  }
}

/** Removes keys with value undefined, so missing fields are really missing (not indexed). */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

function requiredText(value: string | undefined, field: string): string {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') throw new ValidationError(field, `${field} must not be empty`)
  return trimmed
}

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? undefined : trimmed
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isoDate(value: string, field: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  if (!ISO_DATE.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(field, `${field} must be an ISO date (YYYY-MM-DD)`)
  }
  return value
}

const PROFILE_URL_PREFIX = 'https://www.linkedin.com/in/'

/**
 * Normalized form: starts with https://www.linkedin.com/in/, exactly one path segment after
 * /in/, no query string, no fragment and no trailing slash. Turning user input into this form
 * is F4/F5, not here.
 */
function isNormalizedProfileUrl(url: string): boolean {
  if (!url.startsWith(PROFILE_URL_PREFIX)) return false
  const handle = url.slice(PROFILE_URL_PREFIX.length)
  return handle.length > 0 && !/[/?#\s]/.test(handle)
}

// ---------------------------------------------------------------------------
// Persons
// ---------------------------------------------------------------------------

export interface PersonInput {
  name: string
  company?: string
  profileUrl?: string
  searchUrl?: string
}

const CONNECTION_STATUSES: readonly ConnectionStatus[] = ['notConnected', 'connected']

function validatePerson(input: PersonInput & { connectionStatus?: ConnectionStatus }) {
  const name = requiredText(input.name, 'name')
  const company = optionalText(input.company)

  let profileUrl: string | undefined
  if (input.profileUrl !== undefined) {
    if (input.profileUrl === '') throw new ValidationError('profileUrl', 'profileUrl must not be empty')
    if (!isNormalizedProfileUrl(input.profileUrl)) {
      throw new ValidationError('profileUrl', 'profileUrl is not in normalized form')
    }
    profileUrl = input.profileUrl
  }

  const searchUrl = optionalText(input.searchUrl)
  if (profileUrl === undefined && searchUrl === undefined) {
    throw new ValidationError('profileUrl', 'A Person needs a profileUrl or a searchUrl')
  }

  const connectionStatus = input.connectionStatus ?? 'notConnected'
  if (!CONNECTION_STATUSES.includes(connectionStatus)) {
    throw new ValidationError('connectionStatus', 'Unknown connectionStatus')
  }

  return { name, company, profileUrl, searchUrl, connectionStatus }
}

async function assertProfileUrlFree(profileUrl: string | undefined, ownId?: string): Promise<void> {
  if (profileUrl === undefined) return
  const existing = await db.persons.where('profileUrl').equals(profileUrl).first()
  if (existing && existing.id !== ownId) throw new DuplicateProfileUrlError(existing.id)
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const fields = validatePerson(input)
  const now = nowIso()
  const person = compact<Person>({ id: newId(), createdAt: now, updatedAt: now, ...fields })
  await withStorageErrors(() =>
    db.transaction('rw', db.persons, async () => {
      await assertProfileUrlFree(person.profileUrl)
      await db.persons.add(person)
    }),
  )
  return person
}

export async function updatePerson(
  id: string,
  changes: Partial<PersonInput & { connectionStatus: ConnectionStatus }>,
): Promise<Person> {
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, async () => {
      const current = await db.persons.get(id)
      if (!current) throw new ValidationError('id', 'Unknown Person')
      const fields = validatePerson({ ...current, ...changes })
      await assertProfileUrlFree(fields.profileUrl, id)
      const updated = compact<Person>({
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nowIso(),
        ...fields,
      })
      await db.persons.put(updated)
      return updated
    }),
  )
}

/**
 * Edits name, company and Encounter notes (F7, B27, B29) in ONE transaction: everything is saved,
 * or nothing. The search link follows name and company; the profile link, the identity of the
 * Person, never changes here (constitution V). Only Encounters whose note changed are written.
 */
export async function updatePersonDetails(
  id: string,
  changes: { name: string; company?: string; notes?: { encounterId: string; note: string }[] },
): Promise<Person> {
  const name = requiredText(changes.name, 'name')
  const company = optionalText(changes.company)
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.encounters, async () => {
      const current = await db.persons.get(id)
      if (!current) throw new ValidationError('id', 'Unknown Person')

      // Check every Encounter before writing anything.
      const edits: Encounter[] = []
      for (const { encounterId, note } of changes.notes ?? []) {
        const encounter = await db.encounters.get(encounterId)
        if (!encounter || encounter.personId !== id) {
          throw new ValidationError('notes', 'Encounter does not belong to this Person')
        }
        const text = optionalText(note)
        if (text !== encounter.note) edits.push(compact<Encounter>({ ...encounter, note: text, updatedAt: nowIso() }))
      }

      const updated = compact<Person>({
        ...current,
        name,
        company,
        searchUrl: buildSearchUrl(name, company),
        updatedAt: nowIso(),
      })
      await db.persons.put(updated)
      await db.encounters.bulkPut(edits)
      return updated
    }),
  )
}

export async function getPerson(id: string): Promise<Person | undefined> {
  return db.persons.get(id)
}

export async function findPersonByProfileUrl(profileUrl: string): Promise<Person | undefined> {
  return db.persons.where('profileUrl').equals(profileUrl).first()
}

export async function listPersons(): Promise<Person[]> {
  return db.persons.orderBy('name').toArray()
}

/** Deletes the Person, all their Encounters and their dismissed Actions (F8) in one transaction. */
export async function deletePerson(id: string): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.persons, db.encounters, db.dismissals, async () => {
      await db.encounters.where('personId').equals(id).delete()
      await db.dismissals.where('personId').equals(id).delete()
      await db.persons.delete(id)
    }),
  )
}

// ---------------------------------------------------------------------------
// Encounters
// ---------------------------------------------------------------------------

export interface EncounterInput {
  personId: string
  /** No eventId means casual networking. */
  eventId?: string
  date: string
  note?: string
}

export async function createEncounter(input: EncounterInput): Promise<Encounter> {
  const date = isoDate(input.date, 'date')
  const now = nowIso()
  const encounter = compact<Encounter>({
    id: newId(),
    createdAt: now,
    updatedAt: now,
    personId: input.personId,
    eventId: input.eventId,
    date,
    note: optionalText(input.note),
  })
  await withStorageErrors(() =>
    db.transaction('rw', db.persons, db.events, db.encounters, async () => {
      if (!(await db.persons.get(input.personId))) {
        throw new ValidationError('personId', 'Unknown Person')
      }
      if (input.eventId !== undefined && !(await db.events.get(input.eventId))) {
        throw new ValidationError('eventId', 'Unknown Event')
      }
      await db.encounters.add(encounter)
    }),
  )
  return encounter
}

export async function updateEncounter(
  id: string,
  changes: { note?: string; date?: string },
): Promise<Encounter> {
  return withStorageErrors(() =>
    db.transaction('rw', db.encounters, async () => {
      const current = await db.encounters.get(id)
      if (!current) throw new ValidationError('id', 'Unknown Encounter')
      const updated = compact<Encounter>({
        ...current,
        date: changes.date !== undefined ? isoDate(changes.date, 'date') : current.date,
        note: 'note' in changes ? optionalText(changes.note) : current.note,
        updatedAt: nowIso(),
      })
      await db.encounters.put(updated)
      return updated
    }),
  )
}

/** Every Encounter, in no particular order (F7: the contact list is built in memory). */
export async function listEncounters(): Promise<Encounter[]> {
  return db.encounters.toArray()
}

/** Newest first. */
export async function listEncountersByPerson(personId: string): Promise<Encounter[]> {
  const encounters = await db.encounters.where('personId').equals(personId).toArray()
  return encounters.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export async function listEncountersByEvent(eventId: string): Promise<Encounter[]> {
  return db.encounters.where('eventId').equals(eventId).toArray()
}

/** Encounters without an Event (casual networking). Missing values are not indexed, so filter. */
export async function listCasualEncounters(): Promise<Encounter[]> {
  return db.encounters.filter((encounter) => encounter.eventId === undefined).toArray()
}

/** Counts Encounters created after isoTime; all Encounters when isoTime is undefined (FR-017). */
export async function countEncountersSince(isoTime: string | undefined): Promise<number> {
  if (isoTime === undefined) return db.encounters.count()
  return db.encounters.filter((encounter) => encounter.createdAt > isoTime).count()
}

export async function deleteEncounter(id: string): Promise<void> {
  await withStorageErrors(() => db.encounters.delete(id))
}

/**
 * Deletes one Encounter from a Person's timeline (F7, B25), in ONE transaction. The Person's only
 * Encounter is refused with LastEncounterError: the owner deletes the Person instead.
 */
export async function deleteEncounterFromTimeline(id: string): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.encounters, async () => {
      const encounter = await db.encounters.get(id)
      if (!encounter) throw new ValidationError('id', 'Unknown Encounter')
      const count = await db.encounters.where('personId').equals(encounter.personId).count()
      if (count <= 1) throw new LastEncounterError()
      await db.encounters.delete(id)
    }),
  )
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface EventInput {
  name: string
  startDate: string
  endDate: string
}

function validateEvent(input: EventInput) {
  const name = requiredText(input.name, 'name')
  const startDate = isoDate(input.startDate, 'startDate')
  const endDate = isoDate(input.endDate, 'endDate')
  // endDate MUST NOT be before startDate; MAY equal it (FR-018).
  if (endDate < startDate) throw new ValidationError('endDate', 'endDate must not be before startDate')
  return { name, startDate, endDate }
}

export async function createEvent(input: EventInput): Promise<Event> {
  const now = nowIso()
  const event: Event = { id: newId(), createdAt: now, updatedAt: now, ...validateEvent(input) }
  await withStorageErrors(() => db.events.add(event))
  return event
}

export async function updateEvent(id: string, changes: Partial<EventInput>): Promise<Event> {
  return withStorageErrors(() =>
    db.transaction('rw', db.events, async () => {
      const current = await db.events.get(id)
      if (!current) throw new ValidationError('id', 'Unknown Event')
      const updated: Event = {
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: nowIso(),
        ...validateEvent({ ...current, ...changes }),
      }
      await db.events.put(updated)
      return updated
    }),
  )
}

/** Newest startDate first. */
export async function listEvents(): Promise<Event[]> {
  return db.events.orderBy('startDate').reverse().toArray()
}

/**
 * Deletes the Event in ONE transaction. Its Encounters stay, with their date and note, as without
 * an Event (B38, F10 research R5): nothing is lost. Same-day casual Encounters are not folded
 * together (B19 is a rule for adding). The active Event falls back to casual networking.
 */
export async function deleteEvent(id: string): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.events, db.encounters, db.settings, async () => {
      if (!(await db.events.get(id))) throw new ValidationError('id', 'Unknown Event')
      const now = nowIso()
      const encounters = await db.encounters.where('eventId').equals(id).toArray()
      await db.encounters.bulkPut(
        encounters.map((encounter) => compact<Encounter>({ ...encounter, eventId: undefined, updatedAt: now })),
      )
      await db.events.delete(id)
      const settings = await db.settings.get('settings')
      if (settings?.activeEventId === id) {
        await db.settings.put(compact<Settings>({ ...settings, activeEventId: undefined, updatedAt: nowIso() }))
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const LANGUAGES: readonly Language[] = ['nl', 'en']
const NEVER_SAVED = new Date(0).toISOString()

/** Returns the defaults (Dutch, casual networking) if Settings were never saved. */
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('settings')) ?? { key: 'settings', language: 'nl', updatedAt: NEVER_SAVED }
}

/** Merges changes. Passing activeEventId: undefined switches to casual networking. */
export async function updateSettings(
  changes: Partial<Omit<Settings, 'key' | 'updatedAt'>>,
): Promise<Settings> {
  if (changes.language !== undefined && !LANGUAGES.includes(changes.language)) {
    throw new ValidationError('language', 'Unknown language')
  }
  return withStorageErrors(() =>
    db.transaction('rw', db.settings, db.events, async () => {
      if (changes.activeEventId !== undefined && !(await db.events.get(changes.activeEventId))) {
        throw new ValidationError('activeEventId', 'Unknown Event')
      }
      const current = await getSettings()
      const updated = compact<Settings>({ ...current, ...changes, key: 'settings', updatedAt: nowIso() })
      await db.settings.put(updated)
      return updated
    }),
  )
}

/**
 * Stores the owner's own profile link for My QR (F9, B33). It must already be normalized. The
 * owner is not a Person: Persons are never read or changed here (FR-001).
 */
export async function setOwnerProfileUrl(url: string): Promise<Settings> {
  // Stricter than isNormalizedProfileUrl: exactly what F4's normalization makes (data-model).
  const normalized = normalizeProfileUrl(url)
  if (!normalized.ok || normalized.url !== url) {
    throw new ValidationError('ownerProfileUrl', 'Not a normalized profile link')
  }
  return updateSettings({ ownerProfileUrl: url })
}

// ---------------------------------------------------------------------------
// Backup (F10, specs/009-settings-data)
// ---------------------------------------------------------------------------

/** Everything that goes into the CSV backup, read at one moment (research R3). */
export interface BackupSnapshot {
  /** ISO 8601 UTC, taken just before the read transaction. */
  takenAt: string
  persons: Person[]
  encounters: Encounter[]
  events: Event[]
}

/**
 * Reads Persons, Encounters and Events in ONE read transaction, so the file is consistent. A write
 * that lands between takenAt and the read is in the file and also counts as "after the backup":
 * at most one extra reminder, never a lost one.
 */
export async function readBackupSnapshot(): Promise<BackupSnapshot> {
  const takenAt = nowIso()
  return db.transaction('r', db.persons, db.encounters, db.events, async () => {
    const [persons, encounters, events] = await Promise.all([
      db.persons.toArray(),
      db.encounters.toArray(),
      db.events.toArray(),
    ])
    return { takenAt, persons, encounters, events }
  })
}

/** Stores takenAt of the shared snapshot as the last backup (FR-008). Never moves back in time. */
export async function recordBackup(takenAt: string): Promise<Settings> {
  const current = await getSettings()
  if (current.lastBackupAt !== undefined && current.lastBackupAt >= takenAt) return current
  return updateSettings({ lastBackupAt: takenAt })
}

/** For the "Delete all data" confirmation (FR-018). */
export async function countData(): Promise<{ persons: number; encounters: number; events: number }> {
  const [persons, encounters, events] = await Promise.all([db.persons.count(), db.encounters.count(), db.events.count()])
  return { persons, encounters, events }
}

/**
 * Deletes everything on the device except the language, in ONE transaction: all of it, or nothing
 * (FR-019, research R6). The database itself stays open, so no hook needs a reload.
 */
export async function deleteAllData(): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', [db.persons, db.encounters, db.events, db.dismissals, db.settings], async () => {
      const { language } = await getSettings()
      await Promise.all([db.persons.clear(), db.encounters.clear(), db.events.clear(), db.dismissals.clear()])
      await db.settings.put({ key: 'settings', language, updatedAt: nowIso() })
    }),
  )
}

/** "Later" on the backup reminder: hidden for the rest of today (FR-011). */
export async function postponeBackupReminder(): Promise<Settings> {
  return updateSettings({ backupReminderLaterOn: todayLocal() })
}

// ---------------------------------------------------------------------------
// Context: active Event or casual networking (F1, specs/002-events)
// ---------------------------------------------------------------------------

/**
 * Makes an Event active, or switches to casual networking when eventId is undefined.
 * Also records today as the day of the choice (FR-005, FR-007), in one write.
 */
export async function chooseContext(eventId: string | undefined): Promise<Settings> {
  return withStorageErrors(() =>
    db.transaction('rw', db.settings, db.events, async () => {
      if (eventId !== undefined && !(await db.events.get(eventId))) {
        throw new ValidationError('eventId', 'Unknown Event')
      }
      const current = await getSettings()
      const updated = compact<Settings>({
        ...current,
        key: 'settings',
        activeEventId: eventId,
        contextChosenOn: todayLocal(),
        updatedAt: nowIso(),
      })
      await db.settings.put(updated)
      return updated
    }),
  )
}

/** Creates the Event and makes it active, in ONE transaction: nothing is saved on any error (FR-004). */
export async function createAndActivateEvent(input: EventInput): Promise<Event> {
  const now = nowIso()
  const event: Event = { id: newId(), createdAt: now, updatedAt: now, ...validateEvent(input) }
  await withStorageErrors(() =>
    db.transaction('rw', db.events, db.settings, async () => {
      await db.events.add(event)
      const current = await getSettings()
      await db.settings.put(
        compact<Settings>({
          ...current,
          key: 'settings',
          activeEventId: event.id,
          contextChosenOn: todayLocal(),
          updatedAt: now,
        }),
      )
    }),
  )
  return event
}

/**
 * Creates an Encounter for today in the current context: the active Event, or no Event during
 * casual networking (FR-009). F2, F3 and F5 use this instead of createEncounter.
 */
export async function createEncounterInContext(input: { personId: string; note?: string }): Promise<Encounter> {
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.events, db.encounters, db.settings, async () => {
      if (!(await db.persons.get(input.personId))) {
        throw new ValidationError('personId', 'Unknown Person')
      }
      const { activeEventId } = await getSettings()
      const now = nowIso()
      const encounter = compact<Encounter>({
        id: newId(),
        createdAt: now,
        updatedAt: now,
        personId: input.personId,
        eventId: activeEventId,
        date: todayLocal(),
        note: optionalText(input.note),
      })
      await db.encounters.add(encounter)
      return encounter
    }),
  )
}

// ---------------------------------------------------------------------------
// Dismissed Actions (F8, specs/007-actions-tab)
// ---------------------------------------------------------------------------

export async function listDismissals(): Promise<Dismissal[]> {
  return db.dismissals.toArray()
}

/**
 * Dismisses an Action of a Person (FR-009) in ONE transaction. At most one record per Person and
 * type: dismissing again updates it. `previous` is the record as it was, for Undo (research R6).
 */
export async function dismissAction(
  personId: string,
  type: ActionType,
): Promise<{ dismissal: Dismissal; previous?: Dismissal }> {
  if (!ACTION_TYPES.includes(type)) throw new ValidationError('type', 'Unknown Action type')
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.dismissals, async () => {
      if (!(await db.persons.get(personId))) throw new ValidationError('personId', 'Unknown Person')
      const now = nowIso()
      const previous = await db.dismissals.where('[personId+type]').equals([personId, type]).first()
      const dismissal: Dismissal = previous
        ? { ...previous, dismissedAt: now, updatedAt: now }
        : { id: newId(), createdAt: now, updatedAt: now, personId, type, dismissedAt: now }
      await db.dismissals.put(dismissal)
      return previous ? { dismissal, previous } : { dismissal }
    }),
  )
}

/** Undo: deletes the dismissal, or puts the previous version back (research R6). */
export async function undoDismissal(dismissalId: string, previous?: Dismissal): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.dismissals, async () => {
      if (previous) await db.dismissals.put(previous)
      else await db.dismissals.delete(dismissalId)
    }),
  )
}

// ---------------------------------------------------------------------------
// Add by name (F2, specs/003-add-by-name)
// ---------------------------------------------------------------------------

export interface AddByNameResult {
  person: Person
  encounter: Encounter
  /** True when today's Encounter in the same context was reused (B19). */
  alreadyMetToday: boolean
}

export interface SameNameMatch {
  person: Person
  /** Date of the Person's newest Encounter; absent when there is none. */
  lastEncounterDate?: string
  /** Already has an Encounter today in the current context: picking it opens no LinkedIn (B19). */
  metToday: boolean
}

/**
 * Stored Persons with the same name, ignoring case and extra spaces (FR-006, research R3).
 * Newest last Encounter first; Persons without Encounters last. The form looks this up while
 * the owner types, so the tap on "Search on LinkedIn" can open LinkedIn directly (B20).
 */
export async function findSameNamePersons(name: string): Promise<SameNameMatch[]> {
  const wanted = normalizeName(name)
  const { activeEventId } = await getSettings()
  const today = todayLocal()
  const persons = await db.persons.filter((person) => normalizeName(person.name) === wanted).toArray()
  const matches = await Promise.all(
    persons.map(async (person) => {
      const encounters = await db.encounters.where('personId').equals(person.id).toArray()
      const lastEncounterDate = encounters.map((e) => e.date).sort().at(-1)
      const metToday = encounters.some((e) => e.date === today && e.eventId === activeEventId)
      return compact<SameNameMatch>({ person, lastEncounterDate, metToday })
    }),
  )
  return matches.sort((a, b) => (b.lastEncounterDate ?? '').localeCompare(a.lastEncounterDate ?? ''))
}

/**
 * Saves the Person (new, or the existing one the owner picked) and an Encounter for today in the
 * current context, and opens the note step for it, in ONE transaction: nothing is saved on any
 * error (FR-009, research R4). An existing Person already met today in the same context keeps
 * that Encounter (B19).
 *
 * F5: `profileUrl` is the normalized link from a QR scan. A new Person gets it; an existing
 * Person without a link gets it too; one with this link stays unchanged (research R5).
 */
export async function addByName(input: {
  name: string
  company?: string
  existingPersonId?: string
  profileUrl?: string
}): Promise<AddByNameResult> {
  const fields =
    input.existingPersonId === undefined
      ? validatePerson({
          name: input.name,
          company: input.company,
          profileUrl: input.profileUrl,
          searchUrl: buildSearchUrl(input.name, input.company),
        })
      : undefined
  if (input.profileUrl !== undefined && !isNormalizedProfileUrl(input.profileUrl)) {
    throw new ValidationError('profileUrl', 'profileUrl is not in normalized form')
  }
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.events, db.encounters, db.settings, async () => {
      const now = nowIso()
      const settings = await getSettings()
      const today = todayLocal()

      let person: Person
      let encounter: Encounter | undefined
      if (fields) {
        person = compact<Person>({ id: newId(), createdAt: now, updatedAt: now, ...fields })
        await assertProfileUrlFree(person.profileUrl)
        await db.persons.add(person)
      } else {
        const existing = await db.persons.get(input.existingPersonId!)
        if (!existing) throw new ValidationError('existingPersonId', 'Unknown Person')
        person = existing
        if (input.profileUrl !== undefined && person.profileUrl !== input.profileUrl) {
          // The links prove these are different people (F5 US2 scenario 4).
          if (person.profileUrl !== undefined) throw new ValidationError('profileUrl', 'Person has another profileUrl')
          await assertProfileUrlFree(input.profileUrl, person.id)
          person = { ...person, profileUrl: input.profileUrl, updatedAt: now }
          await db.persons.put(person)
        }
        // Same context: the same Event, or both casual networking (eventId absent).
        encounter = await db.encounters
          .where('personId')
          .equals(person.id)
          .filter((e) => e.date === today && e.eventId === settings.activeEventId)
          .first()
      }

      const alreadyMetToday = encounter !== undefined
      if (!encounter) {
        encounter = compact<Encounter>({
          id: newId(),
          createdAt: now,
          updatedAt: now,
          personId: person.id,
          eventId: settings.activeEventId,
          date: today,
        })
        await db.encounters.add(encounter)
      }

      await db.settings.put(
        compact<Settings>({ ...settings, key: 'settings', noteStepEncounterId: encounter.id, updatedAt: now }),
      )
      return { person, encounter, alreadyMetToday }
    }),
  )
}

// ---------------------------------------------------------------------------
// Note step (F2, B18)
// ---------------------------------------------------------------------------

/**
 * The open note step: only when noteStepEncounterId points to an existing Encounter dated today.
 * A stale id (deleted Encounter, another day) is ignored, not cleaned up (research R5).
 */
export async function getNoteStep(): Promise<{ person: Person; encounter: Encounter } | undefined> {
  const { noteStepEncounterId } = await getSettings()
  if (noteStepEncounterId === undefined) return undefined
  const encounter = await db.encounters.get(noteStepEncounterId)
  if (!encounter || encounter.date !== todayLocal()) return undefined
  const person = await db.persons.get(encounter.personId)
  return person ? { person, encounter } : undefined
}

/**
 * Closes the note step in ONE transaction. A note that is not empty after trimming replaces the
 * Encounter's note; an empty or missing note keeps the existing one (skip, FR-016, FR-007a).
 */
export async function finishNoteStep(encounterId: string, note: string | undefined): Promise<void> {
  const text = optionalText(note)
  await withStorageErrors(() =>
    db.transaction('rw', db.encounters, db.settings, async () => {
      const now = nowIso()
      if (text !== undefined) {
        const current = await db.encounters.get(encounterId)
        if (!current) throw new ValidationError('id', 'Unknown Encounter')
        await db.encounters.put({ ...current, note: text, updatedAt: now })
      }
      const settings = await getSettings()
      await db.settings.put(
        compact<Settings>({ ...settings, key: 'settings', noteStepEncounterId: undefined, updatedAt: now }),
      )
    }),
  )
}

// ---------------------------------------------------------------------------
// Profile link (F4, specs/004-link-profile)
// ---------------------------------------------------------------------------

export type LinkProfileResult =
  | { status: 'linked'; person: Person }
  | { status: 'unchanged'; person: Person }
  | { status: 'conflict'; other: Person }

/**
 * Stores a normalized profile link on the Person, replacing an earlier one (FR-003, FR-004).
 * When another Person already has the link, nothing is written and that Person is returned, so
 * the owner can be asked whether to merge (B21, research R3).
 */
export async function linkProfileUrl(personId: string, profileUrl: string): Promise<LinkProfileResult> {
  if (!isNormalizedProfileUrl(profileUrl)) {
    throw new ValidationError('profileUrl', 'profileUrl is not in normalized form')
  }
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, async (): Promise<LinkProfileResult> => {
      const person = await db.persons.get(personId)
      if (!person) throw new ValidationError('id', 'Unknown Person')
      if (person.profileUrl === profileUrl) return { status: 'unchanged', person }

      const other = await db.persons.where('profileUrl').equals(profileUrl).first()
      if (other) return { status: 'conflict', other }

      const linked: Person = { ...person, profileUrl, updatedAt: nowIso() }
      await db.persons.put(linked)
      return { status: 'linked', person: linked }
    }),
  )
}

/** Non-empty notes on separate lines, the first one first. */
function joinNotes(...notes: (string | undefined)[]): string | undefined {
  const kept = notes.map((note) => note?.trim() ?? '').filter((note) => note !== '')
  return kept.length > 0 ? kept.join('\n') : undefined
}

/**
 * Merges `from` into `into`, the Person that already has the profile link, in ONE transaction
 * (B21, research R4, data-model.md "Merge rules"). Every Encounter and note is kept; an Encounter
 * on the same day in the same context is folded into `into`'s (B19). `noteDraft` is the note
 * typed on the open note step but not saved yet.
 */
export async function mergePersons(input: {
  fromPersonId: string
  intoPersonId: string
  noteDraft?: string
}): Promise<{ person: Person; noteStepEncounter?: Encounter }> {
  if (input.fromPersonId === input.intoPersonId) {
    throw new ValidationError('fromPersonId', 'Cannot merge a Person into itself')
  }
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.encounters, db.settings, db.dismissals, async () => {
      const from = await db.persons.get(input.fromPersonId)
      const into = await db.persons.get(input.intoPersonId)
      if (!from) throw new ValidationError('fromPersonId', 'Unknown Person')
      if (!into) throw new ValidationError('intoPersonId', 'Unknown Person')

      const now = nowIso()
      const settings = await getSettings()
      let noteStepId = settings.noteStepEncounterId

      const intoEncounters = await db.encounters.where('personId').equals(into.id).toArray()
      const fromEncounters = await db.encounters.where('personId').equals(from.id).toArray()
      for (const encounter of fromEncounters) {
        // The unsaved note on the open note step counts as this Encounter's note.
        const note =
          encounter.id === noteStepId && input.noteDraft !== undefined ? optionalText(input.noteDraft) : encounter.note
        const clash = intoEncounters.find((e) => e.date === encounter.date && e.eventId === encounter.eventId)
        if (clash) {
          const folded = compact<Encounter>({ ...clash, note: joinNotes(clash.note, note), updatedAt: now })
          await db.encounters.put(folded)
          Object.assign(clash, folded)
          await db.encounters.delete(encounter.id)
          if (encounter.id === noteStepId) noteStepId = clash.id
        } else {
          await db.encounters.put(compact<Encounter>({ ...encounter, personId: into.id, note, updatedAt: now }))
        }
      }

      const person = compact<Person>({
        ...into,
        company: into.company ?? from.company,
        connectionStatus:
          into.connectionStatus === 'connected' || from.connectionStatus === 'connected' ? 'connected' : 'notConnected',
        updatedAt: now,
      })
      await db.persons.put(person)
      await db.persons.delete(from.id)
      // `into` keeps its own dismissed Actions; those of the Person that disappears go (F8).
      await db.dismissals.where('personId').equals(from.id).delete()

      if (noteStepId !== settings.noteStepEncounterId) {
        await db.settings.put(compact<Settings>({ ...settings, key: 'settings', noteStepEncounterId: noteStepId, updatedAt: now }))
      }
      const noteStepEncounter = noteStepId === undefined ? undefined : await db.encounters.get(noteStepId)
      return { person, noteStepEncounter: noteStepEncounter?.personId === into.id ? noteStepEncounter : undefined }
    }),
  )
}
