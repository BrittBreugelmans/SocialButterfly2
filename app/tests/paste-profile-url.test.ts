import { afterEach, describe, expect, it, vi } from 'vitest'
import { pasteProfileUrl } from '../src/linkedin/pasteProfileUrl'

const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

/** The clipboard as iOS hands it over; `readText` undefined = no clipboard API at all. */
function setClipboard(readText: (() => Promise<string>) | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: readText ? { readText } : undefined,
    configurable: true,
  })
}

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'clipboard', original)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

describe('pasteProfileUrl (F4 rules, shared by F9)', () => {
  it('returns the normalized link for a profile link with query and trailing slash', async () => {
    setClipboard(() => Promise.resolve('https://www.linkedin.com/in/Britt-Breugelmans/?utm_source=share'))
    expect(await pasteProfileUrl()).toEqual({ ok: true, url: 'https://www.linkedin.com/in/britt-breugelmans' })
  })

  it('refuses a short lnkd.in link', async () => {
    setClipboard(() => Promise.resolve('https://lnkd.in/abc123'))
    expect(await pasteProfileUrl()).toEqual({ ok: false, messageKey: 'link.shortLink' })
  })

  it('refuses a company page and plain text', async () => {
    setClipboard(() => Promise.resolve('https://www.linkedin.com/company/elmos'))
    expect(await pasteProfileUrl()).toEqual({ ok: false, messageKey: 'link.invalid' })
    setClipboard(() => Promise.resolve('hello there'))
    expect(await pasteProfileUrl()).toEqual({ ok: false, messageKey: 'link.invalid' })
  })

  it('reports a refused paste as dismissed', async () => {
    setClipboard(() => Promise.reject(new DOMException('refused', 'NotAllowedError')))
    expect(await pasteProfileUrl()).toBe('dismissed')
  })

  it('reports a missing clipboard API as unsupported', async () => {
    setClipboard(undefined)
    expect(await pasteProfileUrl()).toEqual({ ok: false, messageKey: 'link.unsupported' })
  })

  it('reads the clipboard synchronously, before the promise settles (F4 R1)', () => {
    const readText = vi.fn(() => Promise.resolve('https://www.linkedin.com/in/britt'))
    setClipboard(readText)
    void pasteProfileUrl()
    expect(readText).toHaveBeenCalledTimes(1)
  })
})
