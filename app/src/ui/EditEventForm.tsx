import { useId, useState, type FormEvent } from 'react'
import { StorageFullError, ValidationError } from '../data/errors'
import { deleteEvent, updateEvent } from '../data/repository'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'
import { ConfirmPanel } from './ConfirmPanel'

interface EditEventFormProps {
  event: Event
  encounterCount: number
  /** After saving, deleting or going back. */
  onDone(): void
}

/**
 * Change an Event's name and dates, or delete it (F10 FR-013–FR-015, B14). Same rules as creating
 * (B11). An edited Event never becomes active; the active Event is not changed here.
 */
export function EditEventForm({ event, encounterCount, onDone }: EditEventFormProps) {
  const { t } = useLanguage()
  const id = useId()
  const [name, setName] = useState(event.name)
  const [startDate, setStartDate] = useState(event.startDate)
  const [endDate, setEndDate] = useState(event.endDate)
  const [error, setError] = useState<TextKey>()
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function changeStartDate(value: string) {
    setStartDate(value)
    // F1 FR-002: the end date moves along when the start date passes it.
    if (value > endDate) setEndDate(value)
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(undefined)
    try {
      await action()
      onDone()
    } catch (err) {
      if (err instanceof ValidationError) setError(err.field === 'name' ? 'event.errorName' : 'event.errorDates')
      else if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
    } finally {
      setBusy(false)
    }
  }

  function save(e: FormEvent) {
    e.preventDefault()
    void run(() => updateEvent(event.id, { name, startDate, endDate }))
  }

  return (
    <main className="event-form-screen">
      <h1>{t('event.editTitle')}</h1>
      <form className="event-form" onSubmit={save}>
        <label htmlFor={`${id}-name`}>{t('event.name')}</label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={80}
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor={`${id}-start`}>{t('event.startDate')}</label>
        <input
          id={`${id}-start`}
          type="date"
          value={startDate}
          required
          onChange={(e) => changeStartDate(e.target.value)}
        />

        <label htmlFor={`${id}-end`}>{t('event.endDate')}</label>
        <input
          id={`${id}-end`}
          type="date"
          value={endDate}
          min={startDate}
          required
          onChange={(e) => setEndDate(e.target.value)}
        />

        {error && (
          <p className="form-error" role="alert">
            {t(error)}
          </p>
        )}

        <button type="submit" disabled={busy || name.trim() === ''}>
          {t('event.saveChanges')}
        </button>
        <button type="button" className="secondary" onClick={onDone}>
          {t('event.back')}
        </button>
      </form>

      {confirmDelete ? (
        <ConfirmPanel
          text={t('event.deleteQuestion', { name: event.name })}
          detail={
            encounterCount === 0
              ? undefined
              : encounterCount === 1
                ? t('event.deleteKeepsOne')
                : t('event.deleteKeepsMany', { count: encounterCount })
          }
          confirmLabel={t('event.deleteConfirm')}
          busy={busy}
          onConfirm={() => void run(() => deleteEvent(event.id))}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : (
        <button type="button" className="text-button danger" onClick={() => setConfirmDelete(true)}>
          {t('event.delete')}
        </button>
      )}
    </main>
  )
}
