import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { Logo } from './Logo'

interface LogoHoldButtonProps {
  onHold(): void
  /** How long the owner must hold, in ms. 2 seconds (B44). */
  holdMs?: number
}

/**
 * The small logo that ends guest mode (F3 FR-012, B44, research R4). Only a hold of `holdMs`
 * counts; a tap does nothing. Pointer capture keeps the hold when the finger moves a little.
 */
export function LogoHoldButton({ onHold, holdMs = 2000 }: LogoHoldButtonProps) {
  const { t } = useLanguage()
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function start(event: PointerEvent<HTMLButtonElement>) {
    // jsdom has no setPointerCapture.
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.clearTimeout(timer.current)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      onHold()
    }, holdMs)
  }

  function stop() {
    window.clearTimeout(timer.current)
    setHolding(false)
  }

  return (
    <button
      type="button"
      className={holding ? 'logo-hold holding' : 'logo-hold'}
      aria-label={t('guest.ownerHold')}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Logo size={44} />
    </button>
  )
}
