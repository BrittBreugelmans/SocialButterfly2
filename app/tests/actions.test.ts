import { describe, expect, it } from 'vitest'
import type { ActionType, Dismissal, Encounter, Person } from '../src/data/types'
import { buildActionCards, countOpenActions, openActions } from '../src/people/actions'

const META = { createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z' }
const SEARCH = 'https://www.linkedin.com/search/results/people/?keywords=x'

function person(id: string, name: string, extra: Partial<Person> = {}): Person {
  return { ...META, id, name, searchUrl: SEARCH, connectionStatus: 'notConnected', ...extra }
}

/** A Person with nothing left to do. */
function done(id: string, name: string): Person {
  return person(id, name, { connectionStatus: 'connected', profileUrl: `https://www.linkedin.com/in/${id}` })
}

let n = 0
function encounter(personId: string, date: string, extra: Partial<Encounter> = {}): Encounter {
  n += 1
  return { ...META, id: `e${n}`, personId, date, createdAt: `${date}T10:00:00.000Z`, ...extra }
}

function dismissal(personId: string, type: ActionType, dismissedAt: string): Dismissal {
  return { ...META, id: `d-${personId}-${type}`, personId, type, dismissedAt }
}

describe('openActions: the three gaps (FR-002–FR-004)', () => {
  it('finds every gap', () => {
    const jan = person('jan', 'Jan')
    expect(openActions(jan, [encounter('jan', '2026-10-07')], [])).toEqual([
      'noteMissing',
      'notConnected',
      'profileLinkMissing',
    ])
  })

  it('finds nothing when everything is done', () => {
    const zoe = done('zoe', 'Zoë')
    expect(openActions(zoe, [encounter('zoe', '2026-10-07', { note: 'Kotlin' })], [])).toEqual([])
  })

  it('opens "note missing" only when no Encounter has a note (B31)', () => {
    const zoe = done('zoe', 'Zoë')
    const older = encounter('zoe', '2026-09-01', { note: 'Met at a meetup' })
    const newer = encounter('zoe', '2026-10-07')
    expect(openActions(zoe, [older, newer], [])).toEqual([])
    expect(openActions(zoe, [encounter('zoe', '2026-09-01'), newer], [])).toEqual(['noteMissing'])
  })

  it("ignores other Persons' records", () => {
    const zoe = done('zoe', 'Zoë')
    const records = [encounter('zoe', '2026-10-07', { note: 'x' }), encounter('jan', '2026-10-07')]
    expect(openActions(zoe, records, [dismissal('jan', 'noteMissing', '2026-10-08T00:00:00.000Z')])).toEqual([])
  })
})

describe('openActions: dismissals (B30)', () => {
  const piet = person('piet', 'Piet', { profileUrl: 'https://www.linkedin.com/in/piet' })
  const met = encounter('piet', '2026-10-07', { note: 'Rust' })

  it('hides a dismissed Action', () => {
    expect(openActions(piet, [met], [dismissal('piet', 'notConnected', '2026-10-08T09:00:00.000Z')])).toEqual([])
  })

  it('brings it back after a newer Encounter', () => {
    const again = encounter('piet', '2026-10-09')
    expect(
      openActions(piet, [met, again], [dismissal('piet', 'notConnected', '2026-10-08T09:00:00.000Z')]),
    ).toEqual(['notConnected'])
  })

  it('keeps it hidden with only older Encounters, as after a merge or a delete', () => {
    const movedIn = encounter('piet', '2026-10-09', { createdAt: '2026-10-05T10:00:00.000Z' })
    expect(
      openActions(piet, [met, movedIn], [dismissal('piet', 'notConnected', '2026-10-08T09:00:00.000Z')]),
    ).toEqual([])
  })

  it('only hides its own type', () => {
    const jan = person('jan', 'Jan')
    expect(
      openActions(jan, [encounter('jan', '2026-10-07')], [dismissal('jan', 'notConnected', '2026-10-08T00:00:00.000Z')]),
    ).toEqual(['noteMissing', 'profileLinkMissing'])
  })
})

describe('buildActionCards (FR-006, FR-007)', () => {
  it('makes one card per Person with open Actions, newest first', () => {
    const persons = [person('a', 'Ann'), done('z', 'Zoë'), person('b', 'Bart'), person('c', 'Chris')]
    const encounters = [
      encounter('a', '2026-10-05'),
      encounter('z', '2026-10-09', { note: 'x' }),
      encounter('b', '2026-10-07'),
      encounter('c', '2026-10-07', { createdAt: '2026-10-07T12:00:00.000Z' }),
    ]
    const cards = buildActionCards(persons, encounters, [])
    expect(cards.map((c) => c.person.name)).toEqual(['Chris', 'Bart', 'Ann'])
  })

  it('uses the newest Encounter as the last one', () => {
    const jan = person('jan', 'Jan')
    const old = encounter('jan', '2026-09-01')
    const recent = encounter('jan', '2026-10-07')
    expect(buildActionCards([jan], [recent, old], [])[0]?.lastEncounter.id).toBe(recent.id)
  })

  it('makes no card for a Person without Encounters', () => {
    expect(buildActionCards([person('x', 'X')], [], [])).toEqual([])
  })
})

describe('countOpenActions (FR-012)', () => {
  it('sums the open Actions', () => {
    const persons = [person('jan', 'Jan'), done('piet', 'Piet')]
    const encounters = [encounter('jan', '2026-10-07'), encounter('piet', '2026-10-07')]
    expect(countOpenActions(persons, encounters, [])).toBe(4)
  })

  it('handles 300 open Actions (SC-005)', () => {
    const persons = Array.from({ length: 300 }, (_, i) => done(`p${i}`, `Person ${i}`))
    const encounters = persons.map((p) => encounter(p.id, '2026-10-07'))
    expect(buildActionCards(persons, encounters, [])).toHaveLength(300)
    expect(countOpenActions(persons, encounters, [])).toBe(300)
  })
})
