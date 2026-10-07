# LinkedIn-beperkingen

## Wat niet kan of mag
- **Geen connectieverzoeken of berichten versturen vanuit een app.** LinkedIn biedt dat niet aan voor gewone apps.
- **Niet zoeken in het ledenbestand via een API.** Die toegang is voorbehouden aan partners.
- **Niet scrapen.** Dat is tegen de gebruiksvoorwaarden en kan Britts account in gevaar brengen.
- **Geen LinkedIn-logo of -merk gebruiken** in de app. Blauwe tinten mogen wel.

## Wat wel kan, en hoe we het gebruiken
| Mogelijkheid | Gebruik in de app |
|---|---|
| Zoek-URL `linkedin.com/search/results/people/?keywords=…` | Openen met naam + bedrijf; gast wijst zichzelf aan; Britt tikt **Connect**. |
| Profiel-URL `linkedin.com/in/<handle>` | Opslaan als unieke sleutel; later openen om een bericht te sturen. |
| LinkedIn-QR | Bevat een profiel-URL (soms met extra parameters); scannen en normaliseren. |
| "Delen → Link kopiëren" in LinkedIn | Britt plakt de link terug in de app ("Plak LinkedIn-link"). |

## Gevolgen voor het ontwerp
- De laatste stap (Connect, bericht versturen) gebeurt **altijd door Britt in LinkedIn**.
- De app weet niet vanzelf of iemand geconnecteerd is → **connectiestatus is manueel** (zie [open-vragen.md](open-vragen.md)).
- LinkedIn stuurt na een zoekopdracht niets terug → de **profiel-URL moet geplakt worden** (actie "profiel-link ontbreekt").
- Zoeken vraagt **internet**; daarom is internet vereist voor de app (beslissing T6 in [beslissingen.md](beslissingen.md)).

Zie ook beslissingen L1–L4 in [beslissingen.md](beslissingen.md).
