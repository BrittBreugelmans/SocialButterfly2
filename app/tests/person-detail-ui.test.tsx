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
  deletePerson,
  getNoteStep,
  getPerson,
  listEncountersByPerson,
  listPersons,
  updateSettings,
} from '../src/data/repository'
import type { Event, Person } from '../src/data/types'
import { formatDateRange } from '../src/events/formatDateRange'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { buildSearchUrl } from '../src/linkedin/links'

const JAN_URL = 'https://www.linkedin.com/in/jan-peeters'

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

async function store(name: string, extra: { company?: string; profileUrl?: string } = {}): Promise<Person> {
  return createPerson({ name, ...extra, searchUrl: buildSearchUrl(name, extra.company) })
}

/** Jan Peeters with a Devoxx Encounter (with note) and an older casual one without a note. */
async function seedJan(): Promise<{ jan: Person; devoxx: Event }> {
  const devoxx = await createEvent({ name: 'Devoxx 2026', startDate: daysAgo(1), endDate: today })
  await chooseContext(devoxx.id)
  const jan = await store('Jan Peeters', { company: 'Elmos', profileUrl: JAN_URL })
  await createEncounter({ personId: jan.id, eventId: devoxx.id, date: today, note: 'Talked about Kotlin' })
  await createEncounter({ personId: jan.id, date: daysAgo(10) })
  return { jan, devoxx }
}

async function openContacts(user: User) {
  await user.click(await screen.findByRole('button', { name: nl['tab.contacts'] }))
  await screen.findByRole('heading', { name: nl['contacts.title'] })
}

