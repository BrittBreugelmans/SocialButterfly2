import { useId, useState } from 'react'
import { StorageFullError } from '../data/errors'
import { mergePersons, updateEncounter, updatePerson } from '../data/repository'
import type { ActionType, Event, Person } from '../data/types'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'
import { linkedInUrlFor } from '../linkedin/links'
import type { ActionCard as Card } from '../people/actions'
import { ProfileLinkControl } from './ProfileLink'

export const ACTION_LABELS: Record<ActionType, TextKey> = {
  noteMissing: 'actions.noteMissing',
  notConnected: 'actions.notConnected',
  profileLinkMissing: 'actions.profileLinkMissing',
}

interface ActionCardProps {
  card: Card
  events: Event[]
  onOpenPerson(personId: string): void
  /** An Action was solved: the tab reloads (FR-005). */
  onChanged(): void
  onDismiss(type: ActionType): void
}

/** Runs a write; a full phone is shown by the F0 banner, anything else is a bug. */
async function write(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action()
    return true
  } catch (err) {
    if (err instanceof StorageFullError) return false
    throw err
  }
}

/** One Person with their open Actions, each solvable here (F8 FR-007, FR-008). Notes are never shown (FR-013). */
export function ActionCard({ card, events, onOpenPerson, onChanged, onDismiss }: ActionCardProps) {
  const { language, t } = useLanguage()
  const id = useId()
  const { person, lastEncounter, actions } = card
  // The note being written for the last Encounter (B31); undefined while the field is closed.
  const [note, setNote] = useState<string>()
  const [busy, setBusy] = useState(false)

  const eventName = events.find((event) => event.id === lastEncounter.eventId)?.name ?? t('contacts.casual')
  const date = formatDateRange(lastEncounter.date, lastEncounter.date, language)
  // One LinkedIn link per card, so two Actions never show the same button twice (research R5).
  const url = actions.includes('notConnected') || actions.includes('profileLinkMissing') ? linkedInUrlFor(person) : undefined

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    const ok = await write(action)
    setBusy(false)
    if (ok) onChanged()
    return ok
  }

  async function saveNote() {
    if (note === undefined || note.trim() === '') return
    if (await run(() => updateEncounter(lastEncounter.id, { note }))) setNote(undefined)
  }

  async function merge(into: Person) {
    await mergePersons({ fromPersonId: person.id, intoPersonId: into.id })
    onChanged()
  }

  return (
    <article className="action-card" aria-labelledby={`${id}-name`}>
      <header>
        <h2 id={`${id}-name`} className="action-heading">
          <button type="button" className="action-name" onClick={() => onOpenPerson(person.id)}>
            {person.name}
          </button>
        </h2>
        {person.company && <p className="action-company">{person.company}</p>}
        <p className="action-when">
          {eventName} · {date}
        </p>
      </header>

      {/* A real link: the tap opens LinkedIn directly (F7 research R6). */}
      {url && (
        <a className="button-link secondary" href={url} target="_blank" rel="noopener">
          {t(person.profileUrl ? 'person.openProfile' : 'person.searchLinkedIn')}
        </a>
      )}

      <ul className="action-rows">
        {actions.map((type) => (
          <li key={type} className="action-row">
            <span className="action-label">{t(ACTION_LABELS[type])}</span>

            {type === 'noteMissing' &&
              (note === undefined ? (
                <button type="button" className="secondary compact" onClick={() => setNote('')}>
                  {t('actions.writeNote')}
                </button>
              ) : (
                <div className="action-note">
                  <textarea
                    aria-label={t('person.noteFor', { date, event: eventName })}
                    value={note}
                    rows={3}
                    placeholder={t('note.placeholder')}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button type="button" disabled={busy || note.trim() === ''} onClick={() => void saveNote()}>
                    {t('note.save')}
                  </button>
                  <button type="button" className="secondary" disabled={busy} onClick={() => setNote(undefined)}>
                    {t('link.cancel')}
                  </button>
                </div>
              ))}

            {type === 'notConnected' && (
              <button
                type="button"
                className="secondary compact"
                disabled={busy}
                onClick={() => void run(() => updatePerson(person.id, { connectionStatus: 'connected' }))}
              >
                {t('actions.connected')}
              </button>
            )}

            {type === 'profileLinkMissing' && (
              <div className="action-paste">
                <ProfileLinkControl person={person} allowReplace={false} onLinked={onChanged} onMerge={merge} />
              </div>
            )}

            <button
              type="button"
              className="text-button small"
              aria-label={t('actions.dismissLabel', { action: t(ACTION_LABELS[type]), name: person.name })}
              disabled={busy}
              onClick={() => onDismiss(type)}
            >
              {t('actions.dismiss')}
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}
