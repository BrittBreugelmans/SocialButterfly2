# Research: F7 — Contacts

**Date**: 2026-10-11 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F7 builds on F0–F5. No new library, no new browser API, no schema change.

## R1. Navigation: tabs without a router (FR-001–FR-001c, B26)

- **Facts**:
  - The app has no router; `App.tsx` switches screens with one `screen` state
    (`specs/002-events/research.md`: "When tabs arrive (F7, F8), a router can be reconsidered").
  - A home-screen web app on iOS has no browser back button, and links never change the URL.
  - F7 needs five tabs and one level deeper (Contacts list → Person detail), each with a visible
    Back button.
- **Decision**: **no router**. `App.tsx` gets a `tab` state
  (`'add' | 'contacts' | 'actions' | 'myQr' | 'settings'`, start value `'add'`). The existing
  screen `'start'` becomes "the tabs": it shows the chosen tab plus the tab bar. Every other screen
  (daily choice, new Event, add by name, scan, note step) is shown **without** the tab bar
  (FR-001c). After an add flow the app returns to the Add tab. The Contacts tab handles list ↔
  detail itself (R5).
- **Rationale**: two levels of navigation fit in plain state (constitution X). No URLs to keep in
  sync, nothing to configure on Cloudflare Pages.
- **Alternatives considered**: React Router or hash routes (history and deep links nobody needs in
  a home-screen app; one more dependency); one `screen` state with every tab as a screen (mixes
  "where am I" with "which flow is open").

## R2. The tab bar (FR-001, FR-001a)

- **Decision**:
  - `<nav>` fixed at the bottom, five equal buttons, each with a small inline SVG icon and a
    label. The chosen tab has `aria-current="page"`. Tap targets at least 44 × 44 pt.
  - Bottom padding `env(safe-area-inset-bottom)` (the app already uses `viewport-fit=cover`), and
    the page gets the same extra bottom padding while the bar is shown, so nothing hides behind it.
  - Icons are drawn inline (≈5 small SVGs); no icon library (constitution X). LinkedIn-like blue
    for the chosen tab, muted grey for the others (M2).
  - Actions, My QR and Settings show one shared `ComingSoon` screen: butterfly, title and one
    sentence about what will come there (FR-001a). F8–F10 replace it.
  - The Diagnostics sheet (F0) opens above the tab bar.
- **Rationale**: the standard iPhone pattern; works with one thumb at a fair.
- **Alternatives considered**: hiding unbuilt tabs (rejected by B26); a top bar (hard to reach).

## R3. Building the list (FR-003–FR-007, SC-002)

- **Facts**: expected volume is a few hundred Persons and about twice as many Encounters (spec
  Assumptions). `eventId` is indexed, but a missing `eventId` (casual networking) is not.
- **Decision**: when Contacts opens, read **all** Persons, Encounters and Events once (three
  table reads) and build the rows in memory with a pure function in `src/people/contacts.ts`:
  `buildContactRows(persons, encounters, view, query)` (contract: storage-api.md).
  - A view is `{ kind: 'all' } | { kind: 'casual' } | { kind: 'event', eventId }`.
  - For each Person: the Encounters that match the view; no match → not in the view (FR-004).
    `lastMet` = newest matching `date`.
  - Sort: `lastMet` descending, then name (`localeCompare`), so the order is stable (FR-005).
  - The search filter runs after the view filter (R4).
  - The data is read again after every change made from the detail screen (status, edit, delete,
    merge), so the list never shows stale rows.
- **Rationale**: one read, then filtering and searching are pure and instant; easy to unit-test.
  500 Persons and 1000 Encounters are well under a millisecond of work per keystroke.
- **Alternatives considered**: a query per view (`listEncountersByEvent`, `listCasualEncounters`)
  — more code, more reads, and search still needs every name; a live query library (Dexie
  `liveQuery`) — not used elsewhere in the app; a virtual list for long lists — not needed at
  this volume (constitution X).

## R4. Search that ignores case, spaces and accents (FR-008)

- **Decision**: a pure `searchKey(text)` in `src/people/contacts.ts`:
  `text.normalize('NFD')`, remove combining marks (`\p{M}`), `toLocaleLowerCase()`, collapse
  repeated spaces, trim. A row matches when `searchKey(person.name)` **contains**
  `searchKey(query)`. An empty query matches everything. Filtering runs on every keystroke; no
  debounce.
- **Not reused**: F2's `normalizeName` stays as it is. The same-name question (B15) deliberately
  does **not** ignore accents (F2 research R3); search does (spec User Story 2). Two functions,
  two purposes.
- **Examples**: "zoe" finds "Zoë"; "  JAN  " finds "Jan Peeters"; "peet" finds "Jan Peeters";
  "jan" finds "Piet Jansen".

## R5. List ↔ detail and keeping the list state (User Story 3 scenario 6)

- **Decision**: a `ContactsTab` component owns `view`, `query`, the loaded data and the open
  `personId`.
  - With a `personId` it shows `PersonDetail`; otherwise `ContactList`. Both are plain children,
    so `view` and `query` survive opening and closing a detail.
  - **Scroll**: the page itself scrolls (no inner scroll box). On opening a detail, `window.scrollY`
    is stored and the detail starts at the top; on Back the list renders with the data it already
    has and the stored position is restored in a layout effect, before paint. The data is then
    re-read in the background; a deleted Person simply disappears.
  - Leaving the Contacts tab resets this state (it is not needed across tabs).
  - The view starts on the active Event, or on "All contacts" during casual networking (FR-003).
    It is read from Settings when the tab opens.
- **Alternatives considered**: keeping the list mounted but hidden (the page height collapses, so
  the scroll position is lost anyway); an inner scroll container (iOS momentum scrolling and the
  status-bar tap-to-top work best with page scrolling).

