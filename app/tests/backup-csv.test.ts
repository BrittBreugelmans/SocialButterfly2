import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackupCsv, CSV_COLUMNS } from '../src/backup/csv'
import type { BackupSnapshot } from '../src/data/repository'
import type { Encounter, Event, Person } from '../src/data/types'

// Built by hand: the CSV module is pure, no database needed (research R1).
const T = '2026-10-01T10:00:00.000Z'

function person(id: string, fields: Partial<Person> & { name: string }): Person {
  return { id, createdAt: T, updatedAt: T, connectionStatus: 'notConnected', ...fields }
}

function encounter(id: string, personId: string, date: string, fields: Partial<Encounter> = {}): Encounter {
  return { id, createdAt: T, updatedAt: T, personId, date, ...fields }
}

function event(id: string, name: string, startDate: string, endDate: string): Event {
  return { id, createdAt: T, updatedAt: T, name, startDate, endDate }
}

function snapshot(parts: Partial<BackupSnapshot>): BackupSnapshot {
  return { takenAt: T, persons: [], encounters: [], events: [], ...parts }
}

const HEADER =
  'name;company;profileUrl;searchUrl;connectionStatus;encounterDate;eventName;eventStartDate;eventEndDate;note'

/** The rows after the BOM and the header, without the final empty line. */
function rows(csv: string): string[] {
  const lines = csv.slice(1).split('\r\n')
  expect(lines.at(-1)).toBe('')
  return lines.slice(1, -1)
}

describe('buildBackupCsv (F10 FR-004–FR-006, research R1)', () => {
  it('starts with a BOM and the 10 headers, separated by semicolons, ending in CRLF', () => {
    const csv = buildBackupCsv(snapshot({}))
    expect(csv).toBe(`﻿${HEADER}\r\n`)
    expect(CSV_COLUMNS.join(';')).toBe(HEADER)
  })

  it('writes one row per Encounter with the Person and Event fields', () => {
    const devoxx = event('e1', 'Devoxx 2026', '2026-10-06', '2026-10-08')
    const jan = person('p1', {
      name: 'Jan Peeters',
      company: 'Elmos',
      profileUrl: 'https://www.linkedin.com/in/jan',
      searchUrl: 'https://www.linkedin.com/search/results/people/?keywords=Jan',
      connectionStatus: 'connected',
    })
    const csv = buildBackupCsv(
      snapshot({
        persons: [jan],
        events: [devoxx],
        encounters: [
          encounter('x1', 'p1', '2026-10-07', { eventId: 'e1', note: 'Talked about AI' }),
          encounter('x2', 'p1', '2026-10-10'),
        ],
      }),
    )
    expect(rows(csv)).toEqual([
      'Jan Peeters;Elmos;https://www.linkedin.com/in/jan;https://www.linkedin.com/search/results/people/?keywords=Jan;connected;2026-10-10;;;;',
      'Jan Peeters;Elmos;https://www.linkedin.com/in/jan;https://www.linkedin.com/search/results/people/?keywords=Jan;connected;2026-10-07;Devoxx 2026;2026-10-06;2026-10-08;Talked about AI',
    ])
  })

  it('orders by encounter date (newest first), then name, then newest created; empty Events last', () => {
    const csv = buildBackupCsv(
      snapshot({
        persons: [person('a', { name: 'Zoë' }), person('b', { name: 'Anna' })],
        events: [
          event('old', 'Old empty', '2026-01-01', '2026-01-01'),
          event('new', 'New empty', '2026-11-01', '2026-11-02'),
        ],
        encounters: [
          encounter('1', 'a', '2026-10-01'),
          encounter('2', 'b', '2026-10-01'),
          encounter('3', 'a', '2026-10-05'),
          encounter('4', 'b', '2026-10-01', { createdAt: '2026-10-02T00:00:00.000Z', note: 'later' }),
        ],
      }),
    )
    expect(rows(csv)).toEqual([
      'Zoë;;;;notConnected;2026-10-05;;;;',
      'Anna;;;;notConnected;2026-10-01;;;;later',
      'Anna;;;;notConnected;2026-10-01;;;;',
      'Zoë;;;;notConnected;2026-10-01;;;;',
      ';;;;;;New empty;2026-11-01;2026-11-02;',
      ';;;;;;Old empty;2026-01-01;2026-01-01;',
    ])
  })

  it('quotes cells with ; " CR LF or spaces at the ends, and keeps line breaks inside one cell', () => {
    const csv = buildBackupCsv(
      snapshot({
        persons: [person('p', { name: 'Jan "JP" Peeters', company: ' Elmos ' })],
        encounters: [encounter('x', 'p', '2026-10-07', { note: 'AI; cloud, data\nCall next week\r\nOK' })],
      }),
    )
    expect(rows(csv.replace('\nCall next week\r\nOK', '<breaks>'))).toEqual([
      '"Jan ""JP"" Peeters";" Elmos ";;;notConnected;2026-10-07;;;;"AI; cloud, data<breaks>"',
    ])
    expect(csv).toContain('"AI; cloud, data\nCall next week\r\nOK"')
  })

  it('guards cells that a spreadsheet would read as a formula (FR-006)', () => {
    const notes = ['- talked about AI', '=HYPERLINK("x")', '+32 tel', '@home', '\tindented']
    const csv = buildBackupCsv(
      snapshot({
        persons: [person('p', { name: 'Jan' })],
        encounters: notes.map((note, i) => encounter(`x${i}`, 'p', `2026-10-0${i + 1}`, { note })),
      }),
    )
    // The note is the cell after the three empty event columns.
    const lastCells = rows(csv).map((row) => row.slice(row.lastIndexOf(';;;;') + 4))
    expect(lastCells).toEqual([
      `"'\tindented"`,
      `"'@home"`,
      `"'+32 tel"`,
      `"'=HYPERLINK(""x"")"`,
      `"'- talked about AI"`,
    ])
  })

  it('keeps accents and emoji unchanged', () => {
    const csv = buildBackupCsv(
      snapshot({
        persons: [person('p', { name: 'Zoë Dé Wit' })],
        encounters: [encounter('x', 'p', '2026-10-07', { note: 'Super 🦋 gesprek' })],
      }),
    )
    expect(rows(csv)).toEqual(['Zoë Dé Wit;;;;notConnected;2026-10-07;;;;Super 🦋 gesprek'])
  })

  it('still writes a row for an Encounter whose Person is missing (no data loss)', () => {
    const csv = buildBackupCsv(snapshot({ encounters: [encounter('x', 'gone', '2026-10-07', { note: 'kept' })] }))
    expect(rows(csv)).toEqual([';;;;;2026-10-07;;;;kept'])
  })
})

describe('backupFileName (FR-007)', () => {
  it('contains the app name and the date', () => {
    expect(backupFileName('2026-10-12')).toBe('sociale-vlinder-2026-10-12.csv')
  })
})
