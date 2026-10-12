import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { backupMessageKey, useBackup } from '../backup/useBackup'
import { StorageFullError } from '../data/errors'
import { countData, deleteAllData, getSettings, listEncounters, listEvents, onDataChanged } from '../data/repository'
import type { Language, Settings } from '../data/types'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'
import type { StorageStatus } from '../platform/persistence'
import { eventListRows, type EventListRow } from '../settings/eventList'
import { Diagnostics } from './Diagnostics'
import { EditEventForm } from './EditEventForm'
import { LanguageSwitch } from './LanguageSwitch'

const LONG_PRESS_MS = 600

/** "12 okt. 2026, 14:05" / "12 Oct 2026, 14:05" (research R10). */
function formatBackupTime(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface DeleteAllPanelProps {
  /** Opens the share sheet; called straight from the tap (research R2). */
  onBackup(): void
  backupMessage?: TextKey
  onDeleted(): void
  onCancel(): void
}

/** "Delete all data": counts, a backup first, and only after typing the word (FR-018, B41). */
function DeleteAllPanel({ onBackup, backupMessage, onDeleted, onCancel }: DeleteAllPanelProps) {
  const { t } = useLanguage()
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [counts, setCounts] = useState<{ persons: number; encounters: number; events: number }>()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const expected = t('deleteAll.word')
  // Case and spaces around the word do not matter (research R9).
  const confirmed = typed.trim().toLocaleUpperCase() === expected

  useEffect(() => {
    panel.current?.focus()
    let cancelled = false
    void countData().then((result) => {
      if (!cancelled) setCounts(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function deleteEverything() {
    setBusy(true)
    try {
      await deleteAllData()
      onDeleted()
    } catch (error) {
      // Storage full: nothing changed, the F0 banner shows and the panel stays open.
      if (!(error instanceof StorageFullError)) throw error
      setBusy(false)
    }
  }

  return (
    <div
      ref={panel}
      className="confirm-panel delete-all-panel"
      role="alertdialog"
      aria-labelledby={`${id}-question`}
      tabIndex={-1}
    >
      <p id={`${id}-question`}>{t('deleteAll.question')}</p>
      {counts && <p className="confirm-detail">{t('deleteAll.counts', counts)}</p>}
      <button type="button" className="secondary" onClick={onBackup}>
        {t('deleteAll.backupFirst')}
      </button>
      <p className="settings-message" role="status">
        {backupMessage && t(backupMessage)}
      </p>
      <label htmlFor={`${id}-word`}>{t('deleteAll.typeWord', { word: expected })}</label>
      <input
        id={`${id}-word`}
        value={typed}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => setTyped(e.target.value)}
      />
      <button type="button" className="danger" disabled={!confirmed || busy} onClick={() => void deleteEverything()}>
        {t('deleteAll.confirm')}
      </button>
      <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
        {t('link.cancel')}
      </button>
    </div>
  )
}

interface SettingsTabProps {
  storageStatus: StorageStatus | 'checking'
  /** After "Delete all data": App shows the daily choice, as on a first start (research R6). */
  onAllDataDeleted(): void
}

/** The Settings tab (F10): backup, Events, language, delete all data, version (research R7). */
export function SettingsTab({ storageStatus, onAllDataDeleted }: SettingsTabProps) {
  const { language, t } = useLanguage()
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const pressTimer = useRef<number | undefined>(undefined)
  const { ready, makeBackup } = useBackup()
  const [settings, setSettings] = useState<Settings>()
  const [eventRows, setEventRows] = useState<EventListRow[]>()
  const [editing, setEditing] = useState<EventListRow>()
  const [backupMessage, setBackupMessage] = useState<TextKey>()
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)

  const loadSettings = useCallback(async () => {
    const [current, events, encounters] = await Promise.all([getSettings(), listEvents(), listEncounters()])
    setSettings(current)
    setEventRows(eventListRows(events, encounters, current.activeEventId))
  }, [])

  // Reload after every write anywhere (Diagnostics test data, a backup, an Event change).
  useEffect(() => {
    void loadSettings()
    return onDataChanged(() => void loadSettings())
  }, [loadSettings])

  /** Called straight from a tap: makeBackup() opens the share sheet before any await (R2). */
  const backup = useCallback(() => {
    setBackupMessage(undefined)
    makeBackup()
      .then((result) => setBackupMessage(backupMessageKey(result)))
      .catch((error: unknown) => {
        // Storage full while recording the time: the F0 banner shows.
        if (!(error instanceof StorageFullError)) throw error
      })
  }, [makeBackup, loadSettings])

  // Long press on the version label opens Diagnostics, so it is not opened by accident (FR-002).
  function startPress() {
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setDiagnosticsOpen(true), LONG_PRESS_MS)
  }
  function cancelPress() {
    window.clearTimeout(pressTimer.current)
  }

  if (editing) {
    return (
      <EditEventForm
        event={editing.event}
        encounterCount={editing.encounterCount}
        onDone={() => {
          setEditing(undefined)
          void loadSettings()
        }}
      />
    )
  }

  return (
    <main className="settings-tab">
      <h1>{t('settings.title')}</h1>

      <section className="settings-section" aria-labelledby="settings-backup">
        <h2 id="settings-backup">{t('backup.title')}</h2>
        <button type="button" disabled={!ready} onClick={backup}>
          {t('backup.make')}
        </button>
        {settings && (
          <p className="settings-hint">
            {settings.lastBackupAt
              ? t('backup.last', { time: formatBackupTime(settings.lastBackupAt, language) })
              : t('backup.never')}
          </p>
        )}
        {/* While the delete-all panel is open, its own status line shows the message. */}
        <p className="settings-message" role="status">
          {backupMessage && !deleteAllOpen && t(backupMessage)}
        </p>
      </section>

      <section className="settings-section" aria-labelledby="settings-events">
        <h2 id="settings-events">{t('settings.events')}</h2>
        {eventRows?.length === 0 && <p className="settings-hint">{t('settings.eventsEmpty')}</p>}
        {eventRows && eventRows.length > 0 && (
          <ul className="event-rows">
            {eventRows.map((row) => (
              <li key={row.event.id}>
                <button type="button" className="event-row" onClick={() => setEditing(row)}>
                  <span className="event-row-name">
                    {row.event.name}
                    {row.isActive && <span className="event-row-active">{t('settings.eventActive')}</span>}
                  </span>
                  <span className="event-row-meta">
                    {formatDateRange(row.event.startDate, row.event.endDate, language)} ·{' '}
                    {row.encounterCount === 1
                      ? t('settings.encounterCountOne')
                      : t('settings.encounterCountMany', { count: row.encounterCount })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="settings-section" aria-labelledby="settings-language">
        <h2 id="settings-language">{t('app.languageSwitch')}</h2>
        <LanguageSwitch />
      </section>

      <section className="settings-section" aria-labelledby="settings-delete-all">
        <h2 id="settings-delete-all">{t('deleteAll.button')}</h2>
        {deleteAllOpen ? (
          <DeleteAllPanel
            onBackup={backup}
            backupMessage={backupMessage}
            onDeleted={onAllDataDeleted}
            onCancel={() => setDeleteAllOpen(false)}
          />
        ) : (
          <button
            type="button"
            className="danger"
            onClick={() => {
              setBackupMessage(undefined)
              setDeleteAllOpen(true)
            }}
          >
            {t('deleteAll.button')}
          </button>
        )}
      </section>

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
