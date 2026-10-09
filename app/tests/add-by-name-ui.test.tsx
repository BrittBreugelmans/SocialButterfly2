import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import {
  chooseContext,
  createEncounter,
  createEncounterInContext,
  createEvent,
  createPerson,
  getPerson,
  getSettings,
  listPersons,
  updatePerson,
  updateSettings,
} from '../src/data/repository'
import type { Person } from '../src/data/types'
import { formatDateRange } from '../src/events/formatDateRange'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { buildSearchUrl } from '../src/linkedin/links'
import { NoteStep } from '../src/ui/NoteStep'

// jsdom cannot follow links; stop it after React has handled the tap. Links only, so
// checkboxes and submit buttons keep working.
const stopNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) event.preventDefault()
}

beforeEach(async () => {
  // The daily choice (F1) was already made today, so the App opens on the start screen.
  await updateSettings({ contextChosenOn: todayLocal() })
  window.addEventListener('click', stopNavigation)
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

/** Mocks window.open; records the Persons stored at the moment LinkedIn is opened. */
function mockOpen(returns: Window | null = {} as Window) {
  const storedWhenOpened: Promise<Person[]>[] = []
  const open = vi.spyOn(window, 'open').mockImplementation(() => {
    storedWhenOpened.push(listPersons())
    return returns
  })
  return { open, storedWhenOpened }
}

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: nl['start.addByName'] }))
  return screen.getByLabelText(nl['add.name'])
}

/** "Search on LinkedIn", once the same-name check for the typed name is done. */
async function searchLink() {
  const link = screen.getByRole('link', { name: nl['add.search'] })
  await vi.waitFor(() => expect(link).toHaveAttribute('aria-busy', 'false'))
  return link
}

function noteTitle(name: string) {
  return nl['note.title'].replace('{name}', name)
}

describe('Add by name (User Story 1)', () => {
  it('replaces "coming soon" with an "Add by name" button', async () => {
    renderApp()
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(screen.queryByText('Binnenkort beschikbaar.')).not.toBeInTheDocument()
  })

  it('shows the form with the context and focuses the name', async () => {
    const user = userEvent.setup()
    const event = await createEvent({ name: 'Devoxx 2026', startDate: todayLocal(), endDate: todayLocal() })
    await chooseContext(event.id)
    renderApp()
    const name = await openForm(user)
    expect(screen.getByRole('heading', { name: nl['add.title'] })).toBeInTheDocument()
    expect(screen.getByText(nl['context.at'])).toBeInTheDocument()
    expect(screen.getByText('Devoxx 2026')).toBeInTheDocument()
    expect(name).toHaveFocus()
  })

  it('shows casual networking in the form', async () => {
    const user = userEvent.setup()
    await chooseContext(undefined)
    renderApp()
    await openForm(user)
    expect(screen.getByText(nl['context.casual'])).toBeInTheDocument()
  })

  it('keeps "Search on LinkedIn" disabled while the name is blank', async () => {
    const user = userEvent.setup()
    const { open } = mockOpen()
    renderApp()
    const name = await openForm(user)
    const search = screen.getByRole('link', { name: nl['add.search'] })
    expect(search).toHaveAttribute('aria-disabled', 'true')
    await user.type(name, '   ')
    expect(search).toHaveAttribute('aria-disabled', 'true')
    await user.click(search)
    expect(await db.persons.count()).toBe(0)
    expect(open).not.toHaveBeenCalled()
  })

  it('opens the LinkedIn search on the tap itself and saves at the same moment (B20)', async () => {
    const user = userEvent.setup()
    const { open } = mockOpen()
    renderApp()
    await user.type(await openForm(user), 'Jan Peeters')
    await user.type(screen.getByLabelText(nl['add.company']), 'Elmos')
    const search = await searchLink()
    expect(search).toHaveAttribute('href', buildSearchUrl('Jan Peeters', 'Elmos'))
    expect(search).toHaveAttribute('target', '_blank')
    expect(search).toHaveAttribute('aria-disabled', 'false')

    await user.click(search)
    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(1)
    expect(await db.encounters.count()).toBe(1)
    expect(open).not.toHaveBeenCalled() // the link opened LinkedIn, not a script
  })

  it('searches on the name only without a company', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await openForm(user), 'Jan Peeters')
    expect(await searchLink()).toHaveAttribute('href', buildSearchUrl('Jan Peeters'))
  })

  it('saves once when "Search on LinkedIn" is tapped twice quickly', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await openForm(user), 'Jan Peeters')
    const search = await searchLink()
    fireEvent.click(search)
    fireEvent.click(search)
    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(1)
    expect(await db.encounters.count()).toBe(1)
  })

  it('goes back without saving anything', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(await openForm(user), 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(await db.persons.count()).toBe(0)
  })
})

