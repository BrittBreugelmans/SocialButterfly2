import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage } from '../src/platform/persistence'

function mockStorage(storage: Partial<StorageManager> | undefined) {
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true })
}

afterEach(() => {
  mockStorage(undefined)
})

describe('requestPersistentStorage (FR-007)', () => {
  it("returns 'persisted' when iOS keeps the data", async () => {
    const persist = vi.fn().mockResolvedValue(true)
    mockStorage({ persist, persisted: vi.fn().mockResolvedValue(true) })
    expect(await requestPersistentStorage()).toBe('persisted')
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it("returns 'not-persisted' when iOS refuses", async () => {
    mockStorage({ persist: vi.fn().mockResolvedValue(false), persisted: vi.fn().mockResolvedValue(false) })
    expect(await requestPersistentStorage()).toBe('not-persisted')
  })

  it("returns 'unsupported' without the Storage API", async () => {
    mockStorage(undefined)
    expect(await requestPersistentStorage()).toBe('unsupported')
    mockStorage({})
    expect(await requestPersistentStorage()).toBe('unsupported')
  })
})
