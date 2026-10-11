import { useId } from 'react'
import type { Event } from '../data/types'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import type { ContactRow, ContactView } from '../people/contacts'

interface ContactListProps {
  rows: ContactRow[]
  /** Newest first by start date, as listEvents returns them (FR-007). */
  events: Event[]
  view: ContactView
  onViewChange(view: ContactView): void
  query: string
  onQueryChange(query: string): void
  onOpen(personId: string): void
  onAddSomeone(): void
  /** A status line, e.g. after deleting a Person. */
  message?: string
}

/** The select's value for a view: 'all', 'casual' or 'event:<id>'. */
function viewValue(view: ContactView): string {
  return view.kind === 'event' ? `event:${view.eventId}` : view.kind
}

function parseView(value: string): ContactView {
  if (value.startsWith('event:')) return { kind: 'event', eventId: value.slice('event:'.length) }
  return value === 'casual' ? { kind: 'casual' } : { kind: 'all' }
}

/** Persons per Event, without Event, or all (F7 User Story 1). */
export function ContactList({
  rows,
  events,
  view,
  onViewChange,
  query,
  onQueryChange,
  onOpen,
  onAddSomeone,
  message,
}: ContactListProps) {
  const { language, t } = useLanguage()
  const id = useId()

  return (
    <main className="contacts">
      <h1>{t('contacts.title')}</h1>

      <label className="contacts-label" htmlFor={`${id}-view`}>
        {t('contacts.show')}
      </label>
      <select
        id={`${id}-view`}
        className="contacts-view"
        value={viewValue(view)}
        onChange={(e) => onViewChange(parseView(e.target.value))}
      >
        <option value="all">{t('contacts.all')}</option>
        <option value="casual">{t('contacts.casual')}</option>
        {events.map((event) => (
          <option key={event.id} value={`event:${event.id}`}>
            {event.name} · {formatDateRange(event.startDate, event.endDate, language)}
          </option>
        ))}
      </select>

      {/* Filters on every keystroke; no search button (FR-008). */}
      <input
        type="search"
        className="contacts-search"
        aria-label={t('contacts.search')}
        placeholder={t('contacts.search')}
        value={query}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <p role="status" className="contacts-message">
        {message}
      </p>

      {rows.length === 0 && query.trim() !== '' ? (
        <div className="contacts-empty">
          <p>{t('contacts.noMatch', { query: query.trim() })}</p>
          <button type="button" className="secondary" onClick={() => onQueryChange('')}>
            {t('contacts.clearSearch')}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="contacts-empty">
          <p>{t('contacts.empty')}</p>
          <button type="button" className="secondary" onClick={onAddSomeone}>
            {t('contacts.emptyAdd')}
          </button>
        </div>
      ) : (
        <ul className="contact-rows">
          {rows.map(({ person, lastMet }) => {
            const status = t(person.connectionStatus === 'connected' ? 'contacts.connected' : 'contacts.notConnected')
            const date = lastMet && formatDateRange(lastMet, lastMet, language)
            return (
              <li key={person.id}>
                <button
                  type="button"
                  className="contact-row"
                  // The spans have no spaces between them; VoiceOver reads this label instead.
                  aria-label={[person.name, person.company, status, date].filter(Boolean).join(', ')}
                  onClick={() => onOpen(person.id)}
                >
                  <span className="contact-main">
                    <span className="contact-name">{person.name}</span>
                    {person.company && <span className="contact-company">{person.company}</span>}
                  </span>
                  <span className="contact-side">
                    <span className={`status-chip${person.connectionStatus === 'connected' ? ' connected' : ''}`}>
                      {status}
                    </span>
                    {date && <span className="contact-date">{date}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