describe('Same name (User Story 2)', () => {
  const LAST_MET = '2026-10-01'

  async function storeJan(fields: { company?: string; profileUrl?: string } = { company: 'Elmos' }) {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters'), ...fields })
    await createEncounter({ personId: jan.id, date: LAST_MET })
    return jan
  }

  async function searchFor(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.type(await openForm(user), name)
    await user.click(await searchLink())
  }

  it('asks "Is this the same person?" before saving or opening anything', async () => {
    const user = userEvent.setup()
    const { open } = mockOpen()
    await storeJan()
    renderApp()
    await searchFor(user, 'jan  peeters')

    expect(await screen.findByRole('heading', { name: nl['same.title'] })).toBeInTheDocument()
    const match = screen.getByRole('link', { name: /Jan Peeters/ })
    expect(match).toHaveTextContent('Elmos')
    expect(match).toHaveTextContent(nl['same.lastMet'].replace('{date}', formatDateRange(LAST_MET, LAST_MET, 'nl')))
    expect(open).not.toHaveBeenCalled()
    expect(await db.encounters.count()).toBe(1)
  })

  it('shows "no company" for a match without one', async () => {
    const user = userEvent.setup()
    await storeJan({})
    renderApp()
    await searchFor(user, 'Jan Peeters')
    expect(await screen.findByRole('link', { name: /Jan Peeters/ })).toHaveTextContent(nl['same.noCompany'])
  })

  it('goes back to the form with the input kept and nothing saved', async () => {
    const user = userEvent.setup()
    await storeJan()
    renderApp()
    await searchFor(user, 'Jan Peeters')
    await user.click(await screen.findByRole('button', { name: nl['add.back'] }))

    expect(screen.getByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
    expect(await db.persons.count()).toBe(1)
    expect(await db.encounters.count()).toBe(1)
  })

  it('adds an Encounter to the chosen Person; the tap opens their profile', async () => {
    const user = userEvent.setup()
    const profileUrl = 'https://www.linkedin.com/in/jan-peeters'
    await storeJan({ company: 'Elmos', profileUrl })
    renderApp()
    await searchFor(user, 'Jan Peeters')
    const match = await screen.findByRole('link', { name: /Jan Peeters/ })
    expect(match).toHaveAttribute('href', profileUrl)
    expect(match).toHaveAttribute('target', '_blank')
    await user.click(match)

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(1)
    expect(await db.encounters.count()).toBe(2)
  })

  it('links a chosen Person without a profile URL to their search link', async () => {
    const user = userEvent.setup()
    await storeJan()
    renderApp()
    await searchFor(user, 'Jan Peeters')
    expect(await screen.findByRole('link', { name: /Jan Peeters/ })).toHaveAttribute(
      'href',
      buildSearchUrl('Jan Peeters'),
    )
  })

  it('saves a second Jan Peeters on "No, new person"; the tap opens the search', async () => {
    const user = userEvent.setup()
    await storeJan()
    renderApp()
    await searchFor(user, 'Jan Peeters')
    const newPerson = await screen.findByRole('link', { name: nl['same.newPerson'] })
    expect(newPerson).toHaveAttribute('href', buildSearchUrl('Jan Peeters'))
    await user.click(newPerson)

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect((await listPersons()).filter((p) => p.name === 'Jan Peeters')).toHaveLength(2)
  })

  it('does not open LinkedIn when the Person was already met today (B19)', async () => {
    const user = userEvent.setup()
    const { open } = mockOpen()
    await chooseContext(undefined)
    const jan = await storeJan()
    await createEncounterInContext({ personId: jan.id })
    renderApp()
    await searchFor(user, 'Jan Peeters')
    // Met today: a plain button, not a link to LinkedIn.
    expect(screen.queryByRole('link', { name: /Jan Peeters/ })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: /Jan Peeters/ }))

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(open).not.toHaveBeenCalled()
    expect(await db.encounters.count()).toBe(2)
  })
})

