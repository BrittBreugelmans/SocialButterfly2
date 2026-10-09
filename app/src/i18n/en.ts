import type { TextKey } from './nl'

// Typed against nl.ts: a missing or extra key is a compile error (FR-015).
export const en: Record<TextKey, string> = {
  'app.title': 'The Social Butterfly',
  'app.comingSoon': 'Coming soon.',
  'app.languageSwitch': 'Language',
  'app.languageNl': 'NL',
  'app.languageEn': 'EN',

  'offline.message': 'No internet. The Social Butterfly needs a connection. Please try again in a moment.',
  'offline.banner': 'No connection. Your data stays safe on your phone.',

  'install.hint': 'Tip: tap Share and choose "Add to Home Screen". Then always open the app from your home screen.',

  'storage.notPersisted': 'Heads-up: iOS may delete your data. Make a CSV backup regularly.',
  'storage.full': 'Your phone is full. This could not be saved; your existing data is safe.',
  'banner.dismiss': 'Close',

  'diagnostics.open': 'Open diagnostics (long press)',
  'diagnostics.title': 'Diagnostics',
  'diagnostics.version': 'Version',
  'diagnostics.storage': 'Storage',
  'diagnostics.storageChecking': 'checking…',
  'diagnostics.storagePersisted': 'persistent',
  'diagnostics.storageNotPersisted': 'not persistent',
  'diagnostics.storageUnsupported': 'not supported',
  'diagnostics.persons': 'Persons',
  'diagnostics.encounters': 'Encounters',
  'diagnostics.events': 'Events',
  'diagnostics.addTestData': 'Add test data',
  'diagnostics.removeTestData': 'Remove test data',
  'diagnostics.close': 'Close',

  'choice.title': 'Where are you today?',
  'choice.continue': 'Continue with {name}',
  'choice.current': 'Happening now',
  'choice.upcoming': 'Coming up',
  'choice.past': 'Past',
  'choice.newEvent': 'New event',
  'choice.casual': 'Casual networking',

  'event.title': 'New event',
  'event.name': 'Name',
  'event.namePlaceholder': 'e.g. Devoxx 2026',
  'event.startDate': 'From',
  'event.endDate': 'Until',
  'event.save': 'Save and start',
  'event.back': 'Back',
  'event.errorName': 'Give the event a name.',
  'event.errorDates': "The end date can't be before the start date.",

  'context.at': "You're at",
  'context.casual': 'Casual networking',
  'context.change': 'Change event',
}
