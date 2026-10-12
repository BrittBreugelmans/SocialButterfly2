import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from '../src/platform/wakeLock'

/** A fake Screen Wake Lock API; `request` resolves to a sentinel with a spied release(). */
function mockWakeLock(request?: () => Promise<unknown>) {
  const sentinel = { released: false, release: vi.fn(() => Promise.resolve()) }
  const wakeLock = { request: vi.fn(request ?? (() => Promise.resolve(sentinel))) }
  Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true })
  return { wakeLock, sentinel }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

/** Lets the request's promise settle. */
const settle = () => act(() => Promise.resolve())

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('useWakeLock (F9, research R4)', () => {
  it('requests a screen lock while active, and releases it when inactive', async () => {
    const { wakeLock, sentinel } = mockWakeLock()
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } })
    await settle()
    expect(wakeLock.request).toHaveBeenCalledTimes(1)
    expect(wakeLock.request).toHaveBeenCalledWith('screen')

    rerender({ active: false })
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('releases the lock on unmount', async () => {
    const { sentinel } = mockWakeLock()
    const { unmount } = renderHook(() => useWakeLock(true))
    await settle()
    unmount()
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('requests again when the page becomes visible again', async () => {
    const { wakeLock } = mockWakeLock()
    renderHook(() => useWakeLock(true))
    await settle()
    act(() => setVisibility('hidden'))
    expect(wakeLock.request).toHaveBeenCalledTimes(1)
    act(() => setVisibility('visible'))
    await settle()
    expect(wakeLock.request).toHaveBeenCalledTimes(2)
  })

  it('does nothing without the API', () => {
    expect(() => renderHook(() => useWakeLock(true)).unmount()).not.toThrow()
  })

  it('ignores a refused request', async () => {
    const { wakeLock } = mockWakeLock(() => Promise.reject(new DOMException('no', 'NotAllowedError')))
    const { unmount } = renderHook(() => useWakeLock(true))
    await settle()
    expect(wakeLock.request).toHaveBeenCalledTimes(1)
    expect(() => unmount()).not.toThrow()
  })

  it('releases a lock that arrives after it is no longer active', async () => {
    let resolve: (value: unknown) => void = () => {}
    const sentinel = { released: false, release: vi.fn(() => Promise.resolve()) }
    mockWakeLock(() => new Promise((r) => (resolve = r)))
    const { unmount } = renderHook(() => useWakeLock(true))
    unmount()
    resolve(sentinel)
    await settle()
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('does not request while inactive', async () => {
    const { wakeLock } = mockWakeLock()
    renderHook(() => useWakeLock(false))
    await settle()
    expect(wakeLock.request).not.toHaveBeenCalled()
  })
})
