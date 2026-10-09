// LinkedIn URLs the app opens for the owner (research R2 in specs/003-add-by-name).
// The app only opens these; it never reads anything back from LinkedIn (constitution I).

import type { Person } from '../data/types'

const PEOPLE_SEARCH = 'https://www.linkedin.com/search/results/people/?keywords='

/** People search for the name, plus the company when given (B17). */
export function buildSearchUrl(name: string, company?: string): string {
  const keywords = [name.trim(), company?.trim() ?? ''].filter((part) => part !== '').join(' ')
  return PEOPLE_SEARCH + encodeURIComponent(keywords)
}

/** The profile when known, otherwise the search link (FR-011). */
export function linkedInUrlFor(person: Pick<Person, 'profileUrl' | 'searchUrl'>): string | undefined {
  return person.profileUrl ?? person.searchUrl
}
