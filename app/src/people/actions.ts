// Open Actions on the Actions tab (F8, specs/007-actions-tab research R2 and R3). Pure: no database.

import type { ActionType, Dismissal, Encounter, Person } from '../data/types'

/** The fixed order of the Action rows on a card. */
export const ACTION_TYPES: readonly ActionType[] = ['noteMissing', 'notConnected', 'profileLinkMissing']

export interface ActionCard {
  person: Person
  /** Newest by date, then by save time. "Write note" writes here (B31). */
  lastEncounter: Encounter
  /** The open Actions, in ACTION_TYPES order; never empty. */
  actions: ActionType[]
}

function newest(encounters: Encounter[]): Encounter | undefined {
  return encounters.reduce<Encounter | undefined>(
    (best, e) =>
      best === undefined || e.date > best.date || (e.date === best.date && e.createdAt > best.createdAt) ? e : best,
    undefined,
  )
}

function hasGap(type: ActionType, person: Person, encounters: Encounter[]): boolean {
  if (type === 'noteMissing') return !encounters.some((e) => e.note !== undefined) // B31
  if (type === 'notConnected') return person.connectionStatus === 'notConnected'
  return person.profileUrl === undefined
}

/**
 * A dismissal counts until an Encounter of the Person is saved after it (B30). Merges and deletes
 * keep `createdAt`, so they never bring an Action back.
 */
function isDismissed(dismissal: Dismissal | undefined, encounters: Encounter[]): boolean {
  if (!dismissal) return false
  return !encounters.some((e) => e.createdAt > dismissal.dismissedAt)
}

/** The open Actions of one Person. Other Persons' records in the lists are ignored. */
export function openActions(person: Person, encounters: Encounter[], dismissals: Dismissal[]): ActionType[] {
  const own = encounters.filter((e) => e.personId === person.id)
  const ownDismissals = dismissals.filter((d) => d.personId === person.id)
  return openFor(person, own, ownDismissals)
}

function openFor(person: Person, own: Encounter[], ownDismissals: Dismissal[]): ActionType[] {
  return ACTION_TYPES.filter(
    (type) =>
      hasGap(type, person, own) &&
      !isDismissed(
        ownDismissals.find((d) => d.type === type),
        own,
      ),
  )
}

/** One card per Person with open Actions, the most recently met first (FR-006). */
export function buildActionCards(persons: Person[], encounters: Encounter[], dismissals: Dismissal[]): ActionCard[] {
  const encountersByPerson = groupBy(encounters)
  const dismissalsByPerson = groupBy(dismissals)
  const cards: ActionCard[] = []
  for (const person of persons) {
    const own = encountersByPerson.get(person.id) ?? []
    const lastEncounter = newest(own)
    if (!lastEncounter) continue // a Person without Encounters should not exist
    const actions = openFor(person, own, dismissalsByPerson.get(person.id) ?? [])
    if (actions.length > 0) cards.push({ person, lastEncounter, actions })
  }
  return cards.sort(
    (a, b) =>
      b.lastEncounter.date.localeCompare(a.lastEncounter.date) ||
      b.lastEncounter.createdAt.localeCompare(a.lastEncounter.createdAt) ||
      a.person.name.localeCompare(b.person.name),
  )
}

/** The badge on the Actions tab (FR-012). */
export function countOpenActions(persons: Person[], encounters: Encounter[], dismissals: Dismissal[]): number {
  return buildActionCards(persons, encounters, dismissals).reduce((sum, card) => sum + card.actions.length, 0)
}

function groupBy<T extends { personId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.personId)
    if (list) list.push(item)
    else map.set(item.personId, [item])
  }
  return map
}
