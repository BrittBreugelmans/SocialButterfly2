// The storage API from specs/001-app-foundation/contracts/storage-api.md.
// UI code reads and writes data only through this file. Nothing here uses the network (FR-008).

import { todayLocal } from './dates'
import { db } from './db'
import {
  DuplicateProfileUrlError,
  EventInUseError,
  StorageFullError,
  ValidationError,
} from './errors'
import { buildSearchUrl } from '../linkedin/links'
import { normalizeName } from '../people/nameMatch'
import type { ConnectionStatus, Encounter, Event, Language, Person, Settings } from './types'

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

async function withStorageErrors<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write()
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

export async function getPerson(id: string): Promise<Person | undefined> {
  return db.persons.get(id)
}

export async function findPersonByProfileUrl(profileUrl: string): Promise<Person | undefined> {
  return db.persons.where('profileUrl').equals(profileUrl).first()
}

export async function listPersons(): Promise<Person[]> {
  return db.persons.orderBy('name').toArray()
}

/** Deletes the Person and all their Encounters in one transaction. */
export async function deletePerson(id: string): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.persons, db.encounters, async () => {
      await db.encounters.where('personId').equals(id).delete()
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

/** Rejects with EventInUseError while the Event has Encounters (no silent loss). */
export async function deleteEvent(id: string): Promise<void> {
  await withStorageErrors(() =>
    db.transaction('rw', db.events, db.encounters, db.settings, async () => {
      if ((await db.encounters.where('eventId').equals(id).count()) > 0) throw new EventInUseError()
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
}

/**
 * Stored Persons with the same name, ignoring case and extra spaces (FR-006, research R3).
 * Newest last Encounter first; Persons without Encounters last.
 */
export async function findSameNamePersons(name: string): Promise<SameNameMatch[]> {
  const wanted = normalizeName(name)
  const persons = await db.persons.filter((person) => normalizeName(person.name) === wanted).toArray()
  const matches = await Promise.all(
    persons.map(async (person) => {
      const dates = (await db.encounters.where('personId').equals(person.id).toArray()).map((e) => e.date)
      const lastEncounterDate = dates.sort().at(-1)
      return compact<SameNameMatch>({ person, lastEncounterDate })
    }),
  )
  return matches.sort((a, b) => (b.lastEncounterDate ?? '').localeCompare(a.lastEncounterDate ?? ''))
}

/**
 * Saves the Person (new, or the existing one the owner picked) and an Encounter for today in the
 * current context, and opens the note step for it, in ONE transaction: nothing is saved on any
 * error (FR-009, research R4). An existing Person already met today in the same context keeps
 * that Encounter (B19).
 */
export async function addByName(input: {
  name: string
  company?: string
  existingPersonId?: string
}): Promise<AddByNameResult> {
  const fields =
    input.existingPersonId === undefined
      ? validatePerson({
          name: input.name,
          company: input.company,
          searchUrl: buildSearchUrl(input.name, input.company),
        })
      : undefined
  return withStorageErrors(() =>
    db.transaction('rw', db.persons, db.events, db.encounters, db.settings, async () => {
      const now = nowIso()
      const settings = await getSettings()
      const today = todayLocal()

      let person: Person
      let encounter: Encounter | undefined
      if (fields) {
        person = compact<Person>({ id: newId(), createdAt: now, updatedAt: now, ...fields })
        await db.persons.add(person)
      } else {
        const existing = await db.persons.get(input.existingPersonId!)
        if (!existing) throw new ValidationError('existingPersonId', 'Unknown Person')
        person = existing
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
