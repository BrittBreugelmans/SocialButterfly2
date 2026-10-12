// The Event list in Settings (F10 FR-012). Pure: no database.

import type { Encounter, Event } from '../data/types'

export interface EventListRow {
  event: Event
  encounterCount: number
  isActive: boolean
}

/** One row per Event, in the order given (listEvents: newest start date first). */
export function eventListRows(events: Event[], encounters: Encounter[], activeEventId?: string): EventListRow[] {
  const counts = new Map<string, number>()
  for (const encounter of encounters) {
    if (encounter.eventId !== undefined) counts.set(encounter.eventId, (counts.get(encounter.eventId) ?? 0) + 1)
  }
  return events.map((event) => ({
    event,
    encounterCount: counts.get(event.id) ?? 0,
    isActive: event.id === activeEventId,
  }))
}
