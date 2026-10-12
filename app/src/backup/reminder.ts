// When the backup reminder is due (F10, specs/009-settings-data research R4). Pure.

import { localDateOf } from '../data/dates'
import type { BackupSnapshot } from '../data/repository'
import type { Settings } from '../data/types'
import { eventStatusOn } from '../events/choice'

/**
 * True when there is data that is only on the phone, and now is a good moment to say so:
 * 1. new Encounters (after the last backup) of an Event that ended before today, or casual ones of
 *    an earlier day (T10, T11);
 * 2. records that existed at the last backup and changed on an earlier day, while the active
 *    Event is not running today (B40).
 * "Later" hides it for the rest of today (FR-011). Deleted records are gone and never count.
 */
export function isBackupReminderDue(snapshot: BackupSnapshot, settings: Settings, today: string): boolean {
  if (settings.backupReminderLaterOn === today) return false
  const lastBackup = settings.lastBackupAt
  const events = new Map(snapshot.events.map((event) => [event.id, event]))

  const newEncounterDue = snapshot.encounters.some((encounter) => {
    if (lastBackup !== undefined && encounter.createdAt <= lastBackup) return false
    if (encounter.eventId === undefined) return encounter.date < today
    const event = events.get(encounter.eventId)
    return event !== undefined && event.endDate < today
  })
  if (newEncounterDue) return true

  if (lastBackup === undefined) return false
  const active = settings.activeEventId === undefined ? undefined : events.get(settings.activeEventId)
  if (active && eventStatusOn(active, today) === 'current') return false

  const records = [...snapshot.persons, ...snapshot.encounters, ...snapshot.events]
  return records.some(
    (record) => record.createdAt <= lastBackup && record.updatedAt > lastBackup && localDateOf(record.updatedAt) < today,
  )
}
