import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { LastEncounterError, StorageFullError } from '../data/errors'
import {
  deleteEncounterFromTimeline,
  deletePerson,
  getPerson,
  listEncountersByPerson,
  mergePersons,
  updatePerson,
  updatePersonDetails,
} from '../data/repository'
import type { ConnectionStatus, Encounter, Event, Person } from '../data/types'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'
import { ConfirmPanel } from './ConfirmPanel'
import { ProfileLinkControl } from './ProfileLink'

interface PersonDetailProps {
  personId: string
  events: Event[]
  onBack(): void
  /** Something changed: the list must reload. */
  onChanged(): void
  /** After a merge the Person is gone; show the one it was merged into (B21). */
  onPersonReplaced(personId: string): void
  /** The Person and all their Encounters were deleted. */
  onDeleted(name: string): void
}

/** One Person: LinkedIn, status and the timeline of all Encounters (F7 User Story 3). */
export function PersonDetail({
  personId,
  events,
  onBack,
  onChanged,
  onPersonReplaced,
  onDeleted,
}: PersonDetailProps) {
  const { language, t } = useLanguage()
  const [person, setPerson] = useState<Person>()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  // Which confirmation is open (research R9). 'lastEncounter': deleting the only Encounter
  // deletes the Person (B25).
  const [confirming, setConfirming] = useState<
    { kind: 'person' } | { kind: 'lastEncounter' } | { kind: 'encounter'; encounter: Encounter }
  >()
  const [deleting, setDeleting] = useState(false)
  // The edit form for name and company (B27); undefined while not editing.
  const [draft, setDraft] = useState<{ name: string; company: string; error: boolean }>()
  const [savingDraft, setSavingDraft] = useState(false)
  const id = useId()
  // Kept in a ref, so a new onBack from the parent does not reload the Person.
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  const load = useCallback(async () => {
    const [found, timeline] = await Promise.all([getPerson(personId), listEncountersByPerson(personId)])
    if (!found) {
      onBackRef.current() // deleted in the meantime
      return
    }
    setPerson(found)
    setEncounters(timeline)
  }, [personId])

  useEffect(() => {
    void load()
  }, [load])

  if (!person) return null

  const eventName = (encounter: Encounter) =>
    events.find((event) => event.id === encounter.eventId)?.name ?? t('contacts.casual')
  const url = linkedInUrlFor(person)

  /** One tap, saved at once, no confirmation (FR-013, B16). */
  function toggleConnected(connected: boolean) {
    if (!person) return
    const previous = person
    const next: ConnectionStatus = connected ? 'connected' : 'notConnected'
    setPerson({ ...person, connectionStatus: next })
    updatePerson(person.id, { connectionStatus: next })
      .then(() => onChanged())
      .catch((err: unknown) => {
        setPerson(previous)
        if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
      })
  }

  /** No same-name question: the profile link is the identity, names may repeat (spec Assumptions). */
  async function saveDraft(event: FormEvent) {
    event.preventDefault()
    if (!person || !draft) return
    if (draft.name.trim() === '') {
      setDraft({ ...draft, error: true })
      return
    }
    setSavingDraft(true)
    try {
      setPerson(await updatePersonDetails(person.id, { name: draft.name, company: draft.company }))
      setDraft(undefined)
      onChanged()
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
    } finally {
      setSavingDraft(false)
    }
  }

  /** The Person and all their Encounters and notes, in one transaction (FR-014). */
  async function removePerson() {
    if (!person) return
    setDeleting(true)
    try {
      await deletePerson(person.id)
      onDeleted(person.name)
    } catch (err) {
      setDeleting(false)
      if (!(err instanceof StorageFullError)) throw err
    }
  }

  /** One Encounter; the only one leads to deleting the Person instead (FR-014a, B25). */
  function askDeleteEncounter(encounter: Encounter) {
    setConfirming(encounters.length > 1 ? { kind: 'encounter', encounter } : { kind: 'lastEncounter' })
  }

  async function removeEncounter(encounter: Encounter) {
    setDeleting(true)
    try {
      await deleteEncounterFromTimeline(encounter.id)
      setConfirming(undefined)
      await load()
      onChanged()
    } catch (err) {
      if (err instanceof LastEncounterError) setConfirming({ kind: 'lastEncounter' }) // a race
      else if (!(err instanceof StorageFullError)) throw err
    } finally {
      setDeleting(false)
    }
  }

  async function merge(into: Person) {
    await mergePersons({ fromPersonId: personId, intoPersonId: into.id })
    onPersonReplaced(into.id)
  }

  return (
    <main className="person-detail">
      <button type="button" className="secondary back-button" onClick={onBack}>
        {t('add.back')}
      </button>

      {draft ? (
        <form className="event-form" onSubmit={(e) => void saveDraft(e)} noValidate>
          <label htmlFor={`${id}-name`}>{t('add.name')}</label>
          <input
            id={`${id}-name`}
            value={draft.name}
            maxLength={100}
            required
            autoComplete="off"
            aria-invalid={draft.error}
            onChange={(e) => setDraft({ ...draft, name: e.target.value, error: false })}
          />
          <label htmlFor={`${id}-company`}>{t('add.company')}</label>
          <input
            id={`${id}-company`}
            value={draft.company}
            maxLength={100}
            autoComplete="off"
            onChange={(e) => setDraft({ ...draft, company: e.target.value })}
          />
          {draft.error && (
            <p role="alert" className="form-error">
              {t('person.errorName')}
            </p>
          )}
          <button type="submit" disabled={savingDraft}>
            {t('person.save')}
          </button>
          <button type="button" className="secondary" disabled={savingDraft} onClick={() => setDraft(undefined)}>
            {t('link.cancel')}
          </button>
        </form>
      ) : (
        <header className="person-header">
          <h1>{person.name}</h1>
          {person.company && <p className="person-company">{person.company}</p>}
          <button
            type="button"
            className="text-button"
            onClick={() => setDraft({ name: person.name, company: person.company ?? '', error: false })}
          >
            {t('person.edit')}
          </button>
        </header>
      )}

      {/* A real link: the tap opens LinkedIn directly (FR-011, research R6). */}
      {url && (
        <a className="button-link" href={url} target="_blank" rel="noopener">
          {t(person.profileUrl ? 'person.openProfile' : 'person.searchLinkedIn')}
        </a>
      )}
      {!person.profileUrl && <p className="person-hint">{t('person.noProfile')}</p>}

      <ProfileLinkControl
        person={person}
        allowReplace={false}
        onLinked={(linked) => {
          setPerson(linked)
          onChanged()
        }}
        onMerge={merge}
      />

      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={person.connectionStatus === 'connected'}
          onChange={(e) => toggleConnected(e.target.checked)}
        />
        <span>{t('note.connected')}</span>
      </label>

      <h2 className="timeline-title">{t('person.timeline')}</h2>
      <ol className="timeline">
        {encounters.map((encounter) => (
          <li key={encounter.id} className="timeline-item">
            <p className="timeline-when">
              <span className="timeline-date">{formatDateRange(encounter.date, encounter.date, language)}</span>
              <span className="timeline-event">{eventName(encounter)}</span>
            </p>
            {encounter.note ? (
              <p className="timeline-note">{encounter.note}</p>
            ) : (
              <p className="timeline-note empty">{t('person.noNote')}</p>
            )}
            {confirming?.kind === 'encounter' && confirming.encounter.id === encounter.id ? (
              <ConfirmPanel
                text={t('encounter.deleteQuestion', {
                  date: formatDateRange(encounter.date, encounter.date, language),
                  event: eventName(encounter),
                })}
                detail={encounter.note ? t('encounter.deleteNote') : undefined}
                confirmLabel={t('person.deleteConfirm')}
                busy={deleting}
                onConfirm={() => void removeEncounter(encounter)}
                onCancel={() => setConfirming(undefined)}
              />
            ) : (
              <button type="button" className="text-button small" onClick={() => askDeleteEncounter(encounter)}>
                {t('encounter.delete')}
              </button>
            )}
          </li>
        ))}
      </ol>

      {confirming?.kind === 'person' || confirming?.kind === 'lastEncounter' ? (
        <ConfirmPanel
          text={
            confirming.kind === 'lastEncounter'
              ? t('encounter.deleteLast', { name: person.name })
              : encounters.length === 1
                ? t('person.deleteQuestionOne', { name: person.name })
                : t('person.deleteQuestionMany', { name: person.name, count: encounters.length })
          }
          confirmLabel={t(confirming.kind === 'lastEncounter' ? 'person.deleteConfirmPerson' : 'person.deleteConfirm')}
          busy={deleting}
          onConfirm={() => void removePerson()}
          onCancel={() => setConfirming(undefined)}
        />
      ) : (
        <button type="button" className="text-button danger" onClick={() => setConfirming({ kind: 'person' })}>
          {t('person.delete')}
        </button>
      )}
    </main>
  )
}
