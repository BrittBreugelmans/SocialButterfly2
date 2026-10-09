import { describe, expect, it } from 'vitest'
import { todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import { ValidationError } from '../src/data/errors'
import {
  chooseContext,
  createAndActivateEvent,
  createEncounterInContext,
  createEvent,
  createPerson,
  getSettings,
} from '../src/data/repository'

const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=britt'

describe('createAndActivateEvent (FR-001–FR-004)', () => {
  it('creates the Event and makes it active today', async () => {
    const event = await createAndActivateEvent({ name: 'Devoxx 2026', startDate: '2026-10-06', endDate: '2026-10-08' })
    const settings = await getSettings()
    expect(settings.activeEventId).toBe(event.id)
    expect(settings.contextChosenOn).toBe(todayLocal())
  })

  it('allows the same day for start and end', async () => {
    const event = await createAndActivateEvent({ name: 'Meetup', startDate: '2026-10-09', endDate: '2026-10-09' })
    expect(event.endDate).toBe(event.startDate)
  })

  it('saves nothing when the name is empty or the end is before the start', async () => {
    await expect(
      createAndActivateEvent({ name: '  ', startDate: '2026-10-09', endDate: '2026-10-09' }),
    ).rejects.toBeInstanceOf(ValidationError)
    await expect(
      createAndActivateEvent({ name: 'Devoxx', startDate: '2026-10-09', endDate: '2026-10-08' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(await db.events.count()).toBe(0)
    expect(await db.settings.count()).toBe(0)
  })
})

describe('createEncounterInContext (FR-009)', () => {
  it('links the Encounter to the active Event', async () => {
    const event = await createAndActivateEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    const encounter = await createEncounterInContext({ personId: person.id })
    expect(encounter.eventId).toBe(event.id)
    expect(encounter.date).toBe(todayLocal())
  })

  it('has no Event during casual networking', async () => {
    await chooseContext(undefined)
    const person = await createPerson({ name: 'Britt', searchUrl: SEARCH_URL })
    const encounter = await createEncounterInContext({ personId: person.id, note: 'Talked about PWAs' })
    expect(encounter.eventId).toBeUndefined()
    expect(encounter.note).toBe('Talked about PWAs')
  })

  it('rejects an unknown Person', async () => {
    await expect(createEncounterInContext({ personId: 'nope' })).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('chooseContext (FR-007)', () => {
  it('makes an Event active and records today', async () => {
    const event = await createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    await chooseContext(event.id)
    expect(await getSettings()).toMatchObject({ activeEventId: event.id, contextChosenOn: todayLocal() })
  })

  it('switches to casual networking and still records today', async () => {
    const event = await createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    await chooseContext(event.id)
    await chooseContext(undefined)
    const settings = await getSettings()
    expect(settings.activeEventId).toBeUndefined()
    expect(settings.contextChosenOn).toBe(todayLocal())
  })

  it('rejects an unknown Event and changes nothing', async () => {
    await expect(chooseContext('nope')).rejects.toBeInstanceOf(ValidationError)
    expect(await db.settings.count()).toBe(0)
  })
})
