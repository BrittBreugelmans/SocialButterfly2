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

/** The device refused to store more data. Existing data is untouched. */
export class StorageFullError extends Error {
  constructor() {
    super('The device storage is full')
    this.name = 'StorageFullError'
  }
}

/** The Encounter is the Person's only one: delete the Person instead (B25). */
export class LastEncounterError extends Error {
  constructor() {
    super("This is the Person's only Encounter")
    this.name = 'LastEncounterError'
  }
}
