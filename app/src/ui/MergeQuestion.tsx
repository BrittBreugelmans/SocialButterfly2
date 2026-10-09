import { useId } from 'react'
import type { Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'

interface MergeQuestionProps {
  /** The Person that already has the pasted profile link. */
  other: Person
  /** True while merging, so a second tap does nothing. */
  busy: boolean
  onMerge(): void
  onCancel(): void
}

/** "This profile belongs to … Merge?" before two Persons become one (B21). */
export function MergeQuestion({ other, busy, onMerge, onCancel }: MergeQuestionProps) {
  const { t } = useLanguage()
  const id = useId()
  return (
    <div className="merge-question" role="alertdialog" aria-labelledby={id}>
      <p id={id}>
        {other.company
          ? t('link.mergeQuestion', { name: other.name, company: other.company })
          : t('link.mergeQuestionNoCompany', { name: other.name })}
      </p>
      <button type="button" disabled={busy} onClick={onMerge}>
        {t('link.merge')}
      </button>
      <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
        {t('link.cancel')}
      </button>
    </div>
  )
}
