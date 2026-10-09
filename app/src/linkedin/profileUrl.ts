// Turns whatever the owner pastes into one normalized profile link (research R2 in
// specs/004-link-profile). Also used by F5 (QR). Pure: no network, no database (L1).

const PROFILE_PREFIX = 'https://www.linkedin.com/in/'

export type NormalizedProfileUrl =
  | { ok: true; url: string }
  | { ok: false; reason: 'notProfile' | 'shortLink' }

/**
 * Finds a LinkedIn profile link in `text` and returns it as `https://www.linkedin.com/in/<handle>`:
 * no query, fragment or trailing slash; the handle decoded, trimmed, lowercased and encoded again,
 * so the same profile always gives the same link (SC-002).
 */
export function normalizeProfileUrl(text: string): NormalizedProfileUrl {
  const token = text.split(/\s+/).find((part) => /linkedin\.com\/|lnkd\.in\//i.test(part))
  if (!token) return { ok: false, reason: 'notProfile' }
  if (/lnkd\.in\//i.test(token)) return { ok: false, reason: 'shortLink' }

  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(token) ? token : `https://${token}`)
  } catch {
    return { ok: false, reason: 'notProfile' }
  }
  const host = url.hostname.toLowerCase()
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return { ok: false, reason: 'notProfile' }

  // '/in/<handle>', '/mwlite/in/<handle>' or '/in/<handle>/details/…'
  const parts = url.pathname.split('/').filter((part) => part !== '')
  const inIndex = parts.findIndex((part) => part.toLowerCase() === 'in')
  const raw = inIndex === -1 ? undefined : parts[inIndex + 1]
  if (raw === undefined) return { ok: false, reason: 'notProfile' }

  let handle: string
  try {
    handle = decodeURIComponent(raw).trim().toLowerCase()
  } catch {
    return { ok: false, reason: 'notProfile' }
  }
  if (handle === '') return { ok: false, reason: 'notProfile' }
  return { ok: true, url: PROFILE_PREFIX + encodeURIComponent(handle) }
}

/** 'linkedin.com/in/<handle>', for showing a linked profile on screen. */
export function shortProfileUrl(url: string): string {
  return url.replace(/^https:\/\/www\./, '')
}
