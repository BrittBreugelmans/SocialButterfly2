import { useCallback, useEffect, useState } from 'react'
import { addDaysLocal, todayLocal } from '../data/dates'
import { StorageFullError } from '../data/errors'
import {
  countEncountersSince,
  createEncounter,
  createEvent,
  createPerson,
  deleteEvent,
  updatePerson,
  deletePerson,
  listEncountersByEvent,
  listEvents,
  listPersons,
} from '../data/repository'
import { useLanguage } from '../i18n/LanguageProvider'
import { buildSearchUrl } from '../linkedin/links'
import type { TextKey } from '../i18n/nl'
import type { StorageStatus } from '../platform/persistence'

// Test records are recognisable by this prefix, so they can be removed again.
const TEST_PREFIX = '[test] '

async function addTestData(): Promise<void> {
  const today = todayLocal()
  const oneDay = await createEvent({ name: `${TEST_PREFIX}One-day`, startDate: today, endDate: today })
  const multiDay = await createEvent({
    name: `${TEST_PREFIX}Multi-day`,
    startDate: today,
    endDate: addDaysLocal(today, 2),
  })
  const person = await createPerson({
    name: `${TEST_PREFIX}Vlinder`,
    searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=test',
  })
  await createEncounter({ personId: person.id, eventId: oneDay.id, date: today })
  await createEncounter({ personId: person.id, eventId: multiDay.id, date: today })
  await createEncounter({ personId: person.id, date: today }) // casual networking
}

/**
 * 500 test contacts for the speed check of the contact list (F7 SC-002, research R12): 1–3
 * Encounters each, over the test Events and casual networking, on recent days.
 */
async function addManyTestData(): Promise<void> {
  const today = todayLocal()
  const events = (await listEvents()).filter((event) => event.name.startsWith(TEST_PREFIX))
  if (events.length === 0) {
    events.push(await createEvent({ name: `${TEST_PREFIX}One-day`, startDate: today, endDate: today }))
  }
  for (let i = 1; i <= 500; i++) {
    const name = `${TEST_PREFIX}Contact ${String(i).padStart(3, '0')}`
    const company = i % 3 === 0 ? 'Test BV' : undefined
    let person = await createPerson({ name, company, searchUrl: buildSearchUrl(name, company) })
    if (i % 5 === 0) person = await updatePerson(person.id, { connectionStatus: 'connected' })
    for (let j = 0; j <= i % 3; j++) {
      const eventId = (i + j) % 4 === 0 ? undefined : events[(i + j) % events.length]?.id // some casual
      await createEncounter({ personId: person.id, eventId, date: addDaysLocal(today, -((i + j) % 30)) })
    }
  }
}

async function removeTestData(): Promise<void> {
  for (const person of await listPersons()) {
    if (person.name.startsWith(TEST_PREFIX)) await deletePerson(person.id) // Encounters cascade
  }
  for (const event of await listEvents()) {
    if (!event.name.startsWith(TEST_PREFIX)) continue
    // An Event that real Encounters still use stays (no silent loss). Deleting would keep those
    // Encounters (B38) but take away their Event, so it is skipped.
    if ((await listEncountersByEvent(event.id)).length === 0) await deleteEvent(event.id)
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
        <button type="button" disabled={busy} onClick={() => run(addManyTestData)}>
          {t('diagnostics.addManyTestData')}
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
