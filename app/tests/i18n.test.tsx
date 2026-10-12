import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/data/db'
import { todayLocal } from '../src/data/dates'
import { getSettings, updateSettings } from '../src/data/repository'
import { en } from '../src/i18n/en'
import { GuestLanguageProvider, LanguageProvider, translate, useLanguage } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

// F1 (B13): the owner already chose today, so the App opens on the start screen.
beforeEach(async () => {
  await updateSettings({ contextChosenOn: todayLocal() })
})

/** The switch lives on the Settings tab since F10 (FR-002, FR-016). */
async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: nl['tab.settings'] }))
}

describe('language switch (FR-015, FR-016)', () => {
  it('starts in Dutch (B37)', async () => {
    renderApp()
    expect(await screen.findByText('De Sociale Vlinder')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('nl')
  })

  it('is not on the Add tab any more (F10)', async () => {
    renderApp()
    await screen.findByRole('button', { name: nl['start.addByName'] })
    expect(screen.queryByRole('button', { name: nl['app.languageEn'] })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: nl['app.languageNl'] })).not.toBeInTheDocument()
  })

  it('switches all visible text at once and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await screen.findByText(nl['storage.notPersisted'])
    await openSettings(user)

    await user.click(await screen.findByRole('button', { name: nl['app.languageEn'] }))
    expect(screen.getByRole('heading', { level: 1, name: en['settings.title'] })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en['tab.add'] })).toBeInTheDocument()
    expect(screen.getByText(en['storage.notPersisted'])).toBeInTheDocument()
    expect(screen.queryByText(nl['backup.title'])).not.toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    await waitFor(async () => expect((await getSettings()).language).toBe('en'))

    unmount()
    renderApp()
    expect(await screen.findByText('The Social Butterfly')).toBeInTheDocument()
  })

  it('keeps the chosen language and shows the storage.full banner when saving fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(db.settings, 'put').mockRejectedValue(new DOMException('full', 'QuotaExceededError'))
    renderApp()
    await screen.findByText(nl['storage.notPersisted'])
    await openSettings(user)

    await user.click(await screen.findByRole('button', { name: nl['app.languageEn'] }))
    expect(await screen.findByText(en['storage.full'])).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: en['settings.title'] })).toBeInTheDocument()
  })
})

describe('translate (F3 research R3)', () => {
  it('looks up a key and fills in parameters', () => {
    expect(translate('nl', 'guest.done')).toBe(nl['guest.done'])
    expect(translate('en', 'same.lastMet', { date: 'x' })).toBe('Last met: x')
  })
})

describe('GuestLanguageProvider (F3 FR-015, FR-016)', () => {
  function Probe({ id }: { id: string }) {
    const { language, setLanguage, t } = useLanguage()
    return (
      <div data-testid={id} data-language={language}>
        <span>{`${id}: ${t('guest.done')}`}</span>
        <button type="button" onClick={() => void setLanguage('en')}>
          {`${id} to EN`}
        </button>
      </div>
    )
  }

  function renderBoth(showGuest = true) {
    return render(
      <LanguageProvider>
        <Probe id="owner" />
        {showGuest && (
          <GuestLanguageProvider>
            <Probe id="guest" />
          </GuestLanguageProvider>
        )}
      </LanguageProvider>,
    )
  }

  it('starts at the app language', async () => {
    await updateSettings({ language: 'en' })
    renderBoth()
    await waitFor(() => expect(screen.getByTestId('guest')).toHaveAttribute('data-language', 'en'))
  })

  it('switches only the guest, never the app setting', async () => {
    const user = userEvent.setup()
    renderBoth()
    await user.click(screen.getByRole('button', { name: 'guest to EN' }))
    expect(screen.getByText(`guest: ${en['guest.done']}`)).toBeInTheDocument()
    expect(screen.getByText(`owner: ${nl['guest.done']}`)).toBeInTheDocument()
    expect((await getSettings()).language).toBe('nl')
    expect(document.documentElement.lang).toBe('en')
  })

  it('gives the page language back on unmount', async () => {
    const user = userEvent.setup()
    const { rerender } = renderBoth()
    await user.click(screen.getByRole('button', { name: 'guest to EN' }))
    act(() => {
      rerender(
        <LanguageProvider>
          <Probe id="owner" />
        </LanguageProvider>,
      )
    })
    expect(document.documentElement.lang).toBe('nl')
  })
})
