# Beslissingen

Formaat: **beslissing** — reden — verworpen alternatieven. Bindend tenzij Britt ze herziet.

## Product
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| B1 | 2026-10-02 | **Eerst concept en context, dan code.** | Samen beslissen; leren werken met context engineering. | Meteen prototype bouwen |
| B2 | 2026-10-02 | **Alleen LinkedIn-contacten** bewaren. | De app draait rond LinkedIn. | Contacten zonder LinkedIn met e-mail/telefoon |
| B3 | 2026-10-02 | **Geen berichtsjablonen**; Britt schrijft zelf, de app bewaart enkel de notitie. | Berichten moeten echt persoonlijk zijn. | Concepten genereren uit de notitie |
| B4 | 2026-10-02 | **Twee invoermodi**: doorgeef-modus én snelle modus. | Soms tikt de gast, soms Britt. | Slechts één modus |
| B5 | 2026-10-02 | **Actief evenement** kiezen bij aankomst. | Snelheid: niet per contact invullen. | Per contact kiezen; geen evenementen |
| B6 | 2026-10-02 | **Notitie meteen of later**; lege notities op een aparte **Acties-tab**, afwijsbaar. | Op een beurs is niet altijd tijd. | Alleen meteen / alleen later |
| B7 | 2026-10-02 | Acties: **notitie ontbreekt, nog niet geconnecteerd, profiel-link ontbreekt**. | Niemand vergeten na het evenement. | "Bericht nog niet gestuurd" (niet gekozen) |
| B8 | 2026-10-07 | **Herkennen en koppelen**: dezelfde persoon op een ander evenement = zelfde Persoon, nieuwe Ontmoeting. | Tijdlijn per persoon. | Per evenement apart opslaan |
| B9 | 2026-10-07 | **Privacygeruststelling** in de doorgeef-modus. | Eerlijk; schept vertrouwen. | Geen uitleg |
| B10 | 2026-10-02 | Showcase: **mooie details** + **eigen QR tonen**. | Indruk maken als developer. | Puur functioneel |
| B11 | 2026-10-08 | Een **evenement** heeft een naam, **startdatum en einddatum**. Einddatum niet vóór startdatum; dezelfde dag mag. | Conferenties duren soms meerdere dagen. | Eén datum per evenement |
| B12 | 2026-10-08 | Bij het openen kiest Britt een evenement **of netwerkt zonder evenement** ("casual networking"). Ontmoetingen kunnen zonder evenement bestaan. | Ook buiten conferenties netwerken. | Altijd een evenement verplicht |
| B13 | 2026-10-09 | De keuze (evenement / nieuw evenement / zonder evenement) verschijnt **bij de eerste keer openen op een nieuwe dag**; het evenement van gisteren staat bovenaan als het nog loopt. | Eén tik per dag voorkomt dat ontmoetingen onder het verkeerde evenement of zonder evenement belanden. | Telkens bij openen; alleen als niets gekozen is of het evenement voorbij is |
| B14 | 2026-10-09 | Evenementen **aanpassen en verwijderen hoort bij F10** ("Evenementen beheren"); F1 maakt alleen aan en kiest. | F1 klein houden. | Naam/datums aanpassen in F1; aanpassen én verwijderen in F1 |

## LinkedIn
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| L1 | 2026-10-02 | **Geen scraping, geen onofficiële API's, geen automatisch verzenden.** | Voorwaarden van LinkedIn; Britts account beschermen. | Profielen scrapen |
| L2 | 2026-10-02 | Zoeken via **LinkedIn-zoeklink** (naam + bedrijf); gast wijst zichzelf aan; Britt connecteert ter plekke. | Gratis; ter plekke connecteren = niemand vergeten. | Betaalde zoek-API (Britt wil niet betalen) |
| L3 | 2026-10-02 | **"Volledig"**: profiel-URL achteraf plakken (via klembord). | Echte URL in de database. | Alleen zoek-link bewaren |
| L4 | 2026-10-02 | **QR-scan** van LinkedIn; naam **afgeleid uit de URL**, aanpasbaar. | QR bevat alleen de URL. | Naam altijd manueel |

