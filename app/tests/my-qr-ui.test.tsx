import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import {
  createEncounter,
  createEvent,
  createPerson,
  getSettings,
  listPersons,
  setOwnerProfileUrl,
  updateSettings,
} from '../src/data/repository'
import { en } from '../src/i18n/en'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

const BRITT_URL = 'https://www.linkedin.com/in/britt-breugelmans'

beforeEach(async () => {
  await updateSettings({ contextChosenOn: todayLocal() })
})

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

type User = ReturnType<typeof userEvent.setup>

async function openMyQr(user: User, label: string = nl['tab.myQr']) {
  await user.click(await screen.findByRole('button', { name: label }))
}

/** The clipboard as iOS hands it over after "Paste". Call after userEvent.setup(). */
function clipboardHolds(text: string) {
  return vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(text)
}

/** The owner dismissed the iOS "Paste" bubble. */
function clipboardRefused() {
  return vi
    .spyOn(navigator.clipboard, 'readText')
    .mockRejectedValue(new DOMException('refused', 'NotAllowedError'))
}

/** The message line under the paste button (the banners also use role="status"). */
function linkMessage() {
  return document.querySelector('.my-qr .link-message')
}

describe('Set my own link once (User Story 2)', () => {
  it('explains how to copy the link and offers "Paste LinkedIn link"; no QR yet', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)

    expect(await screen.findByRole('heading', { name: nl['myQr.setupTitle'] })).toBeInTheDocument()
    expect(screen.getByText(nl['myQr.setupHint'])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['link.paste'] })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: nl['myQr.alt'] })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['myQr.change'] })).not.toBeInTheDocument()
  })

  it('stores the normalized link and shows the QR, also after switching tabs; no Person', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    clipboardHolds('https://www.linkedin.com/in/Britt-Breugelmans/?utm_source=share')
    await user.click(await screen.findByRole('button', { name: nl['link.paste'] }))

    expect(await screen.findByRole('img', { name: nl['myQr.alt'] })).toBeInTheDocument()
    expect((await getSettings()).ownerProfileUrl).toBe(BRITT_URL)
    expect(await listPersons()).toEqual([])

    await user.click(screen.getByRole('button', { name: nl['tab.contacts'] }))
    await openMyQr(user)
    expect(await screen.findByRole('img', { name: nl['myQr.alt'] })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['link.paste'] })).not.toBeInTheDocument()
  })

  it.each([
    ['https://lnkd.in/abc', 'link.shortLink'],
    ['https://www.linkedin.com/company/elmos', 'link.invalid'],
  ] as const)('refuses %s with F4\'s message and stores nothing', async (text, key) => {
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    clipboardHolds(text)
    await user.click(await screen.findByRole('button', { name: nl['link.paste'] }))

    await vi.waitFor(() => expect(linkMessage()).toHaveTextContent(nl[key]))
    expect((await getSettings()).ownerProfileUrl).toBeUndefined()
    expect(screen.queryByRole('img', { name: nl['myQr.alt'] })).not.toBeInTheDocument()
  })

  it('does nothing when the paste is refused', async () => {
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    const readText = clipboardRefused()
    await user.click(await screen.findByRole('button', { name: nl['link.paste'] }))

    await vi.waitFor(() => expect(readText).toHaveBeenCalled())
    expect(linkMessage()).toHaveTextContent('')
    expect((await getSettings()).ownerProfileUrl).toBeUndefined()
  })
})