## R6. "Open in LinkedIn" from the detail screen (FR-011)

- **Decision**: a real link `<a href={linkedInUrlFor(person)} target="_blank" rel="noopener">`,
  as the note step does (F2 research R1). Nothing is saved on this tap, so `openLinkedIn()` is not
  needed.
  - With a profile link: label `person.openProfile`, plus F4's "Profile linked:
    linkedin.com/in/…" line.
  - Without one: label `person.searchLinkedIn` and the line `person.noProfile` ("this opens a
    search"), so the owner knows it is not the profile (US3 scenario 4).
  - The search link used is the stored `searchUrl` (kept in step with name and company, R8).
- **Constitution I**: the app only opens the link; it never fetches LinkedIn.

## R7. Connection status (FR-013, B16)

- **Decision**: the same switch as on the note step ("I connected", `role="switch"`). Each change
  calls the existing `updatePerson(id, { connectionStatus })` at once; on an error the switch
  flips back and F0's storage message appears. No confirmation (US4 scenario 3).

## R8. Editing name and company (FR-014b, B27)

- **Decision**: a new repository function `updatePersonDetails(id, { name, company })` in one
  transaction:
  - name required (trimmed), company optional (empty → removed), both `maxLength` 100 in the form
    as in F2;
  - `searchUrl` is recomputed with `buildSearchUrl(name, company)` (F2), also when a profile link
    exists, because the search link is kept as a fallback (F5 data model);
  - `profileUrl`, `connectionStatus`, `id` and `createdAt` never change; `updatedAt` does.
  - No same-name question on edit (spec Assumptions): identity is the profile link.
- **UI**: an "Edit" button on the detail screen turns name and company into a small form with
  Save and Cancel. Cancel restores the stored values (US7 scenario 5).
- **Alternatives considered**: calling `updatePerson` with a `searchUrl` from the UI (the rule
  "search link follows name and company" would then live in a screen instead of in the
  repository).

## R9. Deleting a Person or one Encounter (FR-014, FR-014a, B25)

- **Person**: the existing `deletePerson(id)` already removes the Person and all their Encounters
  in one transaction (F0).
- **One Encounter**: a new `deleteEncounterFromTimeline(id)`: in one transaction it counts the
  Person's Encounters and **refuses** with a new `LastEncounterError` when this is the only one.
  The screen already knows the count and shows the "delete the whole Person" confirmation instead
  (US6 scenario 3); the error only guards against a race. The existing `deleteEncounter` (F0,
  used in tests) stays unchanged.
- **Open note step (B18)**: no extra work. `getNoteStep()` already ignores an id whose Encounter is
  gone (F2 research R5), so the note step never comes back for deleted data (US5 scenario 4, US6
  scenario 4).
- **Confirmation**: an in-page panel (like F4's merge question), not `window.confirm`: translated,
  styled, and testable. It shows what will be deleted and has a red "Delete" and a "Cancel"
  button; focus moves to it. After deleting a Person, the list shows `contacts.deleted`
  ("Jan Peeters is deleted.") as a status line.
- **Alternatives considered**: an undo instead of a confirmation (needs temporary storage of
  deleted data; more than v1 needs); swipe-to-delete in the list (easy to trigger by accident).

## R10. Reusing "Paste LinkedIn link" (FR-012, F4)

- **Facts**: the paste button, the clipboard read, the messages and the merge question live inside
  `NoteStep.tsx`. F4's spec says F7 will reuse them.
- **Decision**: move them into a shared `ProfileLinkControl` component (`src/ui/ProfileLink.tsx`)
  used by `NoteStep` and `PersonDetail`:
  - it reads the clipboard **in the tap handler** (iOS paste bubble, F4 research R1), normalizes,
    calls `linkProfileUrl`, shows the messages and, on a conflict, F4's `MergeQuestion`;
  - it calls `onLinked(person)` after linking and `onMerge(other)` when the owner chooses Merge.
    The parent runs `mergePersons`, because the note step passes its unsaved note draft and the
    detail screen does not;
  - on the detail screen it is shown only while the profile link is missing (replacing or removing
    a link is not part of F7).
  - After a merge from the detail screen, the detail shows the remaining Person (`into`) with all
    Encounters.
- **Rationale**: one implementation of the F4 rules; the existing link-profile UI tests guard the
  refactor.

## R11. Dates and texts

- **Dates**: one day is shown with the existing `formatDateRange(date, date, language)` ("11 okt.
  2026" / "11 Oct 2026"), the same format as the context bar (F1 research R8).
- **Plurals**: the delete confirmation uses two keys (one / several Encounters) instead of a
  plural library.
- **Texts**: about 40 new keys in `nl.ts` and `en.ts` (contracts/screens.md); the typed `en`
  record makes a missing key a compile error (F0).

## R12. Testing and the 500-contact check (SC-002)

- **Unit**: `buildContactRows` and `searchKey` (views, sorting, search table, a 500-Person data
  set); repository tests for `updatePersonDetails` and `deleteEncounterFromTimeline` with
  fake-indexeddb.
- **UI** (Vitest + Testing Library): tab bar (opens on Add, switching, hidden in flows), list
  (views, empty, search), detail (timeline, links, status, edit, delete Person, delete Encounter,
  last Encounter, paste and merge). The existing note-step and link-profile tests must stay green
  after the `ProfileLinkControl` refactor.
- **On the iPhone**: Diagnostics (F0, hidden behind a long press) gets a second test button,
  "Add 500 test contacts", creating `[test] `-prefixed Persons with Encounters spread over the
  test Events. The existing "Remove test data" removes them again. Used once to check SC-002 on
  the real device (quickstart section 3).
