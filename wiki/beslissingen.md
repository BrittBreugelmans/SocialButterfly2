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

## Merk
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| M1 | 2026-10-02 | Naam: **De Sociale Vlinder**. | Britt is een sociale vlinder; in IT ongewoon. | Muurbloem, Da's Link!, Wie Ben Jij Ook Alweer?, Handjeklap, Het Klikt |
| M2 | 2026-10-02 | Stijl **LinkedIn-achtig** (blauwe tinten), **zonder** LinkedIn-logo of -merk. | Herkenbaar, maar geen merkinbreuk. | Minimal, donker/tech, warm/speels |
| M3 | 2026-10-02 | Taal **wisselbaar NL/EN**. | Belgische én internationale events. | Alleen NL / alleen EN |

## Werkwijze
| # | Datum | Beslissing | Reden | Verworpen |
|---|---|---|---|---|
| W1 | 2026-10-07 | **Samen bouwen**: zelf coderen + feature-driven development (Spec Kit-stijl). | Leren én snel resultaat. | Alleen zelf / alleen AI |
| W2 | 2026-10-07 | Constitution **genereren met een prompt** uit de wiki. | Zoals Kevin het doet; prompt = context. | Constitution met de hand schrijven |
| W3 | 2026-10-07 | Context bijhouden volgens het **LLM Wiki**-patroon (raw → wiki → schema). | Één bron van waarheid voor mens en agent. | Context alleen in gesprekken |
