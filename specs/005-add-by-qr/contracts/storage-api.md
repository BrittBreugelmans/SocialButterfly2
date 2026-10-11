# Contract: Storage API changes (F5)

Changes to [F2](../../003-add-by-name/contracts/storage-api.md) and
[F4](../../004-link-profile/contracts/storage-api.md). All earlier rules stay valid.

## Add a Person (changed)

```ts
addByName(input: {
  name: string
  company?: string
  existingPersonId?: string
  profileUrl?: string          // NEW (F5): normalized profile link from a scan
}): Promise<{ person: Person; encounter: Encounter; alreadyMetToday: boolean }>
// ONE transaction, as in F2, plus:
// - new Person: also stores profileUrl (unique; DuplicateProfileUrlError if taken).
// - existingPersonId without a profileUrl: stores profileUrl on it (same check).
// - existingPersonId that already has this profileUrl: unchanged.
// - existingPersonId with ANOTHER profileUrl: ValidationError, nothing saved.
// Without profileUrl the function behaves exactly as in F2.
```

No other repository changes. The scan screen uses the existing `findPersonByProfileUrl` (F0) and
`findSameNamePersons` (F2, with `metToday`).

## Pure helpers (no database)

```ts
// app/src/linkedin/profileUrl.ts
nameFromProfileUrl(url: string): string
// Name suggested from a normalized profile link (research R4); '' when none can be made.
```

## Camera (browser, not the repository)

```ts
// app/src/platform/camera.ts
class CameraError extends Error { reason: 'denied' | 'unavailable' }

startQrScanner(video: HTMLVideoElement, onCode: (text: string) => void): Promise<() => void>
// Starts the back camera in `video` and calls onCode with each decoded QR text (~5 per second).
// Resolves with stop(): stops the loop and every camera track. Rejects with CameraError.
// Frames are never stored or sent (FR-003).
```

## SameNameQuestion props (changed, F2 component)

```ts
newPersonUrl: string                          // was `searchUrl`: the link for "No, new person"
linkFor?: (match: SameNameMatch) => string    // NEW: link opened when picking a match;
                                              // default linkedInUrlFor(match.person) (F2)
```
