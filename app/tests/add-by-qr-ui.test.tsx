import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import {
  createEncounter,
  createEncounterInContext,
  createPerson,
  getPerson,
  listPersons,
  updateSettings,
} from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { CameraError, startQrScanner } from '../src/platform/camera'

// The real camera only runs on the iPhone; here a test "shows" a code itself.
vi.mock(import('../src/platform/camera'), async (original) => ({
  ...(await original()),
  startQrScanner: vi.fn(),
}))
const scanner = vi.mocked(startQrScanner)

const JAN_URL = 'https://www.linkedin.com/in/jan-peeters'

// jsdom cannot follow links; stop it after React has handled the tap. Links only.
const stopNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest('a')) event.preventDefault()
}

beforeEach(async () => {
  scanner.mockReset()
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

/** A camera that reads whatever the test shows it. */
function fakeCamera() {
  let onCode: ((text: string) => void) | undefined
  const stop = vi.fn()
  scanner.mockImplementation(async (_video, callback) => {
    onCode = callback
    return stop
  })
  return {
    stop,
    show: (text: string) => act(() => onCode?.(text)),
  }
}

async function openScanner(user: User) {
  await user.click(await screen.findByRole('button', { name: nl['start.scanQr'] }))
  await vi.waitFor(() => expect(scanner).toHaveBeenCalled())
}

function noteTitle(name: string) {
  return nl['note.title'].replace('{name}', name)
}

/** The "Save and open LinkedIn" link, once the same-name check is done. */
async function saveLink() {
  const link = await screen.findByRole('link', { name: nl['qr.save'] })
  await vi.waitFor(() => expect(link).toHaveAttribute('aria-busy', 'false'))
  return link
}

describe('Scan a new person (User Story 1)', () => {
  it('opens the camera from the start screen', async () => {
    const user = userEvent.setup()
    fakeCamera()
    renderApp()
    await openScanner(user)
    expect(screen.getByRole('heading', { name: nl['qr.title'] })).toBeInTheDocument()
    expect(scanner).toHaveBeenCalledTimes(1)
  })

  it('stops the camera and shows the derived name, an empty company and the link', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show('https://www.linkedin.com/in/jan-peeters-1a2b3c?utm_source=share')

    expect(await screen.findByRole('heading', { name: nl['qr.confirmTitle'] })).toBeInTheDocument()
    expect(camera.stop).toHaveBeenCalled()
    expect(screen.getByLabelText(nl['add.name'])).toHaveValue('Jan Peeters')
    expect(screen.getByLabelText(nl['add.company'])).toHaveValue('')
    expect(screen.getByText('linkedin.com/in/jan-peeters-1a2b3c')).toBeInTheDocument()
    const save = await saveLink()
    expect(save).toHaveAttribute('href', 'https://www.linkedin.com/in/jan-peeters-1a2b3c')
    expect(save).toHaveAttribute('target', '_blank')
  })

  it('cannot save without a name', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.clear(await screen.findByLabelText(nl['add.name']))
    const save = screen.getByRole('link', { name: nl['qr.save'] })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    await user.click(save)
    expect(await db.persons.count()).toBe(0)
  })

  it('saves the Person with link and company and shows the note step', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.type(await screen.findByLabelText(nl['add.company']), 'Elmos')
    await user.click(await saveLink())

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(screen.getByText(nl['link.linked'])).toBeInTheDocument()
    const [jan] = await listPersons()
    expect(jan).toMatchObject({ name: 'Jan Peeters', company: 'Elmos', profileUrl: JAN_URL })
    expect(await db.encounters.count()).toBe(1)
  })

  it('goes back without saving, from the scan screen and from the confirmation', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await user.click(screen.getByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('button', { name: nl['start.scanQr'] })).toBeInTheDocument()
    expect(camera.stop).toHaveBeenCalled()

    await openScanner(user)
    await camera.show(JAN_URL)
    await user.click(await screen.findByRole('button', { name: nl['add.back'] }))
    expect(await screen.findByRole('button', { name: nl['start.scanQr'] })).toBeInTheDocument()
    expect(await db.persons.count()).toBe(0)
  })

  it('scans again from the confirmation', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.click(await screen.findByRole('button', { name: nl['qr.scanAgain'] }))
    await vi.waitFor(() => expect(scanner).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('heading', { name: nl['qr.title'] })).toBeInTheDocument()
  })
})

