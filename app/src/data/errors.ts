// Errors from specs/001-app-foundation/contracts/storage-api.md.

export class ValidationError extends Error {
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/** The profileUrl already belongs to another Person (FR-012). */
export class DuplicateProfileUrlError extends Error {
  readonly existingPersonId: string

  constructor(existingPersonId: string) {
    super('This profileUrl already belongs to another Person')
    this.name = 'DuplicateProfileUrlError'
    this.existingPersonId = existingPersonId
  }
}

/** An Event that still has Encounters cannot be deleted. */
export class EventInUseError extends Error {
  constructor() {
    super('This Event still has Encounters')
    this.name = 'EventInUseError'
  }
}

/** The device refused to store more data. Existing data is untouched. */
export class StorageFullError extends Error {
  constructor() {
    super('The device storage is full')
    this.name = 'StorageFullError'
  }
}
