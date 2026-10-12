import { describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../src/data/errors'
import {
  createPerson,
  getSettings,
  listDismissals,
  listPersons,
  onDataChanged,
  setOwnerProfileUrl,
  updateSettings,
} from '../src/data/repository'

const BRITT_URL = 'https://www.linkedin.com/in/britt-breugelmans'

describe('setOwnerProfileUrl (F9, B33)', () => {
  it('stores a normalized link with a newer updatedAt', async () => {
    const before = await updateSettings({ language: 'nl' })
    await new Promise((resolve) => setTimeout(resolve, 2))
    await setOwnerProfileUrl(BRITT_URL)
    const settings = await getSettings()
    expect(settings.ownerProfileUrl).toBe(BRITT_URL)
    expect(settings.updatedAt > before.updatedAt).toBe(true)
  })

  it.each([
    'https://linkedin.com/in/Britt/',
    'https://www.linkedin.com/in/Britt',
    'www.linkedin.com/in/britt?x=1',
    'not a link',
  ])(
    'refuses a link that is not normalized: %s',
    async (url) => {
      await expect(setOwnerProfileUrl(url)).rejects.toBeInstanceOf(ValidationError)
      expect((await getSettings()).ownerProfileUrl).toBeUndefined()
    },
  )

  it('replaces the stored link', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    await setOwnerProfileUrl('https://www.linkedin.com/in/zoe-de-wit')
    expect((await getSettings()).ownerProfileUrl).toBe('https://www.linkedin.com/in/zoe-de-wit')
  })

  it('fires onDataChanged once', async () => {
    const listener = vi.fn()
    const unsubscribe = onDataChanged(listener)
    await setOwnerProfileUrl(BRITT_URL)
    unsubscribe()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('leaves a Person with the same link alone: the owner is not a Person (FR-001)', async () => {
    const person = await createPerson({ name: 'Britt Breugelmans', profileUrl: BRITT_URL })
    await setOwnerProfileUrl(BRITT_URL)
    expect(await listPersons()).toEqual([person])
    expect(await listDismissals()).toEqual([])
  })
})
