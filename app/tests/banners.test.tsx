import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
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

beforeEach(() => {
  setOnline(true)
  vi.mocked(isStandalone).mockReturnValue(false)
})

afterEach(() => {
  setOnline(true)
})

describe('install hint (research R3)', () => {
  it('shows in a Safari tab', () => {
    renderApp()
    expect(screen.getByText(nl['install.hint'])).toBeInTheDocument()
  })

  it('is absent in the installed app', () => {
    vi.mocked(isStandalone).mockReturnValue(true)
    renderApp()
    expect(screen.queryByText(nl['install.hint'])).not.toBeInTheDocument()
  })
})

describe('no internet (FR-005)', () => {
  it('shows a full-screen message when the app starts offline, until the connection returns', () => {
    setOnline(false)
    renderApp()
    expect(screen.getByText(nl['offline.message'])).toBeInTheDocument()
    expect(screen.queryByText(nl['app.title'])).not.toBeInTheDocument()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText(nl['offline.message'])).not.toBeInTheDocument()
    expect(screen.getByText(nl['app.title'])).toBeInTheDocument()
  })

  it('shows only a banner when the connection drops after start', () => {
    renderApp()
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