## Techniek & platform
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| T1 | 2026-10-02 | **Gratis**: geen betaalde diensten of accounts. | Persoonlijk project. | — |
| T2 | 2026-10-02 | **PWA via Safari op iPhone**. | Native iOS vraagt een betaald ontwikkelaarsaccount; zonder verloopt de app na 7 dagen. | Native app, React Native/Expo |
| T3 | 2026-10-02 | **Lokaal opslaan**, maar zo ontworpen dat **sync later** kan zonder herbouw. | Nu enkel op gsm; later online. | Meteen cloud/backend |
| T6 | 2026-10-07 | **Internet is vereist.** De app wordt online gehost en draait op Britts iPhone; data blijft lokaal op het toestel. Offline werken is **geen** eis. | Zoeken op LinkedIn is belangrijker dan offline werken. | Offline-first zonder zoeken; zoeken uitstellen als actie |
| T4 | 2026-10-02 | **CSV-export** als back-up. | Lokale browserdata kan verloren gaan. | — |
| T5 | 2026-10-02 | Klembord via knop **"Plak LinkedIn-link"** (iOS vraagt bevestiging). | iOS laat geen stil klembordlezen toe. | — |
| T7 | 2026-10-08 | Hosting op **Cloudflare Pages**, adres → zie T12, geen eigen domein. | Gratis (T1). Keuze van Britt in clarify F0. | GitHub Pages, Netlify, eigen domein (kost geld) |
| T8 | 2026-10-08 | Stack: **TypeScript + Vite + React**. | Types helpen de data correct te houden; gangbaar, veel PWA-voorbeelden, goede showcase. | Puur HTML/JS, TypeScript zonder framework, beslissen in plan |
| T9 | 2026-10-08 | Opslag in een **database op het toestel**; iOS vragen de data **blijvend** te bewaren; duidelijke **waarschuwing** als iOS weigert. CSV-back-up is het vangnet. | Weinig werk, geen extra tikken op het evenement. | Geen extra bescherming; automatische tweede kopie |
| T10 | 2026-10-08 | **Back-upherinnering na elk evenement**: de eerste keer dat de app opent op een dag na de **einddatum** van het actieve evenement (bijgewerkt 2026-10-08, B11), als er ontmoetingen bijkwamen sinds de laatste back-up. | Net na een evenement staan de meeste nieuwe contacten op de gsm; nooit storen tijdens het evenement. | Elke 7 dagen; bij nieuw actief evenement; nooit automatisch |
| T11 | 2026-10-08 | **Back-upherinnering na netwerken zonder evenement**: de eerste keer dat de app opent op een dag na de datum van die ontmoetingen, als er ontmoetingen bijkwamen sinds de laatste back-up. | Zelfde idee als T10: herinneren de dag erna, nooit tijdens het netwerken. | — |
| T12 | 2026-10-08 | Adres van de app: **https://socialbutterfly2.pages.dev/** | Gratis `pages.dev`-adres (T7). | — |
| T13 | 2026-10-08 | **Node 24** vastgelegd: exacte versie in `app/.nvmrc` én dezelfde waarde in de Cloudflare-omgevingsvariabele `NODE_VERSION`. | Lokaal en online bouwen met dezelfde versie, zodat een build niet lokaal lukt en op Cloudflare faalt. | Standaardversie van Cloudflare gebruiken; alleen de hoofdversie vastleggen |

## Merk
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| M1 | 2026-10-02 | Naam: **De Sociale Vlinder**. | Britt is een sociale vlinder; in IT ongewoon. | Muurbloem, Da's Link!, Wie Ben Jij Ook Alweer?, Handjeklap, Het Klikt |
| M2 | 2026-10-02 | Stijl **LinkedIn-achtig** (blauwe tinten), **zonder** LinkedIn-logo of -merk. | Herkenbaar, maar geen merkinbreuk. | Minimal, donker/tech, warm/speels |
| M3 | 2026-10-02 | Taal **wisselbaar NL/EN**. | Belgische én internationale events. | Alleen NL / alleen EN |
| M4 | 2026-10-08 | Label op het beginscherm: **"SB"**. In de app volgt de naam de taal: "De Sociale Vlinder" (NL) / "The Social Butterfly" (EN). | iOS kapt lange namen af (±12 tekens). | Volledige naam (afgekapt) |

## Werkwijze
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| W1 | 2026-10-07 | **Samen bouwen**: zelf coderen + feature-driven development (Spec Kit-stijl). | Leren én snel resultaat. | Alleen zelf / alleen AI |
| W2 | 2026-10-07 | Constitution **genereren met een prompt** uit de wiki. | Zoals Kevin het doet; prompt = context. | Constitution met de hand schrijven |
| W3 | 2026-10-07 | Context bijhouden volgens het **LLM Wiki**-patroon (raw → wiki → schema). | Één bron van waarheid voor mens en agent. | Context alleen in gesprekken |
