import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import { createEncounter, createEvent, createPerson, updateSettings } from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=Jan'

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

/** An Event that ended yesterday, with one Encounter and no backup yet (T10). */
async function seedEndedEvent() {
  const yesterday = addDaysLocal(todayLocal(), -1)
  const devoxx = await createEvent({ name: 'Devoxx', startDate: addDaysLocal(yesterday, -2), endDate: yesterday })
  const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH_URL })
  await createEncounter({ personId: jan.id, eventId: devoxx.id, date: yesterday })
}

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

const reminder = () => screen.findByText(nl['reminder.text'])

describe('Backup reminder on the Add tab (F10 US2)', () => {
  it('appears the day after an Event, with "Make backup" and "Later"', async () => {
    await seedEndedEvent()
    renderApp()
    const banner = (await reminder()).closest('[role="status"]') as HTMLElement
    expect(banner).not.toBeNull()
    expect(within(banner).getByRole('button', { name: nl['reminder.make'] })).toBeInTheDocument()
    expect(within(banner).getByRole('button', { name: nl['reminder.later'] })).toBeInTheDocument()
  })

  it('"Later" hides it for the rest of the day, also after reopening', async () => {
    await seedEndedEvent()
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await reminder()
    await user.click(screen.getByRole('button', { name: nl['reminder.later'] }))
    await waitFor(() => expect(screen.queryByText(nl['reminder.text'])).not.toBeInTheDocument())

    unmount()
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })
    // Give the backup hook time to prepare: the banner must still not come.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText(nl['reminder.text'])).not.toBeInTheDocument()
  })

  it('"Make backup" shares the file and hides the reminder', async () => {
    await seedEndedEvent()
    const user = userEvent.setup()
    renderApp()
    await reminder()
    await user.click(screen.getByRole('button', { name: nl['reminder.make'] }))
    expect(share).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByText(nl['reminder.text'])).not.toBeInTheDocument())
  })

  it('keeps the reminder and shows a message when the backup fails', async () => {
    share.mockRejectedValue(new DOMException('no tap', 'NotAllowedError'))
    await seedEndedEvent()
    const user = userEvent.setup()
    renderApp()
    await reminder()
    await user.click(screen.getByRole('button', { name: nl['reminder.make'] }))
    expect(await screen.findByText(nl['backup.failed'])).toBeInTheDocument()
    expect(screen.getByText(nl['reminder.text'])).toBeInTheDocument()
  })

  it('does not appear while the Event still runs', async () => {
    const today = todayLocal()
    const devoxx = await createEvent({ name: 'Devoxx', startDate: today, endDate: addDaysLocal(today, 1) })
    const jan = await createPerson({ name: 'Jan Peeters', searchUrl: SEARCH_URL })
    await createEncounter({ personId: jan.id, eventId: devoxx.id, date: today })
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText(nl['reminder.text'])).not.toBeInTheDocument()
  })

  it('is not shown in the add-by-name form', async () => {
    await seedEndedEvent()
    const user = userEvent.setup()
    renderApp()
    await reminder()
    await user.click(screen.getByRole('button', { name: nl['start.addByName'] }))
    expect(await screen.findByLabelText(nl['add.name'])).toBeInTheDocument()
    expect(screen.queryByText(nl['reminder.text'])).not.toBeInTheDocument()
  })
})
