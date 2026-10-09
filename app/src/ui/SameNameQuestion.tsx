import type { SameNameMatch } from '../data/repository'
import { formatDateRange } from '../events/formatDateRange'
import { useLanguage } from '../i18n/LanguageProvider'

interface SameNameQuestionProps {
  matches: SameNameMatch[]
  onPick(personId: string): void
  onNewPerson(): void
  onBack(): void
  /** True while saving, so a second tap does nothing. */
  busy: boolean
}

/** "Is this the same person?" before a Person with the same name is saved (FR-006, B15). */
export function SameNameQuestion({ matches, onPick, onNewPerson, onBack, busy }: SameNameQuestionProps) {
  const { language, t } = useLanguage()
  return (
    <main className="event-form-screen">
      <h1>{t('same.title')}</h1>
      <div className="choice-actions">
        {matches.map(({ person, lastEncounterDate }) => (
          <button
            key={person.id}
            type="button"
            className="event-option"
            disabled={busy}
            onClick={() => onPick(person.id)}
          >
            <span className="event-option-name">{person.name}</span>
            <span className="event-option-dates">
              {person.company ?? t('same.noCompany')}
              {lastEncounterDate &&
                ` · ${t('same.lastMet', { date: formatDateRange(lastEncounterDate, lastEncounterDate, language) })}`}
            </span>
          </button>
        ))}
        <button type="button" disabled={busy} onClick={onNewPerson}>
          {t('same.newPerson')}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          {t('add.back')}
        </button>
      </div>
    </main>
  )
}
