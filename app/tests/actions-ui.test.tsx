import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import {
  chooseContext,
  createEncounter,
  createEvent,
  createPerson,
  dismissAction,
  getPerson,
  listEncountersByPerson,
  listPersons,
  updatePerson,
  updateSettings,
} from '../src/data/repository'
import type { Person } from '../src/data/types'
import { formatDateRange } from '../src/events/formatDateRange'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { buildSearchUrl } from '../src/linkedin/links'

const PIET_URL = 'https://www.linkedin.com/in/piet-jansen'

// jsdom cannot follow links; stop it after React has handled the tap. Links only.
const stopNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) event.preventDefault()
}

beforeEach(async () => {
  await updateSettings({ contextChosenOn: todayLocal() })
  window.addEventListener('click', stopNavigation)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // not in jsdom
})

afterEach(() => {
  window.removeEventListener('click', stopNavigation)
})

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

type User = ReturnType<typeof userEvent.setup>

const today = todayLocal()
const daysAgo = (days: number) => addDaysLocal(today, -days)

async function store(name: string, extra: { company?: string; profileUrl?: string; connected?: boolean } = {}) {
  const person = await createPerson({
    name,
    company: extra.company,
    profileUrl: extra.profileUrl,
    searchUrl: buildSearchUrl(name, extra.company),
  })
  return extra.connected ? updatePerson(person.id, { connectionStatus: 'connected' }) : person
}

/**
 * Jan: nothing done, met today at Devoxx. Zoë: everything done. Piet: note and profile link, not
 * connected, met 3 days ago without an Event.
 */
async function seed(): Promise<{ jan: Person; zoe: Person; piet: Person }> {
  const devoxx = await createEvent({ name: 'Devoxx 2026', startDate: daysAgo(1), endDate: today })
  await chooseContext(devoxx.id)
  const jan = await store('Jan Peeters', { company: 'Elmos' })
  await createEncounter({ personId: jan.id, eventId: devoxx.id, date: today })
  const zoe = await store('Zoë Maes', { profileUrl: 'https://www.linkedin.com/in/zoe', connected: true })
  await createEncounter({ personId: zoe.id, date: today, note: 'Zoë talked about design' })
  const piet = await store('Piet Jansen', { profileUrl: PIET_URL })
  await createEncounter({ personId: piet.id, date: daysAgo(3), note: 'Piet likes Rust' })
  return { jan, zoe, piet }
}

async function openActions(user: User) {
  await user.click(await screen.findByRole('button', { name: /^Acties/ }))
  await screen.findByRole('heading', { name: nl['actions.title'] })
}

const cards = () => screen.queryAllByRole('article')
const cardOf = (name: string) => screen.getByRole('article', { name })

describe('Actions tab: what is still open (F8 User Story 1)', () => {
  it('shows one card per Person with open Actions, newest first', async () => {
    const user = userEvent.setup()
    await seed()
    renderApp()
    await openActions(user)

    await vi.waitFor(() => expect(cards()).toHaveLength(2))
    expect(cards().map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Jan Peeters',
      'Piet Jansen',
    ])

    const jan = cardOf('Jan Peeters')
    expect(jan).toHaveTextContent('Elmos')
    expect(jan).toHaveTextContent('Devoxx 2026')
    expect(jan).toHaveTextContent(formatDateRange(today, today, 'nl'))
    expect(jan).toHaveTextContent(nl['actions.noteMissing'])
    expect(jan).toHaveTextContent(nl['actions.notConnected'])
    expect(jan).toHaveTextContent(nl['actions.profileLinkMissing'])

    const piet = cardOf('Piet Jansen')
    expect(piet).toHaveTextContent(nl['actions.notConnected'])
    expect(piet).not.toHaveTextContent(nl['actions.noteMissing'])
    expect(piet).not.toHaveTextContent(nl['actions.profileLinkMissing'])
    expect(piet).toHaveTextContent(nl['contacts.casual'])
  })

  it('shows no note text (FR-013)', async () => {
    const user = userEvent.setup()
    await seed()
    renderApp()
    await openActions(user)
    await vi.waitFor(() => expect(cards()).toHaveLength(2))
    expect(screen.queryByText(/Piet likes Rust/)).not.toBeInTheDocument()
  })

  it('opens no "note missing" when an older Encounter has a note (B31)', async () => {
    const user = userEvent.setup()
    const ann = await store('Ann Older')
    await createEncounter({ personId: ann.id, date: daysAgo(30), note: 'Met at a meetup' })
    await createEncounter({ personId: ann.id, date: today })
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Ann Older' })
    expect(card).not.toHaveTextContent(nl['actions.noteMissing'])
    expect(card).toHaveTextContent(nl['actions.notConnected'])
  })

  it('says "all done" when nothing is open', async () => {
    const user = userEvent.setup()
    renderApp()
    await openActions(user)
    expect(await screen.findByText(nl['actions.empty'])).toBeInTheDocument()
  })
})

