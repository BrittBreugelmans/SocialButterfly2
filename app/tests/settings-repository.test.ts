import { describe, expect, it, vi } from 'vitest'
import { db } from '../src/data/db'
import { todayLocal } from '../src/data/dates'
import { StorageFullError, ValidationError } from '../src/data/errors'
import {
  countData,
  createEncounter,
  createEvent,
  createPerson,
  deleteAllData,
  deleteEvent,
  dismissAction,
  getSettings,
  listEncounters,
  listEncountersByPerson,
  listEvents,
  listPersons,
  onDataChanged,
  postponeBackupReminder,
  readBackupSnapshot,
  recordBackup,
  setGuestMode,
  setOwnerProfileUrl,
  updateEvent,
  updateSettings,
} from '../src/data/repository'

const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=britt'

/** Counts onDataChanged calls while `action` runs. */
async function changesDuring(action: () => Promise<unknown>): Promise<number> {
  const listener = vi.fn()
  const unsubscribe = onDataChanged(listener)
  try {
    await action()
  } finally {
    unsubscribe()
  }
  return listener.mock.calls.length
}

describe('backup snapshot and last backup time (F10 US1, research R3)', () => {
  it('reads all Persons, Encounters and Events with a takenAt from before the read', async () => {
    const devoxx = await createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    const empty = await createEvent({ name: 'Later', startDate: '2026-11-01', endDate: '2026-11-01' })
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: devoxx.id, date: '2026-10-07' })
    await createEncounter({ personId: person.id, date: '2026-10-09' })

    const snapshot = await readBackupSnapshot()
    const after = new Date().toISOString()

    expect(snapshot.persons.map((p) => p.id)).toEqual([person.id])
    expect(snapshot.encounters).toHaveLength(2)
    expect(snapshot.events.map((e) => e.id).sort()).toEqual([devoxx.id, empty.id].sort())
    expect(snapshot.takenAt <= after).toBe(true)
  })

  it('is not a write: it fires no data change', async () => {
    expect(await changesDuring(() => readBackupSnapshot())).toBe(0)
  })

  it('records the snapshot time as the last backup, once per call', async () => {
    const takenAt = '2026-10-12T08:00:00.000Z'
    expect(await changesDuring(() => recordBackup(takenAt))).toBe(1)
    expect((await getSettings()).lastBackupAt).toBe(takenAt)
  })

  it('never moves the last backup back in time', async () => {
    await recordBackup('2026-10-12T08:00:00.000Z')
    await recordBackup('2026-10-11T08:00:00.000Z')
    expect((await getSettings()).lastBackupAt).toBe('2026-10-12T08:00:00.000Z')
  })
})

describe('deleting and changing Events (F10 US3, B38)', () => {
  const devoxx = () => createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })

  it('switches to casual networking when the active Event is deleted', async () => {
    const event = await devoxx()
    await updateSettings({ activeEventId: event.id })
    await deleteEvent(event.id)
    expect((await getSettings()).activeEventId).toBeUndefined()
  })

  it('throws for an unknown Event', async () => {
    await expect(deleteEvent('nope')).rejects.toBeInstanceOf(ValidationError)
  })

  it('keeps both casual Encounters of a Person on the same day (research R5)', async () => {
    const event = await devoxx()
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: event.id, date: '2026-10-07', note: 'at Devoxx' })
    await createEncounter({ personId: person.id, date: '2026-10-07', note: 'at dinner' })
    await deleteEvent(event.id)
    const notes = (await listEncountersByPerson(person.id)).map((e) => e.note).sort()
    expect(notes).toEqual(['at Devoxx', 'at dinner'])
  })

  it('is one data change', async () => {
    const event = await devoxx()
    expect(await changesDuring(() => deleteEvent(event.id))).toBe(1)
  })

  it('refuses an empty name or an end date before the start date, and changes nothing', async () => {
    const event = await devoxx()
    await expect(updateEvent(event.id, { name: '   ' })).rejects.toBeInstanceOf(ValidationError)
    await expect(updateEvent(event.id, { startDate: '2026-10-09' })).rejects.toBeInstanceOf(ValidationError)
    expect((await listEvents())[0]).toEqual(event)
  })
})

describe('delete all data (F10 US5, research R6)', () => {
  async function seedEverything() {
    const event = await createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: event.id, date: '2026-10-07', note: 'AI' })
    await createEncounter({ personId: person.id, date: '2026-10-09' })
    await dismissAction(person.id, 'noteMissing')
    await updateSettings({
      language: 'en',
      activeEventId: event.id,
      contextChosenOn: todayLocal(),
      lastBackupAt: '2026-10-08T10:00:00.000Z',
      backupReminderLaterOn: todayLocal(),
    })
    await setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')
  }

  it('counts Persons, Encounters and Events', async () => {
    await seedEverything()
    expect(await countData()).toEqual({ persons: 1, encounters: 2, events: 1 })
  })

  it('empties every table and keeps only the language', async () => {
    await seedEverything()
    await deleteAllData()
    expect(await db.persons.count()).toBe(0)
    expect(await db.encounters.count()).toBe(0)
    expect(await db.events.count()).toBe(0)
    expect(await db.dismissals.count()).toBe(0)
    const settings = await db.settings.get('settings')
    expect(Object.keys(settings!).sort()).toEqual(['key', 'language', 'updatedAt'])
    expect(settings!.language).toBe('en')
  })

  it('is one data change', async () => {
    await seedEverything()
    expect(await changesDuring(() => deleteAllData())).toBe(1)
  })

  it('changes nothing when storage is full', async () => {
    await seedEverything()
    vi.spyOn(db.settings, 'put').mockRejectedValue(new DOMException('full', 'QuotaExceededError'))
    await expect(deleteAllData()).rejects.toBeInstanceOf(StorageFullError)
    vi.restoreAllMocks()
    expect(await countData()).toEqual({ persons: 1, encounters: 2, events: 1 })
    expect(await db.dismissals.count()).toBe(1)
    expect((await getSettings()).ownerProfileUrl).toBe('https://www.linkedin.com/in/britt-breugelmans')
  })
})

describe('backup reminder "Later" (F10 US2, FR-011)', () => {
  it('stores today as the day of "Later", as one data change', async () => {
    expect(await changesDuring(() => postponeBackupReminder())).toBe(1)
    expect((await getSettings()).backupReminderLaterOn).toBe(todayLocal())
  })
})

describe('F3 setGuestMode (FR-018, research R1)', () => {
  it('turns guest mode on and off; off removes the field', async () => {
    await setGuestMode(true)
    expect((await getSettings()).guestModeOn).toBe(true)
    await setGuestMode(false)
    expect('guestModeOn' in (await getSettings())).toBe(false)
  })

  it('keeps the other settings', async () => {
    const event = await createEvent({ name: 'Devoxx', startDate: todayLocal(), endDate: todayLocal() })
    await updateSettings({ language: 'en', activeEventId: event.id, contextChosenOn: todayLocal() })
    await setGuestMode(true)
    const settings = await getSettings()
    expect(settings.language).toBe('en')
    expect(settings.activeEventId).toBe(event.id)
    expect(settings.contextChosenOn).toBe(todayLocal())
  })

  it('creates no Person, Encounter or Event', async () => {
    await setGuestMode(true)
    await setGuestMode(false)
    expect(await listPersons()).toEqual([])
    expect(await listEncounters()).toEqual([])
    expect(await listEvents()).toEqual([])
  })

  it('is cleared by deleting all data', async () => {
    await setGuestMode(true)
    await deleteAllData()
    expect('guestModeOn' in (await getSettings())).toBe(false)
  })
})
