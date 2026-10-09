import { describe, expect, it } from 'vitest'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import { ValidationError } from '../src/data/errors'
import {
  addByName,
  chooseContext,
  createEncounter,
  createEncounterInContext,
  createEvent,
  createPerson,
  deleteEncounter,
  findSameNamePersons,
  finishNoteStep,
  getNoteStep,
  getPerson,
  getSettings,
  updateSettings,
} from '../src/data/repository'
import { buildSearchUrl } from '../src/linkedin/links'

async function storeJan(company?: string) {
  return createPerson({ name: 'Jan Peeters', company, searchUrl: buildSearchUrl('Jan Peeters', company) })
}

async function devoxx() {
  return createEvent({ name: 'Devoxx 2026', startDate: todayLocal(), endDate: todayLocal() })
}

describe('addByName with a new Person (User Story 1)', () => {
  it('saves the Person with a search link and status "not connected"', async () => {
    const { person } = await addByName({ name: '  Jan Peeters ', company: ' Elmos ' })
    expect(person.name).toBe('Jan Peeters')
    expect(person.company).toBe('Elmos')
    expect(person.searchUrl).toBe(buildSearchUrl('Jan Peeters', 'Elmos'))
    expect(person.profileUrl).toBeUndefined()
    expect(person.connectionStatus).toBe('notConnected')
    expect(await db.persons.get(person.id)).toEqual(person)
  })

  it('leaves out an empty company and searches on the name only (B17)', async () => {
    const { person } = await addByName({ name: 'Jan Peeters', company: '   ' })
    expect('company' in person).toBe(false)
    expect(person.searchUrl).toBe(buildSearchUrl('Jan Peeters'))
  })

  it('saves an Encounter today under the active Event', async () => {
    const event = await devoxx()
    await chooseContext(event.id)
    const { person, encounter } = await addByName({ name: 'Jan Peeters' })
    expect(encounter.personId).toBe(person.id)
    expect(encounter.date).toBe(todayLocal())
    expect(encounter.eventId).toBe(event.id)
  })

  it('saves an Encounter without an Event during casual networking', async () => {
    await chooseContext(undefined)
    const { encounter } = await addByName({ name: 'Jan Peeters' })
    expect('eventId' in encounter).toBe(false)
  })

  it('opens the note step for the new Encounter', async () => {
    const result = await addByName({ name: 'Jan Peeters' })
    expect(result.alreadyMetToday).toBe(false)
    expect((await getSettings()).noteStepEncounterId).toBe(result.encounter.id)
  })

  it('saves nothing when the name is empty', async () => {
    await expect(addByName({ name: '   ' })).rejects.toBeInstanceOf(ValidationError)
    expect(await db.persons.count()).toBe(0)
    expect(await db.encounters.count()).toBe(0)
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })
})

describe('findSameNamePersons (User Story 2, FR-006)', () => {
  it('matches ignoring case and extra spaces, but not another name', async () => {
    const jan = await storeJan('Elmos')
    await createPerson({ name: 'Jan Peeter', searchUrl: buildSearchUrl('Jan Peeter') })
    const matches = await findSameNamePersons('  jan   PEETERS ')
    expect(matches.map((m) => m.person.id)).toEqual([jan.id])
  })

  it('returns an empty list without a match', async () => {
    await storeJan()
    expect(await findSameNamePersons('Piet Janssens')).toEqual([])
  })

  it('gives each match the date of its last Encounter, newest first', async () => {
    const older = await storeJan('Elmos')
    const newer = await storeJan('Acme')
    const never = await storeJan()
    await createEncounter({ personId: older.id, date: '2026-09-01' })
    await createEncounter({ personId: older.id, date: '2026-09-15' })
    await createEncounter({ personId: newer.id, date: '2026-10-01' })

    const matches = await findSameNamePersons('Jan Peeters')
    expect(matches.map((m) => m.person.id)).toEqual([newer.id, older.id, never.id])
    expect(matches[0]?.lastEncounterDate).toBe('2026-10-01')
    expect(matches[1]?.lastEncounterDate).toBe('2026-09-15')
    expect(matches[2]?.lastEncounterDate).toBeUndefined()
  })

  it('marks a match already met today in the current context (B19)', async () => {
    await chooseContext(undefined)
    const metToday = await storeJan('Elmos')
    const metEarlier = await storeJan('Acme')
    await createEncounterInContext({ personId: metToday.id })
    await createEncounter({ personId: metEarlier.id, date: addDaysLocal(todayLocal(), -1) })

    const matches = await findSameNamePersons('Jan Peeters')
    expect(matches.find((m) => m.person.id === metToday.id)?.metToday).toBe(true)
    expect(matches.find((m) => m.person.id === metEarlier.id)?.metToday).toBe(false)

    const event = await devoxx()
    await chooseContext(event.id) // another context now
    expect((await findSameNamePersons('Jan Peeters')).every((m) => !m.metToday)).toBe(true)
  })
})

