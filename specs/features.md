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
- [ ] Formulier: naam + bedrijf (bedrijf optioneel, B17)
- [ ] Knop "Zoek op LinkedIn" opent de zoek-link met naam + bedrijf
- [ ] Zelfde naam → vraag "Is dit dezelfde persoon?" (B15)
- [ ] Ontmoeting opgeslagen met zoek-link, datum en evenement
- [ ] Status "nog niet geconnecteerd" bijhouden
- [ ] Na opslaan verschijnt het notitieveld (overslaan kan)
- [ ] "Ik heb geconnecteerd" op het notitiescherm (B16)

## F3 — Doorgeef-modus (gast)
- [ ] Groot, vriendelijk scherm; geen lijst of notities zichtbaar
- [ ] Begroeting "Hoi! Ik ben Britt, de sociale vlinder 🦋 Wie ben jij?" (NL/EN)
- [ ] Taalknop NL/EN voor de gast
- [ ] Privacyzin: "Je naam wordt alleen op Britts telefoon bewaard."
- [ ] Terug naar Britts modus zonder dat de gast iets anders kan openen

## F4 — Profiel-link koppelen
- [ ] Knop "Plak LinkedIn-link" leest het klembord (iOS-bevestiging)
- [ ] URL wordt gevalideerd en genormaliseerd (`linkedin.com/in/<handle>`)
- [ ] Bestaande persoon met dezelfde URL → samenvoegen, geen dubbel
- [ ] Actie "profiel-link ontbreekt" verdwijnt na koppelen

## F5 — Toevoegen via QR
- [ ] Camera opent en leest een LinkedIn-QR
- [ ] URL genormaliseerd (extra parameters weg)
- [ ] Naam afgeleid uit de URL en aanpasbaar
- [ ] Bestaande persoon herkend → nieuwe ontmoeting toegevoegd
- [ ] Niet-LinkedIn-QR → duidelijke melding, niets opgeslagen

## F6 — Notities
- [ ] Notitie toevoegen meteen na opslaan of later ⚠️ #5
- [ ] Notitie bewerken
- [ ] Notities nooit zichtbaar in doorgeef-modus

## F7 — Contacten
- [ ] Lijst per evenement (en alle contacten)
- [ ] Zoeken/filteren op naam
- [ ] Persoon-detail met tijdlijn van ontmoetingen + notities
- [ ] "Open in LinkedIn" (profiel-URL, anders zoek-link)
- [ ] Connectiestatus aanpassen
- [ ] Persoon verwijderen

## F8 — Acties-tab
- [ ] Toont: notitie ontbreekt, nog niet geconnecteerd, profiel-link ontbreekt
- [ ] Actie oplossen vanuit de tab
- [ ] Actie afwijzen ⚠️ #3
- [ ] Teller/badge op de tab
- [ ] Lege staat: "Alles gedaan, tijd om verder te fladderen."

## F9 — Mijn QR
- [ ] Britts LinkedIn-QR groot op het scherm ⚠️ #12
- [ ] Vlinder in het midden, QR blijft scanbaar
- [ ] Scherm blijft helder (geen dimmen tijdens tonen, waar mogelijk)

## F10 — Instellingen & data
- [ ] Evenementen beheren
- [ ] Taal van de app kiezen ⚠️ #8
- [ ] CSV-export ⚠️ #6
- [ ] Alle data wissen (met bevestiging)
- [ ] Herinnering om een back-up te maken (T10, T11)

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
- [ ] Persoon verwijderen (F7) en CSV-export (F10) werken (constitution VI)
- [ ] iOS Begeleide toegang ingesteld voor de doorgeef-modus

## Later (niet v1)
- [ ] Online sync telefoon ↔ laptop ⚠️ #13
- [ ] Gast vult in op eigen telefoon via Britts QR ⚠️ #14
