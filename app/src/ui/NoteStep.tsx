import { useId, useState, type FormEvent } from 'react'
import { StorageFullError } from '../data/errors'
import { finishNoteStep, updatePerson } from '../data/repository'
import type { ConnectionStatus, Encounter, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'

interface NoteStepProps {
  person: Person
  encounter: Encounter
  /** Today's Encounter was reused; LinkedIn was not opened (B19). */
  alreadyMetToday: boolean
  /** False when opening LinkedIn was blocked (research R1). */
  opened: boolean
  onDone(): void
}

/** Note and "I connected" right after LinkedIn; both optional (FR-015–FR-018, B16). */
export function NoteStep({ person, encounter, alreadyMetToday, opened, onDone }: NoteStepProps) {
  const { t } = useLanguage()
  const id = useId()
  const [note, setNote] = useState(encounter.note ?? '')
  const [status, setStatus] = useState<ConnectionStatus>(person.connectionStatus)
  const [saving, setSaving] = useState(false)
  const url = linkedInUrlFor(person)

  // Stored at once, independent of save or skip, so it survives iOS closing the app (FR-018).
  function toggleConnected(connected: boolean) {
    const next: ConnectionStatus = connected ? 'connected' : 'notConnected'
    setStatus(next)
    updatePerson(person.id, { connectionStatus: next }).catch((err: unknown) => {
      setStatus(person.connectionStatus)
      if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
    })
  }

  async function finish(text: string | undefined) {
    setSaving(true)
    try {
      await finishNoteStep(encounter.id, text)
      onDone()
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
      setSaving(false)
    }
  }

  function save(event: FormEvent) {
    event.preventDefault()
    void finish(note)
  }

  return (
    <main className="event-form-screen note-step">
      <h1>{t('note.title', { name: person.name })}</h1>
      {alreadyMetToday && <p className="note-info">{t('note.alreadyMet', { name: person.name })}</p>}

      <form className="event-form" onSubmit={save}>
        <label htmlFor={`${id}-note`}>{t('note.label')}</label>
        <textarea
          id={`${id}-note`}
          value={note}
          rows={4}
          placeholder={t('note.placeholder')}
          onChange={(e) => setNote(e.target.value)}
        />

        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={status === 'connected'}
            onChange={(e) => toggleConnected(e.target.checked)}
          />
          <span>{t('note.connected')}</span>
        </label>

        <button type="submit" disabled={saving}>
          {t('note.save')}
        </button>
        <button type="button" className="secondary" disabled={saving} onClick={() => void finish(undefined)}>
          {t('note.skip')}
        </button>
      </form>

      {url && (
        <p className="note-linkedin">
          {!opened && !alreadyMetToday && <span className="note-warning">{t('note.openFailed')} </span>}
          <a href={url} target="_blank" rel="noopener">
            {t('note.openLinkedIn')}
          </a>
        </p>
      )}
    </main>
  )
}
