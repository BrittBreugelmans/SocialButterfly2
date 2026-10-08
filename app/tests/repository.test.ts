import { describe, expect, it, vi } from 'vitest'
import { db } from '../src/data/db'
import {
  DuplicateProfileUrlError,
  EventInUseError,
  StorageFullError,
  ValidationError,
} from '../src/data/errors'
import {
  countEncountersSince,
  createEncounter,
  createEvent,
  createPerson,
  deleteEvent,
  deletePerson,
  getPerson,
  getSettings,
  listCasualEncounters,
  listEncountersByPerson,
  listEvents,
  onStorageFull,
  updateEvent,
  updatePerson,
  updateSettings,
} from '../src/data/repository'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=britt'
const PROFILE_URL = 'https://www.linkedin.com/in/britt-breugelmans'

const event = (name = 'Devoxx', startDate = '2026-10-06', endDate = '2026-10-08') =>
  createEvent({ name, startDate, endDate })

describe('record metadata (FR-013)', () => {
  it('sets a UUID and timestamps on create, and only updatedAt changes on update', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    expect(person.id).toMatch(UUID)
    expect(person.createdAt).toBe(person.updatedAt)

    await new Promise((resolve) => setTimeout(resolve, 5))
    const updated = await updatePerson(person.id, { company: 'Elmos' })
    expect(updated.id).toBe(person.id)
    expect(updated.createdAt).toBe(person.createdAt)
    expect(updated.updatedAt > person.updatedAt).toBe(true)
  })
})

