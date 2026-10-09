# Implementation Plan: F4 — Link the Profile URL

**Branch**: `004-link-profile` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-link-profile/spec.md`

## Summary

On the note step (F2), the owner taps "Paste LinkedIn link". The app reads the clipboard, finds a
LinkedIn profile link, normalizes it to `https://www.linkedin.com/in/<handle>`, and stores it on
the Person. If that link already belongs to another Person, the app asks "Merge?" (B21); Merge
combines both Persons into the one that had the link, keeping every Encounter and note.

Technical approach:

- **Logic:** a pure `normalizeProfileUrl(text)` in `src/linkedin/profileUrl.ts`, reused by F5 (QR).
- **Data:** no new fields, no schema change. Two repository functions: `linkProfileUrl` (stores
  the link or reports the other Person) and `mergePersons` (one transaction).
- **Screen:** the note step gets a paste button, a "linked" line, error messages and an inline
  merge question. `App` updates the note step after a merge.
- **Clipboard:** `navigator.clipboard.readText()` called directly in the tap handler, so iOS shows
  its own "Paste" bubble (T5, research R1).

## Technical Context

**Language/Version**: TypeScript 5 (strict); Node.js 24.13.0 (`app/.nvmrc`, wiki T13)

**Primary Dependencies**: unchanged (React 19, Vite, vite-plugin-pwa, Dexie 4); no new packages

**Storage**: IndexedDB via Dexie, schema version 1 unchanged; uses the existing unique `&profileUrl` index

**Testing**: Vitest, React Testing Library, fake-indexeddb; manual checks on the iPhone ([quickstart.md](quickstart.md))

**Target Platform**: iOS 17+ home-screen web app (as F0)

**Project Type**: client-only web app (PWA)

**Performance Goals**: linking in at most 2 taps (SC-001); +1 tap only for a merge

**Constraints**: €0; the clipboard is read only after a tap (T5); the app never opens or checks the link itself (L1)

**Scale/Scope**: hundreds of Persons; 1 changed screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan complies |
|---|---|---|---|
| I | LinkedIn by the Rules | ✅ Pass | The owner copies the link in LinkedIn herself; the app only reads her clipboard after a tap and never visits LinkedIn to check it. |
| II | Zero Cost | ✅ Pass | No new services or packages. |
| III | Installable iPhone Web App | ✅ Pass | Standard clipboard API with the iOS paste confirmation; checked on the iPhone (R1). |
| IV | Local Data, Sync-Ready | ✅ Pass | Merges keep record ids and timestamps; `updatedAt` is set on every changed record. |
| V | LinkedIn-Only Identity | ✅ Pass | The normalized `profileUrl` becomes the Person's identity; still unique (F0 index). |
| VI | Privacy | ✅ Pass | Owner screen only; the clipboard content is not stored unless it is a profile link. |
| VII | Bilingual | ✅ Pass | 11 new keys in NL and EN (contracts/screens.md). |
| VIII | Speed in the Moment | ✅ Pass | One tap + the iOS confirmation; the merge question only on a conflict. |
| IX | No Lost Contacts, No Silent Duplicates | ✅ Pass | Unique link; merge only after "Merge" (B21); `mergePersons` moves every Encounter and keeps every note in one transaction. |
| X | Only v1 | ✅ Pass | No unmerge, no removing a link, no name derived from the link (F5), no fallback paste field. |

**Post-design re-check (after Phase 1)**: all pass; no violations, so no Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-link-profile/
├── plan.md              # This file
├── research.md          # R1–R6
├── data-model.md        # normalization rule, merge rules
├── quickstart.md        # laptop + iPhone checks
├── contracts/
│   ├── storage-api.md   # normalizeProfileUrl, linkProfileUrl, mergePersons
│   └── screens.md       # note step changes, merge question, text keys
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (changes in `app/`)

```text
app/src/
├── linkedin/
│   └── profileUrl.ts        # NEW: normalizeProfileUrl(text) → result
├── data/
│   └── repository.ts        # + linkProfileUrl, mergePersons
├── platform/
│   └── clipboard.ts         # NEW: readClipboardText() → text | 'dismissed' | 'unsupported'
├── i18n/nl.ts, en.ts        # + link.* keys
├── ui/
│   ├── NoteStep.tsx         # + paste button, linked line, messages, merge question
│   └── MergeQuestion.tsx    # NEW: "This profile belongs to … Merge?"
├── App.tsx                  # note step key + update after a merge
└── styles.css               # + linked line, message, merge question
app/tests/
├── profile-url.test.ts      # NEW: normalization table
├── link-profile.test.ts     # NEW: linkProfileUrl, mergePersons (rules, atomic)
└── link-profile-ui.test.tsx # NEW: paste, invalid, merge, cancel, after-merge note step
```

**Structure Decision**: same single client project. URL rules sit next to `links.ts` in
`src/linkedin/`, so F5 (QR) and F7 reuse them.

## Open points

None blocking. The iOS "Paste" bubble behaviour is checked on the iPhone (quickstart section 2).
