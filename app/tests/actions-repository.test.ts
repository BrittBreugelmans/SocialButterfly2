import Dexie from 'dexie'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../src/data/db'
import { ValidationError } from '../src/data/errors'
import {
  createEncounter,
  createPerson,
  deletePerson,
  dismissAction,
  listDismissals,
  listEncounters,
  listEvents,
  listPersons,
  mergePersons,
  onDataChanged,
  undoDismissal,
} from '../src/data/repository'
import type { ActionType } from '../src/data/types'

const META = { createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' }

describe('Schema version 2 (F8 research R1)', () => {
  it('keeps every record of version 1 and adds an empty dismissals table', async () => {
    db.close()
    await Dexie.delete('sociale-vlinder')

    // The database as F0–F7 left it: version 1 only.
    const v1 = new Dexie('sociale-vlinder')
    v1.version(1).stores({
      persons: 'id, &profileUrl, name',
      encounters: 'id, personId, eventId, date',
      events: 'id, startDate',
      settings: 'key',
    })
    await v1.table('persons').add({
      ...META,
      id: 'p1',
      name: 'Jan Peeters',
      searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jan',
      connectionStatus: 'notConnected',
    })
    await v1.table('events').add({ ...META, id: 'e1', name: 'Devoxx 2026', startDate: '2026-10-06', endDate: '2026-10-08' })
    await v1.table('encounters').add({ ...META, id: 'c1', personId: 'p1', eventId: 'e1', date: '2026-10-07', note: 'Kotlin' })
    v1.close()

    await db.open()
    expect(db.verno).toBe(2)
    expect((await listPersons()).map((p) => p.name)).toEqual(['Jan Peeters'])
    expect(await listEncounters()).toEqual([
      { ...META, id: 'c1', personId: 'p1', eventId: 'e1', date: '2026-10-07', note: 'Kotlin' },
    ])
    expect((await listEvents()).map((e) => e.id)).toEqual(['e1'])
    expect(await listDismissals()).toEqual([])
  })
})

const SEARCH = 'https://www.linkedin.com/search/results/people/?keywords=x'

describe('dismissAction and undoDismissal (F8 research R6)', () => {
  it('stores one dismissal per Person and type, updated when dismissed again', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const first = await dismissAction(jan.id, 'notConnected')
    expect(first.previous).toBeUndefined()
    expect(first.dismissal).toMatchObject({ personId: jan.id, type: 'notConnected' })
    expect(first.dismissal.dismissedAt).toBe(first.dismissal.createdAt)

    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await dismissAction(jan.id, 'notConnected')
    expect(second.previous).toEqual(first.dismissal)
    expect(second.dismissal.id).toBe(first.dismissal.id)
    expect(second.dismissal.dismissedAt > first.dismissal.dismissedAt).toBe(true)
    expect(await listDismissals()).toHaveLength(1)

    await dismissAction(jan.id, 'noteMissing')
    expect(await listDismissals()).toHaveLength(2)
  })

  it('refuses an unknown Person or type', async () => {
    await expect(dismissAction('nope', 'notConnected')).rejects.toBeInstanceOf(ValidationError)
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    await expect(dismissAction(jan.id, 'bogus' as ActionType)).rejects.toBeInstanceOf(ValidationError)
  })

  it('undoes a new dismissal, or restores the previous one', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const { dismissal } = await dismissAction(jan.id, 'notConnected')
    await undoDismissal(dismissal.id)
    expect(await listDismissals()).toEqual([])

    const first = await dismissAction(jan.id, 'notConnected')
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await dismissAction(jan.id, 'notConnected')
    await undoDismissal(second.dismissal.id, second.previous)
    expect(await listDismissals()).toEqual([first.dismissal])
  })

  it('deletes the dismissals of a deleted Person', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    const zoe = await createPerson({ name: 'Zoë Maes', searchUrl: SEARCH })
    await dismissAction(jan.id, 'notConnected')
    await dismissAction(zoe.id, 'notConnected')
    await deletePerson(jan.id)
    expect((await listDismissals()).map((d) => d.personId)).toEqual([zoe.id])
  })

  it('drops the dismissals of the Person that disappears in a merge', async () => {
    const from = await createPerson({ name: 'Jan P', searchUrl: SEARCH })
    const into = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    await createEncounter({ personId: from.id, date: '2026-10-01' })
    await createEncounter({ personId: into.id, date: '2026-10-02' })
    await dismissAction(from.id, 'noteMissing')
    await dismissAction(into.id, 'notConnected')
    await mergePersons({ fromPersonId: from.id, intoPersonId: into.id })
    expect((await listDismissals()).map((d) => [d.personId, d.type])).toEqual([[into.id, 'notConnected']])
  })
})

describe('onDataChanged (F8 research R4)', () => {
  it('signals after every successful write, not after a failed one or after unsubscribing', async () => {
    const listener = vi.fn()
    const unsubscribe = onDataChanged(listener)

    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH })
    expect(listener).toHaveBeenCalledTimes(1)
    await dismissAction(jan.id, 'notConnected')
    expect(listener).toHaveBeenCalledTimes(2)

    await expect(createPerson({ name: '  ', searchUrl: SEARCH })).rejects.toBeInstanceOf(ValidationError)
    await expect(dismissAction('nope', 'notConnected')).rejects.toBeInstanceOf(ValidationError)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    await createPerson({ name: 'Zoë Maes', searchUrl: SEARCH })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
