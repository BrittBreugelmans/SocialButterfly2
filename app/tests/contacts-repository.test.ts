import { describe, expect, it } from 'vitest'
import { todayLocal } from '../src/data/dates'
import { LastEncounterError, ValidationError } from '../src/data/errors'
import {
  createEncounter,
  createEvent,
  createPerson,
  deleteEncounterFromTimeline,
  getPerson,
  listEncounters,
  listEncountersByPerson,
  updatePerson,
  updatePersonDetails,
} from '../src/data/repository'
import { buildSearchUrl } from '../src/linkedin/links'

const SEARCH = 'https://www.linkedin.com/search/results/people/?keywords=x'

describe('listEncounters (F7)', () => {
  it('returns the Encounters of every Person, with and without an Event', async () => {
    const today = todayLocal()
    const event = await createEvent({ name: 'Devoxx 2026', startDate: today, endDate: today })
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const zoe = await createPerson({ name: 'Zoë Maes', searchUrl: SEARCH })
    await createEncounter({ personId: jan.id, eventId: event.id, date: today })
    await createEncounter({ personId: zoe.id, date: today })

    const encounters = await listEncounters()
    expect(encounters).toHaveLength(2)
    expect(encounters.map((e) => e.personId).sort()).toEqual([jan.id, zoe.id].sort())
    expect(encounters.filter((e) => e.eventId === undefined)).toHaveLength(1)
  })
})

describe('deleteEncounterFromTimeline (F7, B25)', () => {
  it('deletes only the chosen Encounter and its note', async () => {
    const today = todayLocal()
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const first = await createEncounter({ personId: jan.id, date: today, note: 'Kotlin' })
    const second = await createEncounter({ personId: jan.id, date: today })

    await deleteEncounterFromTimeline(first.id)
    expect((await listEncountersByPerson(jan.id)).map((e) => e.id)).toEqual([second.id])
    expect(await getPerson(jan.id)).toBeDefined()
  })

  it("refuses the Person's only Encounter", async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const only = await createEncounter({ personId: jan.id, date: todayLocal() })

    await expect(deleteEncounterFromTimeline(only.id)).rejects.toBeInstanceOf(LastEncounterError)
    expect(await listEncountersByPerson(jan.id)).toHaveLength(1)
  })

  it('refuses an unknown id', async () => {
    await expect(deleteEncounterFromTimeline('nope')).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('updatePersonDetails (F7, B27)', () => {
  const JAN_URL = 'https://www.linkedin.com/in/jan-peeters'

  it('stores name and company, and the search link follows them', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', profileUrl: JAN_URL, searchUrl: SEARCH })
    await updatePerson(jan.id, { connectionStatus: 'connected' })

    const updated = await updatePersonDetails(jan.id, { name: '  Jan Peeters-Maes ', company: ' Elmos ' })
    expect(updated).toMatchObject({
      id: jan.id,
      createdAt: jan.createdAt,
      name: 'Jan Peeters-Maes',
      company: 'Elmos',
      searchUrl: buildSearchUrl('Jan Peeters-Maes', 'Elmos'),
      profileUrl: JAN_URL,
      connectionStatus: 'connected',
    })
    expect(updated.updatedAt >= jan.updatedAt).toBe(true)
    expect(await getPerson(jan.id)).toEqual(updated)
  })

  it('removes an emptied company', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', company: 'Elmos', searchUrl: SEARCH })
    const updated = await updatePersonDetails(jan.id, { name: 'Jan Peeters', company: '   ' })
    expect(updated.company).toBeUndefined()
    expect('company' in updated).toBe(false)
    expect(updated.searchUrl).toBe(buildSearchUrl('Jan Peeters'))
  })

  it('refuses an empty name and changes nothing', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    await expect(updatePersonDetails(jan.id, { name: '  ' })).rejects.toBeInstanceOf(ValidationError)
    expect(await getPerson(jan.id)).toEqual(jan)
  })

  it('allows a name another Person already has', async () => {
    await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const other = await createPerson({ name: 'Jan P', searchUrl: SEARCH })
    expect((await updatePersonDetails(other.id, { name: 'Jan Peeters' })).name).toBe('Jan Peeters')
  })

  it('refuses an unknown id', async () => {
    await expect(updatePersonDetails('nope', { name: 'X' })).rejects.toBeInstanceOf(ValidationError)
  })
})
