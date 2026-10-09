# Research: F2 — Add by Name (Quick Mode)

**Date**: 2026-10-09 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F2 builds on the F0 and F1 stack (TypeScript, React, Dexie; see
[../001-app-foundation/research.md](../001-app-foundation/research.md) and
[../002-events/research.md](../002-events/research.md)). No new libraries.

## R1. Opening LinkedIn from the home-screen app (FR-009, FR-011, FR-013)

- **Facts**:
  - LinkedIn's `apple-app-site-association` (checked 2026-10-09) claims
    `search/results/people/*` and `/in/*` for the LinkedIn iOS app. So these links *can* open
    in the LinkedIn app when it is installed.
  - How iOS handles a link from a home-screen web app is not fully documented. It may open the
    LinkedIn app, Safari, or a browser view over the web app. This is checked on the iPhone
    (quickstart section 3).
  - Safari can block `window.open` when it does not follow a tap closely.
- **Decision**:
  1. On "Search on LinkedIn" the app first runs `addByName` (one IndexedDB transaction, a few
     milliseconds), then calls `window.open(url, '_blank')` in the same tap handler.
  2. `openLinkedIn(url)` in `src/platform/openExternal.ts` returns whether a window opened. It
     does not pass the `noopener` feature, because then `window.open` always returns `null` and
     a block cannot be detected; instead it sets `opener = null` on the returned window.
  3. The note step **always** has an "Open LinkedIn" link (a plain `<a target="_blank">`, so a
     direct tap that is never blocked). If `window.open` was blocked, the note step shows the
     hint `note.openFailed` above it. Cost: 1 extra tap only when blocked.
- **Result on the iPhone (2026-10-09)**: the automatic opening is **blocked**; the owner opens
  LinkedIn with the link on the note step. So that link became a full-width button right under
  the title (filled when LinkedIn did not open), and the `note.openFailed` hint was dropped.
- **Revised decision (2026-10-09, B20)**: "Search on LinkedIn" is itself a real link
  (`<a target="_blank">`). The tap opens LinkedIn directly, like the note-step link that works on
  the iPhone, and starts `addByName` in the same handler. To know before the tap whether the
  same-name question is needed, the form runs `findSameNamePersons` while the owner types. In the
  question, picking a Person (unless met today) and "No, new person" are links too. Only when the
  tap comes before the check finished does the app save first and try `window.open` (the old
  path; the note-step button covers a block).
- **Trade-off accepted by the owner**: LinkedIn may open a few milliseconds before the save has
  finished. If the save fails (storage full), the form keeps the input and the F0 banner shows.
- **Rationale**: saving first meets FR-009 and constitution IX. The fallback link removes the
  risk that the opening is blocked, and also helps when LinkedIn found nobody or did not load
  (spec edge case).
- **Alternatives considered**:
  - open first, save afterwards (the save could be lost if iOS suspends the app; breaks FR-009);
  - a separate "Save" tap followed by "Open LinkedIn" (an extra tap every time, against SC-001);
  - LinkedIn's own `linkedin://` URL scheme (undocumented for search; fails without the app).

## R2. The people-search link (FR-010)

- **Decision**: `buildSearchUrl(name, company?)` returns
  `https://www.linkedin.com/search/results/people/?keywords=<keywords>`, where `<keywords>` is
  the trimmed name, plus a space and the trimmed company when given, encoded with
  `encodeURIComponent`.
- **Which link to open**: `linkedInUrlFor(person)` returns `profileUrl` when known, otherwise
  `searchUrl` (FR-011). F7 ("Open in LinkedIn") reuses it.
- **Rationale**: this is the public search URL LinkedIn uses itself. No tracking parameters.
- **Alternatives considered**: separate `firstName`/`lastName`/`company` filters (need splitting
  the name, which fails for many names).

## R3. Name match (FR-006)

- **Decision**: `normalizeName(name)` = trim, collapse repeated spaces, lowercase
  (`toLocaleLowerCase()`). `findSameNamePersons(name)` compares normalized names over all
  Persons in JavaScript.
- **Rationale**: the existing `name` index is case-sensitive and does not ignore spaces. A
  scan over a few hundred Persons takes milliseconds on the phone, and needs no schema change.
- **Not done**: accents (`é` = `e`) and typos are not matched (spec assumption; constitution X).
- **Alternatives considered**: a new normalized index (schema version 2 for little gain);
  Dexie `equalsIgnoreCase` (does not ignore repeated spaces).

## R4. One atomic write per add (FR-007, FR-007a, FR-009, SC-005)

- **Decision**: `addByName({ name, company?, existingPersonId? })` runs **one transaction**
  over `persons`, `events`, `encounters` and `settings`:
  1. new Person (with `searchUrl`, `connectionStatus = 'notConnected'`), or the existing Person;
  2. for an existing Person: look for an Encounter with `date = today` and the same context
     (`eventId === activeEventId`, both absent for casual). Found → reuse it and return
     `alreadyMetToday: true`. Otherwise create one, as `createEncounterInContext` does;
  3. set `Settings.noteStepEncounterId` to that Encounter.
- **Rationale**: no Person without an Encounter, and no note step without its Encounter
  (constitution IX). The context is read inside the transaction, like F1's
  `createEncounterInContext`.
- **Alternatives considered**: calling `createPerson` and `createEncounterInContext` one after
  the other (two transactions: a crash in between leaves a Person without an Encounter).

## R5. A note step that survives iOS closing the app (FR-015, B18)

- **Decision**: store the open note step as `Settings.noteStepEncounterId`.
  - `getNoteStep()` returns `{ person, encounter }` only when the Encounter still exists and its
    `date` is today. Otherwise it returns nothing (a stale id is simply ignored).
  - `finishNoteStep` (save or skip) removes the id.
  - `App` calls `getNoteStep()` on start, after the daily choice (F1) is settled.
  - While a note step is open, the app shows only that step, so quick mode cannot start for
    another person. B18's "not started another person" holds by design; no extra clear
    function is needed.
- **Rationale**: written in the same transaction as the Encounter (R4), so it cannot get lost
  when iOS closes the app in LinkedIn. Settings is not indexed on it: no schema change.
- **Alternatives considered**: `localStorage` (a second store that is not in the same
  transaction); a time limit in minutes (B18 chose "same day").

## R6. "I connected" switch (FR-018, B16)

- **Decision**: an `<input type="checkbox" role="switch">`, styled as a switch. Each change calls
  the existing `updatePerson(id, { connectionStatus })` at once. Its starting value is the
  Person's current status.
- **Rationale**: stored at once, so it survives an iOS kill and does not depend on save or
  skip. No new repository function is needed.

## R7. Screens without a router

- **Decision**: `App` screen state becomes `'choice' | 'newEvent' | 'start' | 'addByName' |
  'noteStep'`. The same-name question is a state *inside* `AddByNameForm`, so going back keeps
  the typed input (FR-008).
- **Rationale**: same approach as F1 R7; still few screens and no deep links.

## R8. Input rules and double taps

- **Decision**:
  - name and company inputs: `maxLength={100}`, `autoComplete="off"`, `autoCapitalize="words"`;
    name gets focus. Long values are cut off on screen with an ellipsis (spec assumption).
  - note: a `<textarea>`, trimmed on save; empty save = skip; skip keeps an existing note
    (FR-007a, FR-016).
  - "Search on LinkedIn" is disabled while the name is blank **and** while saving, so a double
    tap saves once (spec edge case).
  - `StorageFullError`: the form stays filled; F0's banner explains (spec edge case).
