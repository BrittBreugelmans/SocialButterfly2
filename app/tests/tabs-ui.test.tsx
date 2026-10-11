import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { addDaysLocal, todayLocal } from '../src/data/dates'
import { updateSettings } from '../src/data/repository'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

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

const tabBar = () => screen.queryByRole('navigation', { name: nl['tabs.label'] })
const tabButton = (key: 'tab.add' | 'tab.contacts' | 'tab.actions' | 'tab.myQr' | 'tab.settings') =>
  screen.getByRole('button', { name: nl[key] })

describe('Tab bar (F7 FR-001–FR-001c)', () => {
  it('opens on the Add tab', async () => {
    renderApp()
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(tabBar()).toBeInTheDocument()
    expect(tabButton('tab.add')).toHaveAttribute('aria-current', 'page')
    expect(tabButton('tab.contacts')).not.toHaveAttribute('aria-current')
  })

  it('shows "coming soon" on My QR and Settings, and the built tabs otherwise', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })

    for (const [tab, text] of [
      ['tab.myQr', 'soon.myQr'],
      ['tab.settings', 'soon.settings'],
    ] as const) {
      await user.click(tabButton(tab))
      expect(screen.getByRole('heading', { name: nl['soon.title'] })).toBeInTheDocument()
      expect(screen.getByText(nl[text])).toBeInTheDocument()
      expect(tabButton(tab)).toHaveAttribute('aria-current', 'page')
    }

    await user.click(tabButton('tab.contacts'))
    expect(await screen.findByRole('heading', { name: nl['contacts.title'] })).toBeInTheDocument()

    await user.click(tabButton('tab.actions'))
    expect(await screen.findByRole('heading', { name: nl['actions.title'] })).toBeInTheDocument()
  })

  it('hides the tab bar in the add flow and the note step, and returns to Add afterwards', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(await screen.findByRole('button', { name: nl['start.addByName'] }))
    expect(tabBar()).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(nl['add.name']), 'Jan Peeters')
    const search = screen.getByRole('link', { name: nl['add.search'] })
    await vi.waitFor(() => expect(search).toHaveAttribute('aria-busy', 'false'))
    await user.click(search)
    await screen.findByRole('heading', { name: nl['note.title'].replace('{name}', 'Jan Peeters') })
    expect(tabBar()).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: nl['note.skip'] }))
    expect(await screen.findByRole('button', { name: nl['start.addByName'] })).toBeInTheDocument()
    expect(tabButton('tab.add')).toHaveAttribute('aria-current', 'page')
  })

  it('hides the tab bar on the daily choice', async () => {
    await updateSettings({ contextChosenOn: addDaysLocal(todayLocal(), -1) })
    renderApp()
    expect(await screen.findByRole('heading', { name: nl['choice.title'] })).toBeInTheDocument()
    expect(tabBar()).not.toBeInTheDocument()
  })
})
