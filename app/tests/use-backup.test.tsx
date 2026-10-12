import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backupFileName, buildBackupCsv } from '../src/backup/csv'
import { useBackup } from '../src/backup/useBackup'
import { todayLocal } from '../src/data/dates'
import { createEvent, getSettings, readBackupSnapshot } from '../src/data/repository'

function defineNavigator(name: 'share' | 'canShare', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

/** jsdom's File: read it with FileReader. */
function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

let share: ReturnType<typeof vi.fn>

beforeEach(() => {
  share = vi.fn().mockResolvedValue(undefined)
  defineNavigator('canShare', vi.fn().mockReturnValue(true))
  defineNavigator('share', share)
})

afterEach(() => {
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
})

async function renderReady() {
  const hook = renderHook(() => useBackup())
  // The first render cannot have a file yet: the button stays disabled until it is ready.
  expect(hook.result.current.ready).toBe(false)
  await waitFor(() => expect(hook.result.current.ready).toBe(true))
  return hook
}

const sharedFile = (call = -1): File => (share.mock.calls.at(call)![0] as { files: File[] }).files[0]!

describe('useBackup (F10 research R2–R3)', () => {
  it('becomes ready and shares synchronously when makeBackup is called', async () => {
    const { result } = await renderReady()
    let pending!: Promise<unknown>
    act(() => {
      pending = result.current.makeBackup()
    })
    expect(share).toHaveBeenCalledTimes(1)
    await act(() => pending)
  })

  it('shares a CSV file named for today with the snapshot as content', async () => {
    await createEvent({ name: 'Devoxx', startDate: '2026-10-06', endDate: '2026-10-08' })
    const { result } = await renderReady()
    await act(() => result.current.makeBackup())

    const file = sharedFile()
    expect(file.name).toBe(backupFileName(todayLocal()))
    expect(file.type.startsWith('text/csv')).toBe(true)
    const snapshot = await readBackupSnapshot()
    // The BOM is dropped by FileReader; compare the rest.
    expect(await readText(file)).toBe(buildBackupCsv(snapshot).replace(/^﻿/, ''))
  })

  it('records the snapshot time, not the time the sheet closed', async () => {
    const { result } = await renderReady()
    await new Promise((resolve) => setTimeout(resolve, 5))
    const beforeTap = new Date().toISOString()
    await act(async () => {
      expect(await result.current.makeBackup()).toBe('shared')
    })
    const { lastBackupAt } = await getSettings()
    expect(lastBackupAt).toBeDefined()
    expect(lastBackupAt! < beforeTap).toBe(true)
  })

  it.each([
    ['cancelled', new DOMException('closed', 'AbortError')],
    ['failed', new DOMException('no tap', 'NotAllowedError')],
  ])('keeps the last backup time when the result is %s', async (expected, error) => {
    share.mockRejectedValue(error)
    const { result } = await renderReady()
    await act(async () => {
      expect(await result.current.makeBackup()).toBe(expected)
    })
    expect((await getSettings()).lastBackupAt).toBeUndefined()
  })

  it('rebuilds the file after a write', async () => {
    const { result } = await renderReady()
    await createEvent({ name: 'Techorama', startDate: '2026-11-01', endDate: '2026-11-01' })
    await waitFor(async () => {
      await act(() => result.current.makeBackup())
      expect(await readText(sharedFile())).toContain('Techorama')
    })
  })
})
