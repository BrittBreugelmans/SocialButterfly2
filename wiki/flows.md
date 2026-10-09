# Flows en schermen (v1)

## Tabs
1. **Contacten**: personen per evenement; één tik opent het profiel in LinkedIn.
2. **Acties**: openstaande [acties](begrippen.md), elk afwijsbaar.
3. **Mijn QR**: Britts LinkedIn-QR, groot, met vlinder.
4. **Instellingen**: evenementen beheren, taal, CSV-export.

## Flow A — Toevoegen via naam
1. Britt kiest **doorgeef-modus** (geeft gsm door) of **snelle modus** (tikt zelf).
2. Naam + bedrijf ingeven; bedrijf is optioneel (B17). In doorgeef-modus: begroeting + privacygeruststelling, NL/EN-knop.
3. "Zoek op LinkedIn". Bestaat er al een persoon met dezelfde naam? → **"Is dit dezelfde persoon?"** (B15, zie Flow D).
4. Ontmoeting wordt opgeslagen onder het actieve evenement; daarna opent de zoek-link in LinkedIn.
5. Gast wijst zichzelf aan; Britt tikt **Connect**.
6. Optioneel: in LinkedIn "Delen → Link kopiëren", terug naar de app, **"Plak LinkedIn-link"**.
7. Terug in de app: notitieveld (overslaan kan) en **"Ik heb geconnecteerd"** (B16). Ook na sluiten door iOS, dezelfde dag (B18).

## Flow B — Toevoegen via QR
1. "Scan QR" → camera.
2. App leest de profiel-URL, normaliseert ze en leidt de naam af (bv. `britt-breugelmans` → "Britt Breugelmans").
3. Britt past de naam aan indien nodig.
4. Bestaat de persoon al? → nieuwe ontmoeting koppelen (zie Flow D).
5. Notitieveld verschijnt (overslaan kan).

## Flow C — Opvolgen na het evenement
1. Acties-tab toont: notitie ontbreekt, nog niet geconnecteerd, profiel-link ontbreekt.
2. Per actie: oplossen of **afwijzen**.
3. Bericht sturen: persoon openen → notitie lezen → "Open in LinkedIn" → Britt schrijft en verstuurt zelf.
4. Lege Acties-tab: "Alles gedaan, tijd om verder te fladderen."

## Flow D — Bestaande persoon herkennen
- Match op **profiel-URL**: zelfde persoon → nieuwe ontmoeting aan de tijdlijn toevoegen.
- Zonder URL (Flow A, nog niet geplakt): match op **naam** (hoofdletters en extra spaties tellen niet). De app vraagt
  "Is dit dezelfde persoon?" met bedrijf en datum van de laatste ontmoeting. Ja → nieuwe ontmoeting bij die persoon;
  nee → nieuwe persoon ([B15](beslissingen.md)).

## Doorgeef-modus — eisen
- Groot, vriendelijk formulier; geen lijst of notities zichtbaar.
- Begroeting: "Hoi! Ik ben Britt, de sociale vlinder 🦋 Wie ben jij?" / "Hi! I'm Britt, the social butterfly 🦋 Who are you?"
- Privacy: "Je naam wordt alleen op Britts telefoon bewaard." / "Your name is only stored on Britt's phone."
- Tip: iOS **Begeleide toegang** voorkomt dat de gast uit de app tikt.