/** The clipboard as iOS hands it over after "Paste". Call after userEvent.setup(). */
function clipboardHolds(text: string) {
  return vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(text)
}

describe('Actions tab: solve on the card (F8 User Story 2)', () => {
  it('shows one LinkedIn link per card: the search or the profile', async () => {
    const user = userEvent.setup()
    const { jan } = await seed()
    const noteOnly = await store('Nora Note', { profileUrl: 'https://www.linkedin.com/in/nora', connected: true })
    await createEncounter({ personId: noteOnly.id, date: today })
    renderApp()
    await openActions(user)
    await vi.waitFor(() => expect(cards()).toHaveLength(3))

    const janLink = within(cardOf('Jan Peeters')).getByRole('link', { name: nl['person.searchLinkedIn'] })
    expect(janLink).toHaveAttribute('href', jan.searchUrl)
    expect(janLink).toHaveAttribute('target', '_blank')
    expect(within(cardOf('Piet Jansen')).getByRole('link', { name: nl['person.openProfile'] })).toHaveAttribute(
      'href',
      PIET_URL,
    )
    expect(within(cardOf('Nora Note')).queryByRole('link')).not.toBeInTheDocument()
  })

  it('writes the missing note on the last Encounter (B31)', async () => {
    const user = userEvent.setup()
    const { jan } = await seed()
    await createEncounter({ personId: jan.id, date: daysAgo(20) }) // older, also without a note
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Jan Peeters' })

    await user.click(within(card).getByRole('button', { name: nl['actions.writeNote'] }))
    const field = within(card).getByRole('textbox', {
      name: nl['person.noteFor'].replace('{date}', formatDateRange(today, today, 'nl')).replace('{event}', 'Devoxx 2026'),
    })
    const save = within(card).getByRole('button', { name: nl['note.save'] })
    expect(save).toBeDisabled()

    await user.click(within(card).getByRole('button', { name: nl['link.cancel'] }))
    expect(within(card).queryByRole('textbox')).not.toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: nl['actions.writeNote'] }))
    await user.type(within(card).getByRole('textbox'), 'Talked about Kotlin')
    await user.click(within(card).getByRole('button', { name: nl['note.save'] }))

    await vi.waitFor(() => expect(cardOf('Jan Peeters')).not.toHaveTextContent(nl['actions.noteMissing']))
    const notes = (await listEncountersByPerson(jan.id)).map((e) => e.note)
    expect(notes).toEqual(['Talked about Kotlin', undefined])
    expect(field).not.toBeInTheDocument()
  })

  it('stores "I connected"', async () => {
    const user = userEvent.setup()
    const { piet } = await seed()
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Piet Jansen' })

    await user.click(within(card).getByRole('button', { name: nl['actions.connected'] }))
    await vi.waitFor(() => expect(screen.queryByRole('article', { name: 'Piet Jansen' })).not.toBeInTheDocument())
    expect((await getPerson(piet.id))?.connectionStatus).toBe('connected')
  })

  it('links a pasted profile; the last solved row removes the card', async () => {
    const user = userEvent.setup()
    const ann = await store('Ann Link', { connected: true })
    await createEncounter({ personId: ann.id, date: today, note: 'x' })
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Ann Link' })

    clipboardHolds('https://www.linkedin.com/in/ann-link')
    await user.click(within(card).getByRole('button', { name: nl['link.paste'] }))
    expect(await screen.findByText(nl['actions.empty'])).toBeInTheDocument()
    expect((await getPerson(ann.id))?.profileUrl).toBe('https://www.linkedin.com/in/ann-link')
  })

  it('merges with the Person who already has the pasted link', async () => {
    const user = userEvent.setup()
    await seed()
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Jan Peeters' })

    clipboardHolds(PIET_URL)
    await user.click(within(card).getByRole('button', { name: nl['link.paste'] }))
    const question = await within(card).findByRole('alertdialog')
    await user.click(within(question).getByRole('button', { name: nl['link.merge'] }))

    await vi.waitFor(() => expect(screen.queryByRole('article', { name: 'Jan Peeters' })).not.toBeInTheDocument())
    expect(await listPersons()).toHaveLength(2) // Zoë and the merged Piet
    // Piet now has Jan's Encounter (newer) and a note from before: only "not connected" is open.
    const piet = cardOf('Piet Jansen')
    expect(piet).toHaveTextContent(nl['actions.notConnected'])
    expect(piet).toHaveTextContent('Devoxx 2026')
  })

  it('opens the Person detail from the name, and Back returns to Actions', async () => {
    const user = userEvent.setup()
    await seed()
    renderApp()
    await openActions(user)
    const card = await screen.findByRole('article', { name: 'Piet Jansen' })

    await user.click(within(card).getByRole('button', { name: 'Piet Jansen' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Piet Jansen' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('heading', { name: nl['actions.title'] })).toBeInTheDocument()
  })
})

describe('Actions tab: dismiss (F8 User Story 3)', () => {
  const dismissButton = (action: string, name: string) =>
    screen.getByRole('button', {
      name: nl['actions.dismissLabel'].replace('{action}', action).replace('{name}', name),
    })

  it('dismisses with Undo, and the dismissal survives a restart', async () => {
    const user = userEvent.setup()
    await seed()
    const { unmount } = renderApp()
    await openActions(user)
    await screen.findByRole('article', { name: 'Piet Jansen' })

    await user.click(dismissButton(nl['actions.notConnected'], 'Piet Jansen'))
    await vi.waitFor(() => expect(screen.queryByRole('article', { name: 'Piet Jansen' })).not.toBeInTheDocument())
    expect(
      screen.getByText(
        nl['actions.dismissed'].replace('{action}', nl['actions.notConnected']).replace('{name}', 'Piet Jansen'),
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['actions.undo'] }))
    expect(await screen.findByRole('article', { name: 'Piet Jansen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['actions.undo'] })).not.toBeInTheDocument()

    await user.click(dismissButton(nl['actions.notConnected'], 'Piet Jansen'))
    await vi.waitFor(() => expect(screen.queryByRole('article', { name: 'Piet Jansen' })).not.toBeInTheDocument())

    // Another change on the tab clears the Undo line.
    await user.click(within(cardOf('Jan Peeters')).getByRole('button', { name: nl['actions.connected'] }))
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: nl['actions.undo'] })).not.toBeInTheDocument())

    unmount()
    renderApp()
    await openActions(user)
    await screen.findByRole('article', { name: 'Jan Peeters' })
    expect(screen.queryByRole('article', { name: 'Piet Jansen' })).not.toBeInTheDocument()
  })

  it('brings a dismissed Action back after a new Encounter (B30)', async () => {
    const user = userEvent.setup()
    const { piet } = await seed()
    await dismissAction(piet.id, 'notConnected')
    await new Promise((resolve) => setTimeout(resolve, 5)) // the new Encounter is saved later
    await createEncounter({ personId: piet.id, date: today })
    renderApp()
    await openActions(user)
    expect(await screen.findByRole('article', { name: 'Piet Jansen' })).toHaveTextContent(nl['actions.notConnected'])
  })
})

