import { useId, useState, type FormEvent } from 'react'
import { StorageFullError } from '../data/errors'
import { finishNoteStep, linkProfileUrl, mergePersons, updatePerson } from '../data/repository'
import type { ConnectionStatus, Encounter, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'
import { normalizeProfileUrl, shortProfileUrl } from '../linkedin/profileUrl'
import { readClipboardText } from '../platform/clipboard'
import { MergeQuestion } from './MergeQuestion'

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
  const [message, setMessage] = useState(initialMessage ?? '')
  // The Person that already has the pasted link: shown in the merge question (B21).
  const [other, setOther] = useState<Person>()
  const [merging, setMerging] = useState(false)
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

  /**
   * "Paste LinkedIn link" (F4 FR-001–FR-004). The clipboard is read first, in the tap handler
   * itself, so iOS shows its "Paste" bubble (research R1).
   */
  function paste() {
    const reading = readClipboardText()
    void (async () => {
      const text = await reading
      if (text === 'dismissed') return // the owner tapped next to the iOS bubble
      if (text === 'unsupported') {
        setMessage(t('link.unsupported'))
        return
      }
      const normalized = normalizeProfileUrl(text)
      if (!normalized.ok) {
        setMessage(t(normalized.reason === 'shortLink' ? 'link.shortLink' : 'link.invalid'))
        return
      }
      try {
        const result = await linkProfileUrl(current.id, normalized.url)
        setMessage('')
        if (result.status === 'conflict') setOther(result.other)
        else setCurrent(result.person)
      } catch (err) {
        if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
      }
    })()
  }

  /** Merge: the typed note goes along, so nothing is lost (FR-007, research R4). */
  async function merge(into: Person) {
    setMerging(true)
    try {
      const result = await mergePersons({ fromPersonId: current.id, intoPersonId: into.id, noteDraft: note })
      onMerged({
        person: result.person,
        encounter: result.noteStepEncounter ?? encounter,
        message: t('link.merged', { name: into.name }),
      })
    } catch (err) {
      setMerging(false)
      if (!(err instanceof StorageFullError)) throw err
    }
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

      {other ? (
        <MergeQuestion
          other={other}
          busy={merging}
          onMerge={() => void merge(other)}
          onCancel={() => setOther(undefined)}
        />
      ) : (
        <button type="button" className="secondary" onClick={paste}>
          {t(current.profileUrl ? 'link.pasteAgain' : 'link.paste')}
        </button>
      )}
      {current.profileUrl && (
        <p className="link-linked">
          {t('link.linked')} <strong>{shortProfileUrl(current.profileUrl)}</strong>
        </p>
      )}
      <p role="status" className="link-message">
        {message}
      </p>

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
