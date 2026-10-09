// Pure rules for the daily choice (specs/002-events: research R1, R3; data-model "Derived").
import type { Event, Settings } from '../data/types'

/** True when the owner has not chosen an Event or casual networking yet today (B13). */
export function needsDailyChoice(settings: Settings, today: string): boolean {
  return settings.contextChosenOn !== today
}

export interface EventGroups {
  /** startDate ≤ today ≤ endDate; the previous choice first, then by startDate. */
  current: Event[]
  /** startDate > today; soonest first. */
  upcoming: Event[]
  /** endDate < today; most recently ended first. */
  past: Event[]
}

export function orderEventsForChoice(events: Event[], today: string, previousEventId?: string): EventGroups {
  const current = events
    .filter((e) => e.startDate <= today && today <= e.endDate)
    .sort((a, b) => {
      if (a.id === previousEventId) return -1
      if (b.id === previousEventId) return 1
      return a.startDate.localeCompare(b.startDate)
    })
  const upcoming = events
    .filter((e) => e.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  const past = events
    .filter((e) => e.endDate < today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
  return { current, upcoming, past }
}
