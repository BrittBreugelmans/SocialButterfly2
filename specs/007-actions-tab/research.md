# Research: F8 — Actions tab

**Date**: 2026-10-11 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F8 builds on F0–F7. No new library and no new browser API. It adds the first new table since F0.

## R1. Storing dismissals (FR-009, SC-006, constitution IV)

- **Facts**:
  - F0 decided that Actions are derived, and only dismissals need storage
    (`specs/001-app-foundation/data-model.md`, "Derived").
  - After B31 every Action belongs to a Person, so a dismissal is "Person + type + when".
  - The database is at schema version 1; F0 says every change adds a new version with an upgrade
    step that keeps existing data (FR-009 of F0).
- **Decision**: a new table **`dismissals`** in **schema version 2**:
  - fields `id` (UUID), `createdAt`, `updatedAt` (as every record), `personId`, `type`
    (`'noteMissing' | 'notConnected' | 'profileLinkMissing'`), `dismissedAt`;
  - indexes `id` (primary), `personId`, and a **unique compound index** `&[personId+type]`: at most
    one dismissal per Person and type;
  - the upgrade only adds the empty table; persons, encounters, events and settings stay as they
    are. Version 1 stays in `db.ts` unchanged, as the F0 rule says.
- **Rationale**: keeps `Person` unchanged; one small record per dismissal is easy to merge in a
  later sync (last write wins on `updatedAt`); the unique index makes "dismiss again" an update,
  not a duplicate.
- **Alternatives considered**: a `dismissed` map on Person (no new table, but every dismissal
  rewrites the Person and mixes follow-up state into the contact record); storing dismissals in
  Settings (one big record, bad for sync and for deleting a Person).

## R2. "Comes back after a new Encounter" (FR-009a, B30)

- **Decision**: a dismissal counts only while **no Encounter of the Person was saved after it**:
  open = gap exists **and** (no dismissal **or** the Person's newest Encounter `createdAt` >
  `dismissedAt`).
  - `createdAt` is the moment of saving, set by the repository and never changed. A merge moves
    Encounters to another Person but keeps their `createdAt` (F4 `mergePersons`), and deleting an
    Encounter only removes one; so neither brings an Action back (US3 scenario 6).
  - Reusing today's Encounter (B19, "already met today") creates nothing new, so nothing comes
    back either.
  - A stale dismissal (older than the newest Encounter) is simply ignored; it is replaced the next
    time the owner dismisses that Action.
- **Rationale**: one comparison, no clean-up job, and it follows B30 literally ("a new Encounter
  after dismissing").
- **Alternatives considered**: deleting dismissals when an Encounter is added (every add flow would
  have to know about F8, and a later sync could resurrect them).

## R3. Deriving Actions and cards (FR-001–FR-007)

- **Decision**: a pure module `src/people/actions.ts` (no database), like `contacts.ts` in F7:
  - `openActions(person, encounters, dismissals)` → the open types for one Person, in a fixed
    order: `noteMissing`, `notConnected`, `profileLinkMissing`:
    - `noteMissing`: no Encounter of the Person has a note (B31);
    - `notConnected`: `connectionStatus === 'notConnected'`;
    - `profileLinkMissing`: no `profileUrl`;
    - each minus a valid dismissal (R2).
  - `buildActionCards(persons, encounters, dismissals)` → one card per Person with at least one
    open Action: `{ person, lastEncounter, actions }`, sorted by `lastEncounter.date` descending,
    then `createdAt` descending, then name. `lastEncounter` is also the Encounter "Write note"
    writes to (B31).
  - `countOpenActions(...)` = the number of open Actions over all cards (the badge).
  - A Person without Encounters (should not exist) gets no card.
- **Rationale**: the same "load everything once, compute in memory" approach as F7 R3; 300
  Actions are well under a millisecond of work (SC-005).

## R4. Keeping the badge current (FR-005, FR-012, SC-004)

- **Facts**: changes that solve an Action happen in several places: the note step (F2/F4), the F7
  detail and edit mode, the Actions tab, merges and deletes. The tab bar is rendered by `App.tsx`.
- **Decision**: a small **change signal** in the repository, next to the existing
  `onStorageFull`:
  - `onDataChanged(listener)` returns an unsubscribe function;
  - `withStorageErrors()` — which already wraps **every** write — calls the listeners after a
    successful write. No write function needs its own call.
  - A hook `useOpenActionCount()` (in `src/people/useOpenActionCount.ts`) loads Persons, Encounters
    and dismissals, computes `countOpenActions`, and recomputes after each signal (coalesced:
    several writes in a row trigger one reload). `App.tsx` passes the number to `TabBar`.
- **Rationale**: one central place, so no future write path can forget to update the badge. Writes
  are rare (a few per minute at most), so reloading the three tables is cheap.
- **Alternatives considered**: Dexie `liveQuery` (not used elsewhere in the app; one more concept);
  recounting only when the tab bar is shown (the badge would be stale while the owner works in the
  Actions or Contacts tab).

## R5. Solving from the card (FR-008, SC-002, SC-003)

- **Decision**: one card per Person (spec Assumptions):
  - **Header**: name as a button (opens the detail, R7), company, and "Event · date" of the last
    Encounter (or "Without event").
  - **One LinkedIn link per card**, only when `notConnected` or `profileLinkMissing` is open: the
    profile, or the search link without a profile (F7 R6). One link instead of one per Action, so
    a card with both Actions does not show two identical buttons.
  - **noteMissing**: "Write note" opens a textarea (with the date and Event of the last Encounter
    as its label) plus Save and Cancel; Save is disabled while the note is blank; saving uses the
    existing `updateEncounter(id, { note })` (F0).
  - **notConnected**: "I connected" calls the existing `updatePerson(id, { connectionStatus:
    'connected' })`. Two taps: the LinkedIn link and "I connected" (SC-002).
  - **profileLinkMissing**: F7's `ProfileLinkControl` with `allowReplace={false}` (paste, F4
    messages, merge question). After a merge the tab reloads; the merged Person's card shows what is
    still open.
  - **Dismiss** per Action (R6).
  - Every change reloads the tab's data; a solved Action, and a card without Actions, disappear at
    once (US2 scenario 4).

