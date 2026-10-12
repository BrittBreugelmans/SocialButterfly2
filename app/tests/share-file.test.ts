import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareFile } from '../src/platform/shareFile'

// jsdom has no Web Share API and no object URLs; define them per test (research R2).
function defineNavigator(name: 'share' | 'canShare', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

afterEach(() => {
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
  vi.useRealTimers()
})

const file = () => new File(['a;b\r\n'], 'sociale-vlinder-2026-10-12.csv', { type: 'text/csv;charset=utf-8' })

describe('shareFile (F10 research R2)', () => {
  it('opens the share sheet with the file and returns "shared" when it resolves', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    defineNavigator('canShare', vi.fn().mockReturnValue(true))
    defineNavigator('share', share)
    const f = file()
    expect(await shareFile(f)).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [f] })
  })

  it('calls share synchronously, before any await', () => {
    const share = vi.fn().mockResolvedValue(undefined)
    defineNavigator('canShare', vi.fn().mockReturnValue(true))
    defineNavigator('share', share)
    const pending = shareFile(file())
    expect(share).toHaveBeenCalledTimes(1)
    return pending
  })

  it('returns "cancelled" when the sheet is closed (AbortError)', async () => {
    defineNavigator('canShare', vi.fn().mockReturnValue(true))
    defineNavigator('share', vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError')))
    expect(await shareFile(file())).toBe('cancelled')
  })

  it('returns "failed" for any other error', async () => {
    defineNavigator('canShare', vi.fn().mockReturnValue(true))
    defineNavigator('share', vi.fn().mockRejectedValue(new DOMException('no tap', 'NotAllowedError')))
    expect(await shareFile(file())).toBe('failed')
    defineNavigator('share', vi.fn().mockRejectedValue(new Error('boom')))
    expect(await shareFile(file())).toBe('failed')
  })

  it.each([
    ['canShare is missing', undefined],
    ['canShare returns false', vi.fn().mockReturnValue(false)],
  ])('downloads the file when %s', async (_label, canShare) => {
    vi.useFakeTimers()
    if (canShare) defineNavigator('canShare', canShare)
    const createObjectURL = vi.fn().mockReturnValue('blob:backup')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    let clicked: HTMLAnchorElement | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked = this
    })

    const f = file()
    expect(await shareFile(f)).toBe('downloaded')
    expect(createObjectURL).toHaveBeenCalledWith(f)
    expect(clicked?.download).toBe(f.name)
    expect(clicked?.href).toBe('blob:backup')
    expect(clicked?.isConnected).toBe(false) // removed again
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })
})
