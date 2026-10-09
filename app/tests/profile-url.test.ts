import { describe, expect, it } from 'vitest'
import { normalizeProfileUrl, shortProfileUrl } from '../src/linkedin/profileUrl'

const JAN = 'https://www.linkedin.com/in/jan-peeters'

describe('normalizeProfileUrl (research R2)', () => {
  it.each([
    'https://www.linkedin.com/in/jan-peeters',
    'https://www.linkedin.com/in/jan-peeters/',
    'https://www.linkedin.com/in/jan-peeters?utm_source=share&utm_medium=ios_app',
    'http://linkedin.com/in/jan-peeters#about',
    'https://be.linkedin.com/in/Jan-Peeters',
    'www.linkedin.com/in/jan-peeters',
    'https://WWW.LINKEDIN.COM/in/jan-peeters',
    'https://www.linkedin.com/mwlite/in/jan-peeters',
    'https://www.linkedin.com/in/jan-peeters/details/experience/',
    'Bekijk het profiel van Jan: https://www.linkedin.com/in/jan-peeters?trk=x',
  ])('turns %s into the normalized link', (input) => {
    expect(normalizeProfileUrl(input)).toEqual({ ok: true, url: JAN })
  })

  it('gives the same link for encoded and plain special characters', () => {
    const encoded = normalizeProfileUrl('https://www.linkedin.com/in/zo%C3%AB-peeters')
    const plain = normalizeProfileUrl('https://www.linkedin.com/in/zoë-peeters')
    expect(encoded).toEqual({ ok: true, url: 'https://www.linkedin.com/in/zo%C3%AB-peeters' })
    expect(plain).toEqual(encoded)
  })

  it.each([
    '',
    'hallo',
    'https://example.com/in/jan',
    'https://www.linkedin.com/company/elmos',
    'https://www.linkedin.com/feed/',
    'https://www.linkedin.com/in/',
    'https://notlinkedin.com/in/jan',
    'https://www.linkedin.com/in/%E0%A4%A',
  ])('refuses %s as not a profile link', (input) => {
    expect(normalizeProfileUrl(input)).toEqual({ ok: false, reason: 'notProfile' })
  })

  it('refuses a short lnkd.in link', () => {
    expect(normalizeProfileUrl('https://lnkd.in/abc123')).toEqual({ ok: false, reason: 'shortLink' })
  })

  it('always gives one path segment after /in/ and no extras', () => {
    const inputs = ['be.linkedin.com/in/A-B/?x=1#y', 'https://www.linkedin.com/in/x/details/', 'linkedin.com/in/%C3%A9']
    for (const input of inputs) {
      const result = normalizeProfileUrl(input)
      expect(result.ok).toBe(true)
      if (!result.ok) continue
      expect(result.url).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[^/?#]+$/)
    }
  })
})

describe('shortProfileUrl', () => {
  it('drops https://www. for display', () => {
    expect(shortProfileUrl(JAN)).toBe('linkedin.com/in/jan-peeters')
  })
})
