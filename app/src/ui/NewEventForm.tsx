import { useId, useState, type FormEvent } from 'react'
import { todayLocal } from '../data/dates'
import { StorageFullError, ValidationError } from '../data/errors'
import { createAndActivateEvent } from '../data/repository'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'

interface NewEventFormProps {
  onSaved(event: Event): void
  onBack(): void
}

/** Create an Event on arrival: a one-day Event needs only a name and one tap (FR-001–FR-004). */
export function NewEventForm({ onSaved, onBack }: NewEventFormProps) {
  const { t } = useLanguage()
  const id = useId()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(todayLocal)
  const [endDate, setEndDate] = useState(todayLocal)
  const [error, setError] = useState<TextKey>()
  const [saving, setSaving] = useState(false)

  function changeStartDate(value: string) {
    setStartDate(value)
    // FR-002: the end date moves along when the start date passes it.
    if (value > endDate) setEndDate(value)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    try {
      onSaved(await createAndActivateEvent({ name, startDate, endDate }))
    } catch (err) {
      if (err instanceof ValidationError) setError(err.field === 'name' ? 'event.errorName' : 'event.errorDates')
      else if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="event-form-screen">
      <h1>{t('event.title')}</h1>
      <form className="event-form" onSubmit={save}>
        <label htmlFor={`${id}-name`}>{t('event.name')}</label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={80}
          placeholder={t('event.namePlaceholder')}
          autoFocus
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

        <button type="submit" disabled={saving || name.trim() === ''}>
          {t('event.save')}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          {t('event.back')}
        </button>
      </form>
    </main>
  )
}