describe('Badge on the Actions tab (F8 User Story 4)', () => {
  const actionsTab = () => screen.getByRole('button', { name: /^Acties/ })

  it('shows the number of open Actions, and no number without', async () => {
    await seed() // Jan 3 + Piet 1
    const { unmount } = renderApp()
    await vi.waitFor(() =>
      expect(actionsTab()).toHaveAccessibleName(nl['tab.actionsCount'].replace('{count}', '4')),
    )
    expect(actionsTab()).toHaveTextContent('4')
    unmount()
  })

  it('shows no badge when nothing is open', async () => {
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })
    await vi.waitFor(() => expect(actionsTab()).toHaveAccessibleName(nl['tab.actions']))
    expect(document.querySelector('.tab-badge')).toBeNull()
  })

  it('goes up after adding someone, and down at once after solving', async () => {
    const user = userEvent.setup()
    await seed()
    renderApp()
    const count = (n: number) => nl['tab.actionsCount'].replace('{count}', String(n))
    await vi.waitFor(() => expect(actionsTab()).toHaveAccessibleName(count(4)))

    await user.click(screen.getByRole('button', { name: nl['start.addByName'] }))
    await user.type(screen.getByLabelText(nl['add.name']), 'Nieuwe Persoon')
    const search = screen.getByRole('link', { name: nl['add.search'] })
    await vi.waitFor(() => expect(search).toHaveAttribute('aria-busy', 'false'))
    await user.click(search)
    await user.click(await screen.findByRole('button', { name: nl['note.skip'] }))
    await vi.waitFor(() => expect(actionsTab()).toHaveAccessibleName(count(7)))

    await user.click(actionsTab())
    const piet = await screen.findByRole('article', { name: 'Piet Jansen' })
    await user.click(within(piet).getByRole('button', { name: nl['actions.connected'] }))
    await vi.waitFor(() => expect(actionsTab()).toHaveAccessibleName(count(6)))

    // A change in the F7 detail counts too.
    await user.click(within(cardOf('Jan Peeters')).getByRole('button', { name: 'Jan Peeters' }))
    await user.click(await screen.findByRole('switch', { name: nl['note.connected'] }))
    await vi.waitFor(() => expect(actionsTab()).toHaveAccessibleName(count(5)))
  })

  it('shows "99+" above 99', async () => {
    for (let i = 0; i < 40; i++) {
      const person = await store(`Person ${i}`)
      await createEncounter({ personId: person.id, date: today })
    }
    renderApp()
    await vi.waitFor(() =>
      expect(actionsTab()).toHaveAccessibleName(nl['tab.actionsCount'].replace('{count}', '120')),
    )
    expect(document.querySelector('.tab-badge')).toHaveTextContent('99+')
  })
})
