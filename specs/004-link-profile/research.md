# Research: F4 — Link the Profile URL

**Date**: 2026-10-09 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F4 builds on F0–F2 (see [../003-add-by-name/research.md](../003-add-by-name/research.md)). No new
libraries.

## R1. Reading the clipboard on the iPhone (FR-001, T5)

- **Decision**: `readClipboardText()` in `src/platform/clipboard.ts` calls
  `navigator.clipboard.readText()` **directly** in the tap handler, before any `await`.
  - iOS then shows its own "Paste" bubble next to the button; the owner taps it (T5).
  - It returns the text, `'dismissed'` when the promise rejects (bubble dismissed or refused),
    or `'unsupported'` when the API is missing.
  - `'dismissed'` shows nothing (she can tap again); `'unsupported'` shows `link.unsupported`.
- **Rationale**: F2 showed that iOS blocks actions that come after an `await` (F2 research R1).
  Reading in the same handler keeps it a direct tap. Safari supports `readText` since 13.1.
- **Alternatives considered**: a text field where she pastes by long-press (an extra step every
  time; kept out per constitution X, can be added if the iPhone check fails); reading the
  clipboard automatically on return (iOS does not allow silent reading, T5).

## R2. Normalizing a profile link (FR-002, FR-003)

- **Decision**: a pure `normalizeProfileUrl(text)` returns `{ ok: true, url }` or
  `{ ok: false, reason: 'notProfile' | 'shortLink' }`:
  1. Find the first link in the text: a token containing `linkedin.com/` or `lnkd.in/`
     (with or without `http(s)://`). None → `notProfile`.
  2. `lnkd.in` → `shortLink` (cannot be resolved without visiting it, L1).
  3. Parse it with `new URL` (add `https://` when missing). The host must be `linkedin.com` or
     end in `.linkedin.com` (`www`, `be`, `nl`, `m`, …). Otherwise `notProfile`.
  4. Split the path; find the segment `in`; the next segment is the handle (this also covers
     `/mwlite/in/<handle>` and `/in/<handle>/details/…`). Missing or empty → `notProfile`.
  5. Handle: `decodeURIComponent`, trim, lowercase, then `encodeURIComponent`. A broken `%`
     sequence → `notProfile`.
  6. Result: `https://www.linkedin.com/in/<handle>`; no query, fragment or trailing slash.
- **Rationale**: the same profile always gives the same string (SC-002), whatever app or browser
  it came from. LinkedIn handles are case-insensitive. The output passes F0's
  `isNormalizedProfileUrl`.
- **Alternatives considered**: keeping the case of the handle (two strings for one profile).

## R3. Linking without a merge (FR-004, FR-006)

- **Decision**: `linkProfileUrl(personId, profileUrl)` runs one transaction:
  - the link already on this Person → `{ status: 'unchanged', person }`;
  - the link on another Person → `{ status: 'conflict', other }`, **nothing written**;
  - otherwise set `profileUrl` (replacing an older one) and `updatedAt` → `{ status: 'linked', person }`.
- **Rationale**: the check and the write happen in the same transaction, so no other write can
  slip in between. The merge question (B21) is UI; the merge itself is a second, explicit call.

## R4. Merging two Persons (FR-006–FR-008, B21)

- **Decision**: `mergePersons({ fromPersonId, intoPersonId, noteDraft? })` runs **one**
  transaction over `persons`, `encounters` and `settings`:
  1. `into` keeps `name`, `profileUrl` and `searchUrl`; gets `from.company` if it had none;
     `connectionStatus = 'connected'` if either was connected.
  2. If `noteDraft` is given, it is first used as the note of the open note-step Encounter
     (`Settings.noteStepEncounterId`) of `from` (so unsaved typing is not lost).
  3. Each Encounter of `from`: when `into` has an Encounter with the same `date` and the same
     `eventId` (both absent for casual), its note is added to that Encounter's note on a new line
     (empty notes skipped) and the `from` Encounter is deleted (B19). Otherwise its `personId`
     becomes `into.id`.
  4. `noteStepEncounterId` is moved to the Encounter that now holds the note step.
  5. `from` is deleted.
  Returns `{ person: into, noteStepEncounter }`.
- **Rationale**: nothing is lost and no duplicate Encounter remains (constitution IX, SC-003).
  One transaction: a failure leaves both Persons as they were (FR-007).
- **Alternatives considered**: keeping the note-step Person and moving the other one into it
  (B21 and the spec keep the Person that already had the link).

## R5. The note step after linking or merging (FR-004, FR-008)

- **Decision**:
  - `NoteStep` keeps the current `person` in state, so after linking "Open LinkedIn" uses the
    profile link at once (F2 `linkedInUrlFor`).
  - After a merge, `NoteStep` calls `onMerged({ person, encounter, note })`; `App` replaces its
    note-step state. `NoteStep` is keyed on `person.id` + `encounter.id`, so it remounts with the
    merged Person, its status and the merged note.
  - The merge question is shown inside the note step (no new screen); `link.merged` confirms.

## R6. Messages

- **Decision**: one message area under the paste button with `role="status"`:
  `link.invalid` (no profile link), `link.shortLink`, `link.unsupported`, `link.merged`.
  A successful link shows the line `link.linked` with the short form `linkedin.com/in/<handle>`.
