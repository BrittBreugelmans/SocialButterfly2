import { useCallback, useEffect, useState } from 'react'
import { EventInUseError, StorageFullError } from '../data/errors'
import {
  countEncountersSince,
  createEncounter,
  createEvent,
  createPerson,
  deleteEvent,
  deletePerson,
  listEvents,
  listPersons,
} from '../data/repository'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'
import type { StorageStatus } from '../platform/persistence'

// Test records are recognisable by this prefix, so they can be removed again.
const TEST_PREFIX = '[test] '

/** Today's local date as YYYY-MM-DD, plus an optional number of days. */
function localIsoDate(addDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + addDays)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

async function addTestData(): Promise<void> {
  const today = localIsoDate()
  const oneDay = await createEvent({ name: `${TEST_PREFIX}One-day`, startDate: today, endDate: today })
  const multiDay = await createEvent({
    name: `${TEST_PREFIX}Multi-day`,
    startDate: today,
    endDate: localIsoDate(2),
  })
  const person = await createPerson({
    name: `${TEST_PREFIX}Vlinder`,
    searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=test',
  })
  await createEncounter({ personId: person.id, eventId: oneDay.id, date: today })
  await createEncounter({ personId: person.id, eventId: multiDay.id, date: today })
  await createEncounter({ personId: person.id, date: today }) // casual networking
}

async function removeTestData(): Promise<void> {
  for (const person of await listPersons()) {
    if (person.name.startsWith(TEST_PREFIX)) await deletePerson(person.id) // Encounters cascade
  }
  for (const event of await listEvents()) {
    if (!event.name.startsWith(TEST_PREFIX)) continue
    try {
      await deleteEvent(event.id)
    } catch (error) {
      // An Event that real Encounters still use stays (no silent loss).
      if (!(error instanceof EventInUseError)) throw error
    }
  }
}

const STATUS_KEYS: Record<StorageStatus | 'checking', TextKey> = {
  checking: 'diagnostics.storageChecking',
  persisted: 'diagnostics.storagePersisted',
  'not-persisted': 'diagnostics.storageNotPersisted',
  unsupported: 'diagnostics.storageUnsupported',
}

interface DiagnosticsProps {
  storageStatus: StorageStatus | 'checking'
  onClose(): void
}

/** Storage status, counts and test data (plan "Complexity Tracking"). Shows counts only, never names. */
export function Diagnostics({ storageStatus, onClose }: DiagnosticsProps) {
  const { t } = useLanguage()
  const [counts, setCounts] = useState<{ persons: number; encounters: number; events: number }>()
  const [busy, setBusy] = useState(false)
  const [storageFull, setStorageFull] = useState(false)

  const refresh = useCallback(async () => {
    const [persons, encounters, events] = await Promise.all([
      listPersons(),
      countEncountersSince(undefined),
      listEvents(),
    ])
    setCounts({ persons: persons.length, encounters, events: events.length })
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setStorageFull(false)
    try {
      await action()
    } catch (error) {
      if (error instanceof StorageFullError) setStorageFull(true)
      else throw error
    } finally {
      setBusy(false)
      await refresh()
    }
  }

  return (
    <div className="diagnostics" role="dialog" aria-modal="true" aria-labelledby="diagnostics-title">
      <h2 id="diagnostics-title">{t('diagnostics.title')}</h2>
      <dl>
        <dt>{t('diagnostics.version')}</dt>
        <dd>{__APP_VERSION__}</dd>
        <dt>{t('diagnostics.storage')}</dt>
        <dd data-testid="storage-status">{t(STATUS_KEYS[storageStatus])}</dd>
        <dt>{t('diagnostics.persons')}</dt>
        <dd data-testid="count-persons">{counts?.persons ?? '…'}</dd>
        <dt>{t('diagnostics.encounters')}</dt>
        <dd data-testid="count-encounters">{counts?.encounters ?? '…'}</dd>
        <dt>{t('diagnostics.events')}</dt>
        <dd data-testid="count-events">{counts?.events ?? '…'}</dd>
      </dl>
      {storageFull && (
        <p className="banner banner-error" role="alert">
          {t('storage.full')}
        </p>
      )}
      <div className="diagnostics-actions">
        <button type="button" disabled={busy} onClick={() => run(addTestData)}>
          {t('diagnostics.addTestData')}
        </button>
        <button type="button" disabled={busy} onClick={() => run(removeTestData)}>
          {t('diagnostics.removeTestData')}
        </button>
        <button type="button" className="secondary" onClick={onClose}>
          {t('diagnostics.close')}
        </button>
      </div>
    </div>
  )
}
