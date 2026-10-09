import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import { db } from '../src/data/db'
import { chooseContext, createEvent, getSettings, updateSettings } from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'
import { NewEventForm } from '../src/ui/NewEventForm'

// "Today" in these tests is Friday 9 October 2026, 10:00 local time.
const TODAY = '2026-10-09'
const YESTERDAY = '2026-10-08'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 9, 10, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

describe('NewEventForm (User Story 1)', () => {
  function renderForm() {
    const onSaved = vi.fn()
    const onBack = vi.fn()
    render(
      <LanguageProvider>
        <NewEventForm onSaved={onSaved} onBack={onBack} />
      </LanguageProvider>,
    )
    return { onSaved, onBack }
  }

  it('suggests today for both dates and does not allow an earlier end date', () => {
    renderForm()
    const start = screen.getByLabelText(nl['event.startDate'])
    const end = screen.getByLabelText(nl['event.endDate'])
    expect(start).toHaveValue(TODAY)
    expect(end).toHaveValue(TODAY)
    expect(end).toHaveAttribute('min', TODAY)
  })

  it('keeps Save disabled while the name is empty', async () => {
    const user = userEvent.setup()
    renderForm()
    const save = screen.getByRole('button', { name: nl['event.save'] })
    expect(save).toBeDisabled()
    await user.type(screen.getByLabelText(nl['event.name']), '   ')
    expect(save).toBeDisabled()
  })

  it('moves the end date along when the start date passes it', () => {
    renderForm()
    const later = addDaysLocal(TODAY, 3)
    fireEvent.change(screen.getByLabelText(nl['event.startDate']), { target: { value: later } })
    expect(screen.getByLabelText(nl['event.endDate'])).toHaveValue(later)
  })

  it('saves the Event and makes it active', async () => {
    const user = userEvent.setup()
    const { onSaved } = renderForm()
    await user.type(screen.getByLabelText(nl['event.name']), 'Devoxx 2026')
    await user.click(screen.getByRole('button', { name: nl['event.save'] }))

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    const saved = onSaved.mock.calls[0]?.[0] as { id: string; name: string }
    expect(saved.name).toBe('Devoxx 2026')
    expect((await getSettings()).activeEventId).toBe(saved.id)
  })

  it('goes back without saving', async () => {
    const user = userEvent.setup()
    const { onBack } = renderForm()
    await user.click(screen.getByRole('button', { name: nl['event.back'] }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(await db.events.count()).toBe(0)
  })
})

describe('daily choice (User Story 2, FR-005)', () => {
  it('asks the very first time, with only "New event" and "Casual networking" when there are no Events', async () => {
    renderApp()
    expect(await screen.findByText(nl['choice.title'])).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['choice.newEvent'] })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: nl['choice.casual'] })).toBeInTheDocument()
    expect(screen.queryByText(nl['choice.current'])).not.toBeInTheDocument()
    expect(screen.queryByText(nl['choice.past'])).not.toBeInTheDocument()
  })

  it('opens the start screen after choosing casual networking, and does not ask again today', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await user.click(await screen.findByRole('button', { name: nl['choice.casual'] }))
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()

    unmount()
    renderApp()
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()
    expect(screen.queryByText(nl['choice.title'])).not.toBeInTheDocument()
  })

  it("offers yesterday's Event on top when it is still running", async () => {
    const user = userEvent.setup()
    const devoxx = await createEvent({ name: 'Devoxx', startDate: YESTERDAY, endDate: addDaysLocal(TODAY, 1) })
    await updateSettings({ activeEventId: devoxx.id, contextChosenOn: YESTERDAY })

    renderApp()
    await screen.findByText(nl['choice.title'])
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent('Verder met Devoxx')

    await user.click(buttons[0]!)
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()
  })

  it('lists an ended Event under "Past" without a continue button', async () => {
    const ended = await createEvent({ name: 'Old fair', startDate: '2026-10-01', endDate: '2026-10-05' })
    await updateSettings({ activeEventId: ended.id, contextChosenOn: '2026-10-05' })

    renderApp()
    await screen.findByText(nl['choice.title'])
    expect(screen.getByText(nl['choice.past'])).toBeInTheDocument()
    expect(screen.getByText('Old fair')).toBeInTheDocument()
    expect(screen.queryByText(/Verder met/)).not.toBeInTheDocument()
  })

  it('asks again when the app comes back to the foreground on a new day', async () => {
    await chooseContext(undefined)
    renderApp()
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()

    vi.setSystemTime(new Date(2026, 9, 10, 8, 0))
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(await screen.findByText(nl['choice.title'])).toBeInTheDocument()
  })

  it('goes from "New event" through the form to the start screen', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['choice.newEvent'] }))
    await user.type(screen.getByLabelText(nl['event.name']), 'Devoxx 2026')
    await user.click(screen.getByRole('button', { name: nl['event.save'] }))
    expect(await screen.findByText(nl['app.title'])).toBeInTheDocument()
    expect(screen.getByText('Devoxx 2026')).toBeInTheDocument()
  })
})

describe('context bar (User Story 3, FR-008)', () => {
  it('shows the active Event with its dates', async () => {
    const devoxx = await createEvent({ name: 'Devoxx', startDate: TODAY, endDate: addDaysLocal(TODAY, 2) })
    await chooseContext(devoxx.id)
    renderApp()
    const bar = await screen.findByRole('button', { name: nl['context.change'] })
    expect(bar).toHaveTextContent(nl['context.at'])
    expect(bar).toHaveTextContent('Devoxx')
    expect(bar).toHaveTextContent('2026')
  })

  it('shows casual networking, opens the choice on tap, and remembers casual', async () => {
    const user = userEvent.setup()
    await chooseContext(undefined)
    const { unmount } = renderApp()
    const bar = await screen.findByRole('button', { name: nl['context.change'] })
    expect(bar).toHaveTextContent(nl['context.casual'])

    await user.click(bar)
    expect(await screen.findByText(nl['choice.title'])).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: nl['choice.casual'] }))

    unmount()
    renderApp()
    expect(await screen.findByRole('button', { name: nl['context.change'] })).toHaveTextContent(
      nl['context.casual'],
    )
    expect(todayLocal()).toBe(TODAY)
  })
})
