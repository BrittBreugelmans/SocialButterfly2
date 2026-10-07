# Sparringsessie concept — De Sociale Vlinder

- **Datum:** 2026-10-02 t.e.m. 2026-10-07
- **Deelnemers:** Britt, Claude
- **Type:** samenvatting van het gesprek (geen letterlijk transcript)

## Aanleiding
Britt wil een mobiele app om op conferenties en beurzen efficiënt te connecteren op LinkedIn.
Ze heeft nog nooit genetwerkt en vindt het ongemakkelijk om naar iemands naam te vragen.
Een zelfgebouwde app moet dat oplossen: het toont dat ze echt wil netwerken, en als developer
maakt het een goede indruk dat ze er zelf een app voor bouwde.

## Verloop en beslissingen (in volgorde)
1. Britt wil eerst concept en ontwerp, geen code. Eerst sparren, samen beslissen.
2. Opslag: voorlopig alleen op haar telefoon, maar later moet de app online kunnen.
3. Claude: LinkedIn laat geen connectieverzoeken of berichten versturen via apps, en zoeken in
   het ledenbestand kan enkel voor partners. Scrapen is tegen de voorwaarden.
4. Kernidee van Britt: iemand geeft zijn naam in, de app vindt het LinkedIn-profiel en bewaart naam + URL.
   Ook LinkedIn-QR scannen. Een notitiekolom om later persoonlijke berichten te sturen.
5. Opties voor zoeken: (a) zoek-API (betalend), (b) zelf URL ingeven, (c) combinatie.
   **Britt wil niet betalen** → geen zoek-API.
6. Oplossing: de app opent de LinkedIn-zoekpagina met naam + bedrijf; de persoon wijst zichzelf aan;
   Britt connecteert ter plekke. Vervolgens wordt de profiel-link geplakt ("volledig" gekozen).
7. QR: naam afleiden uit de URL is oké.
8. Geen berichtsjablonen: Britt schrijft zelf berichten; de app bewaart alleen haar notitie.
9. Britt heeft een **iPhone** → PWA via Safari (gratis). Klembord-plakken vraagt op iOS een bevestiging.
   CSV-export als back-up.
10. Invoer: **beide** — doorgeef-modus (de ander tikt) en snelle modus (Britt tikt).
11. Evenementen: een **actief evenement** kiezen; nieuwe contacten komen daar automatisch onder.
12. Notitie: meteen of later. Lege notities verschijnen op een aparte **Acties-tab**, waar je een
    herinnering ook kan afwijzen.
13. Acties: notitie ontbreekt, nog niet geconnecteerd, profiel-link ontbreekt.
14. Showcase: **mooie details** en **eigen QR tonen**.
15. Taal: **wisselbaar NL/EN**. Stijl: **LinkedIn-achtig** (blauwe tinten), zonder LinkedIn-logo.
16. Naam: Britt wil een ludieke naam (zoals "Het Grootste Licht"). Voorstellen: Wie Ben Jij Ook Alweer?,
    Da's Link!, Muurbloem, De Sociale Vlinder, Handjeklap, Het Klikt.
    **Gekozen: De Sociale Vlinder** — "ik ben eigenlijk wel een sociale vlinder, en in IT is dat niet zo normaal."
17. Brandingideeën: vlinderlogo met vleugels als netwerkknooppunten; doorgeef-scherm
    "Hoi! Ik ben Britt, de sociale vlinder 🦋 Wie ben jij?"; vlinder fladdert bij opslaan;
    lege Acties-tab "Alles gedaan, tijd om verder te fladderen"; vlinder in het midden van de eigen QR.
18. Bouwen: **samen** — combinatie van zelf coderen en feature-driven development (zoals Spec Kit).
    Britt wil nu vooral **context engineering** leren vóór het coderen.
19. Geen LinkedIn → **niet opslaan** (alleen LinkedIn-contacten).
20. Dezelfde persoon op een ander evenement → **herkennen en koppelen** (tijdlijn per persoon).
21. Privacy in doorgeef-modus: **korte geruststelling** ("Je naam wordt alleen op Britts telefoon bewaard").
22. Werkwijze: constitution laten genereren met een goede prompt (zoals collega Kevin doet).
    Sparringgesprekken als vaste stap vóór development; context vastleggen in bestanden.
23. Context uitbreiden volgens het **LLM Wiki**-patroon: raw → wiki → schema.
24. Offline vs. zoeken: Britt trekt de app liever **online** (internet vereist, draait op haar toestel)
    dan het opzoeken te schrappen. Offline werken is geen eis.
25. Projectsetup: starten vanuit een lege map in VS Code (geen .NET-solution).
