// Entities from specs/001-app-foundation/data-model.md. Terms follow wiki/begrippen.md.

/** Fields every Person, Encounter and Event has (FR-013). */
export interface RecordMeta {
  /** UUID v4. Set on create, never changes. */
  id: string
  /** ISO 8601 UTC. Set on create, never changes. */
  createdAt: string
  /** ISO 8601 UTC. Set on create; updated on every change. */
  updatedAt: string
}

export type ConnectionStatus = 'notConnected' | 'connected'

/** Someone with a LinkedIn profile. No email or phone fields (FR-014). */
export interface Person extends RecordMeta {
  name: string
  company?: string
  /** Normalized LinkedIn profile URL. Unique when present. Never ''. */
  profileUrl?: string
  /** LinkedIn people-search URL; used while profileUrl is missing. */
  searchUrl?: string
  connectionStatus: ConnectionStatus
}

/** One time the owner met a Person. No eventId means casual networking. */
export interface Encounter extends RecordMeta {
  personId: string
  eventId?: string
  /** ISO date YYYY-MM-DD. */
  date: string
  note?: string
}

/** A conference, fair or meetup. endDate is never before startDate. */
export interface Event extends RecordMeta {
  name: string
  /** ISO date YYYY-MM-DD. */
  startDate: string
  /** ISO date YYYY-MM-DD. */
  endDate: string
}

export type Language = 'nl' | 'en'

/** The single device-level settings record. */
export interface Settings {
  key: 'settings'
  language: Language
  /** Absent means casual networking. */
  activeEventId?: string
  /** ISO 8601 UTC. Set by the CSV export (F10). */
  lastBackupAt?: string
  /** Local date (YYYY-MM-DD) on which the owner last chose an Event or casual networking (FR-005). */
  contextChosenOn?: string
  /** The Encounter whose note step is open (F2, B18). Ignored when the Encounter is gone or not dated today. */
  noteStepEncounterId?: string
  updatedAt: string
}
