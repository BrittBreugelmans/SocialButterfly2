import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { StorageFullError } from '../data/errors'
import { addByName, findSameNamePersons, type AddByNameResult, type SameNameMatch } from '../data/repository'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { buildSearchUrl, linkedInUrlFor } from '../linkedin/links'
import { normalizeName } from '../people/nameMatch'
import { openLinkedIn } from '../platform/openExternal'
import { ContextBar } from './ContextBar'
import { SameNameQuestion } from './SameNameQuestion'

export interface SavedByName extends AddByNameResult {
  /** False when LinkedIn was not opened: blocked by iOS (research R1), or met today (B19). */
  opened: boolean
}

interface AddByNameFormProps {
  /** The active Event, undefined during casual networking, or 'loading' while it is read. */
  activeEvent: Event | undefined | 'loading'
  onSaved(result: SavedByName): void
  onBack(): void
}

/**
 * Quick mode: name + company, one tap opens LinkedIn and saves (FR-001–FR-013).
 *
 * iOS blocks opening LinkedIn after an asynchronous save (research R1), so "Search on LinkedIn"
 * is a real link: the tap opens LinkedIn itself, and the save starts in the same tap (B20).
 * The same-name check (B15) must be known before that tap, so it runs while the owner types.
 */
export function AddByNameForm({ activeEvent, onSaved, onBack }: AddByNameFormProps) {
  const { t } = useLanguage()
  const id = useId()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [checked, setChecked] = useState<{ key: string; matches: SameNameMatch[] }>()
  const [question, setQuestion] = useState<SameNameMatch[]>()
  const [saving, setSaving] = useState(false)
  // A second tap can arrive before the new state is rendered; the ref blocks it.
  const savingRef = useRef(false)

  const key = normalizeName(name)
  const blank = key === ''
  const ready = blank || checked?.key === key

  // Look up stored Persons with the same name while the owner types.
  useEffect(() => {
    if (key === '') return
    let cancelled = false
    void findSameNamePersons(key).then((matches) => {
      if (!cancelled) setChecked({ key, matches })
    })
    return () => {
      cancelled = true
    }
  }, [key])

  /** Runs one save at a time; storage full keeps the input (the F0 banner explains). */
  async function busy(work: () => Promise<void>) {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      await work()
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  /**
   * Saves, then goes to the note step. When the tap did not open LinkedIn itself (`linkOpened`
   * false), it tries to open it now; iOS may block that, and the note step offers a button.
   */
  async function save(existingPersonId: string | undefined, linkOpened: boolean) {
    const result = await addByName({ name, company, existingPersonId })
    // Already met today: no LinkedIn, straight to the note step (B19).
    const opened =
      !result.alreadyMetToday && (linkOpened || openLinkedIn(linkedInUrlFor(result.person)!))
    onSaved({ ...result, opened })
  }

  function search(event: MouseEvent<HTMLAnchorElement>) {
    if (blank || savingRef.current) {
      event.preventDefault()
      return
    }
    if (!ready) {
      // Tapped before the name check finished: check and save first (rare; research R1 fallback).
      event.preventDefault()
      void busy(async () => {
        const matches = await findSameNamePersons(name)
        if (matches.length > 0) setQuestion(matches)
        else await save(undefined, false)
      })
      return
    }
    if (checked && checked.matches.length > 0) {
      event.preventDefault()
      setQuestion(checked.matches)
      return
    }
    // No match: the link opens LinkedIn; save at the same moment.
    void busy(() => save(undefined, true))
  }

  const searchUrl = buildSearchUrl(name, company)

  if (question) {
    return (
      <SameNameQuestion
        matches={question}
        searchUrl={searchUrl}
        busy={saving}
        onPick={(match, linkOpened) => void busy(() => save(match.person.id, linkOpened))}
        onNewPerson={() => void busy(() => save(undefined, true))}
        onBack={() => setQuestion(undefined)}
      />
    )
  }

  return (
    <main className="event-form-screen">
      <h1>{t('add.title')}</h1>
      <ContextBar event={activeEvent} />
      <form className="event-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={`${id}-name`}>{t('add.name')}</label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={100}
          placeholder={t('add.namePlaceholder')}
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor={`${id}-company`}>{t('add.company')}</label>
        <input
          id={`${id}-company`}
          value={company}
          maxLength={100}
          placeholder={t('add.companyPlaceholder')}
          autoComplete="off"
          autoCapitalize="words"
          onChange={(e) => setCompany(e.target.value)}
        />

        <a
          className="button-link search-link"
          href={searchUrl}
          target="_blank"
          rel="noopener"
          aria-disabled={blank || saving}
          aria-busy={!ready}
          onClick={search}
        >
          {t('add.search')}
        </a>
        <button type="button" className="secondary" onClick={onBack}>
          {t('add.back')}
        </button>
      </form>
    </main>
  )
}
