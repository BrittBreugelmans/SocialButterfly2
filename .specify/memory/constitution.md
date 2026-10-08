<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (PATCH: Open Questions list brought up to date)
- Modified principles: none
- Removed from Open Questions: #7 (decided: wiki B12) and #11 (decided: wiki T9–T11)
- Added sections: none | Removed sections: none
- Templates: not modified
- Deferred: remaining Open Questions mirror wiki/open-vragen.md
-->

# De Sociale Vlinder (The Social Butterfly) Constitution

## Purpose

Asking for someone's name at a conference and looking them up on LinkedIn feels awkward, and
afterwards you forget who was who. This personal app makes that moment natural. It is at once
a **tool** (capture LinkedIn contacts fast and correctly, with a personal note), an
**icebreaker** ("I built an app for this, want to type your name?"), and a **showcase** of the
owner's skills as a developer.

- **Users:** the **owner** (Britt, on her iPhone) and the **guest** (the person she meets, who
  may type their own name on her phone in `guestMode`). The owner can also enter data herself
  in `quickMode`.
- **v1 core flows:** add a Person by name (opens a LinkedIn `searchUrl`); add by scanning a
  LinkedIn QR code; write a `note`; follow up open `Action`s; show `myQr`.
- **Ranked quality values.** When two goals conflict, resolve in this order:
  1. **Speed in the moment**: adding someone at a busy event takes seconds and few taps.
  2. **Correctness of data**: no lost contacts, no silent duplicates.
  3. **Delight**: polished design, small butterfly-themed animations.
  4. **Simplicity**: build only what v1 needs (YAGNI).

## Core Principles

Each principle has a **Rule**, a **Rationale** and a **Verify** step for reviewers.

### I. LinkedIn by the Rules (NON-NEGOTIABLE)

- **Rule:** The app MUST interact with LinkedIn only by opening LinkedIn URLs (`searchUrl`,
  `profileUrl`) for the owner to use. It MUST NOT scrape, call unofficial or partner-only APIs,
  or send connection requests or messages automatically. The final tap (Connect, Send) MUST
  always be the owner's, inside LinkedIn.
- **Rationale:** Breaking LinkedIn's terms puts the owner's own account at risk.
- **Verify:** No feature fetches or parses LinkedIn pages or calls LinkedIn endpoints; every
  LinkedIn touchpoint is a link that opens LinkedIn.

### II. Zero Cost

- **Rule:** The app MUST NOT depend on paid services, paid APIs, paid hosting, or paid
  developer/app store accounts.
- **Rationale:** This is a personal project with no budget.
- **Verify:** Every external service in a plan is on a free tier with no card required.

### III. Installable iPhone Web App

- **Rule:** The app MUST be a web app that the owner installs on her iPhone home screen through
  Safari. It MUST NOT require a native iOS build or app store distribution.
- **Rationale:** A native iOS app needs a paid developer account; without one it expires after
  7 days.
- **Verify:** The app installs via Safari "Add to Home Screen" and all v1 flows work from there.

### IV. Online App, Local Data, Sync-Ready

- **Rule:** The app is hosted online and MAY assume an internet connection; offline use is NOT a
  requirement. In v1, all personal data (Persons, Encounters, Events, notes) MUST stay on the
  owner's device and MUST NOT be sent to any server. The data model MUST allow cloud sync to be
  added later without a rewrite (for example: stable unique IDs and change timestamps per record).
- **Rationale:** LinkedIn search needs internet anyway; keeping data local avoids cost and privacy
  risk, while sync is a stated future wish.
- **Verify:** Network traffic contains no personal data; the data model review confirms each
  record can be merged across devices.

### V. LinkedIn-Only Identity

- **Rule:** A Person MUST only be stored if they have, or will get, a LinkedIn `profileUrl`.
  The normalized `profileUrl` MUST be the unique identity of a Person. Meeting a known Person
  again MUST add a new Encounter to that Person, not create a new Person. A name derived from a
  scanned QR URL MUST remain editable.
- **Rationale:** The app is built around LinkedIn, and one timeline per Person is the goal.
- **Verify:** Saving a second Encounter with the same (differently formatted) profile URL yields
  one Person with two Encounters.

### VI. Privacy of the People You Meet

- **Rule:** `guestMode` MUST show a short notice that the guest's data is stored only on the
  owner's phone. `guestMode` MUST NOT show notes, the contact list, or any other Person's data.
  The owner MUST always be able to export all data as CSV and delete any Person or Encounter.
