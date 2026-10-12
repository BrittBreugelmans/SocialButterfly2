import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import {
  countData,
  createEncounter,
  createEvent,
  createPerson,
  getSettings,
  listEvents,
  setOwnerProfileUrl,
  updateSettings,
} from '../src/data/repository'
import { formatDateRange } from '../src/events/formatDateRange'
import { en } from '../src/i18n/en'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

function defineNavigator(name: 'share' | 'canShare', value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true })
}

let share: ReturnType<typeof vi.fn>

beforeEach(async () => {
  await updateSettings({ contextChosenOn: todayLocal() })
  share = vi.fn().mockResolvedValue(undefined)
  defineNavigator('canShare', vi.fn().mockReturnValue(true))
  defineNavigator('share', share)
})

afterEach(() => {
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
})

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

async function openSettings() {
  const user = userEvent.setup()
  renderApp()
  await user.click(await screen.findByRole('button', { name: nl['tab.settings'] }))
  await screen.findByRole('heading', { level: 1, name: nl['settings.title'] })
  return user
}

async function backupButton() {
  const button = screen.getByRole('button', { name: nl['backup.make'] })
  await waitFor(() => expect(button).toBeEnabled())
  return button
}

describe('Settings: CSV backup (F10 US1)', () => {
  it('shows the backup button and that no backup was made yet', async () => {
    await openSettings()
    expect(screen.getByRole('button', { name: nl['backup.make'] })).toBeInTheDocument()
    expect(screen.getByText(nl['backup.never'])).toBeInTheDocument()
  })

  it('shows "saved" and the time of the last backup after a share', async () => {
    const user = await openSettings()
    await user.click(await backupButton())
    expect(await screen.findByText(nl['backup.done'])).toBeInTheDocument()
    const last = await screen.findByText((text) => text.startsWith('Laatste back-up:'))
    expect(last.textContent).toContain(String(new Date().getFullYear()))
    expect(screen.queryByText(nl['backup.never'])).not.toBeInTheDocument()
    expect(share).toHaveBeenCalledTimes(1)
  })

  it('shows nothing when the share sheet is closed', async () => {
    share.mockRejectedValue(new DOMException('closed', 'AbortError'))
    const user = await openSettings()
    await user.click(await backupButton())
    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(screen.queryByText(nl['backup.done'])).not.toBeInTheDocument()
    expect(screen.queryByText(nl['backup.failed'])).not.toBeInTheDocument()
    expect(screen.getByText(nl['backup.never'])).toBeInTheDocument()
  })

  it('shows a message when the backup fails', async () => {
    share.mockRejectedValue(new DOMException('no tap', 'NotAllowedError'))
    const user = await openSettings()
    await user.click(await backupButton())
    expect(await screen.findByText(nl['backup.failed'])).toBeInTheDocument()
  })
})

const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=x'

/** Devoxx: running today, active, 2 Encounters. Techorama: last month, no Encounters. */
async function seedEvents() {
  const today = todayLocal()
  const devoxx = await createEvent({ name: 'Devoxx', startDate: today, endDate: addDaysLocal(today, 1) })
  const techorama = await createEvent({
    name: 'Techorama',
    startDate: addDaysLocal(today, -40),
    endDate: addDaysLocal(today, -39),
  })
  for (const name of ['Jan Peeters', 'An Smet']) {
    const person = await createPerson({ name, searchUrl: SEARCH_URL })
    await createEncounter({ personId: person.id, eventId: devoxx.id, date: today, note: `met ${name}` })
  }
  await updateSettings({ activeEventId: devoxx.id })
  return { devoxx, techorama }
}

const eventRow = (name: RegExp) => screen.findByRole('button', { name })

