// The CSV backup (F10, specs/009-settings-data research R1). Pure: no database, no network.

import type { BackupSnapshot } from '../data/repository'
import type { Encounter, Event, Person } from '../data/types'

/** The columns of FR-004, in this order (B35). */
export const CSV_COLUMNS = [
  'name',
  'company',
  'profileUrl',
  'searchUrl',
  'connectionStatus',
  'encounterDate',
  'eventName',
  'eventStartDate',
  'eventEndDate',
  'note',
] as const

// Semicolon: Excel with Belgian settings opens the file straight into columns (B39).
const SEPARATOR = ';'
const ROW_END = '\r\n'
// Without the byte order mark, Excel reads the file as Windows-1252 and breaks accents.
const BOM = '﻿'

/**
 * One cell. A value a spreadsheet would read as a formula gets a leading apostrophe (FR-006,
 * OWASP CSV injection advice). Then it is quoted when it holds ; " CR LF or spaces at the ends.
 */
function cell(value: string | undefined): string {
  let text = value ?? ''
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[;"\r\n]/.test(text) || /^\s|\s$/.test(text) || text.startsWith("'")) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function row(values: (string | undefined)[]): string {
  return values.map(cell).join(SEPARATOR)
}

function encounterRow(encounter: Encounter, person: Person | undefined, event: Event | undefined): string {
  return row([
    person?.name,
    person?.company,
    person?.profileUrl,
    person?.searchUrl,
    person?.connectionStatus,
    encounter.date,
    event?.name,
    event?.startDate,
    event?.endDate,
    encounter.note,
  ])
}

/**
 * The whole backup: BOM, header, one row per Encounter and one row per Event without Encounters.
 * Encounters: newest date first, then name, then the newest created first. Empty Events: newest
 * start date first.
 */
export function buildBackupCsv(snapshot: BackupSnapshot): string {
  const persons = new Map(snapshot.persons.map((p) => [p.id, p]))
  const events = new Map(snapshot.events.map((e) => [e.id, e]))
  const name = (encounter: Encounter) => persons.get(encounter.personId)?.name ?? ''

  const encounters = [...snapshot.encounters].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || name(a).localeCompare(name(b)) || b.createdAt.localeCompare(a.createdAt),
  )
  const usedEventIds = new Set(snapshot.encounters.map((e) => e.eventId))
  const emptyEvents = snapshot.events
    .filter((event) => !usedEventIds.has(event.id))
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  const lines = [
    CSV_COLUMNS.join(SEPARATOR),
    ...encounters.map((e) =>
      encounterRow(e, persons.get(e.personId), e.eventId === undefined ? undefined : events.get(e.eventId)),
    ),
    ...emptyEvents.map((event) => row(['', '', '', '', '', '', event.name, event.startDate, event.endDate, ''])),
  ]
  return BOM + lines.map((line) => line + ROW_END).join('')
}

/** "sociale-vlinder-2026-10-12.csv": the same in both languages (FR-007). */
export function backupFileName(today: string): string {
  return `sociale-vlinder-${today}.csv`
}
