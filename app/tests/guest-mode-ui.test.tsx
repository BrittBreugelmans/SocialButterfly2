import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import {
  chooseContext,
  createEncounter,
  createEvent,
  createPerson,
  getSettings,
  listEncounters,
  listPersons,
  setGuestMode,
  updateSettings,
} from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { en } from '../src/i18n/en'
import { nl } from '../src/i18n/nl'
import { buildSearchUrl } from '../src/linkedin/links'
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

async function handOver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: nl['start.handOver'] }))
  return screen.getByLabelText(nl['guest.name'])
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

describe('US1 — the guest types their own name', () => {
  it('opens guest mode from the Add tab with greeting, fields and privacy line', async () => {
    const user = userEvent.setup()
    renderApp()
    const name = await handOver(user)
    expect(screen.getByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
    expect(screen.getByLabelText(nl['guest.company'])).toBeInTheDocument()
    expect(screen.getByText(nl['guest.privacy'])).toBeInTheDocument()
    expect(name).toHaveFocus()
    expect(name).toHaveAttribute('maxLength', '100')
    expect(screen.getByLabelText(nl['guest.company'])).toHaveAttribute('maxLength', '100')
  })

  it('keeps "Done" disabled while the name is blank (FR-007)', async () => {
    const user = userEvent.setup()
    renderApp()
    const name = await handOver(user)
    const done = screen.getByRole('button', { name: nl['guest.done'] })
    expect(done).toBeDisabled()
    await user.type(name, '   ')
    expect(done).toBeDisabled()
    await user.clear(name)
    await user.type(name, 'Jan Peeters')
    expect(done).toBeEnabled()
  })

  it('"Done" shows the thank-you screen; "Back" keeps the input (FR-011)', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.type(screen.getByLabelText(nl['guest.company']), 'Elmos')
    await user.click(screen.getByRole('button', { name: nl['guest.done'] }))
    expect(screen.getByText(nl['guest.thanks'])).toBeInTheDocument()
    expect(screen.queryByLabelText(nl['guest.name'])).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(screen.getByLabelText(nl['guest.name'])).toHaveValue('Jan Peeters')
    expect(screen.getByLabelText(nl['guest.company'])).toHaveValue('Elmos')
  })

  it('Enter in the company field equals "Done"', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.type(screen.getByLabelText(nl['guest.company']), 'Elmos{Enter}')
    expect(screen.getByText(nl['guest.thanks'])).toBeInTheDocument()
  })

  it('shows no tab bar, Event name or banners (FR-008)', async () => {
    const user = userEvent.setup()
    const event = await createEvent({ name: 'Devoxx', startDate: todayLocal(), endDate: todayLocal() })
    await chooseContext(event.id)
    renderApp()
    expect(await screen.findByText('Devoxx')).toBeInTheDocument()
    expect(screen.getByText(nl['install.hint'])).toBeInTheDocument()
    await handOver(user)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Devoxx')).not.toBeInTheDocument()
    expect(screen.queryByText(nl['install.hint'])).not.toBeInTheDocument()
  })

  it('shows no offline banner when the connection drops (FR-008)', async () => {
    const user = userEvent.setup()
    renderApp()
    await handOver(user)
    setOnline(false)
    window.dispatchEvent(new Event('offline'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText(nl['offline.banner'])).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
  })

  it('gives no hint of a same-name match (FR-009)', async () => {
    const user = userEvent.setup()
    const person = await createPerson({
      name: 'Jan Peeters',
      company: 'Elmos',
      searchUrl: buildSearchUrl('Jan Peeters', 'Elmos'),
    })
    await createEncounter({ personId: person.id, date: todayLocal() })
    renderApp()
    await user.type(await handOver(user), 'jan peeters')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText(nl['same.title'])).not.toBeInTheDocument()
    expect(screen.queryByText('Elmos')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: nl['guest.done'] }))
    expect(screen.queryByText(nl['same.title'])).not.toBeInTheDocument()
  })

  it('saves nothing (FR-010) but remembers that guest mode is on (FR-018)', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['guest.done'] }))
    await waitFor(async () => expect((await getSettings()).guestModeOn).toBe(true))
    expect(await listPersons()).toEqual([])
    expect(await listEncounters()).toEqual([])
  })

  it('reopens in guest mode after a reload, before the daily choice (FR-018)', async () => {
    await updateSettings({ contextChosenOn: undefined })
    await setGuestMode(true)
    renderApp()
    expect(await screen.findByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
    expect(screen.queryByText(nl['choice.title'])).not.toBeInTheDocument()
    expect(screen.getByLabelText(nl['guest.name'])).toHaveValue('')
  })

  it('reopens in guest mode after a reload without internet (FR-018)', async () => {
    setOnline(false)
    await setGuestMode(true)
    renderApp()
    expect(await screen.findByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
    expect(screen.queryByText(nl['offline.message'])).not.toBeInTheDocument()
  })
})

