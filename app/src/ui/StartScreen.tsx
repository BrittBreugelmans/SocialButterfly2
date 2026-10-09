import { useRef, useState } from 'react'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import type { StorageStatus } from '../platform/persistence'
import { ContextBar } from './ContextBar'
import { Diagnostics } from './Diagnostics'

const LONG_PRESS_MS = 600

interface StartScreenProps {
  storageStatus: StorageStatus | 'checking'
  /** The active Event, undefined during casual networking, or 'loading' while it is read. */
  activeEvent: Event | undefined | 'loading'
  onChangeContext(): void
}

export function StartScreen({ storageStatus, activeEvent, onChangeContext }: StartScreenProps) {
  const { language, setLanguage, t } = useLanguage()
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const pressTimer = useRef<number | undefined>(undefined)

  // Long press on the version label opens Diagnostics, so a guest does not open it by accident.
  function startPress() {
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setDiagnosticsOpen(true), LONG_PRESS_MS)
  }
  function cancelPress() {
    window.clearTimeout(pressTimer.current)
  }

  return (
    <main className="start-screen">
      <ContextBar event={activeEvent} onChange={onChangeContext} />

      <p className="butterfly" aria-hidden="true">
        🦋
      </p>
      <h1>{t('app.title')}</h1>
      <p className="subtitle">{t('app.comingSoon')}</p>

      <div className="language-switch" role="group" aria-label={t('app.languageSwitch')}>
        <span className="language-label">{t('app.languageSwitch')}</span>
        <button type="button" aria-pressed={language === 'nl'} onClick={() => void setLanguage('nl')}>
          {t('app.languageNl')}
        </button>
        <button type="button" aria-pressed={language === 'en'} onClick={() => void setLanguage('en')}>
          {t('app.languageEn')}
        </button>
      </div>

      <button
        type="button"
        className="version-label"
        aria-label={t('diagnostics.open')}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') setDiagnosticsOpen(true)
        }}
      >
        v{__APP_VERSION__}
      </button>

      {diagnosticsOpen && (
        <Diagnostics storageStatus={storageStatus} onClose={() => setDiagnosticsOpen(false)} />
      )}
    </main>
  )
}
