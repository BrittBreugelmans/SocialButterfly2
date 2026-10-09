import { useId, useRef, useState, type FormEvent } from 'react'
import { StorageFullError } from '../data/errors'
import { addByName, findSameNamePersons, type AddByNameResult, type SameNameMatch } from '../data/repository'
import type { Event } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { linkedInUrlFor } from '../linkedin/links'
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

/** Quick mode: name + company, one tap saves and searches on LinkedIn (FR-001–FR-013). */
export function AddByNameForm({ activeEvent, onSaved, onBack }: AddByNameFormProps) {
  const { t } = useLanguage()
  const id = useId()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [matches, setMatches] = useState<SameNameMatch[]>()
  const [saving, setSaving] = useState(false)
  // A second tap can arrive before the disabled button is rendered; the ref blocks it.
  const savingRef = useRef(false)

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

  /** Save first, then open LinkedIn in the same tap handler (FR-009, research R1). */
  async function save(existingPersonId?: string) {
    const result = await addByName({ name, company, existingPersonId })
    // Already met today: no LinkedIn, straight to the note step (B19).
    const opened = !result.alreadyMetToday && openLinkedIn(linkedInUrlFor(result.person)!)
    onSaved({ ...result, opened })
  }

  function search(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '') return
    void busy(async () => {
      const found = await findSameNamePersons(name)
      if (found.length > 0) setMatches(found)
      else await save()
    })
  }

  if (matches) {
    return (
      <SameNameQuestion
        matches={matches}
        busy={saving}
        onPick={(personId) => void busy(() => save(personId))}
        onNewPerson={() => void busy(() => save())}
        onBack={() => setMatches(undefined)}
      />
    )
  }

  return (
    <main className="event-form-screen">
      <h1>{t('add.title')}</h1>
      <ContextBar event={activeEvent} />
      <form className="event-form" onSubmit={search}>
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

        <button type="submit" disabled={saving || name.trim() === ''}>
          {t('add.search')}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          {t('add.back')}
        </button>
      </form>
    </main>
  )
}
