import { useLanguage } from '../i18n/LanguageProvider'

interface ComingSoonProps {
  textKey: 'soon.actions' | 'soon.myQr' | 'soon.settings'
}

/** A tab that is not built yet (B26): F8–F10 replace it. */
export function ComingSoon({ textKey }: ComingSoonProps) {
  const { t } = useLanguage()
  return (
    <main className="coming-soon">
      <p className="butterfly" aria-hidden="true">
        🦋
      </p>
      <h1>{t('soon.title')}</h1>
      <p className="subtitle">{t(textKey)}</p>
    </main>
  )
}
