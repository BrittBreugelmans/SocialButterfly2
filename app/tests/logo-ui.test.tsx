import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import { setOwnerProfileUrl, updateSettings } from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
}

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

/** The logo image inside the current screen, and no 🦋 placeholder left in it (FR-004). */
function expectLogoIn(main: HTMLElement | null) {
  expect(main).not.toBeNull()
  expect(main!.querySelector('img[src="/logo.svg"]')).not.toBeNull()
  expect(main!.textContent).not.toContain('🦋')
}

beforeEach(async () => {
  setOnline(true)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // not in jsdom
  await updateSettings({ contextChosenOn: todayLocal() })
})

afterEach(() => {
  setOnline(true)
})

describe('The logo replaces every placeholder butterfly (User Story 1)', () => {
  it('on the start screen', async () => {
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })
    expectLogoIn(document.querySelector('main.start-screen'))
  })

  it('on the offline screen', async () => {
    setOnline(false)
    renderApp()
    await screen.findByText(nl['offline.message'])
    expectLogoIn(document.querySelector('main.offline-screen'))
  })

  it('on My QR before the own link is set', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['tab.myQr'] }))
    await screen.findByText(nl['myQr.setupTitle'])
    expectLogoIn(document.querySelector('main.my-qr'))
  })

  it('on the empty Actions tab', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: new RegExp(`^${nl['tab.actions']}`) }))
    await screen.findByText(nl['actions.empty'])
    expectLogoIn(document.querySelector('main'))
  })

  it('in the middle of My QR', async () => {
    const user = userEvent.setup()
    await setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['tab.myQr'] }))
    const qr = await screen.findByRole('img', { name: nl['myQr.alt'] })
    expect(qr.querySelector('image[href="/logo.svg"]')).not.toBeNull()
  })
})
