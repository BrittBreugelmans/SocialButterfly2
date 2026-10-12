# Log

Nieuwste bovenaan. Formaat: `datum — bron — wat veranderde`.

- **2026-10-12** — implementatie F10 (`/speckit-implement`) — Instellingen-tab:
  - CSV-back-up via het deelmenu van de iPhone (puntkomma, BOM, `'` vóór formules);
  - laatste back-up = moment van de momentopname;
  - back-upherinnering op Toevoegen, met "Later" (T10, T11, B40);
  - evenementen aanpassen en verwijderen; de ontmoetingen blijven, zonder evenement (B38);
  - de taalknop, de versie en Diagnostics staan nu in Instellingen;
  - alle data wissen na het typen van "WISSEN" (B41).

  `EventInUseError` en `ComingSoon` zijn weg. Geen nieuwe bibliotheek, geen schemawijziging.
  419 tests groen (was 344), build OK, bundel +3,3 kB gecomprimeerd. 48 van 51 taken klaar;
  open: push (T049), controle op de iPhone (T050) en afvinken in features.md (T051). De tekst
  van de herinnering is nog te keuren (merk-en-stijl).

- **2026-10-12** — gesprek met Britt (F11) — M9: voorlopig logo = voorstel B (Netwerkvleugels);
  Britt levert zelf nog een eigen logo (12 of 13 okt). M10: witte icoonachtergrond (open vraag
  #16 gesloten). Taken F11: T003 afgevinkt, T005 vervalt.

- **2026-10-12** — taken F10 (`/speckit-tasks`) ([tasks](../specs/009-settings-data/tasks.md)) — 51
  taken in 8 fases: setup, fundament (veld, teksten, lege Instellingen-tab met versie en
  Diagnostics), dan per user story (CSV-back-up, herinnering, evenementen beheren, taal, alle data
  wissen), daarna afwerking. MVP = back-up + herinnering.

- **2026-10-12** — gesprek met Britt (F11) — M8: kleurenpalet goedgekeurd. Keuzepagina met 3
  logovoorstellen gemaakt ([logo-proposals.html](../specs/010-brand-delight/logo-proposals.html));
  keuze van Britt volgt.

- **2026-10-12** — plan F11 (`/speckit-plan`) ([plan](../specs/010-brand-delight/plan.md)) — Geen
  nieuwe bibliotheek, geen datawijziging. Eén logobestand (`logo.svg`) voor icoon, opstartscherm,
  app en Mijn QR; eerst 3 voorstellen op een keuzepagina (M5). Kleurvoorstel met 12 kleuren, eigen
  blauw `#0d5fb8` i.p.v. LinkedIns `#0a66c2`; alle tekst haalt WCAG AA. Opstartbeelden voor iPhones
  op iOS 17+. Vlinder: 1,2 s, tikken gaan erdoor, niets bij "Beweging beperken". Bekende beperking:
  in het zeldzame B19-geval na een herstart door iOS kan de vlinder één keer vliegen.
  Merk-en-stijl: kleurvoorstel (te keuren).

- **2026-10-12** — plan F10 (`/speckit-plan`) ([plan](../specs/009-settings-data/plan.md)) — Geen
  nieuwe bibliotheek, geen schemawijziging; één nieuw veld `backupReminderLaterOn` in de
  instellingen. CSV: puntkomma, BOM voor Excel, `'` vóór cellen die met `= + - @` beginnen (anders
  ziet Excel een formule). Bestand via het deelmenu van de iPhone ("Bewaar in Bestanden"); het
  bestand staat al klaar vóór de tik, anders weigert iOS het deelmenu. Laatste back-up = moment
  van de momentopname. `deleteEvent` houdt de ontmoetingen (B38). Begrippen: Back-up,
  Back-upherinnering, Alle data wissen. Merk-en-stijl: tekst van de herinnering (te keuren).
  Na te kijken op de iPhone: annuleren in Bestanden, Excel met Belgische instellingen.

- **2026-10-12** — spec F11 (`/speckit-specify`) met Britt ([spec](../specs/010-brand-delight/spec.md)) —
  M5 (logo getekend in het project, Britt keurt goed; anders maakt ze het zelf), M6 (geen donkere
  modus), M7 (vlinder fladdert bij het afsluiten van het notitiescherm). Merk-en-stijl bijgewerkt.

- **2026-10-12** — clarify F10 (`/speckit-clarify`) met Britt ([spec](../specs/009-settings-data/spec.md)) —
  B39 (CSV met puntkomma), B40 (back-upherinnering ook bij wijzigingen, breidt T10/T11 uit),
  B41 (alle data wissen: woord typen). Spec: FR-005, FR-009a, FR-018, user stories 2 en 5, SC-003.
  Flows (Instellingen) bijgewerkt.

- **2026-10-12** — testlijst voor een externe tester ([testlijst](../specs/testlijst-v1.html)) — 58
  stappen over F0–F9, per stap OK / Probleem / Overgeslagen en een notitie, met een verslag om te
  kopiëren en naar Britt te sturen. Vinkjes blijven alleen op het toestel van de tester.

- **2026-10-12** — spec F10 (`/speckit-specify`) met Britt ([spec](../specs/009-settings-data/spec.md)) —
  B35 (CSV: één rij per ontmoeting), B36 (geen import in v1), B37 (standaardtaal NL; doorgeef-modus
  volgt de app), B38 (evenement verwijderen: ontmoetingen blijven, zonder evenement). Open vragen
  #6 en #8 gesloten. Bijgewerkt: flows (Instellingen), features.md (⚠️ bij F10 weg), constitution
  v1.0.6 (#6 en #8 uit de open vragen).

- **2026-10-12** — implementatie F9 (`/speckit-implement`) — Mijn QR-tab:
  - de eerste keer "Plak LinkedIn-link" (regels van F4, gedeelde functie `pasteProfileUrl`);
  - daarna de QR, lokaal gemaakt met uqr, foutcorrectie H, donkerblauw op wit, met de vlinder in
    het midden, en eronder "Scan mij om te connecteren" / "Scan me to connect";
  - "Link aanpassen";
  - het scherm blijft aan via de Screen Wake Lock-API;
  - het offline-scherm heeft "Toon mijn QR" (B34); komt de verbinding terug, dan blijft de app op
    Mijn QR.

  Een test leest de QR terug met jsQR voor vier soorten links. Eigen link als `ownerProfileUrl`
  in de instellingen, geen schemawijziging. 344 tests groen (was 290), build OK, bundel +6,4 kB
  gecomprimeerd. 29 van 32 taken klaar; open: push (T030), controle op de iPhone (T031) en
  afvinken in features.md (T032).

- **2026-10-12** — taken F9 (`/speckit-tasks`) ([tasks](../specs/008-my-qr/tasks.md)) — 32 taken
  in 7 fases: setup (uqr installeren), fundament (eigen link opslaan, gedeelde plakfunctie, teksten,
  lege Mijn QR-tab), dan per user story (QR tonen + offline-knop, link instellen, link aanpassen,
  scherm aan), daarna afwerking. MVP = QR tonen + link instellen.

- **2026-10-12** — plan F9 (`/speckit-plan`) met Britt ([plan](../specs/008-my-qr/plan.md)) — B34:
  start de app zonder internet, dan heeft het offline-scherm een knop "Toon mijn QR" (spec FR-010b).
  Eigen link als optioneel veld `ownerProfileUrl` in de instellingen; geen schemawijziging. Nieuwe
  bibliotheek **uqr 0.1.3** (gratis, open source) om de QR te maken. Foutcorrectie H, vlinder in
  het midden; een test leest de QR terug met jsQR. Donkerblauw op wit. Scherm blijft aan via de
  Screen Wake Lock-API; in een beginscherm-app werkt die pas vanaf iOS 18.4, anders gebeurt er
  niets. Plakregels van F4 in één gedeelde functie. Na te kijken op de iPhone: iOS-versie, scannen
  met camera en LinkedIn-app.

- **2026-10-12** — clarify F9 (`/speckit-clarify`) met Britt ([spec](../specs/008-my-qr/spec.md)) —
  Onder de QR één zin in beide talen tegelijk: "Scan mij om te connecteren" / "Scan me to connect";
  geen naam, geen taalknop (vaste tekst in merk-en-stijl). De tabbalk blijft zichtbaar; geen aparte
  volledig-scherm-stand.

- **2026-10-12** — spec F9 (`/speckit-specify`) met Britt ([spec](../specs/008-my-qr/spec.md)) —
  `specs/008-my-qr` aangemaakt. Open vraag #12 beslist: B32 (QR lokaal maken uit de profiel-URL).
  B33: eigen profiel-URL eenmalig plakken op Mijn QR, aanpasbaar daar. Nieuw begrip "Eigen
  profiel-URL" (`ownerProfileUrl`). Flows (tab Mijn QR), open-vragen en features.md bijgewerkt.
  Of de eigen link in de CSV-export komt, blijft bij open vraag #6.

- **2026-10-12** — implementatie F8 (`/speckit-implement`) — Acties-tab: één kaart per persoon met
  open acties (notitie ontbreekt volgens B31, nog niet geconnecteerd, profiel-link ontbreekt),
  nieuwste eerst; oplossen op de kaart (notitie bij de laatste ontmoeting, LinkedIn + "Ik heb
  geconnecteerd", "Plak LinkedIn-link" met samenvoegvraag), naam opent het detailscherm, afwijzen
  met "Ongedaan maken", komt terug bij een nieuwe ontmoeting (B30). Teller op de tab ("99+" boven
  99). Database naar schemaversie 2 (tabel `dismissals`), upgrade getest met bestaande data. 290
  tests groen (was 254), build OK, geen nieuwe bibliotheken. 28 van 31 taken klaar; open: push
  (T029), controle op de iPhone (T030) en afvinken in features.md (T031).

- **2026-10-11** — taken F8 (`/speckit-tasks`) ([tasks](../specs/007-actions-tab/tasks.md)) — 31 taken
  in 7 fases: fundament (schemaversie 2, actieregels, teksten), dan per user story (lijst,
  oplossen, afwijzen, teller), daarna afwerking. MVP = lijst + oplossen.

- **2026-10-11** — plan F8 (`/speckit-plan`) ([plan](../specs/007-actions-tab/plan.md)) — Eerste
  schemawijziging sinds F0: versie 2 voegt de tabel `dismissals` toe (persoon + type + moment),
  bestaande data blijft ongemoeid. Acties worden in het geheugen afgeleid; een afwijzing telt tot er
  een nieuwere ontmoeting is (B30). Teller op de tab via een centraal signaal na elke schrijfactie.
  Detailscherm en "Plak LinkedIn-link" uit F7 hergebruikt. Geen nieuwe bibliotheken, geen nieuwe
  beslissingen of open vragen.

- **2026-10-11** — spec F8 (`/speckit-specify`) met Britt
  ([spec](../specs/007-actions-tab/spec.md)) — B30: een afgewezen actie komt terug bij een nieuwe
  ontmoeting (open vraag #3 gesloten; constitution 1.0.5). B31: "notitie ontbreekt" alleen als geen
  enkele ontmoeting een notitie heeft; alle drie de acties horen bij een persoon. begrippen.md
  (Actie, Afgewezen actie) en features.md (F8) bijgewerkt.

- **2026-10-11** — wijziging F7 op vraag van Britt — B28: notitie hoort bij een ontmoeting (open
  vraag #5 gesloten; constitution 1.0.4). B29: F6 gaat op in F7; de aanpasmodus van het
  detailscherm past naam, bedrijf en de notitie van elke ontmoeting aan, alles in één keer bewaard.
  Spec (US7, FR-010, FR-014b, SC-009), plan, research, datamodel, contracten, quickstart en taken
  (T042–T046) bijgewerkt; features.md: F6 verwijst naar F7. 254 tests groen, build OK.

- **2026-10-11** — implementatie F7 (`/speckit-implement`) — Tabbalk (Toevoegen, Contacten, Acties,
  Mijn QR, Instellingen; de laatste drie "Binnenkort"). Contacten: lijst per evenement / zonder
  evenement / alle, zoeken op naam (accenten tellen niet), detail met tijdlijn en notities, "Open in
  LinkedIn" of zoeklink, "Plak LinkedIn-link", connectiestatus, naam/bedrijf aanpassen, ontmoeting
  of persoon verwijderen met bevestiging. "Plak LinkedIn-link" is nu één gedeeld onderdeel van
  notitiescherm en detail. Diagnose: "500 testcontacten toevoegen". 248 tests groen (was 200),
  build OK, geen nieuwe bibliotheken. 38 van 41 taken klaar; open: push (T039), controle op de
  iPhone (T040) en afvinken in features.md (T041).

- **2026-10-11** — taken F7 (`/speckit-tasks`) ([tasks](../specs/006-contacts/tasks.md)) — 41 taken
  in 10 fases: fundament (tabbalk, teksten, lijsthulpen), dan per user story (lijst, zoeken,
  detail, status, persoon verwijderen, ontmoeting verwijderen, naam/bedrijf aanpassen), daarna
  afwerking. MVP = lijst + zoeken + detail.

- **2026-10-11** — plan F7 (`/speckit-plan`) ([plan](../specs/006-contacts/plan.md)) — Tabbalk
  zonder router; lijst en zoeken in het geheugen (hoofdletters, spaties en accenten tellen niet);
  nieuwe opslagfuncties voor naam/bedrijf aanpassen en één ontmoeting verwijderen; "Plak
  LinkedIn-link" wordt een gedeeld onderdeel van notitiescherm en detailscherm. Geen nieuwe
  bibliotheken, geen schemawijziging. Diagnostics krijgt "500 testcontacten toevoegen" voor de
  snelheidstest. Geen nieuwe beslissingen of open vragen.

- **2026-10-11** — spec F7 (`/speckit-specify`) met Britt
  ([spec](../specs/006-contacts/spec.md)) — B25: één ontmoeting verwijderen, de laatste = hele
  persoon. B26: volledige tabbalk met tab "Toevoegen"; nog niet gebouwde tabs tonen "binnenkort".
  B27: naam en bedrijf aanpassen op het detailscherm. flows.md (tabs) en features.md (F7)
  bijgewerkt.

- **2026-10-11** — bugfix F1 na melding Britt — B23: een evenement dat vandaag niet loopt, kan je
  kiezen na een waarschuwing. B24: een nieuw evenement dat later begint, wordt bewaard maar niet
  actief. F1-spec (FR-004, FR-007), contract en taken bijgewerkt; 200 tests groen. Ontmoetingen die
  al onder het verkeerde evenement staan, zijn niet aangepast. Nog te controleren op de iPhone
  (F1 T036).

- **2026-10-11** — rollout en iPhone-controle F5 door Britt — Gepusht als `22df4b0`. iOS vraagt om
  camera-toegang; scannen gaat heel snel. Alle taken van F5 en F5 in features.md afgevinkt. Bug
  gemeld: een evenement dat pas morgen begint, kan vandaag al actief zijn (zie F1).

- **2026-10-11** — implementatie F5 (`/speckit-implement`) — "Scan QR" op het startscherm: camera,
  bevestigingsscherm met afgeleide naam en optioneel bedrijf, één tik opent het profiel en bewaart.
  Bekende persoon via link → nieuwe ontmoeting; zelfde naam zonder link → "Is dit dezelfde
  persoon?". jsQR zit in een apart stuk van de app (47 kB gecomprimeerd). 194 tests groen, build
  OK. 21 van 24 taken klaar; open: push (T022), controle op de iPhone met een tweede telefoon
  (T023) en afvinken (T024).

- **2026-10-11** — plan F5 (`/speckit-plan`) — Plan, research, datamodel, contracts en quickstart
  voor F5. Eerste extra bibliotheek: **jsQR 1.4.0** (gratis, open source) om QR-codes te lezen,
  want Safari kan dat zelf niet; alleen geladen op het scanscherm. Geen nieuwe velden; bewaren via
  dezelfde functie als F2 (`addByName`, nu met profiel-link).

- **2026-10-11** — spec F5 (`/speckit-specify`) — `specs/005-add-by-qr` aangemaakt. B22: optioneel
  bedrijfsveld bij een QR-scan; open vraag #4 daarmee volledig beslist. Flow B, open-vragen en
  constitution (1.0.3) bijgewerkt. Spec klaar voor `/speckit-plan`.

- **2026-10-09** — rollout en iPhone-controle F4 door Britt — F4 geïmplementeerd. Gepusht als
  `7719aa4`; live op socialbutterfly2.pages.dev. Controles op de iPhone in orde, ook de
  iOS-"Plakken"-bubbel. Alle taken van F4 afgevinkt; F4 in features.md volledig afgevinkt. Ook de
  laatste F2-controle (T036: één tik opent LinkedIn, schakelaar) afgevinkt.

- **2026-10-09** — implementatie F4 (`/speckit-implement`) — "Plak LinkedIn-link" op het
  notitiescherm: link opkuisen tot `https://www.linkedin.com/in/<handle>`, opslaan, "Open LinkedIn"
  opent daarna het profiel. Link van een andere persoon → vraag "Samenvoegen?" (B21); samenvoegen
  houdt alle ontmoetingen en notities. 165 tests groen, build OK. 18 van 21 taken klaar; open:
  push (T019), controle op de iPhone (T020, ook de iOS-"Plakken"-bubbel) en afvinken (T021).

- **2026-10-09** — plan F4 (`/speckit-plan`) — Plan, research, datamodel, contracts en quickstart
  voor F4. Geen nieuwe velden, geen schemawijziging. Klembord lezen direct bij de tik (lessen uit
  F2); links worden genormaliseerd tot `https://www.linkedin.com/in/<handle>` (kleine letters);
  samenvoegen in één transactie, met beide notities bewaard.

- **2026-10-09** — spec F4 (`/speckit-specify`, feedback Britt: link plakken op het notitiescherm) —
  `specs/004-link-profile` aangemaakt. B21: bij een profiel-link die al bij een andere persoon hoort,
  eerst vragen "Samenvoegen?". Flow D en features.md bijgewerkt. Spec klaar voor `/speckit-plan`.

- **2026-10-09** — keuze Britt na de iPhone-controle F2 — B20: "Zoek op LinkedIn" opent LinkedIn
  met dezelfde tik en bewaart tegelijk; terug naar 2 tikken. De naamcontrole gebeurt nu tijdens
  het typen. Spec (FR-009), research R1, contracts, quickstart en taken bijgewerkt; 119 tests
  groen. Nog te controleren op de iPhone (T036).

- **2026-10-09** — feedback Britt na de iPhone-controle F2 — LinkedIn opent op de iPhone **niet
  automatisch**; Britt tikt op de link. Die link is nu een knop bovenaan het notitiescherm (blauw
  als LinkedIn niet openging); de melding "LinkedIn ging niet open" is weg. De schakelaar
  "Ik heb geconnecteerd" had een verkeerde vorm door de algemene invoerstijl; opgelost. Zie B20 hierboven.

- **2026-10-09** — rollout en iPhone-controle F2 door Britt — F2 geïmplementeerd. Gepusht als
  `ce775f5`; live op socialbutterfly2.pages.dev. Controles op de iPhone in orde. Alle taken van F2
  afgevinkt; F2 in features.md volledig afgevinkt. De zoek-link opent niet automatisch (zie
  hierboven).

- **2026-10-09** — implementatie F2 (`/speckit-implement`) — Toevoegen via naam gebouwd: formulier,
  "Is dit dezelfde persoon?", notitiescherm met "Ik heb geconnecteerd", terugkeer na sluiten door
  iOS. 118 tests groen, build OK. 29 van 32 taken klaar; open: push (T030), controle op de iPhone
  (T031, ook hoe LinkedIn opent) en afvinken in features.md (T032).

- **2026-10-09** — plan F2 (`/speckit-plan`) — Plan, research, data model, contracts en quickstart
  voor F2. Eén nieuw Settings-veld (`noteStepEncounterId`), geen schemawijziging. LinkedIn opent na
  het opslaan; een link op het notitiescherm vangt een geblokkeerde opening op. Te controleren op de
  iPhone: opent de zoek-link in de LinkedIn-app, Safari of een browservenster (quickstart 3).

- **2026-10-09** — clarify F2 (`/speckit-clarify`) — B18 (notitiescherm komt terug na sluiten door
  iOS, dezelfde dag) en B19 (zelfde persoon twee keer op één dag: geen tweede ontmoeting). F2-spec
  en Flow A bijgewerkt.

- **2026-10-09** — antwoorden Britt op de F2-vragen (`/speckit-specify`) — Open vragen #1, #2 en
  (deels) #4 beslist: B15 (zelfde naam → "Is dit dezelfde persoon?"), B16 ("Ik heb geconnecteerd" op
  het notitiescherm), B17 (bedrijf optioneel). F2-spec (`specs/003-add-by-name`) zonder open
  markers. Flows A en D, begrippen, features.md en constitution (1.0.2) bijgewerkt. Nog open uit #4:
  bedrijf bewaren bij een QR-scan (F5).

- **2026-10-09** — rollout en iPhone-controle F1 door Britt — F1 geïmplementeerd. Gepusht als
  `512a9ff`; live op socialbutterfly2.pages.dev. Controles op de iPhone in orde (quickstart 2–5).
  Alle taken van F1 afgevinkt; F1 in features.md volledig afgevinkt. Ontmoetingen onder het actieve
  evenement werken in de opslag; zichtbaar in de app vanaf F2.

- **2026-10-09** — implementatie F1 (`/speckit-implement`) — Keuzescherm, formulier nieuw evenement,
  contextbalk en dagelijkse keuze gebouwd; 66 tests groen, build OK. 28 van 31 taken klaar; open:
  push (T029), controle op de iPhone (T030) en afvinken in features.md (T031).

- **2026-10-09** — spec F1 (`/speckit-specify`) met Britt — Spec `specs/002-events` aangemaakt.
  Beslissingen B13 (keuze bij eerste keer openen per dag) en B14 (evenementen beheren in F10).

- **2026-10-08** — rollout en iPhone-controle F0 door Britt — App live op
  socialbutterfly2.pages.dev (build via Cloudflare, Node 24.13.0). Controles op de iPhone in orde.
  Alle taken van F0 afgevinkt; F0 in features.md volledig afgevinkt.

- **2026-10-08** — implementatie F0 (`/speckit-implement`) — App in `app/` gebouwd (TypeScript,
  Vite, React, Dexie, PWA); 33 tests groen, build OK. 35 van 41 taken klaar; open: rollout (T022),
  controles op de iPhone (T023, T032, T037, T039) en afvinken in features.md (T041). Nog niet gepusht.

- **2026-10-08** — analyse F0 (`/speckit-analyze`) met Britt — Spec: FR-013 geldt voor Person,
  Encounter en Event (Settings alleen `updatedAt`); FR-005: volledig scherm alleen bij opstarten
  zonder internet, anders een banner. Datamodel en taken: Settings krijgt `key`; F0 weigert een
  niet-genormaliseerde `profileUrl`; volle opslag overal zichtbaar via `onStorageFull`.
  features.md: "Klaar voor de eerste beurs" vraagt nu dat verwijderen (F7) en CSV-export (F10) werken.

- **2026-10-08** — correcties van Britt vóór tasks — T7 verwijst voor het adres naar T12.
  T13 toegevoegd (Node 24 in `app/.nvmrc` en Cloudflare `NODE_VERSION`). Plan F0: sectie
  "Rollout": Cloudflare-build-instellingen pas actief in de push met `app/package.json`;
  placeholder blijft online bij een mislukte build. Lint: `sociale-vlinder.pages.dev` stond
  nergens; geen tegenstrijdige hostingconfig. features.md (F0 stack/hosting afgevinkt,
  ⚠️ #10/#11 vervangen), checklist-notitie en constitution v1.0.1 (#7, #11 uit open vragen)
  bijgewerkt.

- **2026-10-08** — plan F0 met Britt — T11 (back-upherinnering na netwerken zonder evenement),
  T12 (adres socialbutterfly2.pages.dev). Open vraag #15 gesloten.

- **2026-10-08** — plan F0 met Britt — Beslissingen B11 (evenement met start- en einddatum),
  B12 (netwerken zonder evenement), M4 (label "SB", naam volgt taal); T10 bijgewerkt naar einddatum.
  Open vraag #7 gesloten, #15 toegevoegd. Begrippen: Evenement, Zonder evenement. Features F1 bijgewerkt.

- **2026-10-08** — clarify F0 met Britt ([spec](../specs/001-app-foundation/spec.md)) — Beslissingen
  T7–T10: Cloudflare Pages, TypeScript + Vite + React, blijvende opslag op het toestel met
  waarschuwing, back-upherinnering na elk evenement. Open vragen #10 en #11 gesloten.

- **2026-10-07** — constitution v1.0.0 gegenereerd met [constitution-prompt.md](../specs/constitution-prompt.md);
  spec F0 aangemaakt.

- **2026-10-07** — gesprek met Britt — Beslissing T6: internet vereist, offline geen eis. Open vraag "offline vs. zoeken" gesloten; constitution-prompt en linkedin-beperkingen bijgewerkt.

- **2026-10-07** — [raw/2026-10-07-sparring-concept.md](../raw/2026-10-07-sparring-concept.md) —
  Wiki opgezet. Pagina's aangemaakt: visie, begrippen, beslissingen, linkedin-beperkingen,
  flows, merk-en-stijl, open-vragen. Constitution-prompt toegevoegd in `specs/`.