## R6. Dismiss and Undo (FR-009, US3)

- **Decision**:
  - `dismissAction(personId, type)` in one transaction: upsert on `[personId+type]` with
    `dismissedAt = now` (an old, stale dismissal is updated, not duplicated). Returns the record and
    the previous one (if any).
  - **Undo** restores the state before the tap: `undoDismissal(previous | undefined, id)` deletes the
    new record, or puts the previous one back. In practice the previous one was always stale
    (otherwise the Action would not have been visible), so deleting would give the same result;
    restoring it exactly keeps the data honest.
  - The tab shows one status line "‹Action› dismissed for ‹name›. [Undo]" until the next change on
    the tab (another dismiss, a solve, Write note, leaving the tab).
  - No confirmation (constitution VIII; spec Assumptions).
- **Clean-up**: `deletePerson` also deletes the Person's dismissals; `mergePersons` deletes those of
  the Person that disappears (spec edge case "Merge"). Both inside their existing transactions.

## R7. Opening the Person detail from a card (FR-010)

- **Decision**: the Actions tab shows F7's `PersonDetail` itself (with `personId` state), as the
  Contacts tab does; its Back returns to the Actions list. No cross-tab navigation and no router
  (F7 R1). After Back the tab reloads, so changes made in the detail show at once.

## R8. The badge (FR-012)

- **Decision**: `TabBar` gets an optional `badges` prop (`Partial<Record<Tab, number>>`). On the
  Actions tab it draws a small pill on the icon's top-right: the number, "99+" above 99, nothing at
  0. The pill is `aria-hidden`; instead the button's accessible name becomes "Acties, 4 open"
  (`tab.actionsCount`), so VoiceOver reads it once and tests can find it.
- **Colour**: the theme blue on white text, not red: the badge is a quiet reminder, not an alarm
  (spec Assumptions: "a quiet number").

## R9. Testing

- **Unit** (`actions.test.ts`): the three rules, B31 (a note on any Encounter clears
  `noteMissing`), dismissals, return after a newer Encounter (B30), no return after merge/delete
  (by `createdAt`), sorting, the count, 300 Actions.
- **Repository** (`actions-repository.test.ts`): schema upgrade from version 1 keeps data (open a
  v1 database with the same name first, add records, close, then open the app database);
  `dismissAction` upsert; `undoDismissal`; `deletePerson` and `mergePersons` clean up dismissals;
  `onDataChanged` fires after a write and not after a failed one.
- **UI** (`actions-ui.test.tsx`): cards and empty state; solving each type; dismiss + Undo; return
  after a new Encounter; name → detail → Back; badge count and "99+"; the existing tab tests are
  updated where they expected "coming soon" on Actions.
