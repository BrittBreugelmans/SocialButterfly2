import { describe, expect, it } from 'vitest'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import type { Event, Settings } from '../src/data/types'
import { needsDailyChoice, orderEventsForChoice } from '../src/events/choice'
import { formatDateRange } from '../src/events/formatDateRange'

describe('local dates (research R2)', () => {
  it('adds calendar days across a month end', () => {
    expect(addDaysLocal('2026-10-30', 3)).toBe('2026-11-02')
  })

  it('is not shifted by daylight saving', () => {
    expect(addDaysLocal('2026-03-28', 2)).toBe('2026-03-30')
  })

  it('gives today as YYYY-MM-DD', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDateRange (research R8)', () => {
  it('shows a range in the app language', () => {
    const text = formatDateRange('2026-10-06', '2026-10-08', 'en')
    expect(text).toContain('Oct')
    expect(text).toContain('2026')
  })

  it('shows a single date when start and end are equal', () => {
    const text = formatDateRange('2026-10-07', '2026-10-07', 'nl')
    expect(text).toContain('2026')
    expect(text).not.toMatch(/[–-]/)
  })
})

const settings = (contextChosenOn?: string): Settings => ({
  key: 'settings',
  language: 'nl',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...(contextChosenOn ? { contextChosenOn } : {}),
})

describe('needsDailyChoice (FR-005, B13)', () => {
  it('asks when nothing was chosen yet', () => {
    expect(needsDailyChoice(settings(), '2026-10-09')).toBe(true)
  })

  it('asks on a new day', () => {
    expect(needsDailyChoice(settings('2026-10-08'), '2026-10-09')).toBe(true)
  })

  it('does not ask again on the same day', () => {
    expect(needsDailyChoice(settings('2026-10-09'), '2026-10-09')).toBe(false)
  })
})

const event = (id: string, startDate: string, endDate: string): Event => ({
  id,
  name: id,
  startDate,
  endDate,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('orderEventsForChoice (research R3)', () => {
  const today = '2026-10-09'
  const events = [
    event('past-old', '2026-01-10', '2026-01-12'),
    event('upcoming-late', '2026-12-01', '2026-12-02'),
    event('current-b', '2026-10-09', '2026-10-09'),
    event('past-recent', '2026-10-01', '2026-10-08'),
    event('current-a', '2026-10-08', '2026-10-10'),
    event('upcoming-soon', '2026-10-20', '2026-10-21'),
  ]

  it('groups into current, upcoming and past in the right order', () => {
    const groups = orderEventsForChoice(events, today)
    expect(groups.current.map((e) => e.id)).toEqual(['current-a', 'current-b'])
    expect(groups.upcoming.map((e) => e.id)).toEqual(['upcoming-soon', 'upcoming-late'])
    expect(groups.past.map((e) => e.id)).toEqual(['past-recent', 'past-old'])
  })

  it('puts the previous choice first when it is still running', () => {
    const groups = orderEventsForChoice(events, today, 'current-b')
    expect(groups.current.map((e) => e.id)).toEqual(['current-b', 'current-a'])
  })

  it('counts an Event that ends today as current', () => {
    const groups = orderEventsForChoice([event('ends-today', '2026-10-07', today)], today)
    expect(groups.current).toHaveLength(1)
  })
})
