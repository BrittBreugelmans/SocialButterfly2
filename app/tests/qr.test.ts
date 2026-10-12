import jsQR from 'jsqr'
import { encode } from 'uqr'
import { describe, expect, it } from 'vitest'
import { normalizeProfileUrl } from '../src/linkedin/profileUrl'
import { makeQr, QUIET_ZONE, type QrCode } from '../src/myQr/qr'

/** The QR as RGBA pixels, with the quiet zone, as a camera would see it on screen. */
function toPixels(qr: QrCode, scale = 4) {
  const modules = qr.size + 2 * QUIET_ZONE
  const width = modules * scale
  const data = new Uint8ClampedArray(width * width * 4).fill(255)
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.dark[y]![x]) continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = (x + QUIET_ZONE) * scale + dx
          const py = (y + QUIET_ZONE) * scale + dy
          const i = (py * width + px) * 4
          data[i] = data[i + 1] = data[i + 2] = 0
        }
      }
    }
  }
  return { data, width, height: width }
}

function profileUrl(handle: string): string {
  const normalized = normalizeProfileUrl(`https://www.linkedin.com/in/${handle}`)
  if (!normalized.ok) throw new Error(`not a profile link: ${handle}`)
  return normalized.url
}

const LINKS = [
  profileUrl('britt-breugelmans'),
  profileUrl(`${'jan-peeters-van-den-broeck-'.repeat(3)}${'x'.repeat(10)}-1a2b3c4d5`), // about 100 characters
  profileUrl('zoë-de-wit'),
  profileUrl('britt-🦋'),
]

describe('makeQr (F9, research R2)', () => {
  it.each(LINKS)('decodes to exactly the link, butterfly area included: %s', (url) => {
    const { data, width, height } = toPixels(makeQr(url))
    expect(jsQR(data, width, height)?.data).toBe(url)
  })

  it('makes a long handle of about 100 characters', () => {
    expect(LINKS[1]!.length - 'https://www.linkedin.com/in/'.length).toBeGreaterThanOrEqual(95)
  })

  it.each(LINKS)('keeps the badge centred and at most 22%% of the width: %s', (url) => {
    const { size, badge } = makeQr(url)
    expect(badge.side).toBeGreaterThan(0)
    expect(badge.side).toBeLessThanOrEqual(Math.floor(size * 0.22))
    expect(badge.x).toBe(badge.y)
    expect(badge.x * 2 + badge.side).toBe(size)
  })

  it.each(LINKS)('clears every module inside the badge: %s', (url) => {
    const { dark, badge } = makeQr(url)
    for (let y = badge.y; y < badge.y + badge.side; y++) {
      for (let x = badge.x; x < badge.x + badge.side; x++) expect(dark[y]![x]).toBe(false)
    }
  })

  it.each(LINKS)('leaves the three finder patterns untouched: %s', (url) => {
    const qr = makeQr(url)
    const plain = encode(url, { ecc: 'H', border: 0 }).data
    const n = qr.size
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ] as const) {
      for (let y = oy; y < oy + 7; y++) {
        for (let x = ox; x < ox + 7; x++) expect(qr.dark[y]![x]).toBe(plain[y]![x])
      }
    }
  })
})
