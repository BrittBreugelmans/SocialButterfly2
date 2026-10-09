// Source dictionary (contracts/i18n.md). en.ts must have exactly the same keys.
// Tone: friendly, lightly playful, short (wiki/merk-en-stijl.md).

export const nl = {
  'app.title': 'De Sociale Vlinder',
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

  'start.addByName': 'Toevoegen via naam',

  'add.title': 'Wie heb je ontmoet?',
  'add.name': 'Naam',
  'add.namePlaceholder': 'bv. Jan Peeters',
  'add.company': 'Bedrijf (optioneel)',
  'add.companyPlaceholder': 'bv. Elmos',
  'add.search': 'Zoek op LinkedIn',
  'add.back': 'Terug',

  'same.title': 'Is dit dezelfde persoon?',
  'same.lastMet': 'Laatst ontmoet: {date}',
  'same.noCompany': 'Geen bedrijf',
  'same.newPerson': 'Nee, nieuwe persoon',

  'note.title': 'Notitie bij {name}',
  'note.label': 'Notitie',
  'note.placeholder': 'Waarover hebben jullie gepraat?',
  'note.connected': 'Ik heb geconnecteerd',
  'note.save': 'Opslaan',
  'note.skip': 'Overslaan',
  'note.alreadyMet': 'Je hebt {name} vandaag al ontmoet.',
  'note.openLinkedIn': 'Open LinkedIn',
} as const

export type TextKey = keyof typeof nl
