import { useId, useState, type FormEvent } from 'react'
import { StorageFullError } from '../data/errors'
import { finishNoteStep, mergePersons, updatePerson } from '../data/repository'
import type { ConnectionStatus, Encounter, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'
import { ProfileLinkControl } from './ProfileLink'

interface NoteStepProps {
  person: Person
  encounter: Encounter
  /** Today's Encounter was reused; LinkedIn was not opened (B19). */
  alreadyMetToday: boolean
  /** False when opening LinkedIn was blocked (research R1). */
  opened: boolean
  /** A line to show on arrival, e.g. "Merged with …" after a merge (F4). */
  initialMessage?: string
  onDone(): void
  /** Two Persons became one (B21); the note step continues for the remaining Person. */
  onMerged(result: { person: Person; encounter: Encounter; message: string }): void
}

/** Note and "I connected" right after LinkedIn; both optional (FR-015–FR-018, B16). */
export function NoteStep({
  person,
  encounter,
  alreadyMetToday,
  opened,
  initialMessage,
  onDone,
  onMerged,
}: NoteStepProps) {
  const { t } = useLanguage()
  const id = useId()
  // The Person as it is now: pasting a profile link changes it on this screen (F4).
  const [current, setCurrent] = useState(person)
  const [note, setNote] = useState(encounter.note ?? '')
  const [status, setStatus] = useState<ConnectionStatus>(person.connectionStatus)
  const [saving, setSaving] = useState(false)
  const url = linkedInUrlFor(current)

  // Stored at once, independent of save or skip, so it survives iOS closing the app (FR-018).
  function toggleConnected(connected: boolean) {
    const next: ConnectionStatus = connected ? 'connected' : 'notConnected'
    setStatus(next)
    updatePerson(current.id, { connectionStatus: next }).catch((err: unknown) => {
      setStatus(person.connectionStatus)
      if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
    })
  }

  /** Merge: the typed note goes along, so nothing is lost (FR-007, research R4). */
  async function merge(into: Person) {
    const result = await mergePersons({ fromPersonId: current.id, intoPersonId: into.id, noteDraft: note })
    onMerged({
      person: result.person,
      encounter: result.noteStepEncounter ?? encounter,
      message: t('link.merged', { name: into.name }),
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
      <h1>{t('note.title', { name: current.name })}</h1>
      {alreadyMetToday && <p className="note-info">{t('note.alreadyMet', { name: current.name })}</p>}

      {/* On the iPhone the automatic opening is blocked, so this button is the main way to
          LinkedIn: filled when LinkedIn did not open, outlined when it did or was not needed. */}
      {url && (
        <a
          className={`button-link${opened || alreadyMetToday ? ' secondary' : ''}`}
          href={url}
          target="_blank"
          rel="noopener"
        >
          {t('note.openLinkedIn')}
        </a>
      )}

      <ProfileLinkControl
        person={current}
        allowReplace
        initialMessage={initialMessage}
        onLinked={setCurrent}
        onMerge={merge}
      />

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
    </main>
  )
}
