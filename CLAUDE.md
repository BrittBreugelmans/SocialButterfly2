# CLAUDE.md — De Sociale Vlinder

Dit bestand is het **schema** van deze repo: het vertelt een AI-agent hoe de kennis
hier georganiseerd is en hoe hij ermee moet werken. Lees dit altijd eerst.

## Wat is dit project?
Een persoonlijke web-app (PWA voor iPhone) waarmee Britt op conferenties en beurzen
vlot en natuurlijk kan connecteren met mensen op LinkedIn. Zie [wiki/visie.md](wiki/visie.md).

## Structuur
| Map | Inhoud | Wie schrijft? |
|---|---|---|
| `raw/` | Ruwe bronnen: gesprekken, notities, screenshots. **Nooit aanpassen.** | Britt (of export van gesprekken) |
| `wiki/` | Gestructureerde kennis: één onderwerp per pagina, onderling gelinkt. | AI, gereviewd door Britt |
| `specs/` | Spec-driven development (Spec Kit-stijl): constitution, feature-specs, plans, tasks. | AI + Britt |

## Werkwijze voor de wiki

### Ingest (nieuwe bron verwerken)
1. Lees de nieuwe bron in `raw/`.
2. Werk de relevante pagina's in `wiki/` bij. Maak alleen een nieuwe pagina als het onderwerp nergens past.
3. Nieuwe beslissing? → toevoegen aan [wiki/beslissingen.md](wiki/beslissingen.md) met datum, keuze, reden en verworpen alternatieven.
4. Nieuw begrip? → toevoegen aan [wiki/begrippen.md](wiki/begrippen.md).
5. Onbeantwoorde vraag? → [wiki/open-vragen.md](wiki/open-vragen.md). Nooit zelf invullen.
6. Werk [wiki/index.md](wiki/index.md) bij als er pagina's bijkomen.
7. Voeg een regel toe aan [wiki/log.md](wiki/log.md): datum, bron, wat er veranderde.

### Query (vraag beantwoorden)
- Beantwoord vanuit de wiki en verwijs naar de pagina. Staat het er niet in, zeg dat dan
  en stel voor het als open vraag te noteren.

### Lint (onderhoud)
- Zoek tegenstrijdigheden tussen pagina's, verouderde info, pagina's zonder links,
  en open vragen die intussen beantwoord zijn. Rapporteer eerst, pas daarna aan.

## Regels
- **Beslissingen van Britt zijn bindend.** Stel ze niet opnieuw in vraag, tenzij je een concreet
  probleem ziet; noteer dat dan als open vraag.
- **Niet gokken.** Ontbrekende info → open vraag.
- **Gebruik de begrippen** uit `begrippen.md` consequent, in wiki, specs én code.
- Wiki in het **Nederlands**; specs en code in het **Engels** (begrippen.md bevat de vertaling).
- Korte pagina's, korte zinnen. Links tussen pagina's met relatieve markdown-links.

## Spec-driven development
Volgorde: `constitution` → `spec` per feature → `plan` → `tasks` → implementatie.
- De constitution wordt gegenereerd uit de wiki met [specs/constitution-prompt.md](specs/constitution-prompt.md).
- Voor elke nieuwe feature: lees eerst constitution + wiki, stel daarna enkel vragen over wat nieuw is.
- Sluit elk gesprek af met bijgewerkte bestanden: wat niet in de repo staat, bestaat niet.
