import { describe, expect, it } from 'vitest'
// The files as text, through Vite (the tests have no Node types).
import indexHtml from '../index.html?raw'
import logo from '../public/logo.svg?raw'
import { palette, TEXT_PAIRS } from '../src/brand/palette'
import css from '../src/styles.css?raw'

describe('logo.svg (FR-001, FR-002)', () => {
  it('is a square 512 canvas', () => {
    expect(logo).toMatch(/<svg[^>]*viewBox="0 0 512 512"/)
  })

  it('has no text, scripts, images or external references', () => {
    for (const forbidden of ['<text', '<script', '<image', 'href="http', 'xlink:href="http']) {
      expect(logo).not.toContain(forbidden)
    }
  })

  it('has no LinkedIn mark or name', () => {
    expect(logo.toLowerCase()).not.toContain('linkedin')
  })

  it('uses only palette colours', () => {
    const allowed: string[] = Object.values(palette)
    const used = [...logo.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1]!.toLowerCase())
    expect(used.length).toBeGreaterThan(0)
    for (const colour of used) expect(allowed).toContain(colour)
  })

  it('has a transparent background (no full-canvas rect)', () => {
    expect(logo).not.toMatch(/<rect[^>]*width="512"[^>]*height="512"/)
  })
})

describe('palette (FR-009–FR-012a)', () => {
  const rootBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? ''
  const outsideRoot = css.replace(/:root\s*\{[^}]*\}/, '')
  const kebab = (token: string) => `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`

  it('reads the real stylesheet (Vitest empties CSS unless configured)', () => {
    expect(css.length).toBeGreaterThan(1000)
    expect(rootBlock).not.toBe('')
  })

  it('mirrors palette.ts on :root in styles.css', () => {
    for (const [token, value] of Object.entries(palette)) {
      expect(rootBlock).toContain(`${kebab(token)}: ${value};`)
    }
  })

  it('uses no hex colours outside :root', () => {
    expect(outsideRoot.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
  })

  it('stays light (M6)', () => {
    expect(rootBlock).toContain('color-scheme: light;')
    expect(indexHtml).toContain('<meta name="color-scheme" content="light"')
  })

  it('gives the status bar the brand blue', () => {
    expect(indexHtml).toContain(`<meta name="theme-color" content="${palette.blue}"`)
  })

  it.each(TEXT_PAIRS)('%s on %s reaches WCAG AA (4.5:1)', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5)
  })
})

/** WCAG 2.x contrast ratio of two #rrggbb colours. */
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('launch images (FR-008)', () => {
  const links = [...indexHtml.matchAll(/<link rel="apple-touch-startup-image" media="([^"]+)" href="([^"]+)"/g)]
  const files = Object.keys(import.meta.glob('../public/apple-splash-*.png'))

  it('has portrait launch images for iOS', () => {
    expect(links.some(([, media]) => media!.includes('orientation: portrait'))).toBe(true)
  })

  it('points every link to a generated file', () => {
    expect(links.length).toBeGreaterThan(0)
    for (const [, , href] of links) expect(files).toContain(`../public${href}`)
  })
})