- **Rationale:** The owner stores other people's data and must be honest and in control of it.
- **Verify:** Walk `guestMode` end to end: notice visible, no notes or list reachable; export and
  delete are available from the owner's screens at all times.

### VII. Bilingual, Welcoming Guest Mode

- **Rule:** Every guest-facing screen MUST be available in Dutch and English, with a switch
  visible on that screen. Guest-facing text MUST be short, friendly and lightly playful. The app
  language MUST be switchable between Dutch and English.
- **Rationale:** The owner attends both Belgian and international events.
- **Verify:** Every guest-facing string exists in both languages; the switch works without
  leaving the screen.

### VIII. Speed in the Moment

- **Rule:** Adding a Person at an event MUST take only a few taps. The `activeEvent` MUST be set
  once (on arrival) and MUST NOT be asked per contact. The note MUST be skippable; a skipped note
  becomes an Action. Both `guestMode` and `quickMode` MUST be offered. Any step that slows the
  add flow MUST be justified against this principle.
- **Rationale:** At a busy fair there is rarely time; a slow app makes the moment awkward again.
- **Verify:** Walk each add flow and confirm no mandatory step beyond identifying the Person.

### IX. No Lost Contacts, No Silent Duplicates

- **Rule:** A saved Encounter MUST NOT be lost by any app action other than an explicit delete.
  The app MUST NOT create a duplicate Person without the owner knowing. Every follow-up gap
  (missing note, not yet connected, missing profile link) MUST appear as an Action until it is
  resolved or `dismissed` by the owner.
- **Rationale:** The success criterion is that nobody is forgotten after an event.
- **Verify:** Tests cover save, re-encounter and interrupted flows; the Action list reflects every
  open gap.

### X. Own Brand, Purposeful Delight, Only v1

- **Rule:** The app MAY use LinkedIn-like blue tones but MUST NOT use LinkedIn's logo, name as a
  brand, or other trademarks. Animations and butterfly details SHOULD add delight but MUST NOT
  delay adding a contact. The app MUST NOT generate message templates or drafts; the owner writes
  every message herself. Features outside v1 MUST NOT be built.
- **Rationale:** Recognisable without trademark infringement; delight ranks below speed and
  correctness; personal messages must be truly personal.
- **Verify:** Visual review for trademarks; animations never block input; each feature traces to a
  v1 flow.

## Out of Scope (v1)

- Offline use and offline-first behaviour.
- Cloud sync between devices.
- A guest entering data on their own phone (needs a server).
- Message templates or drafts generated from notes.
- Any automated LinkedIn action, and any contact without LinkedIn (email/phone only).
- Native iOS app, app store distribution, and any paid service.

## Development Workflow

- The wiki is the source of truth for context; terms MUST follow the glossary
  (`wiki/begrippen.md`) in specs and code.
- Order: constitution → spec → plan → tasks → implementation.
- Every plan MUST include a Constitution Check that lists each principle as passed or justified.

## Governance

- This constitution overrides all other practices in this repo.
- **Amending:** first record the decision in `wiki/beslissingen.md` (date, choice, reason,
  rejected options), then regenerate or edit this file via `specs/constitution-prompt.md`.
- **Versioning:** MAJOR = a principle removed or redefined incompatibly; MINOR = a principle or
  section added or materially expanded; PATCH = wording and clarifications.
- **Compliance:** reviews of specs, plans and code check against the principles above.
- Agents MUST NOT resolve open questions themselves; they stay open until the owner decides.

**Version**: 1.0.1 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-08

## Open Questions

Numbers refer to `wiki/open-vragen.md`. Specs MUST NOT assume an answer.

- **#1 Duplicates without URL** (V, IX): match on name (+ company)? Ask or merge automatically
  once the URL is pasted?
- **#2 connectionStatus** (IX): how is "connected" set?
- **#3 dismissed Actions** (IX): permanent, or can they return on a new Encounter?
- **#4 Company** (VIII): required? Stored for QR scans?
- **#5 Note scope** (glossary): per Encounter (current model) or per Person?
- **#6 CSV export** (VI): which columns? Also import as a restore?
- **#8 Default language** (VII): for the owner and for `guestMode`.
- **#9 Ranking of quality values** (Purpose): stated in the prompt; to be confirmed in the wiki.
