import { useCallback, useEffect, useRef, useState } from 'react'
import { todayLocal } from '../data/dates'
import { getSettings, onDataChanged, readBackupSnapshot, recordBackup, type BackupSnapshot } from '../data/repository'
import type { TextKey } from '../i18n/nl'
import { shareFile, type ShareFileResult } from '../platform/shareFile'
import { backupFileName, buildBackupCsv } from './csv'
import { isBackupReminderDue } from './reminder'

export type BackupResult = ShareFileResult

/** The message after a backup; nothing after a cancel (contracts/screens.md). */
export function backupMessageKey(result: BackupResult): TextKey | undefined {
  if (result === 'shared' || result === 'downloaded') return 'backup.done'
  if (result === 'failed') return 'backup.failed'
  return undefined
}

interface Prepared {
  snapshot: BackupSnapshot
  file: File
}

/**
 * The CSV backup, prepared in advance (F10 research R2–R3): Safari only opens the share sheet
 * right after a tap, so makeBackup() must not read the database first. The file is rebuilt after
 * every write (one rebuild per burst) and when the app returns to the foreground.
 */
export function useBackup(): {
  ready: boolean
  reminderDue: boolean
  makeBackup(): Promise<BackupResult>
} {
  const prepared = useRef<Prepared | undefined>(undefined)
  const [ready, setReady] = useState(false)
  const [reminderDue, setReminderDue] = useState(false)

  useEffect(() => {
    let active = true
    let pending = false

    async function prepare() {
      const [snapshot, settings] = await Promise.all([readBackupSnapshot(), getSettings()])
      if (!active) return
      const today = todayLocal()
      const file = new File([buildBackupCsv(snapshot)], backupFileName(today), {
        type: 'text/csv;charset=utf-8',
      })
      prepared.current = { snapshot, file }
      setReady(true)
      // Settings writes ("Later", a finished backup) also fire onDataChanged, so this stays current.
      setReminderDue(isBackupReminderDue(snapshot, settings, today))
    }

    function schedule() {
      if (pending) return
      pending = true
      queueMicrotask(() => {
        pending = false
        void prepare()
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') schedule()
    }

    void prepare()
    const unsubscribe = onDataChanged(schedule)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const makeBackup = useCallback(async (): Promise<BackupResult> => {
    // Taken synchronously: share() starts before the first await (research R2).
    const current = prepared.current
    if (!current) return 'failed'
    const result = await shareFile(current.file)
    if (result === 'shared' || result === 'downloaded') await recordBackup(current.snapshot.takenAt)
    return result
  }, [])

  return { ready, reminderDue, makeBackup }
}
