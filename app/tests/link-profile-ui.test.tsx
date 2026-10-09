import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import { createEncounterInContext, createPerson, getSettings, listPersons, updateSettings } from '../src/data/repository'
import { db } from '../src/data/db'
import { buildSearchUrl } from '../src/linkedin/links'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

const JAN_URL = 'https://www.linkedin.com/in/jan-peeters'

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

/** Start → quick mode → name → "Search on LinkedIn" → the note step. */
async function addByName(user: User, name: string) {
  await user.click(await screen.findByRole('button', { name: nl['start.addByName'] }))
  await user.type(screen.getByLabelText(nl['add.name']), name)
  const search = screen.getByRole('link', { name: nl['add.search'] })
  await vi.waitFor(() => expect(search).toHaveAttribute('aria-busy', 'false'))
  await user.click(search)
  await screen.findByRole('heading', { name: nl['note.title'].replace('{name}', name) })
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
  return document.querySelector('.link-message')
}

describe('Paste the profile link (User Story 1)', () => {
  it('stores the normalized link and shows it as linked', async () => {
    const user = userEvent.setup()
    renderApp()
    await addByName(user, 'Jan Peeters')
    clipboardHolds(`${JAN_URL}?utm_source=share&utm_medium=ios_app`)

    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
    expect(await screen.findByText('linkedin.com/in/jan-peeters')).toBeInTheDocument()
    expect(screen.getByText(nl['link.linked'])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['link.pasteAgain'] })).toBeInTheDocument()
    const [jan] = await listPersons()
    expect(jan?.profileUrl).toBe(JAN_URL)
  })

  it('opens the profile instead of the search once linked', async () => {
    const user = userEvent.setup()
    renderApp()
    await addByName(user, 'Jan Peeters')
    clipboardHolds(JAN_URL)
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
    await screen.findByText('linkedin.com/in/jan-peeters')
    expect(screen.getByRole('link', { name: nl['note.openLinkedIn'] })).toHaveAttribute('href', JAN_URL)
  })

  it.each([
    ['hallo', nl['link.invalid']],
    ['https://lnkd.in/abc', nl['link.shortLink']],
  ])('refuses %s with a message and stores nothing', async (clipboard, message) => {
    const user = userEvent.setup()
    renderApp()
    await addByName(user, 'Jan Peeters')
    clipboardHolds(clipboard)
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))

    await vi.waitFor(() => expect(linkMessage()).toHaveTextContent(message))
    expect((await listPersons())[0]?.profileUrl).toBeUndefined()
  })

  it('does nothing when the iOS paste bubble is dismissed', async () => {
    const user = userEvent.setup()
    renderApp()
    await addByName(user, 'Jan Peeters')
    const readText = clipboardRefused()
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))

    await vi.waitFor(() => expect(readText).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(linkMessage()).toBeEmptyDOMElement()
    expect((await listPersons())[0]?.profileUrl).toBeUndefined()
  })

  it('explains when the clipboard cannot be read here', async () => {
    const user = userEvent.setup()
    renderApp()
    await addByName(user, 'Jan Peeters')
    const descriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard')
    Object.defineProperty(window.navigator, 'clipboard', { value: undefined, configurable: true })
    try {
      await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
      await vi.waitFor(() => expect(linkMessage()).toHaveTextContent(nl['link.unsupported']))
    } finally {
      if (descriptor) Object.defineProperty(window.navigator, 'clipboard', descriptor)
    }
  })

  it('shows the linked profile again when the note step comes back (B18)', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await addByName(user, 'Jan Peeters')
    clipboardHolds(JAN_URL)
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
    await screen.findByText('linkedin.com/in/jan-peeters')
    unmount()

    renderApp()
    expect(await screen.findByText('linkedin.com/in/jan-peeters')).toBeInTheDocument()
  })
})

describe('Merge with the Person that has the link (User Story 2, B21)', () => {
  async function storeJan(company?: string) {
    const jan = await createPerson({
      name: 'Jan Peeters',
      company,
      profileUrl: JAN_URL,
      searchUrl: buildSearchUrl('Jan Peeters'),
    })
    await createEncounterInContext({ personId: jan.id, note: 'eerste' })
    return jan
  }

  /** Adds "Jan Peters" (a typo, so no same-name question), types a note, pastes Jan's link. */
  async function pasteJansLinkOnTypo(user: User) {
    renderApp()
    await addByName(user, 'Jan Peters')
    await user.type(screen.getByLabelText(nl['note.label']), 'tweede')
    clipboardHolds(JAN_URL)
    await user.click(screen.getByRole('button', { name: nl['link.paste'] }))
  }

  it('asks whether to merge, naming the Person and company', async () => {
    const user = userEvent.setup()
    await storeJan('Elmos')
    await pasteJansLinkOnTypo(user)

    expect(
      await screen.findByText(
        nl['link.mergeQuestion'].replace('{name}', 'Jan Peeters').replace('{company}', 'Elmos'),
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['link.paste'] })).not.toBeInTheDocument()
  })

  it('asks without a company when there is none', async () => {
    const user = userEvent.setup()
    await storeJan()
    await pasteJansLinkOnTypo(user)
    expect(
      await screen.findByText(nl['link.mergeQuestionNoCompany'].replace('{name}', 'Jan Peeters')),
    ).toBeInTheDocument()
  })

  it('changes nothing on "Cancel"', async () => {
    const user = userEvent.setup()
    await storeJan('Elmos')
    await pasteJansLinkOnTypo(user)
    await user.click(await screen.findByRole('button', { name: nl['link.cancel'] }))

    expect(screen.getByRole('button', { name: nl['link.paste'] })).toBeInTheDocument()
    const persons = await listPersons()
    expect(persons).toHaveLength(2)
    expect(persons.find((p) => p.name === 'Jan Peters')?.profileUrl).toBeUndefined()
  })

  it('merges on "Merge" and continues the note step for the remaining Person', async () => {
    const user = userEvent.setup()
    await storeJan('Elmos')
    await pasteJansLinkOnTypo(user)
    await user.click(await screen.findByRole('button', { name: nl['link.merge'] }))

    expect(
      await screen.findByRole('heading', { name: nl['note.title'].replace('{name}', 'Jan Peeters') }),
    ).toBeInTheDocument()
    expect(linkMessage()).toHaveTextContent(nl['link.merged'].replace('{name}', 'Jan Peeters'))
    expect(screen.getByLabelText(nl['note.label'])).toHaveValue('eerste\ntweede')
    expect(screen.getByText('linkedin.com/in/jan-peeters')).toBeInTheDocument()
    expect(await listPersons()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: nl['note.save'] }))
    await screen.findByRole('button', { name: nl['start.addByName'] })
    const encounters = await db.encounters.toArray()
    expect(encounters).toHaveLength(1)
    expect(encounters[0]?.note).toBe('eerste\ntweede')
    expect((await getSettings()).noteStepEncounterId).toBeUndefined()
  })
})
