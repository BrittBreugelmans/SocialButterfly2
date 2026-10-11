import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import {
  chooseContext,
  createEncounter,
  createEvent,
  createPerson,
  updatePerson,
  updateSettings,
} from '../src/data/repository'
import type { Event } from '../src/data/types'
import { formatDateRange } from '../src/events/formatDateRange'
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

async function store(name: string, company?: string, connected = false) {
  const person = await createPerson({ name, company, searchUrl: buildSearchUrl(name, company) })
  return connected ? updatePerson(person.id, { connectionStatus: 'connected' }) : person
}

async function openContacts(user: User) {
  await user.click(await screen.findByRole('button', { name: nl['tab.contacts'] }))
  await screen.findByRole('heading', { name: nl['contacts.title'] })
}

/** The names in the list, top to bottom. */
function listedNames(): string[] {
  return Array.from(document.querySelectorAll('.contact-row .contact-name')).map((el) => el.textContent ?? '')
}

const viewPicker = () => screen.getByLabelText(nl['contacts.show']) as HTMLSelectElement

async function seedDevoxx(): Promise<Event> {
  const devoxx = await createEvent({ name: 'Devoxx 2026', startDate: daysAgo(2), endDate: today })
  await chooseContext(devoxx.id)
  const jan = await store('Jan Peeters', 'Elmos')
  const zoe = await store('Zoë Maes', undefined, true)
  const piet = await store('Piet Jansen', 'Acme')
  const casual = await store('Casual Carl')
  await createEncounter({ personId: jan.id, eventId: devoxx.id, date: daysAgo(1) })
  await createEncounter({ personId: zoe.id, eventId: devoxx.id, date: today })
  await createEncounter({ personId: piet.id, eventId: devoxx.id, date: daysAgo(2) })
  await createEncounter({ personId: casual.id, date: daysAgo(5) })
  return devoxx
}

describe('Contact list (F7 User Story 1)', () => {
  it('shows the people of the active Event, newest first, with company, status and date', async () => {
    const user = userEvent.setup()
    await seedDevoxx()
    renderApp()
    await openContacts(user)

    expect(await screen.findByText('Zoë Maes')).toBeInTheDocument()
    expect(listedNames()).toEqual(['Zoë Maes', 'Jan Peeters', 'Piet Jansen'])

    const janRow = screen.getByRole('button', { name: /^Jan Peeters,/ })
    expect(janRow).toHaveTextContent('Elmos')
    expect(janRow).toHaveTextContent(nl['contacts.notConnected'])
    expect(janRow).toHaveTextContent(formatDateRange(daysAgo(1), daysAgo(1), 'nl'))
    expect(screen.getByRole('button', { name: /^Zoë Maes,/ })).toHaveTextContent(nl['contacts.connected'])
  })

  it('switches between the Event, without Event and all contacts', async () => {
    const user = userEvent.setup()
    await seedDevoxx()
    renderApp()
    await openContacts(user)
    await screen.findByText('Zoë Maes')

    expect(viewPicker().selectedOptions[0]?.textContent).toContain('Devoxx 2026')

    await user.selectOptions(viewPicker(), nl['contacts.all'])
    expect(listedNames()).toHaveLength(4)

    await user.selectOptions(viewPicker(), nl['contacts.casual'])
    expect(listedNames()).toEqual(['Casual Carl'])
  })

  it('opens on all contacts during casual networking', async () => {
    const user = userEvent.setup()
    await seedDevoxx()
    await chooseContext(undefined)
    renderApp()
    await openContacts(user)
    await screen.findByText('Zoë Maes')
    expect(viewPicker().selectedOptions[0]?.textContent).toBe(nl['contacts.all'])
    expect(listedNames()).toHaveLength(4)
  })

  it('lists a Person met at two Events once in each', async () => {
    const user = userEvent.setup()
    const devoxx = await seedDevoxx()
    const other = await createEvent({ name: 'Techorama', startDate: daysAgo(30), endDate: daysAgo(29) })
    const jan = await store('Ann Twice')
    await createEncounter({ personId: jan.id, eventId: devoxx.id, date: daysAgo(1) })
    await createEncounter({ personId: jan.id, eventId: other.id, date: daysAgo(30) })
    renderApp()
    await openContacts(user)
    await screen.findByText('Ann Twice')
    expect(listedNames().filter((name) => name === 'Ann Twice')).toHaveLength(1)

    await user.selectOptions(viewPicker(), screen.getByRole('option', { name: /^Techorama/ }))
    expect(listedNames()).toEqual(['Ann Twice'])

    await user.selectOptions(viewPicker(), nl['contacts.all'])
    expect(listedNames().filter((name) => name === 'Ann Twice')).toHaveLength(1)
  })

  it('shows a friendly empty message with a way to add someone', async () => {
    const user = userEvent.setup()
    renderApp()
    await openContacts(user)
    expect(await screen.findByText(nl['contacts.empty'])).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['contacts.emptyAdd'] }))
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
  })
})

describe('Search by name (F7 User Story 2)', () => {
  async function seedNames() {
    for (const name of ['Jan Peeters', 'Janne De Smet', 'Piet Jansen', 'Zoë Maes']) {
      const person = await store(name)
      await createEncounter({ personId: person.id, date: today })
    }
  }

  const searchField = () => screen.getByRole('searchbox', { name: nl['contacts.search'] })

  it('filters while typing, ignoring case and accents', async () => {
    const user = userEvent.setup()
    await seedNames()
    renderApp()
    await openContacts(user)
    await screen.findByText('Zoë Maes')

    await user.type(searchField(), 'jan')
    expect(listedNames().sort()).toEqual(['Jan Peeters', 'Janne De Smet', 'Piet Jansen'])

    await user.clear(searchField())
    await user.type(searchField(), 'peet')
    expect(listedNames()).toEqual(['Jan Peeters'])

    await user.clear(searchField())
    await user.type(searchField(), 'zoe')
    expect(listedNames()).toEqual(['Zoë Maes'])
  })

  it('says when nobody matches, with a way to clear the search', async () => {
    const user = userEvent.setup()
    await seedNames()
    renderApp()
    await openContacts(user)
    await screen.findByText('Zoë Maes')

    await user.type(searchField(), 'xyz')
    expect(screen.getByText(nl['contacts.noMatch'].replace('{query}', 'xyz'))).toBeInTheDocument()
    expect(screen.queryByText(nl['contacts.empty'])).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['contacts.clearSearch'] }))
    expect(searchField()).toHaveValue('')
    expect(listedNames()).toHaveLength(4)
  })

  it('keeps the search when the view changes', async () => {
    const user = userEvent.setup()
    await seedNames()
    const devoxx = await createEvent({ name: 'Devoxx 2026', startDate: today, endDate: today })
    const jef = await store('Jef Janssens')
    await createEncounter({ personId: jef.id, eventId: devoxx.id, date: today })
    renderApp()
    await openContacts(user)
    await screen.findByText('Zoë Maes')

    await user.type(searchField(), 'jan')
    expect(listedNames()).toHaveLength(4)
    await user.selectOptions(viewPicker(), screen.getByRole('option', { name: /^Devoxx 2026/ }))
    expect(searchField()).toHaveValue('jan')
    expect(listedNames()).toEqual(['Jef Janssens'])
  })
})
