import type { Event } from '../data/types'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'

interface ContextBarProps {
  /** The active Event, undefined during casual networking, or 'loading' while it is read. */
  event: Event | undefined | 'loading'
  onChange(): void
}

/** Always shows where the owner is networking; one tap opens the choice (FR-008). */
export function ContextBar({ event, onChange }: ContextBarProps) {
  const { language, t } = useLanguage()
  // Show nothing while loading, so the bar never shows the wrong context for a moment.
  if (event === 'loading') return <div className="context-bar" aria-busy="true" />
  return (
    <button type="button" className="context-bar" aria-label={t('context.change')} onClick={onChange}>
      {event ? (
        <>
          <span className="context-label">{t('context.at')}</span>
          <span className="context-name">{event.name}</span>
          <span className="context-dates">{formatDateRange(event.startDate, event.endDate, language)}</span>
        </>
      ) : (
        <span className="context-name">{t('context.casual')}</span>
      )}
    </button>
  )
}