describe('US2 — the owner takes over and searches', () => {
  beforeEach(() => {
    // Only the timers: fake-indexeddb keeps working (tasks.md ground rules).
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  }

  function holdLogo(ms = 2000) {
    const logo = screen.getByRole('button', { name: nl['guest.ownerHold'] })
    fireEvent.pointerDown(logo, { pointerId: 1 })
    act(() => {
      vi.advanceTimersByTime(ms)
    })
    fireEvent.pointerUp(logo, { pointerId: 1 })
  }

  it('a short press keeps guest mode', async () => {
    const user = setup()
    renderApp()
    await handOver(user)
    holdLogo(500)
    expect(screen.getByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
  })

  it('a 2-second hold on the form opens the quick mode form, filled in', async () => {
    const user = setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.type(screen.getByLabelText(nl['guest.company']), 'Elmos')
    holdLogo()
    expect(await screen.findByRole('heading', { name: nl['add.title'] })).toBeInTheDocument()
    expect(screen.getByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
    expect(screen.getByLabelText(nl['add.company'])).toHaveValue('Elmos')
    expect(await screen.findByText(nl['context.casual'])).toBeInTheDocument()
    await waitFor(async () => expect('guestModeOn' in (await getSettings())).toBe(false))
  })

  it('a 2-second hold on the thank-you screen does the same', async () => {
    const user = setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['guest.done'] }))
    holdLogo()
    expect(await screen.findByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
  })

  it('with no name, the hold returns to the Add tab', async () => {
    const user = setup()
    renderApp()
    await handOver(user)
    holdLogo()
    expect(await screen.findByRole('button', { name: nl['start.handOver'] })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('F2 runs unchanged: the same-name question appears (FR-014)', async () => {
    const user = setup()
    await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters', undefined) })
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    holdLogo()
    const link = await screen.findByRole('link', { name: nl['add.search'] })
    await vi.waitFor(() => expect(link).toHaveAttribute('aria-busy', 'false'))
    await user.click(link)
    expect(await screen.findByText(nl['same.title'])).toBeInTheDocument()
  })

  it('"Back" on the filled-in form saves nothing and drops the input', async () => {
    const user = setup()
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    holdLogo()
    await user.click(await screen.findByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('button', { name: nl['start.handOver'] })).toBeInTheDocument()
    expect(await listPersons()).toEqual([])
    await user.click(screen.getByRole('button', { name: nl['start.addByName'] }))
    expect(screen.getByLabelText(nl['add.name'])).toHaveValue('')
  })

  it('when the daily choice is due, it comes first, then the filled-in form', async () => {
    const user = setup()
    await updateSettings({ contextChosenOn: undefined })
    await setGuestMode(true)
    renderApp()
    await user.type(await screen.findByLabelText(nl['guest.name']), 'Jan Peeters')
    holdLogo()
    await user.click(await screen.findByRole('button', { name: nl['choice.casual'] }))
    expect(await screen.findByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
  })
})

describe('US3 — the guest switches language', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function holdLogo() {
    const logo = screen.getByRole('button', { name: /^(Terug naar Britt|Back to Britt)/ })
    fireEvent.pointerDown(logo, { pointerId: 1 })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.pointerUp(logo, { pointerId: 1 })
  }

  it('opens in the app language (B37)', async () => {
    await updateSettings({ language: 'en' })
    await setGuestMode(true)
    renderApp()
    expect(await screen.findByRole('heading', { name: en['guest.greeting'] })).toBeInTheDocument()
  })

  it('switches all guest texts at once and keeps the input (FR-015)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['app.languageEn'] }))
    expect(screen.getByRole('heading', { name: en['guest.greeting'] })).toBeInTheDocument()
    expect(screen.getByText(en['guest.privacy'])).toBeInTheDocument()
    expect(screen.getByLabelText(en['guest.name'])).toHaveValue('Jan Peeters')
    expect((await getSettings()).language).toBe('nl')

    await user.click(screen.getByRole('button', { name: en['guest.done'] }))
    expect(screen.getByText(en['guest.thanks'])).toBeInTheDocument()
    // The switch is on the thank-you screen too.
    await user.click(screen.getByRole('button', { name: nl['app.languageNl'] }))
    expect(screen.getByText(nl['guest.thanks'])).toBeInTheDocument()
  })

  it('does not change the owner screens or the next guest mode (FR-016)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderApp()
    await user.type(await handOver(user), 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['app.languageEn'] }))
    holdLogo()
    expect(await screen.findByRole('heading', { name: nl['add.title'] })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    await handOver(user)
    expect(screen.getByRole('heading', { name: nl['guest.greeting'] })).toBeInTheDocument()
    expect((await getSettings()).language).toBe('nl')
  })
})
