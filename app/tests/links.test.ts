import { describe, expect, it } from 'vitest'
import { buildSearchUrl, linkedInUrlFor } from '../src/linkedin/links'
import { normalizeName } from '../src/people/nameMatch'

const SEARCH = 'https://www.linkedin.com/search/results/people/?keywords='

describe('buildSearchUrl (research R2)', () => {
  it('searches for the name and the company', () => {
    expect(buildSearchUrl('Jan Peeters', 'Elmos')).toBe(`${SEARCH}Jan%20Peeters%20Elmos`)
  })

  it('searches for the name only when the company is empty (B17)', () => {
    expect(buildSearchUrl(' Jan Peeters ', '  ')).toBe(`${SEARCH}Jan%20Peeters`)
    expect(buildSearchUrl('Jan Peeters')).toBe(`${SEARCH}Jan%20Peeters`)
  })

  it('encodes special characters', () => {
    expect(buildSearchUrl('Zoë & Co', 'A/B')).toContain('Zo%C3%AB%20%26%20Co%20A%2FB')
  })
})

describe('linkedInUrlFor (FR-011)', () => {
  const profileUrl = 'https://www.linkedin.com/in/jan-peeters'
  const searchUrl = `${SEARCH}Jan%20Peeters`

  it('prefers the profile URL', () => {
    expect(linkedInUrlFor({ profileUrl, searchUrl })).toBe(profileUrl)
  })

  it('falls back to the search link', () => {
    expect(linkedInUrlFor({ searchUrl })).toBe(searchUrl)
  })

  it('returns undefined when both are missing', () => {
    expect(linkedInUrlFor({})).toBeUndefined()
  })
})

describe('normalizeName (research R3)', () => {
  it('ignores case and extra spaces', () => {
    expect(normalizeName('  Jan   PEETERS ')).toBe('jan peeters')
  })

  it('does not fold accents', () => {
    expect(normalizeName('Zoë')).not.toBe(normalizeName('Zoe'))
  })
})
