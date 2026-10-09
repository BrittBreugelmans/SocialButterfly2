# Log

Nieuwste bovenaan. Formaat: `datum — bron — wat veranderde`.

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