describe('Settings: manage Events (F10 US3)', () => {
  it('lists every Event with dates, encounter count and the active mark', async () => {
    const { devoxx, techorama } = await seedEvents()
    await openSettings()
    const devoxxRow = await eventRow(/^Devoxx/)
    expect(devoxxRow).toHaveTextContent(formatDateRange(devoxx.startDate, devoxx.endDate, 'nl'))
    expect(devoxxRow).toHaveTextContent(nl['settings.encounterCountMany'].replace('{count}', '2'))
    expect(devoxxRow).toHaveTextContent(nl['settings.eventActive'])
    const techoramaRow = await eventRow(/^Techorama/)
    expect(techoramaRow).toHaveTextContent(formatDateRange(techorama.startDate, techorama.endDate, 'nl'))
    expect(techoramaRow).not.toHaveTextContent(nl['settings.eventActive'])
    expect(screen.getAllByText(nl['settings.eventActive'])).toHaveLength(1)
  })

  it('says so when there are no Events', async () => {
    await openSettings()
    expect(await screen.findByText(nl['settings.eventsEmpty'])).toBeInTheDocument()
  })

  it('renames an Event, and the context bar on Add shows the new name (research R8)', async () => {
    await seedEvents()
    const user = await openSettings()
    await user.click(await eventRow(/^Devoxx/))
    expect(screen.getByRole('heading', { name: nl['event.editTitle'] })).toBeInTheDocument()
    const name = screen.getByLabelText(nl['event.name'])
    expect(name).toHaveValue('Devoxx')

    await user.clear(name)
    await user.type(name, 'Devoxx BE')
    await user.click(screen.getByRole('button', { name: nl['event.saveChanges'] }))
    expect(await eventRow(/^Devoxx BE/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['tab.add'] }))
    const bar = await screen.findByRole('button', { name: nl['context.change'] })
    await waitFor(() => expect(bar).toHaveTextContent('Devoxx BE'))
  })

  it('cannot save an empty name', async () => {
    await seedEvents()
    const user = await openSettings()
    await user.click(await eventRow(/^Devoxx/))
    await user.clear(screen.getByLabelText(nl['event.name']))
    expect(screen.getByRole('button', { name: nl['event.saveChanges'] })).toBeDisabled()
    expect((await listEvents()).map((e) => e.name)).toContain('Devoxx')
  })

  it('moves the end date along when the start date passes it', async () => {
    await seedEvents()
    const user = await openSettings()
    await user.click(await eventRow(/^Techorama/))
    fireEvent.change(screen.getByLabelText(nl['event.startDate']), { target: { value: '2030-01-05' } })
    expect(screen.getByLabelText(nl['event.endDate'])).toHaveValue('2030-01-05')
  })

  it('deletes an Event and keeps its Encounters without an Event (B38)', async () => {
    await seedEvents()
    const user = await openSettings()
    await user.click(await eventRow(/^Devoxx/))
    await user.click(screen.getByRole('button', { name: nl['event.delete'] }))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent(nl['event.deleteQuestion'].replace('{name}', 'Devoxx'))
    expect(dialog).toHaveTextContent(nl['event.deleteKeepsMany'].replace('{count}', '2'))

    // Cancel keeps it.
    await user.click(within(dialog).getByRole('button', { name: nl['link.cancel'] }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect((await listEvents()).map((e) => e.name)).toContain('Devoxx')

    await user.click(screen.getByRole('button', { name: nl['event.delete'] }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: nl['event.deleteConfirm'] }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Devoxx/ })).not.toBeInTheDocument())
    expect(await eventRow(/^Techorama/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['tab.contacts'] }))
    await user.selectOptions(await screen.findByLabelText(nl['contacts.show']), nl['contacts.casual'])
    expect(await screen.findByText('Jan Peeters')).toBeInTheDocument()
    expect(screen.getByText('An Smet')).toBeInTheDocument()
  })

  it('asks without the "keeps" line for an Event without Encounters (US3 scenario 4)', async () => {
    await seedEvents()
    const user = await openSettings()
    await user.click(await eventRow(/^Techorama/))
    await user.click(screen.getByRole('button', { name: nl['event.delete'] }))
    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveTextContent(nl['event.deleteQuestion'].replace('{name}', 'Techorama'))
    expect(dialog).not.toHaveTextContent('blijft bewaard')
    expect(dialog).not.toHaveTextContent('blijven bewaard')
  })
})

describe('Settings: delete all data (F10 US5, B41)', () => {
  async function openPanel() {
    await seedEvents()
    await setOwnerProfileUrl('https://www.linkedin.com/in/britt-breugelmans')
    const user = await openSettings()
    await user.click(screen.getByRole('button', { name: nl['deleteAll.button'] }))
    const panel = await screen.findByRole('alertdialog')
    return { user, panel }
  }

  const word = () => screen.getByLabelText(nl['deleteAll.typeWord'].replace('{word}', nl['deleteAll.word']))
  const confirm = () => screen.getByRole('button', { name: nl['deleteAll.confirm'] })

  it('shows the counts, and the button stays disabled until the word is typed', async () => {
    const { user, panel } = await openPanel()
    expect(panel).toHaveTextContent(nl['deleteAll.question'])
    await waitFor(() =>
      expect(panel).toHaveTextContent(
        nl['deleteAll.counts'].replace('{persons}', '2').replace('{encounters}', '2').replace('{events}', '2'),
      ),
    )
    expect(confirm()).toBeDisabled()

    for (const typed of ['wissen', '  WISSEN ', 'Wissen']) {
      await user.clear(word())
      await user.type(word(), typed)
      expect(confirm()).toBeEnabled()
    }
    for (const typed of ['WISSE', 'DELETE']) {
      await user.clear(word())
      await user.type(word(), typed)
      expect(confirm()).toBeDisabled()
    }
  })

  it('cancels without deleting anything', async () => {
    const { user, panel } = await openPanel()
    await user.type(word(), 'wissen')
    await user.click(within(panel).getByRole('button', { name: nl['link.cancel'] }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(await countData()).toEqual({ persons: 2, encounters: 2, events: 2 })
  })

  it('offers a backup first and stays open', async () => {
    const { user, panel } = await openPanel()
    await user.click(within(panel).getByRole('button', { name: nl['deleteAll.backupFirst'] }))
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
    expect(await within(panel).findByText(nl['backup.done'])).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('deletes everything and starts over with the daily choice, in the same language', async () => {
    const { user } = await openPanel()
    await user.type(word(), 'wissen')
    await user.click(confirm())

    expect(await screen.findByRole('heading', { name: nl['choice.title'] })).toBeInTheDocument()
    expect(await countData()).toEqual({ persons: 0, encounters: 0, events: 0 })
    expect((await getSettings()).ownerProfileUrl).toBeUndefined()
    expect(document.documentElement.lang).toBe('nl')

    // Choose casual networking, then look around: everything is empty.
    await user.click(screen.getByRole('button', { name: nl['choice.casual'] }))
    await user.click(await screen.findByRole('button', { name: nl['tab.myQr'] }))
    expect(await screen.findByRole('heading', { name: nl['myQr.setupTitle'] })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['tab.actions'] })).not.toHaveAttribute('aria-label')
  })

  it('uses the English word in English', async () => {
    await updateSettings({ language: 'en' })
    await seedEvents()
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: en['tab.settings'] }))
    await user.click(await screen.findByRole('button', { name: en['deleteAll.button'] }))
    await user.type(await screen.findByLabelText(en['deleteAll.typeWord'].replace('{word}', 'DELETE')), 'delete')
    expect(screen.getByRole('button', { name: en['deleteAll.confirm'] })).toBeEnabled()
  })
})
