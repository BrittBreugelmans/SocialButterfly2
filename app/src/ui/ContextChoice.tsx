import { useEffect, useState } from 'react'
import { todayLocal } from '../data/dates'
import { chooseContext, getSettings, listEvents } from '../data/repository'
import type { Event } from '../data/types'
import { eventStatusOn, orderEventsForChoice, type EventGroups } from '../events/choice'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'

interface ContextChoiceProps {
  /** An Event just created that does not run today: saved, not active (B24). */
  createdNotActive?: Event
  onNewEvent(): void
  onDone(): void
}

/** "Where are you today?": an Event, a new Event or casual networking (FR-005–FR-007, B12, B13). */
export function ContextChoice({ createdNotActive, onNewEvent, onDone }: ContextChoiceProps) {
  const { language, t } = useLanguage()
  const [groups, setGroups] = useState<EventGroups>()
  const [continueWith, setContinueWith] = useState<Event>()
  // An Event that does not run today, waiting for "Choose anyway" (B23).
  const [confirming, setConfirming] = useState<Event>()

  useEffect(() => {
    let cancelled = false
    void Promise.all([listEvents(), getSettings()]).then(([events, settings]) => {
      if (cancelled) return
      const ordered = orderEventsForChoice(events, todayLocal(), settings.activeEventId)
      setGroups(ordered)
      // Yesterday's Event goes on top only when it is still running (FR-005).
      setContinueWith(ordered.current.find((e) => e.id === settings.activeEventId))
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function choose(eventId: string | undefined) {
    await chooseContext(eventId)
    onDone()
  }

  /** A running Event is chosen at once; another one first shows a warning (B23). */
  function tapEvent(event: Event) {
    if (eventStatusOn(event, todayLocal()) === 'current') void choose(event.id)
    else setConfirming(event)
  }

  function warning(event: Event): string {
    return eventStatusOn(event, todayLocal()) === 'upcoming'
      ? t('choice.warnUpcoming', { name: event.name, date: formatDateRange(event.startDate, event.startDate, language) })
      : t('choice.warnPast', { name: event.name, dates: formatDateRange(event.startDate, event.endDate, language) })
  }

  if (!groups) return null

  const eventButton = (event: Event) => (
    <button key={event.id} type="button" className="event-option" onClick={() => tapEvent(event)}>
      <span className="event-option-name">{event.name}</span>
      <span className="event-option-dates">{formatDateRange(event.startDate, event.endDate, language)}</span>
    </button>
  )

  const section = (heading: TextKey, events: Event[]) =>
    events.length > 0 && (
      <section className="choice-section">
        <h2>{t(heading)}</h2>
        {events.map(eventButton)}
      </section>
    )

  return (
    <main className="choice-screen">
      <h1>{t('choice.title')}</h1>
      {createdNotActive && (
        <p className="note-info">
          {eventStatusOn(createdNotActive, todayLocal()) === 'upcoming'
            ? t('choice.createdLater', {
                name: createdNotActive.name,
                date: formatDateRange(createdNotActive.startDate, createdNotActive.startDate, language),
              })
            : t('choice.createdPast', { name: createdNotActive.name })}
        </p>
      )}

      {confirming && (
        <div className="merge-question" role="alertdialog" aria-label={warning(confirming)}>
          <p>{warning(confirming)}</p>
          <button type="button" onClick={() => void choose(confirming.id)}>
            {t('choice.chooseAnyway')}
          </button>
          <button type="button" className="secondary" onClick={() => setConfirming(undefined)}>
            {t('choice.cancel')}
          </button>
        </div>
      )}

      {continueWith && (
        <button type="button" className="event-option continue" onClick={() => void choose(continueWith.id)}>
          <span className="event-option-name">{t('choice.continue', { name: continueWith.name })}</span>
          <span className="event-option-dates">
            {formatDateRange(continueWith.startDate, continueWith.endDate, language)}
          </span>
        </button>
      )}

      {section('choice.current', groups.current.filter((e) => e.id !== continueWith?.id))}

      <div className="choice-actions">
        <button type="button" onClick={onNewEvent}>
          {t('choice.newEvent')}
        </button>
        <button type="button" className="secondary" onClick={() => void choose(undefined)}>
          {t('choice.casual')}
        </button>
      </div>

      {section('choice.upcoming', groups.upcoming)}
      {section('choice.past', groups.past)}
    </main>
  )
}