describe('Note step and "I connected" (User Story 3)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  async function addJan(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await openForm(user), 'Jan Peeters')
    await user.click(await searchLink())
    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    const [person] = await listPersons()
    return person!
  }

  it('shows the note step after the search, with the switch off', async () => {
    const user = userEvent.setup()
    mockOpen()
    renderApp()
    await addJan(user)
    expect(screen.getByLabelText(nl['note.label'])).toHaveValue('')
    expect(screen.getByRole('switch', { name: nl['note.connected'] })).not.toBeChecked()
  })

  it('stores "connected" at once, before save or skip (FR-018)', async () => {
    const user = userEvent.setup()
    mockOpen()
    renderApp()
    const jan = await addJan(user)
    const toggle = screen.getByRole('switch', { name: nl['note.connected'] })

    await user.click(toggle)
    await vi.waitFor(async () => expect((await getPerson(jan.id))?.connectionStatus).toBe('connected'))
    await user.click(toggle)
    await vi.waitFor(async () => expect((await getPerson(jan.id))?.connectionStatus).toBe('notConnected'))
  })

  it('saves the note and returns to the start screen', async () => {
    const user = userEvent.setup()
    mockOpen()
    renderApp()
    await addJan(user)
    await user.type(screen.getByLabelText(nl['note.label']), 'Works on payments')
    await user.click(screen.getByRole('button', { name: nl['note.save'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    const [encounter] = await db.encounters.toArray()
    expect(encounter?.note).toBe('Works on payments')
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })

  it('skips without a note and keeps "not connected"', async () => {
    const user = userEvent.setup()
    mockOpen()
    renderApp()
    const jan = await addJan(user)
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))

    await screen.findByRole('button', { name: nl['start.addByName'] })
    const [encounter] = await db.encounters.toArray()
    expect(encounter?.note).toBeUndefined()
    expect((await getPerson(jan.id))?.connectionStatus).toBe('notConnected')
  })

  it('comes back after the app was closed, the same day (B18)', async () => {
    const user = userEvent.setup()
    mockOpen()
    const { unmount } = renderApp()
    await addJan(user)
    unmount()

    const second = renderApp()
    expect(await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })
    second.unmount()

    renderApp()
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(screen.queryByLabelText(nl['note.label'])).not.toBeInTheDocument()
  })

  it('does not come back on a later day', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters') })
    const encounter = await createEncounter({ personId: jan.id, date: todayLocal() })
    await updateSettings({ noteStepEncounterId: encounter.id })

    const tomorrow = addDaysLocal(todayLocal(), 1)
    const [year, month, day] = tomorrow.split('-').map(Number) as [number, number, number]
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(year, month - 1, day, 10, 0))
    await updateSettings({ contextChosenOn: tomorrow })

    renderApp()
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(screen.queryByLabelText(nl['note.label'])).not.toBeInTheDocument()
  })

  it('shows a filled "Open LinkedIn" button when LinkedIn did not open (research R1)', async () => {
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters') })
    const encounter = await createEncounter({ personId: jan.id, date: todayLocal() })
    render(
      <LanguageProvider>
        <NoteStep person={jan} encounter={encounter} alreadyMetToday={false} opened={false} onDone={() => {}} onMerged={() => {}} />
      </LanguageProvider>,
    )
    const button = await screen.findByRole('link', { name: nl['note.openLinkedIn'] })
    expect(button).toHaveAttribute('href', buildSearchUrl('Jan Peeters'))
    expect(button).toHaveAttribute('target', '_blank')
    expect(button).toHaveClass('button-link')
    expect(button).not.toHaveClass('secondary')
  })

  it('shows an outlined "Open LinkedIn" button after the search opened LinkedIn', async () => {
    const user = userEvent.setup()
    renderApp()
    await addJan(user)
    expect(screen.getByRole('link', { name: nl['note.openLinkedIn'] })).toHaveClass('button-link', 'secondary')
  })

  it('says "already met today" and shows the existing note and status (B19)', async () => {
    const user = userEvent.setup()
    const { open } = mockOpen()
    await chooseContext(undefined)
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: buildSearchUrl('Jan Peeters') })
    await updatePerson(jan.id, { connectionStatus: 'connected' })
    await createEncounterInContext({ personId: jan.id, note: 'Payments' })
    renderApp()

    await user.type(await openForm(user), 'Jan Peeters')
    await user.click(await searchLink())
    await user.click(await screen.findByRole('button', { name: /Jan Peeters/ }))

    expect(await screen.findByText(nl['note.alreadyMet'].replace('{name}', 'Jan Peeters'))).toBeInTheDocument()
    expect(screen.getByLabelText(nl['note.label'])).toHaveValue('Payments')
    expect(screen.getByRole('switch', { name: nl['note.connected'] })).toBeChecked()
    expect(screen.getByRole('link', { name: nl['note.openLinkedIn'] })).toHaveClass('secondary')
    expect(open).not.toHaveBeenCalled()
  })
})
