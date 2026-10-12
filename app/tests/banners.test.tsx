import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import { setOwnerProfileUrl, updateSettings } from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { isStandalone } from '../src/platform/standalone'

vi.mock('../src/platform/standalone', () => ({ isStandalone: vi.fn(() => false) }))

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

beforeEach(async () => {
  setOnline(true)
  vi.mocked(isStandalone).mockReturnValue(false)
  // F1 (B13): the owner already chose today, so the App opens on the start screen.
  await updateSettings({ contextChosenOn: todayLocal() })
})

afterEach(() => {
  setOnline(true)
})

describe('"Show my QR" on the offline screen (F9, B34)', () => {
  it('opens My QR without tab bar, and Back returns to the offline screen', async () => {
    await setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')
    setOnline(false)
    const user = userEvent.setup()
    renderApp()

    await user.click(await screen.findByRole('button', { name: nl['offline.showMyQr'] }))
    expect(await screen.findByRole('img', { name: nl['myQr.alt'] })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['tab.contacts'] })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['myQr.back'] }))
    expect(screen.getByText(nl['offline.message'])).toBeInTheDocument()
  })

  it('stays on My QR, now with the tab bar, when the connection comes back', async () => {
    await setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')
    setOnline(false)
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['offline.showMyQr'] }))
    await screen.findByRole('img', { name: nl['myQr.alt'] })

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(await screen.findByRole('img', { name: nl['myQr.alt'] })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: nl['tab.contacts'] })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['tab.myQr'] })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the setup when no own link is stored yet', async () => {
    setOnline(false)
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['offline.showMyQr'] }))
    expect(await screen.findByRole('heading', { name: nl['myQr.setupTitle'] })).toBeInTheDocument()
  })
})

describe('install hint (research R3)', () => {
  it('shows in a Safari tab', async () => {
    renderApp()
    expect(await screen.findByText(nl['install.hint'])).toBeInTheDocument()
  })

  it('is absent in the installed app', async () => {
    vi.mocked(isStandalone).mockReturnValue(true)
    renderApp()
    await screen.findByText(nl['app.title'])
    expect(screen.queryByText(nl['install.hint'])).not.toBeInTheDocument()
  })
})

describe('no internet (FR-005)', () => {
  it('shows a full-screen message when the app starts offline, until the connection returns', async () => {
    setOnline(false)
    renderApp()
    // F3 (research R5): the offline screen waits for the guest-mode check, one database read.
    expect(await screen.findByText(nl['offline.message'])).toBeInTheDocument()
    expect(screen.queryByText(nl['app.title'])).not.toBeInTheDocument()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText(nl['offline.message'])).not.toBeInTheDocument()
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()
  })

  it('shows only a banner when the connection drops after start', async () => {
    renderApp()
    await screen.findByText(nl['app.title'])
    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(nl['offline.banner'])).toBeInTheDocument()
    expect(screen.queryByText(nl['offline.message'])).not.toBeInTheDocument()
    expect(screen.getByText(nl['app.title'])).toBeInTheDocument()
  })
})

describe('storage warning (FR-007)', () => {
  it('shows when the Storage API is missing', async () => {
    renderApp()
    expect(await screen.findByText(nl['storage.notPersisted'])).toBeInTheDocument()
  })
})
