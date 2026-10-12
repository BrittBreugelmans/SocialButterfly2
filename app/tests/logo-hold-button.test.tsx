import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { LogoHoldButton } from '../src/ui/LogoHoldButton'

beforeEach(() => {
  // Only the timers: fake-indexeddb (used by LanguageProvider's Settings read) keeps working.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderButton(holdMs?: number) {
  const onHold = vi.fn()
  render(
    <LanguageProvider>
      <LogoHoldButton onHold={onHold} holdMs={holdMs} />
    </LanguageProvider>,
  )
  return { onHold, button: screen.getByRole('button', { name: nl['guest.ownerHold'] }) }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('LogoHoldButton (F3 FR-012, research R4)', () => {
  it('holds the logo and has the accessible name', () => {
    const { button } = renderButton()
    expect(button.querySelector('img')).not.toBeNull()
  })

  it('does nothing on a click', () => {
    const { onHold, button } = renderButton()
    fireEvent.click(button)
    advance(5000)
    expect(onHold).not.toHaveBeenCalled()
  })

  it('does nothing when released before 2 seconds', () => {
    const { onHold, button } = renderButton()
    fireEvent.pointerDown(button, { pointerId: 1 })
    advance(1999)
    fireEvent.pointerUp(button, { pointerId: 1 })
    advance(5000)
    expect(onHold).not.toHaveBeenCalled()
  })

  it('calls onHold once after a 2-second hold', () => {
    const { onHold, button } = renderButton()
    fireEvent.pointerDown(button, { pointerId: 1 })
    advance(2000)
    expect(onHold).toHaveBeenCalledTimes(1)
    fireEvent.pointerUp(button, { pointerId: 1 })
    advance(5000)
    expect(onHold).toHaveBeenCalledTimes(1)
  })

  it('stops on pointercancel', () => {
    const { onHold, button } = renderButton()
    fireEvent.pointerDown(button, { pointerId: 1 })
    advance(1000)
    fireEvent.pointerCancel(button, { pointerId: 1 })
    advance(2000)
    expect(onHold).not.toHaveBeenCalled()
  })

  it('shows that it is counting while held', () => {
    const { button } = renderButton()
    expect(button).not.toHaveClass('holding')
    fireEvent.pointerDown(button, { pointerId: 1 })
    expect(button).toHaveClass('holding')
    fireEvent.pointerUp(button, { pointerId: 1 })
    expect(button).not.toHaveClass('holding')
  })

  it('blocks the iOS image menu', () => {
    const { button } = renderButton()
    expect(fireEvent.contextMenu(button)).toBe(false)
  })

  it('uses holdMs when given', () => {
    const { onHold, button } = renderButton(500)
    fireEvent.pointerDown(button, { pointerId: 1 })
    advance(500)
    expect(onHold).toHaveBeenCalledTimes(1)
  })
})
