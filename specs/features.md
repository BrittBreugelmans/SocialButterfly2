# Featurelijst v1 — De Sociale Vlinder

Vink af wat klaar is. Elke feature (F0–F11) wordt één Spec Kit-feature: eerst `spec`, dan `plan`, `tasks`, implementatie.
⚠️ = hangt af van een open vraag in [../wiki/open-vragen.md](../wiki/open-vragen.md); eerst beslissen, dan specifiëren.

Volgorde = voorgestelde bouwvolgorde. Na F0–F2 heb je al een bruikbare app.

---

## F0 — Fundament
- [x] Constitution gegenereerd met [constitution-prompt.md](constitution-prompt.md) en gereviewd
- [x] Stack en hosting gekozen (gratis): T7, T8, T12, T13
- [x] App online bereikbaar via een eigen URL
- [x] Installeerbaar op iPhone-beginscherm (PWA: icoon, schermvullend openen)
- [x] Datamodel: Person, Encounter, Event (Person ↔ meerdere Encounters)
- [x] Data blijft lokaal op het toestel en overleeft het sluiten van de app (T9)
- [x] Taalwissel NL/EN-basis aanwezig

## F1 — Evenementen
- [x] Evenement aanmaken (naam, startdatum, einddatum; einddatum ≥ startdatum)
- [x] Actief evenement kiezen
- [x] Nieuwe ontmoetingen komen automatisch onder het actieve evenement
- [x] Bij openen: evenement kiezen/aanmaken of netwerken zonder evenement (B12), eerste keer per dag (B13)

## F2 — Toevoegen via naam (snelle modus)
- [x] Formulier: naam + bedrijf (bedrijf optioneel, B17)
- [x] Knop "Zoek op LinkedIn" opent de zoek-link met naam + bedrijf
- [x] Zelfde naam → vraag "Is dit dezelfde persoon?" (B15)
- [x] Ontmoeting opgeslagen met zoek-link, datum en evenement
- [x] Status "nog niet geconnecteerd" bijhouden
- [x] Na opslaan verschijnt het notitieveld (overslaan kan)
- [x] "Ik heb geconnecteerd" op het notitiescherm (B16)

## F3 — Doorgeef-modus (gast)
- [ ] Groot, vriendelijk scherm; geen lijst of notities zichtbaar
- [ ] Begroeting "Hoi! Ik ben Britt, de sociale vlinder 🦋 Wie ben jij?" (NL/EN)
- [ ] Taalknop NL/EN voor de gast
- [ ] Privacyzin: "Je naam wordt alleen op Britts telefoon bewaard."
- [ ] Terug naar Britts modus zonder dat de gast iets anders kan openen

## F4 — Profiel-link koppelen
- [x] Knop "Plak LinkedIn-link" leest het klembord (iOS-bevestiging)
- [x] URL wordt gevalideerd en genormaliseerd (`linkedin.com/in/<handle>`)
- [x] Bestaande persoon met dezelfde URL → samenvoegen na bevestiging (B21), geen dubbel
- [x] Actie "profiel-link ontbreekt" verdwijnt na koppelen

## F5 — Toevoegen via QR
- [X] Camera opent en leest een LinkedIn-QR
- [X] URL genormaliseerd (extra parameters weg)
- [X] Naam afgeleid uit de URL en aanpasbaar
- [X] Bestaande persoon herkend → nieuwe ontmoeting toegevoegd
- [X] Niet-LinkedIn-QR → duidelijke melding, niets opgeslagen

## F6 — Notities → opgegaan in F7 (B29)
- [x] Notitie per ontmoeting (B28)
- Notitie meteen na opslaan: notitiescherm (F2). Later toevoegen en bewerken: F7.
- Notities nooit zichtbaar in doorgeef-modus: geldt voor F3 en F7.

## F7 — Contacten
- [X] Tabbalk: Toevoegen, Contacten, Acties, Mijn QR, Instellingen; nog niet gebouwd = "binnenkort" (B26)
- [X] Lijst per evenement (en alle contacten)
- [X] Zoeken/filteren op naam
- [X] Persoon-detail met tijdlijn van ontmoetingen + notities
- [X] "Open in LinkedIn" (profiel-URL, anders zoek-link)
- [X] Connectiestatus aanpassen
- [X] Aanpasmodus: naam, bedrijf en notitie per ontmoeting aanpassen (B27, B29)
- [X] Persoon verwijderen
- [X] Eén ontmoeting verwijderen; laatste ontmoeting = persoon verwijderen (B25)

## F8 — Acties-tab
- [X] Toont per persoon: notitie ontbreekt (B31), nog niet geconnecteerd, profiel-link ontbreekt
- [X] Actie oplossen vanuit de tab
- [X] Actie afwijzen; komt terug bij een nieuwe ontmoeting (B30)
- [X] Teller/badge op de tab
- [X] Lege staat: "Alles gedaan, tijd om verder te fladderen."

## F9 — Mijn QR
- [X] Britts LinkedIn-QR groot op het scherm, lokaal gemaakt (B32); eigen link eenmalig plakken (B33)
- [?] Vlinder in het midden, QR blijft scanbaar
- [X] Scherm blijft helder (geen dimmen tijdens tonen, waar mogelijk)
- [?] Bereikbaar vanaf het offline-scherm: "Toon mijn QR" (B34)

## F10 — Instellingen & data
- [X] Evenementen beheren; ontmoetingen blijven bij verwijderen (B38)
- [X] Taal van de app kiezen; standaard NL (B37)
- [X] CSV-export: één rij per ontmoeting, geen import (B35, B36)
- [X] Alle data wissen (met bevestiging)
- [X] Herinnering om een back-up te maken (T10, T11)

## F11 — Merk & plezier
- [ ] Logo: vlinder met netwerkknooppunten
- [ ] Kleuren: LinkedIn-achtig blauw, geen LinkedIn-logo
- [ ] Vlinder-animatie bij opslaan
- [ ] App-icoon en opstartscherm
- [ ] Animaties vertragen de kernflows niet (snelheid > plezier)

---

## Klaar voor de eerste beurs
- [ ] Getest op Britts iPhone, via mobiele data
- [ ] Volledige flow A (naam) en B (QR) zonder haperen
- [ ] Doorgeef-modus getest met iemand anders
- [ ] Back-up (CSV) gemaakt vóór vertrek
- [X] Persoon verwijderen (F7) en CSV-export (F10) werken (constitution VI)
- [ ] iOS Begeleide toegang ingesteld voor de doorgeef-modus

## Later (niet v1)
- [ ] Online sync telefoon ↔ laptop ⚠️ #13
- [ ] Gast vult in op eigen telefoon via Britts QR ⚠️ #14