describe('Person', () => {
  it('trims the name and rejects an empty one', async () => {
    const person = await createPerson({ name: '  Britt  ', searchUrl: SEARCH_URL })
    expect(person.name).toBe('Britt')
    await expect(createPerson({ name: '   ', searchUrl: SEARCH_URL })).rejects.toBeInstanceOf(ValidationError)
  })

  it('stores an empty company as undefined', async () => {
    const person = await createPerson({ name: 'Britt', company: '  ', searchUrl: SEARCH_URL })
    expect(person.company).toBeUndefined()
    expect('company' in ((await getPerson(person.id)) ?? {})).toBe(false)
  })

  it("rejects profileUrl === ''", async () => {
    await expect(createPerson({ name: 'Britt', profileUrl: '' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('needs a profileUrl or a searchUrl', async () => {
    await expect(createPerson({ name: 'Britt' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects a profileUrl that is not in normalized form', async () => {
    await expect(
      createPerson({ name: 'Britt', profileUrl: 'https://www.linkedin.com/in/britt/' }),
    ).rejects.toBeInstanceOf(ValidationError)
    await expect(
      createPerson({ name: 'Britt', profileUrl: 'https://linkedin.com/in/britt?trk=qr' }),
    ).rejects.toBeInstanceOf(ValidationError)
    const person = await createPerson({ name: 'Britt', profileUrl: PROFILE_URL })
    expect(person.profileUrl).toBe(PROFILE_URL)
  })

  it('refuses a second Person with the same profileUrl and names the first one', async () => {
    const first = await createPerson({ name: 'Britt', profileUrl: PROFILE_URL })
    const error = await createPerson({ name: 'Britt B.', profileUrl: PROFILE_URL }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(DuplicateProfileUrlError)
    expect((error as DuplicateProfileUrlError).existingPersonId).toBe(first.id)
  })

  it('allows several Persons without a profileUrl', async () => {
    await createPerson({ name: 'A', searchUrl: SEARCH_URL })
    await createPerson({ name: 'B', searchUrl: SEARCH_URL })
    expect(await db.persons.count()).toBe(2)
  })

  it("defaults connectionStatus to 'notConnected'", async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    expect(person.connectionStatus).toBe('notConnected')
  })
})

describe('Encounter', () => {
  it('rejects an unknown personId or eventId', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await expect(createEncounter({ personId: 'nope', date: '2026-10-07' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(
      createEncounter({ personId: person.id, eventId: 'nope', date: '2026-10-07' }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('allows an Encounter without an Event (casual networking)', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    const encounter = await createEncounter({ personId: person.id, date: '2026-10-07' })
    expect(encounter.eventId).toBeUndefined()
    expect(await listCasualEncounters()).toHaveLength(1)
  })

  it('requires the date as YYYY-MM-DD', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await expect(createEncounter({ personId: person.id, date: '07/10/2026' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(createEncounter({ personId: person.id, date: '2026-02-30' })).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it('lists the Encounters of a Person newest first', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, date: '2026-01-01' })
    await createEncounter({ personId: person.id, date: '2026-10-07' })
    const dates = (await listEncountersByPerson(person.id)).map((e) => e.date)
    expect(dates).toEqual(['2026-10-07', '2026-01-01'])
  })
})

describe('Event', () => {
  it('rejects an endDate before the startDate and allows the same day', async () => {
    await expect(event('Devoxx', '2026-10-08', '2026-10-07')).rejects.toBeInstanceOf(ValidationError)
    const oneDay = await event('Meetup', '2026-10-07', '2026-10-07')
    expect(oneDay.endDate).toBe(oneDay.startDate)
    await expect(updateEvent(oneDay.id, { endDate: '2026-10-01' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects an empty name', async () => {
    await expect(event('  ')).rejects.toBeInstanceOf(ValidationError)
  })

  it('lists Events with the newest startDate first', async () => {
    await event('Old', '2025-01-01', '2025-01-02')
    await event('New', '2026-10-06', '2026-10-08')
    expect((await listEvents()).map((e) => e.name)).toEqual(['New', 'Old'])
  })
})

describe('deleting', () => {
  it('deletes a Person together with their Encounters', async () => {
    const devoxx = await event()
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: devoxx.id, date: '2026-10-07' })
    await createEncounter({ personId: person.id, date: '2026-10-07' })

    await deletePerson(person.id)
    expect(await db.persons.count()).toBe(0)
    expect(await db.encounters.count()).toBe(0)
  })

  it('refuses to delete an Event that still has Encounters', async () => {
    const devoxx = await event()
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: devoxx.id, date: '2026-10-07' })
    await expect(deleteEvent(devoxx.id)).rejects.toBeInstanceOf(EventInUseError)
    expect(await db.events.count()).toBe(1)
  })
})

describe('counting Encounters since the last backup (FR-017)', () => {
  it('counts all Encounters without a time, and only newer ones with a time', async () => {
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, date: '2026-10-07' })
    await new Promise((resolve) => setTimeout(resolve, 5))
    const backupAt = new Date().toISOString()
    await new Promise((resolve) => setTimeout(resolve, 5))
    await createEncounter({ personId: person.id, date: '2026-10-08' })

    expect(await countEncountersSince(undefined)).toBe(2)
    expect(await countEncountersSince(backupAt)).toBe(1)
  })
})

describe('Settings', () => {
  it('returns Dutch defaults when never saved', async () => {
    expect(await getSettings()).toMatchObject({ key: 'settings', language: 'nl' })
  })

  it('stores the language and the activeEvent; undefined means casual networking', async () => {
    const devoxx = await event()
    await updateSettings({ language: 'en', activeEventId: devoxx.id })
    expect(await getSettings()).toMatchObject({ language: 'en', activeEventId: devoxx.id })

    await updateSettings({ activeEventId: undefined })
    expect((await getSettings()).activeEventId).toBeUndefined()
  })
})

describe('storage full', () => {
  it('maps a quota error to StorageFullError and notifies listeners', async () => {
    const listener = vi.fn()
    const unsubscribe = onStorageFull(listener)
    vi.spyOn(db.events, 'add').mockRejectedValue(new DOMException('full', 'QuotaExceededError'))

    await expect(event()).rejects.toBeInstanceOf(StorageFullError)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