async function openPerson(user: User, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${escaped}(,|$)`) }))
  await screen.findByRole('heading', { name })
}

const timelineItems = () => Array.from(document.querySelectorAll('.timeline-item')) as HTMLElement[]

/** The clipboard as iOS hands it over after "Paste". Call after userEvent.setup(). */
function clipboardHolds(text: string) {
  return vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue(text)
}

describe('Person detail (F7 User Story 3)', () => {
  it('shows the timeline of all Encounters, newest first, with Event and note', async () => {
    const user = userEvent.setup()
    await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    expect(screen.getByText('Elmos')).toBeInTheDocument()
    const [first, second] = timelineItems()
    expect(timelineItems()).toHaveLength(2) // also the casual one, while the list showed Devoxx
    expect(first).toHaveTextContent(formatDateRange(today, today, 'nl'))
    expect(first).toHaveTextContent('Devoxx 2026')
    expect(first).toHaveTextContent('Talked about Kotlin')
    expect(second).toHaveTextContent(nl['contacts.casual'])
    expect(second).toHaveTextContent(nl['person.noNote'])
  })

  it('opens the profile when the profile link is known', async () => {
    const user = userEvent.setup()
    await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    const link = screen.getByRole('link', { name: nl['person.openProfile'] })
    expect(link).toHaveAttribute('href', JAN_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('linkedin.com/in/jan-peeters')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['link.paste'] })).not.toBeInTheDocument()
  })

  it('opens the search without a profile link, and links a pasted profile', async () => {
    const user = userEvent.setup()
    const piet = await store('Piet Jansen', { company: 'Acme' })
    await createEncounter({ personId: piet.id, date: today })
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Piet Jansen')

    expect(screen.getByRole('link', { name: nl['person.searchLinkedIn'] })).toHaveAttribute(
      'href',
      buildSearchUrl('Piet Jansen', 'Acme'),
    )
    expect(screen.getByText(nl['person.noProfile'])).toBeInTheDocument()

    clipboardHolds('https://www.linkedin.com/in/piet')
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
    expect(await screen.findByText(nl['link.linked'], { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: nl['person.openProfile'] })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/piet',
    )
    expect(screen.queryByText(nl['person.noProfile'])).not.toBeInTheDocument()
    expect((await getPerson(piet.id))?.profileUrl).toBe('https://www.linkedin.com/in/piet')
  })

  it('merges with the Person who already has the pasted link', async () => {
    const user = userEvent.setup()
    await seedJan()
    const twin = await store('Janneke')
    await createEncounter({ personId: twin.id, date: daysAgo(3), note: 'At the meetup' })
    renderApp()
    await openContacts(user)
    await user.selectOptions(screen.getByLabelText(nl['contacts.show']), nl['contacts.all'])
    await openPerson(user, 'Janneke')

    clipboardHolds(JAN_URL)
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
    const question = await screen.findByRole('alertdialog')
    await user.click(within(question).getByRole('button', { name: nl['link.merge'] }))

    expect(await screen.findByRole('heading', { name: 'Jan Peeters' })).toBeInTheDocument()
    await vi.waitFor(() => expect(timelineItems()).toHaveLength(3))
    expect(await listPersons()).toHaveLength(1)
  })

  it('goes back to the list with the same view and search', async () => {
    const user = userEvent.setup()
    await seedJan()
    const ann = await store('Ann Other')
    await createEncounter({ personId: ann.id, date: today })
    renderApp()
    await openContacts(user)
    await user.selectOptions(screen.getByLabelText(nl['contacts.show']), nl['contacts.all'])
    await user.type(screen.getByRole('searchbox', { name: nl['contacts.search'] }), 'jan')
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('searchbox', { name: nl['contacts.search'] })).toHaveValue('jan')
    expect((screen.getByLabelText(nl['contacts.show']) as HTMLSelectElement).value).toBe('all')
    expect(screen.queryByText('Ann Other')).not.toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalled()
  })
})

describe('Connection status (F7 User Story 4)', () => {
  it('switches the status with one tap, saved at once', async () => {
    const user = userEvent.setup()
    const { jan } = await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    const toggle = screen.getByRole('switch', { name: nl['note.connected'] })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
    await vi.waitFor(async () => expect((await getPerson(jan.id))?.connectionStatus).toBe('connected'))

    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('button', { name: /^Jan Peeters,/ })).toHaveTextContent(nl['contacts.connected'])

    await openPerson(user, 'Jan Peeters')
    await user.click(screen.getByRole('switch', { name: nl['note.connected'] }))
    await vi.waitFor(async () => expect((await getPerson(jan.id))?.connectionStatus).toBe('notConnected'))
  })
})

describe('Delete a person (F7 User Story 5)', () => {
  it('asks first, then deletes the Person with all Encounters', async () => {
    const user = userEvent.setup()
    const { jan } = await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['person.delete'] }))
    const question = screen.getByRole('alertdialog')
    expect(question).toHaveTextContent(
      nl['person.deleteQuestionMany'].replace('{name}', 'Jan Peeters').replace('{count}', '2'),
    )

    await user.click(within(question).getByRole('button', { name: nl['link.cancel'] }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(await getPerson(jan.id)).toBeDefined()

    await user.click(screen.getByRole('button', { name: nl['person.delete'] }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: nl['person.deleteConfirm'] }))

    expect(await screen.findByText(nl['contacts.deleted'].replace('{name}', 'Jan Peeters'))).toBeInTheDocument()
    expect(await getPerson(jan.id)).toBeUndefined()
    expect(await listEncountersByPerson(jan.id)).toEqual([])

    await user.type(screen.getByRole('searchbox', { name: nl['contacts.search'] }), 'jan')
    expect(screen.getByText(nl['contacts.noMatch'].replace('{query}', 'jan'))).toBeInTheDocument()
  })

  it('says "1 encounter" for a Person met once', async () => {
    const user = userEvent.setup()
    const ann = await store('Ann Once')
    await createEncounter({ personId: ann.id, date: today })
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Ann Once')

    await user.click(screen.getByRole('button', { name: nl['person.delete'] }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      nl['person.deleteQuestionOne'].replace('{name}', 'Ann Once'),
    )
  })

  // With an open note step the app opens on it (B18), so this is checked on the data only.
  it('does not bring back the note step of a deleted Person (B18)', async () => {
    const ann = await store('Ann Once')
    const encounter = await createEncounter({ personId: ann.id, date: today })
    await updateSettings({ noteStepEncounterId: encounter.id })
    expect(await getNoteStep()).toBeDefined()
    await deletePerson(ann.id)
    expect(await getNoteStep()).toBeUndefined()
  })
})

describe('Delete one encounter (F7 User Story 6)', () => {
  it('deletes only that Encounter and its note', async () => {
    const user = userEvent.setup()
    const { jan } = await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    const [devoxxItem] = timelineItems()
    await user.click(within(devoxxItem!).getByRole('button', { name: nl['encounter.delete'] }))
    const question = screen.getByRole('alertdialog')
    expect(question).toHaveTextContent(
      nl['encounter.deleteQuestion']
        .replace('{date}', formatDateRange(today, today, 'nl'))
        .replace('{event}', 'Devoxx 2026'),
    )
    expect(question).toHaveTextContent(nl['encounter.deleteNote'])

    await user.click(within(question).getByRole('button', { name: nl['person.deleteConfirm'] }))
    await vi.waitFor(() => expect(timelineItems()).toHaveLength(1))
    expect(timelineItems()[0]).toHaveTextContent(nl['contacts.casual'])
    expect(await listEncountersByPerson(jan.id)).toHaveLength(1)

    // Back on the Devoxx view Jan is gone; he is still met without an Event.
    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    await vi.waitFor(() => expect(screen.queryByRole('button', { name: /^Jan Peeters,/ })).not.toBeInTheDocument())
    await user.selectOptions(screen.getByLabelText(nl['contacts.show']), nl['contacts.casual'])
    expect(screen.getByRole('button', { name: /^Jan Peeters,/ })).toBeInTheDocument()
  })

  it('offers to delete the whole Person for the only Encounter', async () => {
    const user = userEvent.setup()
    const ann = await store('Ann Once')
    await createEncounter({ personId: ann.id, date: today })
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Ann Once')

    await user.click(screen.getByRole('button', { name: nl['encounter.delete'] }))
    const question = screen.getByRole('alertdialog')
    expect(question).toHaveTextContent(nl['encounter.deleteLast'].replace('{name}', 'Ann Once'))

    await user.click(within(question).getByRole('button', { name: nl['link.cancel'] }))
    expect(await getPerson(ann.id)).toBeDefined()

    await user.click(screen.getByRole('button', { name: nl['encounter.delete'] }))
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: nl['person.deleteConfirmPerson'] }),
    )
    expect(await screen.findByText(nl['contacts.deleted'].replace('{name}', 'Ann Once'))).toBeInTheDocument()
    expect(await getPerson(ann.id)).toBeUndefined()
  })
})

describe('Correct a name or company (F7 User Story 7)', () => {
  it('saves a new name and company; search and the search link follow', async () => {
    const user = userEvent.setup()
    const jan = await store('Jan Peeters')
    await createEncounter({ personId: jan.id, date: today })
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    const name = screen.getByLabelText(nl['add.name'])
    const company = screen.getByLabelText(nl['add.company'])
    expect(name).toHaveValue('Jan Peeters')
    expect(name).toHaveAttribute('maxLength', '100')
    expect(company).toHaveValue('')
    expect(company).toHaveAttribute('maxLength', '100')

    await user.clear(name)
    await user.type(name, 'Jan Peeters-Maes')
    await user.type(company, 'Elmos')
    await user.click(screen.getByRole('button', { name: nl['person.save'] }))

    expect(await screen.findByRole('heading', { name: 'Jan Peeters-Maes' })).toBeInTheDocument()
    expect(screen.getByText('Elmos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: nl['person.searchLinkedIn'] })).toHaveAttribute(
      'href',
      buildSearchUrl('Jan Peeters-Maes', 'Elmos'),
    )

    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    await user.type(await screen.findByRole('searchbox', { name: nl['contacts.search'] }), 'maes')
    expect(await screen.findByRole('button', { name: /^Jan Peeters-Maes,/ })).toBeInTheDocument()
  })

  it('refuses an empty name, and cancel restores the stored values', async () => {
    const user = userEvent.setup()
    const jan = await store('Jan Peeters', { company: 'Elmos' })
    await createEncounter({ personId: jan.id, date: today })
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    await user.clear(screen.getByLabelText(nl['add.name']))
    await user.click(screen.getByRole('button', { name: nl['person.save'] }))
    expect(screen.getByRole('alert')).toHaveTextContent(nl['person.errorName'])
    expect((await getPerson(jan.id))?.name).toBe('Jan Peeters')

    await user.type(screen.getByLabelText(nl['add.name']), 'Someone Else')
    await user.click(screen.getByRole('button', { name: nl['link.cancel'] }))
    expect(screen.getByRole('heading', { name: 'Jan Peeters' })).toBeInTheDocument()
    expect(screen.getByText('Elmos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    expect(screen.getByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
  })
})

describe('Notes in the edit mode (F7, B28, B29)', () => {
  const noteField = (date: string, event: string) =>
    screen.getByRole('textbox', {
      name: nl['person.noteFor'].replace('{date}', formatDateRange(date, date, 'nl')).replace('{event}', event),
    })

  it('shows a note field per Encounter and hides the other actions', async () => {
    const user = userEvent.setup()
    await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')
    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))

    expect(noteField(today, 'Devoxx 2026')).toHaveValue('Talked about Kotlin')
    expect(noteField(daysAgo(10), nl['contacts.casual'])).toHaveValue('')
    expect(screen.queryByRole('link', { name: nl['person.openProfile'] })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['encounter.delete'] })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['person.delete'] })).not.toBeInTheDocument()
  })

  it('adds, changes and clears notes, saved together', async () => {
    const user = userEvent.setup()
    const { jan } = await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    await user.type(noteField(daysAgo(10), nl['contacts.casual']), 'Met at the train station')
    await user.clear(noteField(today, 'Devoxx 2026'))
    await user.type(noteField(today, 'Devoxx 2026'), 'Kotlin and coffee')
    await user.click(screen.getByRole('button', { name: nl['person.save'] }))

    // Only the timeline paragraphs: a controlled textarea also carries its value as text.
    expect(await screen.findByText('Kotlin and coffee', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Met at the train station', { selector: 'p' })).toBeInTheDocument()
    const notes = (await listEncountersByPerson(jan.id)).map((e) => e.note)
    expect(notes).toEqual(['Kotlin and coffee', 'Met at the train station'])

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    await user.clear(noteField(today, 'Devoxx 2026'))
    await user.click(screen.getByRole('button', { name: nl['person.save'] }))
    await vi.waitFor(() => expect(timelineItems()[0]).toHaveTextContent(nl['person.noNote']))
    expect((await listEncountersByPerson(jan.id))[0]?.note).toBeUndefined()
  })

  it('cancel restores the stored notes', async () => {
    const user = userEvent.setup()
    const { jan } = await seedJan()
    renderApp()
    await openContacts(user)
    await openPerson(user, 'Jan Peeters')

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    await user.type(noteField(today, 'Devoxx 2026'), ' and more')
    await user.click(screen.getByRole('button', { name: nl['link.cancel'] }))
    expect(screen.getByText('Talked about Kotlin', { selector: 'p' })).toBeInTheDocument()
    expect((await listEncountersByPerson(jan.id))[0]?.note).toBe('Talked about Kotlin')

    await user.click(screen.getByRole('button', { name: nl['person.edit'] }))
    expect(noteField(today, 'Devoxx 2026')).toHaveValue('Talked about Kotlin')
  })
})
