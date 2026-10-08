# Log

Nieuwste bovenaan. Formaat: `datum — bron — wat veranderde`.

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
