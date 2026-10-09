# Contract: Storage API additions (F4)

Adds to the F0–F2 storage contracts
([F0](../../001-app-foundation/contracts/storage-api.md),
[F2](../../003-add-by-name/contracts/storage-api.md)). All earlier rules stay valid: UI code uses
only `app/src/data/repository.ts`, every write goes through the storage-full handling, nothing in
the repository uses the network.

## Profile link

```ts
linkProfileUrl(personId: string, profileUrl: string):
  Promise<
    | { status: 'linked'; person: Person }      // stored (new or replacing an older link)
    | { status: 'unchanged'; person: Person }   // this Person already had this link
    | { status: 'conflict'; other: Person }     // another Person has it; NOTHING written
  >
// ONE transaction. profileUrl must already be normalized (normalizeProfileUrl); otherwise
// ValidationError (F0 rule). Unknown personId → ValidationError.
```

## Merge (B21)

```ts
mergePersons(input: { fromPersonId: string; intoPersonId: string; noteDraft?: string }):
  Promise<{ person: Person; noteStepEncounter?: Encounter }>
// ONE transaction, rules in data-model.md "Merge rules":
// - noteDraft (if given) first becomes the note of from's open note-step Encounter;
// - into gets from's company if it had none, and 'connected' if either was connected;
// - from's Encounters move to into; a clash (same date + same context) is folded into into's
//   Encounter with both notes kept;
// - Settings.noteStepEncounterId follows the note step; from is deleted.
// noteStepEncounter: the Encounter that now holds the open note step (if one was open).
// On any error nothing changes. Unknown ids or fromPersonId === intoPersonId → ValidationError.
```

## Pure helpers (no database)

```ts
// app/src/linkedin/profileUrl.ts
normalizeProfileUrl(text: string):
  | { ok: true; url: string }                       // https://www.linkedin.com/in/<handle>
  | { ok: false; reason: 'notProfile' | 'shortLink' }
shortProfileUrl(url: string): string               // 'linkedin.com/in/<handle>' for display

// app/src/platform/clipboard.ts (browser, not the repository)
readClipboardText(): Promise<string | 'dismissed' | 'unsupported'>
// Must be called directly in the tap handler, before any await (research R1).
```

## Errors

No new error types. `ValidationError` and `StorageFullError` as in F0.
