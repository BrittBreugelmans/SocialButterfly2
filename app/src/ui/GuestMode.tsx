import { useId, useState, type FormEvent } from 'react'
import { GuestLanguageProvider, useLanguage } from '../i18n/LanguageProvider'
import { LanguageSwitch } from './LanguageSwitch'
import { LogoHoldButton } from './LogoHoldButton'

export interface GuestInput {
  name: string
  company: string
}

interface GuestModeProps {
  /** Called when the owner takes the phone back, with the input as typed (F3 FR-013). */
  onExit(input: GuestInput): void
}

/**
 * Guest mode (F3): a big, friendly screen where the guest types their own name. It saves nothing
 * (FR-010) and shows nothing of the owner (FR-008): the owner searches after the hand-back (B43).
 */
export function GuestMode(props: GuestModeProps) {
  // The guest's own NL/EN, never the app setting (FR-015, FR-016, research R3).
  return (
    <GuestLanguageProvider>
      <GuestScreens {...props} />
    </GuestLanguageProvider>
  )
}

function GuestScreens({ onExit }: GuestModeProps) {
  const { t } = useLanguage()
  const id = useId()
  const [step, setStep] = useState<'form' | 'thanks'>('form')
  // React state only: guest input is never stored (research R2).
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')

  const blank = name.trim() === ''

  function done(event: FormEvent) {
    event.preventDefault()
    if (!blank) setStep('thanks')
  }

  const top = (
    <div className="guest-top">
      <LogoHoldButton onHold={() => onExit({ name, company })} />
      <LanguageSwitch />
    </div>
  )

  if (step === 'thanks') {
    return (
      <main className="guest-screen">
        {top}
        <p className="guest-thanks" role="status">
          {t('guest.thanks')}
        </p>
        <button type="button" className="secondary" onClick={() => setStep('form')}>
          {t('add.back')}
        </button>
      </main>
    )
  }

  return (
    <main className="guest-screen">
      {top}
      <h1>{t('guest.greeting')}</h1>
      <form className="guest-form" onSubmit={done}>
        <label htmlFor={`${id}-name`}>{t('guest.name')}</label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={100}
          placeholder={t('add.namePlaceholder')}
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor={`${id}-company`}>{t('guest.company')}</label>
        <input
          id={`${id}-company`}
          value={company}
          maxLength={100}
          placeholder={t('add.companyPlaceholder')}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="done"
          onChange={(e) => setCompany(e.target.value)}
        />

        <p className="guest-privacy">{t('guest.privacy')}</p>

        <button type="submit" className="guest-done" disabled={blank}>
          {t('guest.done')}
        </button>
      </form>
    </main>
  )
}
