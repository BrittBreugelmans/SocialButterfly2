import { useEffect, useState } from 'react'
import { todayLocal } from '../data/dates'
import { chooseContext, getSettings, listEvents } from '../data/repository'
import type { Event } from '../data/types'
import { orderEventsForChoice, type EventGroups } from '../events/choice'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'

interface ContextChoiceProps {
  onNewEvent(): void
  onDone(): void
}

/** "Where are you today?": an Event, a new Event or casual networking (FR-005–FR-007, B12, B13). */
export function ContextChoice({ onNewEvent, onDone }: ContextChoiceProps) {
  const { language, t } = useLanguage()
  const [groups, setGroups] = useState<EventGroups>()
  const [continueWith, setContinueWith] = useState<Event>()

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

  if (!groups) return null

  const eventButton = (event: Event) => (
    <button key={event.id} type="button" className="event-option" onClick={() => void choose(event.id)}>
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
