import { describe, expect, it } from 'vitest'
import { todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import { ValidationError } from '../src/data/errors'
import {
  createEncounter,
  createEvent,
  createPerson,
  getPerson,
  getSettings,
  linkProfileUrl,
  mergePersons,
  updatePerson,
  updateSettings,
} from '../src/data/repository'
import { buildSearchUrl } from '../src/linkedin/links'

const JAN_URL = 'https://www.linkedin.com/in/jan-peeters'
const OTHER_URL = 'https://www.linkedin.com/in/jan-peeters-2'

async function storePerson(name: string, profileUrl?: string, company?: string) {
  return createPerson({ name, company, searchUrl: buildSearchUrl(name), profileUrl })
}

describe('linkProfileUrl (User Story 1)', () => {
  it('stores the link and keeps the search link', async () => {
    const jan = await storePerson('Jan Peeters')
    await new Promise((resolve) => setTimeout(resolve, 5)) // a later updatedAt
    const result = await linkProfileUrl(jan.id, JAN_URL)

    expect(result.status).toBe('linked')
    const stored = await getPerson(jan.id)
    expect(stored?.profileUrl).toBe(JAN_URL)
    expect(stored?.searchUrl).toBe(jan.searchUrl)
    expect(stored!.updatedAt > jan.updatedAt).toBe(true)
    expect(result.status === 'linked' && result.person).toEqual(stored)
  })

  it('reports "unchanged" for the link the Person already has', async () => {
    const jan = await storePerson('Jan Peeters', JAN_URL)
    const result = await linkProfileUrl(jan.id, JAN_URL)
    expect(result.status).toBe('unchanged')
    expect(await getPerson(jan.id)).toEqual(jan)
  })

  it('replaces an earlier link', async () => {
    const jan = await storePerson('Jan Peeters', OTHER_URL)
    expect((await linkProfileUrl(jan.id, JAN_URL)).status).toBe('linked')
    expect((await getPerson(jan.id))?.profileUrl).toBe(JAN_URL)
  })

  it('reports a conflict and writes nothing when another Person has the link', async () => {
    const stored = await storePerson('Jan Peeters', JAN_URL)
    const typo = await storePerson('Jan Peters')
    const result = await linkProfileUrl(typo.id, JAN_URL)

    expect(result).toEqual({ status: 'conflict', other: stored })
    expect(await getPerson(typo.id)).toEqual(typo)
    expect(await getPerson(stored.id)).toEqual(stored)
  })

  it('rejects a link that is not normalized, or an unknown Person', async () => {
    const jan = await storePerson('Jan Peeters')
    await expect(linkProfileUrl(jan.id, 'https://www.linkedin.com/in/jan/')).rejects.toBeInstanceOf(ValidationError)
    await expect(linkProfileUrl('missing', JAN_URL)).rejects.toBeInstanceOf(ValidationError)
    expect((await getPerson(jan.id))?.profileUrl).toBeUndefined()
  })
})

describe('mergePersons (User Story 2, B21)', () => {
  const TODAY = todayLocal()

  async function pair() {
    const into = await storePerson('Jan Peeters', JAN_URL)
    const from = await storePerson('Jan Peters', undefined, 'Acme')
    return { into, from }
  }

  it('keeps the Person with the link and fills in what it misses', async () => {
    const { into, from } = await pair()
    await updatePerson(from.id, { connectionStatus: 'connected' })
    const { person } = await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })

    expect(person.id).toBe(into.id)
    expect(person.name).toBe('Jan Peeters')
    expect(person.profileUrl).toBe(JAN_URL)
    expect(person.searchUrl).toBe(into.searchUrl)
    expect(person.company).toBe('Acme')
    expect(person.connectionStatus).toBe('connected')
    expect(person.updatedAt >= into.updatedAt).toBe(true)
    expect(await getPerson(into.id)).toEqual(person)
    expect(await getPerson(from.id)).toBeUndefined()
  })

  it('keeps the company of the Person with the link', async () => {
    const into = await storePerson('Jan Peeters', JAN_URL, 'Elmos')
    const from = await storePerson('Jan Peters', undefined, 'Acme')
    const { person } = await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })
    expect(person.company).toBe('Elmos')
    expect(person.connectionStatus).toBe('notConnected')
  })

  it('moves Encounters on other days or in other contexts, with their notes', async () => {
    const { into, from } = await pair()
    const event = await createEvent({ name: 'Devoxx 2026', startDate: TODAY, endDate: TODAY })
    await createEncounter({ personId: into.id, date: TODAY })
    const otherDay = await createEncounter({ personId: from.id, date: '2026-09-01', note: 'oud' })
    const otherContext = await createEncounter({ personId: from.id, date: TODAY, eventId: event.id })

    await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })
    const moved = await db.encounters.where('personId').equals(into.id).toArray()
    expect(moved).toHaveLength(3)
    expect((await db.encounters.get(otherDay.id))?.personId).toBe(into.id)
    expect((await db.encounters.get(otherDay.id))?.note).toBe('oud')
    expect((await db.encounters.get(otherContext.id))?.personId).toBe(into.id)
  })

  it('folds a same-day, same-context Encounter into one, keeping both notes (B19)', async () => {
    const { into, from } = await pair()
    const kept = await createEncounter({ personId: into.id, date: TODAY, note: 'eerste' })
    const folded = await createEncounter({ personId: from.id, date: TODAY, note: 'tweede' })

    await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })
    expect(await db.encounters.count()).toBe(1)
    expect((await db.encounters.get(kept.id))?.note).toBe('eerste\ntweede')
    expect(await db.encounters.get(folded.id)).toBeUndefined()
  })

  it('keeps the one note when the other is empty', async () => {
    const { into, from } = await pair()
    const kept = await createEncounter({ personId: into.id, date: TODAY })
    await createEncounter({ personId: from.id, date: TODAY, note: 'tweede' })
    await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })
    expect((await db.encounters.get(kept.id))?.note).toBe('tweede')
  })

  it('uses the unsaved note and moves the note step along', async () => {
    const { into, from } = await pair()
    const kept = await createEncounter({ personId: into.id, date: TODAY, note: 'eerste' })
    const open = await createEncounter({ personId: from.id, date: TODAY })
    await updateSettings({ noteStepEncounterId: open.id })

    const { noteStepEncounter } = await mergePersons({
      fromPersonId: from.id,
      intoPersonId: into.id,
      noteDraft: 'getypt',
    })
    expect(noteStepEncounter?.id).toBe(kept.id)
    expect(noteStepEncounter?.note).toBe('eerste\ngetypt')
    expect((await getSettings()).noteStepEncounterId).toBe(kept.id)
  })

  it('keeps the note step on a moved Encounter', async () => {
    const { into, from } = await pair()
    const open = await createEncounter({ personId: from.id, date: TODAY })
    await updateSettings({ noteStepEncounterId: open.id })
    const { noteStepEncounter } = await mergePersons({
      fromPersonId: from.id,
      intoPersonId: into.id,
      noteDraft: 'getypt',
    })
    expect(noteStepEncounter).toMatchObject({ id: open.id, personId: into.id, note: 'getypt' })
    expect((await getSettings()).noteStepEncounterId).toBe(open.id)
  })

  it('refuses the same Person twice or an unknown Person, and changes nothing', async () => {
    const { into, from } = await pair()
    await expect(mergePersons({ fromPersonId: into.id, intoPersonId: into.id })).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(mergePersons({ fromPersonId: 'missing', intoPersonId: into.id })).rejects.toBeInstanceOf(
      ValidationError,
    )
    expect(await getPerson(from.id)).toEqual(from)
    expect(await getPerson(into.id)).toEqual(into)
  })
})
