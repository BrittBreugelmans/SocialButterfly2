import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { db } from '../src/data/db'
import { getSettings } from '../src/data/repository'
import { en } from '../src/i18n/en'
import { LanguageProvider } from '../src/i18n/LanguageProvider'
import { nl } from '../src/i18n/nl'

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

describe('language switch (FR-015, FR-016)', () => {
  it('starts in Dutch', async () => {
    renderApp()
    expect(await screen.findByText('De Sociale Vlinder')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('nl')
  })

  it('switches all visible text at once and remembers the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = renderApp()
    await screen.findByText(nl['storage.notPersisted'])

    await user.click(screen.getByRole('button', { name: nl['app.languageEn'] }))
    expect(screen.getByText('The Social Butterfly')).toBeInTheDocument()
    expect(screen.getByText(en['storage.notPersisted'])).toBeInTheDocument()
    expect(screen.queryByText(nl['app.title'])).not.toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: nl['app.languageEn'] }))
    expect(await screen.findByText(en['storage.full'])).toBeInTheDocument()
    expect(screen.getByText('The Social Butterfly')).toBeInTheDocument()
  })
})
