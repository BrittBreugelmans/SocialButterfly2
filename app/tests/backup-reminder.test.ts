import { describe, expect, it } from 'vitest'
import { isBackupReminderDue } from '../src/backup/reminder'
import { localDateOf } from '../src/data/dates'
import type { BackupSnapshot } from '../src/data/repository'
import type { Encounter, Event, Person, Settings } from '../src/data/types'

// Built by hand: the rule is pure (research R4). "Today" is 12 October 2026.
const TODAY = '2026-10-12'
const BACKUP = '2026-10-05T12:00:00.000Z'
const BEFORE_BACKUP = '2026-10-04T12:00:00.000Z'
// Local noon on a given day, as ISO: safe from time zone edges.
const at = (date: string) => new Date(`${date}T12:00:00`).toISOString()

function person(fields: Partial<Person> = {}): Person {
  return {
    id: 'p',
    createdAt: BEFORE_BACKUP,
    updatedAt: BEFORE_BACKUP,
    name: 'Jan',
    searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jan',
    connectionStatus: 'notConnected',
    ...fields,
  }
}

function encounter(fields: Partial<Encounter>): Encounter {
  return { id: 'x', createdAt: BEFORE_BACKUP, updatedAt: BEFORE_BACKUP, personId: 'p', date: '2026-10-04', ...fields }
}

function event(fields: Partial<Event>): Event {
  return {
    id: 'e',
    createdAt: BEFORE_BACKUP,
    updatedAt: BEFORE_BACKUP,
    name: 'Devoxx',
    startDate: '2026-10-09',
    endDate: '2026-10-11',
    ...fields,
  }
}

function snapshot(parts: Partial<BackupSnapshot>): BackupSnapshot {
  return { takenAt: at(TODAY), persons: [person()], encounters: [], events: [], ...parts }
}

function settings(fields: Partial<Settings> = {}): Settings {
  return { key: 'settings', language: 'nl', updatedAt: BEFORE_BACKUP, ...fields }
}

const due = (s: BackupSnapshot, set: Settings = settings()) => isBackupReminderDue(s, set, TODAY)

describe('isBackupReminderDue: new Encounters (T10, T11)', () => {
  it('is due for an Encounter of an Event that ended before today', () => {
    expect(due(snapshot({ events: [event({})], encounters: [encounter({ eventId: 'e', date: '2026-10-10' })] }))).toBe(true)
  })

  it('is not due while that Event still runs today or later', () => {
    for (const endDate of [TODAY, '2026-10-13']) {
      const s = snapshot({ events: [event({ endDate })], encounters: [encounter({ eventId: 'e', date: '2026-10-10' })] })
      expect(due(s)).toBe(false)
    }
  })

  it('is due for a casual Encounter of an earlier day, not of today', () => {
    expect(due(snapshot({ encounters: [encounter({ date: '2026-10-11' })] }))).toBe(true)
    expect(due(snapshot({ encounters: [encounter({ date: TODAY })] }))).toBe(false)
  })

  it('only counts Encounters created after the last backup', () => {
    const s = snapshot({ encounters: [encounter({ date: '2026-10-04' })] })
    expect(due(s, settings({ lastBackupAt: BACKUP }))).toBe(false)
    const newer = snapshot({ encounters: [encounter({ date: '2026-10-11', createdAt: at('2026-10-11'), updatedAt: at('2026-10-11') })] })
    expect(due(newer, settings({ lastBackupAt: BACKUP }))).toBe(true)
  })

  it('is not due with no data at all', () => {
    expect(due(snapshot({ persons: [] }))).toBe(false)
  })
})

describe('isBackupReminderDue: changes since the last backup (B40)', () => {
  const backedUp = settings({ lastBackupAt: BACKUP })

  it('is due for an Encounter changed on an earlier day, not today', () => {
    const yesterday = snapshot({ encounters: [encounter({ updatedAt: at('2026-10-11'), note: 'new note' })] })
    expect(due(yesterday, backedUp)).toBe(true)
    const today = snapshot({ encounters: [encounter({ updatedAt: at(TODAY), note: 'new note' })] })
    expect(due(today, backedUp)).toBe(false)
  })

  it('is due for a changed Person or Event', () => {
    expect(due(snapshot({ persons: [person({ updatedAt: at('2026-10-11'), connectionStatus: 'connected' })] }), backedUp)).toBe(true)
    expect(due(snapshot({ events: [event({ updatedAt: at('2026-10-11'), name: 'Devoxx BE' })] }), backedUp)).toBe(true)
  })

  it('waits while the active Event runs today, and not once it has ended', () => {
    const running = event({ id: 'run', startDate: '2026-10-11', endDate: '2026-10-13' })
    const changed = snapshot({ events: [running], persons: [person({ updatedAt: at('2026-10-11') })] })
    expect(due(changed, settings({ lastBackupAt: BACKUP, activeEventId: 'run' }))).toBe(false)

    const ended = event({ id: 'run', startDate: '2026-10-09', endDate: '2026-10-11' })
    const later = snapshot({ events: [ended], persons: [person({ updatedAt: at('2026-10-11') })] })
    expect(due(later, settings({ lastBackupAt: BACKUP, activeEventId: 'run' }))).toBe(true)
  })

  it('does not apply when no backup was ever made', () => {
    // Everything is "new" then; a Person changed yesterday with an Encounter of today is not due.
    const s = snapshot({ persons: [person({ updatedAt: at('2026-10-11') })], encounters: [encounter({ date: TODAY })] })
    expect(due(s)).toBe(false)
  })

  it('never counts deleted records: they are not in the snapshot', () => {
    expect(due(snapshot({ persons: [], encounters: [] }), backedUp)).toBe(false)
  })
})

describe('isBackupReminderDue: "Later" (FR-011)', () => {
  const dueSnapshot = snapshot({ encounters: [encounter({ date: '2026-10-11' })] })

  it('hides it for the rest of today', () => {
    expect(due(dueSnapshot, settings({ backupReminderLaterOn: TODAY }))).toBe(false)
  })

  it('has no effect on a later day', () => {
    expect(due(dueSnapshot, settings({ backupReminderLaterOn: '2026-10-11' }))).toBe(true)
  })
})

describe('localDateOf', () => {
  it('gives the local date of a UTC time', () => {
    const iso = '2026-10-11T22:30:00.000Z'
    const local = new Date(iso)
    const expected = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`
    expect(localDateOf(iso)).toBe(expected)
    expect(localDateOf(at('2026-10-11'))).toBe('2026-10-11')
  })
})
