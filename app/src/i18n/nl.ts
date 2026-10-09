// Source dictionary (contracts/i18n.md). en.ts must have exactly the same keys.
// Tone: friendly, lightly playful, short (wiki/merk-en-stijl.md).

export const nl = {
  'app.title': 'De Sociale Vlinder',
  'app.comingSoon': 'Binnenkort beschikbaar.',
  'app.languageSwitch': 'Taal',
  'app.languageNl': 'NL',
  'app.languageEn': 'EN',

  'offline.message': 'Geen internet. De Sociale Vlinder heeft een verbinding nodig. Probeer het zo meteen opnieuw.',
  'offline.banner': 'Geen verbinding. Je gegevens blijven veilig op je telefoon.',

  'install.hint': 'Tip: tik op Deel en kies "Zet op beginscherm". Open de app daarna altijd via je beginscherm.',

  'storage.notPersisted': 'Let op: iOS bewaart je gegevens niet gegarandeerd. Maak geregeld een CSV-back-up.',
  'storage.full': 'Je telefoon is vol. Dit kon niet bewaard worden; je bestaande gegevens zijn veilig.',
  'banner.dismiss': 'Sluiten',

  'diagnostics.open': 'Diagnose openen (lang indrukken)',
  'diagnostics.title': 'Diagnose',
  'diagnostics.version': 'Versie',
  'diagnostics.storage': 'Opslag',
  'diagnostics.storageChecking': 'controleren…',
  'diagnostics.storagePersisted': 'blijvend',
  'diagnostics.storageNotPersisted': 'niet blijvend',
  'diagnostics.storageUnsupported': 'niet ondersteund',
  'diagnostics.persons': 'Personen',
  'diagnostics.encounters': 'Ontmoetingen',
  'diagnostics.events': 'Evenementen',
  'diagnostics.addTestData': 'Testdata toevoegen',
  'diagnostics.removeTestData': 'Testdata verwijderen',
  'diagnostics.close': 'Sluiten',

  'choice.title': 'Waar ben je vandaag?',
  'choice.continue': 'Verder met {name}',
  'choice.current': 'Nu bezig',
  'choice.upcoming': 'Binnenkort',
  'choice.past': 'Voorbij',
  'choice.newEvent': 'Nieuw evenement',
  'choice.casual': 'Netwerken zonder evenement',

  'event.title': 'Nieuw evenement',
  'event.name': 'Naam',
  'event.namePlaceholder': 'bv. Devoxx 2026',
  'event.startDate': 'Van',
  'event.endDate': 'Tot en met',
  'event.save': 'Opslaan en starten',
  'event.back': 'Terug',
  'event.errorName': 'Geef het evenement een naam.',
  'event.errorDates': 'De einddatum kan niet vóór de startdatum liggen.',

  'context.at': 'Je bent op',
  'context.casual': 'Netwerken zonder evenement',
  'context.change': 'Wijzig evenement',
} as const

export type TextKey = keyof typeof nl
