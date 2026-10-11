import { describe, expect, it } from 'vitest'
import type { Encounter, Person } from '../src/data/types'
import { buildContactRows, defaultView, searchKey } from '../src/people/contacts'

const META = { createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' }

function person(id: string, name: string): Person {
  return { ...META, id, name, searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=x', connectionStatus: 'notConnected' }
}

let encounterId = 0
function encounter(personId: string, date: string, eventId?: string): Encounter {
  encounterId += 1
  return { ...META, id: `e${encounterId}`, personId, date, ...(eventId ? { eventId } : {}) }
}

const names = (rows: { person: Person }[]) => rows.map((row) => row.person.name)

describe('buildContactRows: views (FR-003, FR-004)', () => {
  const persons = [person('a', 'Anna'), person('b', 'Bart'), person('c', 'Chris'), person('d', 'Dirk'), person('e', 'Eva')]
  const encounters = [
    encounter('a', '2026-10-06', 'A'),
    encounter('b', '2026-10-07', 'A'),
    encounter('c', '2026-10-08', 'A'),
    encounter('d', '2026-10-02'),
    encounter('e', '2026-10-05', 'A'),
    encounter('e', '2026-10-09'),
  ]

  it('shows the Persons met at an Event', () => {
    expect(names(buildContactRows(persons, encounters, { kind: 'event', eventId: 'A' }, ''))).toEqual([
      'Chris',
      'Bart',
      'Anna',
      'Eva',
    ])
  })

  it('shows the Persons met without an Event', () => {
    expect(names(buildContactRows(persons, encounters, { kind: 'casual' }, ''))).toEqual(['Eva', 'Dirk'])
  })

  it('shows everyone once in all contacts', () => {
    const rows = buildContactRows(persons, encounters, { kind: 'all' }, '')
    expect(names(rows)).toEqual(['Eva', 'Chris', 'Bart', 'Anna', 'Dirk'])
  })

  it('counts only the Encounters in the view', () => {
    const [eva] = buildContactRows(persons, encounters, { kind: 'event', eventId: 'A' }, 'eva')
    expect(eva).toMatchObject({ lastMet: '2026-10-05', encounterCount: 1 })
    const [evaAll] = buildContactRows(persons, encounters, { kind: 'all' }, 'eva')
    expect(evaAll).toMatchObject({ lastMet: '2026-10-09', encounterCount: 2 })
  })

  it('keeps a Person without Encounters only in all contacts', () => {
    const lonely = person('z', 'Zeno')
    expect(names(buildContactRows([lonely], [], { kind: 'all' }, ''))).toEqual(['Zeno'])
    expect(buildContactRows([lonely], [], { kind: 'casual' }, '')).toEqual([])
  })
})

describe('buildContactRows: sorting (FR-005)', () => {
  it('sorts by newest Encounter, then by name', () => {
    const persons = [person('1', 'Wim'), person('2', 'Ann'), person('3', 'Mo')]
    const encounters = [encounter('1', '2026-10-01'), encounter('2', '2026-10-03'), encounter('3', '2026-10-03')]
    expect(names(buildContactRows(persons, encounters, { kind: 'all' }, ''))).toEqual(['Ann', 'Mo', 'Wim'])
  })
})

describe('searchKey (research R4)', () => {
  it.each([
    ['  JAN  Peeters ', 'jan peeters'],
    ['Zoë', 'zoe'],
    ['Çelik', 'celik'],
  ])('%j → %j', (input, expected) => {
    expect(searchKey(input)).toBe(expected)
  })
})

describe('buildContactRows: search (FR-008)', () => {
  const persons = [person('1', 'Jan Peeters'), person('2', 'Janne De Smet'), person('3', 'Piet Jansen'), person('4', 'Zoë Maes')]
  const encounters = persons.map((p) => encounter(p.id, '2026-10-01'))
  const search = (query: string) => names(buildContactRows(persons, encounters, { kind: 'all' }, query)).sort()

  it('matches any part of the name', () => {
    expect(search('jan')).toEqual(['Jan Peeters', 'Janne De Smet', 'Piet Jansen'])
    expect(search('peet')).toEqual(['Jan Peeters'])
  })

  it('ignores accents, case and extra spaces', () => {
    expect(search('zoe')).toEqual(['Zoë Maes'])
    expect(search('  JAN   peeters')).toEqual(['Jan Peeters'])
  })

  it('keeps everyone for an empty query', () => {
    expect(search('')).toHaveLength(4)
  })
})

describe('defaultView (FR-003)', () => {
  it('opens on the active Event, or all contacts during casual networking', () => {
    expect(defaultView('x')).toEqual({ kind: 'event', eventId: 'x' })
    expect(defaultView(undefined)).toEqual({ kind: 'all' })
  })
})

describe('buildContactRows: volume (SC-002)', () => {
  it('handles 500 Persons with 1 000 Encounters', () => {
    const persons = Array.from({ length: 500 }, (_, i) => person(`p${i}`, `Contact ${i}`))
    const encounters = persons.flatMap((p, i) => [
      encounter(p.id, `2026-09-${String((i % 28) + 1).padStart(2, '0')}`, i % 2 === 0 ? 'A' : undefined),
      encounter(p.id, '2026-10-01', 'B'),
    ])
    expect(buildContactRows(persons, encounters, { kind: 'all' }, '')).toHaveLength(500)
    expect(buildContactRows(persons, encounters, { kind: 'event', eventId: 'A' }, '')).toHaveLength(250)
    expect(buildContactRows(persons, encounters, { kind: 'all' }, 'contact 49')).toHaveLength(11)
  })
})