describe('Recognise someone already stored (User Story 2)', () => {
  it('reuses the Person with this link and shows name and company as text (B8)', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    const jan = await createPerson({ name: 'Jan Peeters', company: 'Elmos', profileUrl: JAN_URL })
    await createEncounter({ personId: jan.id, date: '2026-09-01' })
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)

    expect(await screen.findByText(nl['qr.known'].replace('{name}', 'Jan Peeters'))).toBeInTheDocument()
    expect(screen.queryByLabelText(nl['add.name'])).not.toBeInTheDocument()
    expect(screen.getByText(/Elmos/)).toBeInTheDocument()
    await user.click(await saveLink())

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(1)
    expect(await db.encounters.count()).toBe(2)
  })

  it('goes to the note without LinkedIn when already met today (B19)', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    const open = vi.spyOn(window, 'open')
    const jan = await createPerson({ name: 'Jan Peeters', profileUrl: JAN_URL })
    await createEncounterInContext({ personId: jan.id })
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)

    expect(screen.queryByRole('link', { name: nl['qr.save'] })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: nl['qr.saveMetToday'] }))
    expect(await screen.findByText(nl['note.alreadyMet'].replace('{name}', 'Jan Peeters'))).toBeInTheDocument()
    expect(await db.encounters.count()).toBe(1)
    expect(open).not.toHaveBeenCalled()
  })

  it('asks "Is this the same person?" for a same-name Person without a link (B15)', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jan' })
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.click(await saveLink())

    expect(await screen.findByRole('heading', { name: nl['same.title'] })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: nl['same.newPerson'] })).toHaveAttribute('href', JAN_URL)
    const match = screen.getByRole('link', { name: /Jan Peeters/ })
    expect(match).toHaveAttribute('href', JAN_URL)
    await user.click(match)

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(1)
    expect((await getPerson(jan.id))?.profileUrl).toBe(JAN_URL)
  })

  it('saves a new Person on "No, new person"', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    await createPerson({ name: 'Jan Peeters', searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jan' })
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.click(await saveLink())
    await user.click(await screen.findByRole('link', { name: nl['same.newPerson'] }))

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(2)
  })

  it('does not ask for a same-name Person that has another link', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    await createPerson({ name: 'Jan Peeters', profileUrl: 'https://www.linkedin.com/in/other-jan' })
    renderApp()
    await openScanner(user)
    await camera.show(JAN_URL)
    await user.click(await saveLink())

    await screen.findByRole('heading', { name: noteTitle('Jan Peeters') })
    expect(await db.persons.count()).toBe(2)
  })
})

describe('Wrong code or no camera (User Story 3)', () => {
  function qrMessage() {
    return document.querySelector('.qr-message')
  }

  it('refuses a code that is not a LinkedIn profile and keeps scanning', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show('https://example.com')

    expect(qrMessage()).toHaveTextContent(nl['qr.notProfile'])
    expect(camera.stop).not.toHaveBeenCalled()
    expect(await db.persons.count()).toBe(0)

    await camera.show(JAN_URL)
    expect(await screen.findByRole('heading', { name: nl['qr.confirmTitle'] })).toBeInTheDocument()
  })

  it('refuses a short lnkd.in link', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await camera.show('https://lnkd.in/abc')
    expect(qrMessage()).toHaveTextContent(nl['qr.shortLink'])
  })

  it('explains a refused camera and offers "Add by name"', async () => {
    const user = userEvent.setup()
    scanner.mockRejectedValue(new CameraError('denied'))
    renderApp()
    await openScanner(user)

    expect(await screen.findByText(nl['qr.cameraDenied'])).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: nl['start.addByName'] }))
    expect(await screen.findByRole('heading', { name: nl['add.title'] })).toBeInTheDocument()
  })

  it('explains a missing camera', async () => {
    const user = userEvent.setup()
    scanner.mockRejectedValue(new CameraError('unavailable'))
    renderApp()
    await openScanner(user)
    expect(await screen.findByText(nl['qr.cameraUnavailable'])).toBeInTheDocument()
  })

  it('stops the camera when the app goes to the background', async () => {
    const user = userEvent.setup()
    const camera = fakeCamera()
    renderApp()
    await openScanner(user)
    await vi.waitFor(() => expect(scanner).toHaveBeenCalled())

    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(camera.stop).toHaveBeenCalled()
    visibility.mockRestore()
  })
})
