# Research: F1 — Events

**Date**: 2026-10-09 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

F1 builds on the F0 stack (TypeScript, React, Dexie; see
[../001-app-foundation/research.md](../001-app-foundation/research.md)). No new libraries.
This file records the design choices that F1 adds.

## R1. Knowing whether the owner already chose today (FR-005, B13)

- **Decision**: store the local date of the last choice in Settings as `contextChosenOn`
  (`YYYY-MM-DD`). The choice appears when `contextChosenOn` is missing or differs from today's
  local date.
- **When to check**:
  - on app start;
  - when the app comes back to the foreground (`visibilitychange` → `visible`).

  iOS often resumes a home-screen app instead of starting it again, so "opening" includes
  resuming. The app never checks while it is visible and in use, so the choice does not pop up
  at midnight in the middle of a conversation (spec edge case).
- **Alternatives considered**: a timestamp plus "24 hours later" (does not match "a new day");
  checking on a timer (would interrupt the owner while she uses the app).

## R2. Local dates in one place

- **Decision**: a small module `app/src/data/dates.ts` with `todayLocal()` and
  `addDaysLocal(date, days)`. Both return `YYYY-MM-DD` in the phone's local time. Diagnostics
  (F0) moves its private `localIsoDate()` to this module.
- **Rationale**: "today" decides the daily choice, the order of the list and the default dates.
  One shared function avoids the UTC mistake (`toISOString()` is still "yesterday" just after
  midnight in Belgium).

## R3. Order of Events in the choice (FR-006, FR-005)

- **Decision**: a pure function `orderEventsForChoice(events, today, previousEventId)` that returns
  three groups:
  1. **current** (`startDate ≤ today ≤ endDate`), with yesterday's Event first if it is still
     running, then by `startDate`;
  2. **upcoming** (`startDate > today`), soonest first;
  3. **past** (`endDate < today`), most recently ended first.
- **Rationale**: a pure function is easy to test with fixed dates, without a database or a clock.
- **Alternatives considered**: sorting in the database query (Dexie can only sort on one index
  and cannot group).

## R4. Settings field without a schema change

- **Decision**: add `contextChosenOn?: string` to the `Settings` type. Settings is not indexed on
  this field, so the database schema stays at **version 1**.
- **Rationale**: Dexie only needs a new version when tables or indexes change (F0 data model,
  "Schema evolution"). Non-indexed fields are stored as they are.

## R5. Atomic writes for the choice (FR-004, FR-007)

- **Decision**: two new repository functions:
  - `chooseContext(eventId | undefined)` sets `activeEventId` and `contextChosenOn` in one write;
  - `createAndActivateEvent(input)` creates the Event and makes it active in **one transaction**.
- **Rationale**: no state where the Event exists but is not active, or the context is set but the
  day is not (constitution IX). The UI calls one function per action.

## R6. Linking new Encounters to the context (FR-009)

- **Decision**: a repository function `createEncounterInContext({ personId, note? })` that reads
  `activeEventId` inside the same transaction and sets `eventId` from it (or leaves it empty).
  The date is today's local date.
- **Rationale**: F2, F3 and F5 call this one function, so no screen can forget the Event
  (SC-003). In F1 it is covered by automated tests only, because there is no screen yet that
  adds contacts (spec assumption).

## R7. Screens without a router

- **Decision**: `App` keeps a simple screen state: `'choice' | 'newEvent' | 'start'`. No routing
  library.
- **Rationale**: YAGNI (constitution X): three screens and no deep links. When tabs arrive (F7,
  F8), a router can be reconsidered.
- **Alternatives considered**: a router library (more than needed now).

## R8. Date input and display

- **Decision**:
  - **Input**: the native `<input type="date">`, which shows the iOS date wheel and uses
    `YYYY-MM-DD`. The end date input gets `min = startDate`. When the start date moves past the
    end date, the end date is set to the start date (FR-002).
  - **Display**: `Intl.DateTimeFormat(language).formatRange(start, end)` gives "6–8 okt. 2026" or
    "6–8 Oct 2026" in the app language, and a single date when start and end are equal.
    Supported in Safari since 14.1.
  - **Name field**: `maxLength=80`; longer names are cut off on screen with an ellipsis (spec
    assumption). The storage layer does not add a length rule.
- **Rationale**: the native picker is fast on iPhone and free of extra libraries.