describe('addByName with an existing Person (User Story 2)', () => {
  it('adds a new Encounter and leaves the Person unchanged (FR-007)', async () => {
    const jan = await storeJan('Elmos')
    await createEncounter({ personId: jan.id, date: '2026-10-01' })
    const result = await addByName({ name: 'jan peeters', company: 'Other', existingPersonId: jan.id })

    expect(await db.persons.count()).toBe(1)
    expect(await getPerson(jan.id)).toEqual(jan)
    expect(result.person).toEqual(jan)
    expect(result.encounter.personId).toBe(jan.id)
    expect(result.encounter.date).toBe(todayLocal())
    expect(result.alreadyMetToday).toBe(false)
    expect(await db.encounters.count()).toBe(2)
  })

  it('reuses today\'s Encounter in the same context (B19)', async () => {
    const event = await devoxx()
    await chooseContext(event.id)
    const jan = await storeJan()
    const today = await createEncounterInContext({ personId: jan.id, note: 'Payments' })

    const result = await addByName({ name: 'Jan Peeters', existingPersonId: jan.id })
    expect(result.alreadyMetToday).toBe(true)
    expect(result.encounter).toEqual(today)
    expect(await db.encounters.count()).toBe(1)
    expect((await getSettings()).noteStepEncounterId).toBe(today.id)
  })

  it('reuses today\'s casual Encounter during casual networking', async () => {
    await chooseContext(undefined)
    const jan = await storeJan()
    await createEncounterInContext({ personId: jan.id })
    const result = await addByName({ name: 'Jan Peeters', existingPersonId: jan.id })
    expect(result.alreadyMetToday).toBe(true)
    expect(await db.encounters.count()).toBe(1)
  })

  it('adds a new Encounter when today\'s is in another context', async () => {
    const event = await devoxx()
    await chooseContext(event.id)
    const jan = await storeJan()
    await createEncounterInContext({ personId: jan.id })

    await chooseContext(undefined)
    const result = await addByName({ name: 'Jan Peeters', existingPersonId: jan.id })
    expect(result.alreadyMetToday).toBe(false)
    expect(await db.encounters.count()).toBe(2)
  })

  it('saves nothing for an unknown Person', async () => {
    await expect(addByName({ name: 'Jan Peeters', existingPersonId: 'missing' })).rejects.toBeInstanceOf(
      ValidationError,
    )
    expect(await db.persons.count()).toBe(0)
    expect(await db.encounters.count()).toBe(0)
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })
})

describe('Note step (User Story 3)', () => {
  it('returns the open note step after addByName', async () => {
    const { person, encounter } = await addByName({ name: 'Jan Peeters' })
    expect(await getNoteStep()).toEqual({ person, encounter })
  })

  it('returns nothing without an open note step', async () => {
    expect(await getNoteStep()).toBeUndefined()
  })

  it('returns nothing when the Encounter was deleted', async () => {
    const { encounter } = await addByName({ name: 'Jan Peeters' })
    await deleteEncounter(encounter.id)
    expect(await getNoteStep()).toBeUndefined()
  })

  it('returns nothing when the Encounter is not dated today (B18)', async () => {
    const jan = await storeJan()
    const yesterday = await createEncounter({ personId: jan.id, date: addDaysLocal(todayLocal(), -1) })
    await updateSettings({ noteStepEncounterId: yesterday.id })
    expect(await getNoteStep()).toBeUndefined()
  })

  it('stores a trimmed note and closes the note step', async () => {
    const { encounter } = await addByName({ name: 'Jan Peeters' })
    await finishNoteStep(encounter.id, '  Works on payments ')
    expect((await db.encounters.get(encounter.id))?.note).toBe('Works on payments')
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })

  it('keeps an existing note when skipped or left empty', async () => {
    await chooseContext(undefined)
    const jan = await storeJan()
    const today = await createEncounterInContext({ personId: jan.id, note: 'Payments' })

    await addByName({ name: 'Jan Peeters', existingPersonId: jan.id })
    await finishNoteStep(today.id, '')
    expect((await db.encounters.get(today.id))?.note).toBe('Payments')
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()

    await addByName({ name: 'Jan Peeters', existingPersonId: jan.id })
    await finishNoteStep(today.id, undefined)
    expect((await db.encounters.get(today.id))?.note).toBe('Payments')
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })
})