describe('Change my link (User Story 3)', () => {
  it('replaces the link after a valid paste and says so', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    clipboardHolds('https://www.linkedin.com/in/zoe-de-wit')
    await user.click(await screen.findByRole('button', { name: nl['myQr.change'] }))

    expect(await screen.findByText('linkedin.com/in/zoe-de-wit')).toBeInTheDocument()
    expect(linkMessage()).toHaveTextContent(nl['myQr.changed'])
    expect((await getSettings()).ownerProfileUrl).toBe('https://www.linkedin.com/in/zoe-de-wit')
  })

  it('keeps the old link when the paste is not a profile link', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    clipboardHolds('https://www.linkedin.com/company/elmos')
    await user.click(await screen.findByRole('button', { name: nl['myQr.change'] }))

    await vi.waitFor(() => expect(linkMessage()).toHaveTextContent(nl['link.invalid']))
    expect(screen.getByText('linkedin.com/in/britt-breugelmans')).toBeInTheDocument()
    expect((await getSettings()).ownerProfileUrl).toBe(BRITT_URL)
  })

  it('changes nothing when the paste is refused', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    const readText = clipboardRefused()
    await user.click(await screen.findByRole('button', { name: nl['myQr.change'] }))

    await vi.waitFor(() => expect(readText).toHaveBeenCalled())
    expect(linkMessage()).toHaveTextContent('')
    expect((await getSettings()).ownerProfileUrl).toBe(BRITT_URL)
  })
})

describe('Screen stays bright (User Story 4)', () => {
  function mockWakeLock() {
    const sentinel = { released: false, release: vi.fn(() => Promise.resolve()) }
    const wakeLock = { request: vi.fn(() => Promise.resolve(sentinel)) }
    Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true })
    return { wakeLock, sentinel }
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
  })

  it('keeps the screen on while the QR is shown, and lets go on another tab', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const { wakeLock, sentinel } = mockWakeLock()
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    await screen.findByRole('img', { name: nl['myQr.alt'] })
    await vi.waitFor(() => expect(wakeLock.request).toHaveBeenCalledWith('screen'))

    await user.click(screen.getByRole('button', { name: nl['tab.contacts'] }))
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('does not keep the screen on during the setup', async () => {
    const { wakeLock } = mockWakeLock()
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)
    await screen.findByRole('heading', { name: nl['myQr.setupTitle'] })
    expect(wakeLock.request).not.toHaveBeenCalled()
  })
})

describe('Show my QR (User Story 1)', () => {
  it('shows the QR, both caption lines, the short link and "Change link"', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)

    expect(await screen.findByRole('img', { name: nl['myQr.alt'] })).toBeInTheDocument()
    expect(screen.getByText(nl['myQr.scanMe'])).toBeInTheDocument()
    expect(screen.getByText(en['myQr.scanMe'])).toBeInTheDocument()
    expect(screen.getByText('linkedin.com/in/britt-breugelmans')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['myQr.change'] })).toBeInTheDocument()
    // The tab bar stays (no full-screen mode).
    expect(screen.getByRole('button', { name: nl['tab.contacts'] })).toBeInTheDocument()
  })

  it('keeps both caption lines when the app is in English', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    await updateSettings({ language: 'en' })
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user, en['tab.myQr'])

    expect(await screen.findByRole('img', { name: en['myQr.alt'] })).toBeInTheDocument()
    expect(screen.getByText(nl['myQr.scanMe'])).toBeInTheDocument()
    expect(screen.getByText(en['myQr.scanMe'])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en['myQr.change'] })).toBeInTheDocument()
  })

  it('shows no notes, Persons or Events (FR-011)', async () => {
    await setOwnerProfileUrl(BRITT_URL)
    const event = await createEvent({ name: 'Devoxx 2026', startDate: todayLocal(), endDate: todayLocal() })
    const jan = await createPerson({ name: 'Jan Peeters', profileUrl: 'https://www.linkedin.com/in/jan-peeters' })
    await createEncounter({ personId: jan.id, eventId: event.id, date: todayLocal(), note: 'Talked about PWAs' })
    const user = userEvent.setup()
    renderApp()
    await openMyQr(user)

    await screen.findByRole('img', { name: nl['myQr.alt'] })
    expect(screen.queryByText(/Jan Peeters/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Talked about PWAs/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Devoxx 2026/)).not.toBeInTheDocument()
  })
})
