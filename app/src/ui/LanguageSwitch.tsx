import { useLanguage } from '../i18n/LanguageProvider'

/**
 * NL/EN for the owner's screens (M3, F0 FR-016). In Settings since F10 (FR-002), under the heading
 * "Taal", so the group has no visible label of its own. Guest mode (F3) reuses it inside
 * GuestLanguageProvider, where it switches only the guest's language.
 */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div className="language-switch" role="group" aria-label={t('app.languageSwitch')}>
      <button type="button" aria-pressed={language === 'nl'} onClick={() => void setLanguage('nl')}>
        {t('app.languageNl')}
      </button>
      <button type="button" aria-pressed={language === 'en'} onClick={() => void setLanguage('en')}>
        {t('app.languageEn')}
      </button>
    </div>
  )
}
