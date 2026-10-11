// The contact list (F7, specs/006-contacts research R3 and R4). Pure: no database.

import type { Encounter, Person } from '../data/types'

/** Which Persons the list shows: one Event, casual networking, or everyone (FR-003). */
export type ContactView = { kind: 'all' } | { kind: 'casual' } | { kind: 'event'; eventId: string }

export interface ContactRow {
  person: Person
  /** Newest Encounter date in the view; absent only for a Person without Encounters in 'all'. */
  lastMet?: string
  /** Number of the Person's Encounters in the view. */
  encounterCount: number
}

/**
 * The form of a name used for searching (FR-008): accents removed, lowercase, repeated spaces
 * collapsed, trimmed. Unlike normalizeName (F2), accents do not count here.
 */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** The active Event, or everyone during casual networking (FR-003). */
export function defaultView(activeEventId: string | undefined): ContactView {
  return activeEventId === undefined ? { kind: 'all' } : { kind: 'event', eventId: activeEventId }
}

function inView(encounter: Encounter, view: ContactView): boolean {
  if (view.kind === 'all') return true
  if (view.kind === 'casual') return encounter.eventId === undefined
  return encounter.eventId === view.eventId
}

/** Rows for the view, filtered by name, newest Encounter first, then by name (FR-004, FR-005). */
export function buildContactRows(
  persons: Person[],
  encounters: Encounter[],
  view: ContactView,
  query: string,
): ContactRow[] {
  const byPerson = new Map<string, Encounter[]>()
  for (const encounter of encounters) {
    if (!inView(encounter, view)) continue
    const list = byPerson.get(encounter.personId)
    if (list) list.push(encounter)
    else byPerson.set(encounter.personId, [encounter])
  }

  const wanted = searchKey(query)
  const rows: ContactRow[] = []
  for (const person of persons) {
    const matching = byPerson.get(person.id) ?? []
    if (matching.length === 0 && view.kind !== 'all') continue
    if (wanted !== '' && !searchKey(person.name).includes(wanted)) continue
    const lastMet = matching.reduce<string | undefined>((max, e) => (max === undefined || e.date > max ? e.date : max), undefined)
    rows.push(lastMet === undefined ? { person, encounterCount: 0 } : { person, lastMet, encounterCount: matching.length })
  }

  return rows.sort(
    (a, b) => (b.lastMet ?? '').localeCompare(a.lastMet ?? '') || a.person.name.localeCompare(b.person.name),
  )
}
