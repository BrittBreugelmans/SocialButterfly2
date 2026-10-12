import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import {
  chooseContext,
  createEncounter,
  createEncounterInContext,
  createPerson,
  updatePerson,
  updateSettings,
} from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { buildSearchUrl } from '../src/linkedin/links'

// jsdom cannot follow links; stop it after React has handled the tap. Links only.
const stopNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) event.preventDefault()
}

beforeEach(async () => {
  await updateSettings({ contextChosenOn: todayLocal() })
  window.addEventListener('click', stopNavigation)
  vi.spyOn(window, 'open').mockImplementation(() => ({}) as Window)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // not in jsdom
})

afterEach(() => {
  window.removeEventListener('click', stopNavigation)
  // jsdom has no matchMedia; remove the mock of mockReducedMotion().
  delete (window as Partial<Window>).matchMedia
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

type User = ReturnType<typeof userEvent.setup>

/** iOS "Reduce Motion" on or off. */
function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn((media: string) => ({
    matches: media === '(prefers-reduced-motion: reduce)' ? matches : false,
    media,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
}

/** Add by name up to the note step (Flow A). */
async function addJan(user: User) {
  await user.click(await screen.findByRole('button', { name: nl['start.addByName'] }))
  await user.type(screen.getByLabelText(nl['add.name']), 'Jan Peeters')
  const link = screen.getByRole('link', { name: nl['add.search'] })
  await vi.waitFor(() => expect(link).toHaveAttribute('aria-busy', 'false'))
  await user.click(link)
  await screen.findByRole('heading', { name: nl['note.title'].replace('{name}', 'Jan Peeters') })
}

const flutter = () => document.querySelector('.flutter')

describe('The butterfly after adding a contact (User Story 3, M7)', () => {
  it('flutters over the start screen after saving the note', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.type(screen.getByLabelText(nl['note.label']), 'Works on payments')
    await user.click(screen.getByRole('button', { name: nl['note.save'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    const layer = flutter()
    expect(layer).not.toBeNull()
    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(layer!.querySelector('img[src="/logo.svg"]')).not.toBeNull()
  })

  it('also flutters after skipping the note', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).not.toBeNull()
  })

  it('is removed completely when its animation ends', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })

    fireEvent.animationEnd(flutter()!.querySelector('img')!)
    expect(flutter()).toBeNull()
  })

  it('is gone within 1.5 seconds, even without an animation end (FR-015)', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).not.toBeNull()

    await vi.waitFor(() => expect(flutter()).toBeNull(), { timeout: 1700, interval: 50 })
  })

  it('stops when the app goes to the background, and does not come back', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(flutter()).toBeNull()

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(flutter()).toBeNull()
  })

  it('never blocks a tap: "Add by name" opens the form at once (FR-014)', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    const addByName = await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).not.toBeNull()

    await user.click(addByName)
    expect(screen.getByLabelText(nl['add.name'])).toBeInTheDocument()
    expect(flutter()).toBeNull()

    // Back on the start screen: it does not fly again.
    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).toBeNull()
  })

  it('does not fly when the person was already met today (B19)', async () => {
    const user = userEvent.setup()
    await chooseContext(undefined)
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters') })
    await updatePerson(jan.id, { connectionStatus: 'connected' })
    await createEncounterInContext({ personId: jan.id, note: 'Payments' })
    renderApp()

    await user.click(await screen.findByRole('button', { name: nl['start.addByName'] }))
    await user.type(screen.getByLabelText(nl['add.name']), 'Jan Peeters')
    const link = screen.getByRole('link', { name: nl['add.search'] })
    await vi.waitFor(() => expect(link).toHaveAttribute('aria-busy', 'false'))
    await user.click(link)
    await user.click(await screen.findByRole('button', { name: /Jan Peeters/ }))
    await screen.findByText(nl['note.alreadyMet'].replace('{name}', 'Jan Peeters'))
    await user.click(screen.getByRole('button', { name: nl['note.save'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).toBeNull()
  })

  it('does not fly under iOS "Reduce Motion" (FR-018)', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).toBeNull()
  })

  it('flutters when "Reduce Motion" is off', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).not.toBeNull()
  })

  it('does not fly while saving the note fails (storage full)', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    vi.spyOn(db.encounters, 'put').mockRejectedValue(new DOMException('full', 'QuotaExceededError'))
    await user.type(screen.getByLabelText(nl['note.label']), 'Works on payments')
    await user.click(screen.getByRole('button', { name: nl['note.save'] }))

    await vi.waitFor(() => expect(screen.getByRole('button', { name: nl['note.save'] })).toBeEnabled())
    expect(screen.getByLabelText(nl['note.label'])).toBeInTheDocument()
    expect(flutter()).toBeNull()
  })

  it('does not fly for a note written later on the Actions tab (FR-017)', async () => {
    const user = userEvent.setup()
    const piet = await createPerson({ name: 'Piet Jansen', searchUrl: buildSearchUrl('Piet Jansen') })
    await createEncounter({ personId: piet.id, date: todayLocal() })
    renderApp()

    await user.click(await screen.findByRole('button', { name: new RegExp(`^${nl['tab.actions']}`) }))
    const card = await screen.findByRole('article', { name: 'Piet Jansen' })
    await user.click(within(card).getByRole('button', { name: nl['actions.writeNote'] }))
    await user.type(within(card).getByRole('textbox'), 'Talked about Kotlin')
    await user.click(within(card).getByRole('button', { name: nl['note.save'] }))

    await vi.waitFor(() => expect(card).not.toHaveTextContent(nl['actions.noteMissing']))
    await user.click(screen.getByRole('button', { name: nl['tab.add'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(flutter()).toBeNull()
  })
})
