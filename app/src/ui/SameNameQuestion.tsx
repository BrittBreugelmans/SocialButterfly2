import type { MouseEvent, ReactNode } from 'react'
import type { SameNameMatch } from '../data/repository'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'

interface SameNameQuestionProps {
  matches: SameNameMatch[]
  /** The link opened by "No, new person": F2's search link, or F5's scanned profile. */
  newPersonUrl: string
  /** The link opened when picking a match; default the match's own LinkedIn link (F2). */
  linkFor?: (match: SameNameMatch) => string
  /** True while saving, so a second tap does nothing. */
  busy: boolean
  /** `linkOpened`: the tap itself opened LinkedIn (B20). */
  onPick(match: SameNameMatch, linkOpened: boolean): void
  onNewPerson(): void
  onBack(): void
}

/**
 * "Is this the same person?" before a Person with the same name is saved (FR-006, B15).
 * Choices that lead to LinkedIn are real links, so the tap opens it directly (B20).
 */
export function SameNameQuestion({
  matches,
  newPersonUrl,
  linkFor = (match) => linkedInUrlFor(match.person) ?? '',
  busy,
  onPick,
  onNewPerson,
  onBack,
}: SameNameQuestionProps) {
  const { language, t } = useLanguage()

  /** Blocks the link while a save runs; otherwise lets it open LinkedIn and calls `then`. */
  function follow(then: () => void) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (busy) event.preventDefault()
      else then()
    }
  }

  return (
    <main className="event-form-screen">
      <h1>{t('same.title')}</h1>
      <div className="choice-actions">
        {matches.map((match) => {
          const { person, lastEncounterDate, metToday } = match
          const content: ReactNode = (
            <>
              <span className="event-option-name">{person.name}</span>
              <span className="event-option-dates">
                {person.company ?? t('same.noCompany')}
                {lastEncounterDate &&
                  ` · ${t('same.lastMet', { date: formatDateRange(lastEncounterDate, lastEncounterDate, language) })}`}
              </span>
            </>
          )
          const url = linkFor(match)
          // Met today: straight to the note step without LinkedIn (B19), so a plain button.
          if (metToday || !url) {
            return (
              <button
                key={person.id}
                type="button"
                className="event-option"
                disabled={busy}
                onClick={() => onPick(match, false)}
              >
                {content}
              </button>
            )
          }
          return (
            <a
              key={person.id}
              className="event-option"
              href={url}
              target="_blank"
              rel="noopener"
              aria-disabled={busy}
              onClick={follow(() => onPick(match, true))}
            >
              {content}
            </a>
          )
        })}
        <a
          className="button-link"
          href={newPersonUrl}
          target="_blank"
          rel="noopener"
          aria-disabled={busy}
          onClick={follow(onNewPerson)}
        >
          {t('same.newPerson')}
        </a>
        <button type="button" className="secondary" onClick={onBack}>
          {t('add.back')}
        </button>
      </div>
    </main>
  )
}
