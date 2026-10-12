import { describe, expect, it } from 'vitest'
import type { Encounter, Event } from '../src/data/types'
import { eventListRows } from '../src/settings/eventList'

const T = '2026-10-01T10:00:00.000Z'
const event = (id: string, startDate: string): Event => ({
  id,
  createdAt: T,
  updatedAt: T,
  name: id,
  startDate,
  endDate: startDate,
})
const encounter = (id: string, eventId?: string): Encounter => ({
  id,
  createdAt: T,
  updatedAt: T,
  personId: 'p',
  date: '2026-10-07',
  ...(eventId ? { eventId } : {}),
})

describe('eventListRows (F10 FR-012)', () => {
  const events = [event('new', '2026-11-01'), event('old', '2026-09-01')]

  it('counts Encounters per Event; an Event without Encounters has 0', () => {
    const rows = eventListRows(events, [encounter('1', 'old'), encounter('2', 'old')])
    expect(rows.map((r) => [r.event.id, r.encounterCount])).toEqual([
      ['new', 0],
      ['old', 2],
    ])
  })

  it('does not count casual Encounters anywhere', () => {
    const rows = eventListRows(events, [encounter('1'), encounter('2')])
    expect(rows.every((r) => r.encounterCount === 0)).toBe(true)
  })

  it('marks only the active Event', () => {
    const rows = eventListRows(events, [], 'old')
    expect(rows.map((r) => r.isActive)).toEqual([false, true])
    expect(eventListRows(events, []).some((r) => r.isActive)).toBe(false)
  })

  it('keeps the order it is given', () => {
    const reversed = [...events].reverse()
    expect(eventListRows(reversed, []).map((r) => r.event.id)).toEqual(['old', 'new'])
  })
})
