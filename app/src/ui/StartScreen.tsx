import { useState } from 'react'
import { useBackup } from '../backup/useBackup'
import { StorageFullError } from '../data/errors'
import { postponeBackupReminder } from '../data/repository'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { ContextBar } from './ContextBar'
import { Logo } from './Logo'

/** The backup reminder (F10 FR-009–FR-011): a banner, never a blocking screen (constitution VIII). */
function BackupReminder() {
  const { t } = useLanguage()
  const { reminderDue, makeBackup } = useBackup()
  const [failed, setFailed] = useState(false)

  if (!reminderDue) return null

  function ignoreStorageFull(error: unknown) {
    // Storage full: the F0 banner shows.
    if (!(error instanceof StorageFullError)) throw error
  }

  return (
    <div className="banner banner-reminder" role="status">
      <p>{t('reminder.text')}</p>
      {failed && <p className="banner-reminder-failed">{t('backup.failed')}</p>}
      <div className="banner-reminder-actions">
        <button
          type="button"
          onClick={() => {
            // Straight from the tap: the share sheet opens before any await (research R2).
            setFailed(false)
            makeBackup()
              .then((result) => setFailed(result === 'failed'))
              .catch(ignoreStorageFull)
          }}
        >
          {t('reminder.make')}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            postponeBackupReminder().catch(ignoreStorageFull)
          }}
        >
          {t('reminder.later')}
        </button>
      </div>
    </div>
  )
}

interface StartScreenProps {
  /** The active Event, undefined during casual networking, or 'loading' while it is read. */
  activeEvent: Event | undefined | 'loading'
  onChangeContext(): void
  onAddByName(): void
  onScanQr(): void
  /** F3: opens guest mode. */
  onHandOver(): void
}

export function StartScreen({ activeEvent, onChangeContext, onAddByName, onScanQr, onHandOver }: StartScreenProps) {
  const { t } = useLanguage()

  return (
    <main className="start-screen">
      <ContextBar event={activeEvent} onChange={onChangeContext} />
      <BackupReminder />

      <Logo />
      <h1>{t('app.title')}</h1>

      <div className="start-actions">
        <button type="button" className="add-by-name" onClick={onAddByName}>
          {t('start.addByName')}
        </button>
        <button type="button" className="add-by-name" onClick={onScanQr}>
          {t('start.scanQr')}
        </button>
        <button type="button" className="add-by-name" onClick={onHandOver}>
          {t('start.handOver')}
        </button>
      </div>
    </main>
  )
}
