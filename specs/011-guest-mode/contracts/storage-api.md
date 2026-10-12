# Contract: Storage and module API (F3)

Only `data/repository.ts` touches the database (F0 rule).

## Repository

```ts
/** Turns guest mode on or off on this device (FR-018, research R1). Writes Settings.guestModeOn. */
export async function setGuestMode(on: boolean): Promise<Settings>
```

- `on: true` → `guestModeOn: true`; `on: false` → field removed (via `updateSettings` and
  `compact`).
- Throws `StorageFullError` like every write; callers ignore it (guest mode keeps working in
  memory).
- Never reads or writes Persons, Encounters, Events or Dismissals.

`getSettings()` is unchanged and returns `guestModeOn` when present.

## i18n

```ts
/** Pure lookup with {param} replacement; used by both providers (research R3). */
export function translate(language: Language, key: TextKey, params?: Record<string, string | number>): string

/**
 * Overrides the language for its children only. Starts at the current app language;
 * setLanguage changes local state and never writes Settings (FR-016).
 * Sets document.documentElement.lang while mounted and restores it on unmount.
 */
export function GuestLanguageProvider(props: { children: ReactNode }): JSX.Element
```

`useLanguage()` is unchanged; inside `GuestLanguageProvider` it returns the guest value.

## UI components

```ts
/** The guest screens (form and thank-you). Saves nothing (FR-010). */
export function GuestMode(props: {
  /** Called once after the 2-second hold, with the input as typed (not trimmed). */
  onExit(input: { name: string; company: string }): void
}): JSX.Element

/** The small logo that ends guest mode after a 2000 ms hold (FR-012, research R4). */
export function LogoHoldButton(props: { onHold(): void; holdMs?: number }): JSX.Element
```

`AddByNameForm` props gain `initialName?: string` and `initialCompany?: string`.
`StartScreen` props gain `onHandOver(): void`.

## App state

| State | Values | Rule |
|---|---|---|
| `guestMode` | `'loading' \| boolean` | `'loading'` until Settings are read; renders nothing meanwhile. `true` renders only `GuestMode`. |
| `guestInput` | `{ name, company } \| undefined` | Set on exit when the trimmed name is not empty. Passed to `AddByNameForm`; cleared when that form saves or goes back. |
