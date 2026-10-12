# Contract: Screens and texts (F3)

What the guest and the owner see. All texts come from the dictionaries
([F0 i18n contract](../../001-app-foundation/contracts/i18n.md)).

## Screen flow

```text
app opens / comes back
   │
   ├─ guestModeOn? ──▶ Guest form          (before the offline screen, daily choice and note step; research R5)
   └─ otherwise: F0 offline screen / F1 daily choice / F2 note step / tabs (unchanged)

Add tab ──"Hand over"──▶ Guest form
Guest form ──"Done"──▶ Thank-you screen ──"Back"──▶ Guest form (input kept)
Guest form / Thank-you ──hold logo 2 s──┬─ daily choice due ─▶ Daily choice ─▶ Quick mode form (filled in, if a name was typed)
                                        ├─ name typed ───────▶ Quick mode form (filled in)  ── then F2 unchanged
                                        └─ no name ──────────▶ Add tab
```

- In guest mode **nothing else is rendered**: no banners, no tab bar, no context bar (FR-008).
- A short tap on the logo does nothing (FR-012).

## Add tab (changed)

| Element | Behaviour |
|---|---|
| "Hand over" (`start.handOver`) | Third button under "Add by name" and "Scan QR", same style. One tap opens guest mode (FR-001) and stores `guestModeOn` in the background. |
| Everything else | Unchanged. |

## Guest form (new, `GuestMode` step `form`)

| Element | Rule |
|---|---|
| Top row | Left: `LogoHoldButton` (small logo, about 44 px). Right: `LanguageSwitch` inside `GuestLanguageProvider` (FR-015). |
| Greeting (`guest.greeting`) | The heading. Wiki fixed text (FR-003). |
| Name (`guest.name`) | Focused on open (FR-002); `maxLength` 100; `autoCapitalize="words"`; `autoComplete="off"`; placeholder `add.namePlaceholder`. |
| Company (`guest.company`) | Optional; `maxLength` 100; placeholder `add.companyPlaceholder`; `enterKeyHint="done"`, Enter = "Done" when the name is filled. |
| Privacy (`guest.privacy`) | Always visible under the fields (FR-005). |
| "Done" (`guest.done`) | Full-width primary button. `disabled` while the name is blank (FR-007). Goes to the thank-you screen; saves nothing (FR-010). |
| Not present | Context bar, Event name, same-name hints, banners, tab bar, any link to an owner screen (FR-008, FR-009). |

Size (FR-006, research R7): greeting about 1.6rem; inputs at least 18 px text and 52 px tall;
touch targets at least 44 px.

## Thank-you screen (new, `GuestMode` step `thanks`)

| Element | Rule |
|---|---|
| Top row | Same as the form: `LogoHoldButton` and `LanguageSwitch`. |
| Text (`guest.thanks`) | Large, centred. |
| "Back" (`add.back`) | Secondary button; back to the form with the input kept (FR-011). |

## LogoHoldButton (new)

| Aspect | Rule |
|---|---|
| Content | The F11 `Logo` (one logo file, M5). No visible text. |
| Accessible name | `aria-label` = `guest.ownerHold`. |
| Hold | `pointerdown` starts a 2000 ms timer and captures the pointer; `pointerup` / `pointercancel` before that clears it. At 2000 ms: `onHold()` once. |
| Feedback | While held, a ring around the logo fills in 2 s (class `holding`). Released early: the ring resets. |
| iOS | No image menu, no text selection, no zoom: `contextmenu` prevented; `-webkit-touch-callout: none`, `user-select: none`, `touch-action: none`. |
| Click / keyboard | `onClick` does nothing (FR-012). |

## Quick mode form (changed)

| Element | Rule |
|---|---|
| Name, company | Start with `initialName` / `initialCompany` when opened after guest mode (research R6). The same-name check runs at once. |
| Everything else | Unchanged F2 behaviour (FR-014). "Back" saves nothing and drops the guest input. |

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `start.handOver` | Geef door | Hand over |
| `guest.greeting` | Hoi! Ik ben Britt, de sociale vlinder. Wie ben jij? | Hi! I'm Britt, the social butterfly. Who are you? |
| `guest.name` | Je naam | Your name |
| `guest.company` | Je bedrijf (optioneel) | Your company (optional) |
| `guest.privacy` | Je naam wordt alleen op Britts telefoon bewaard. | Your name is only stored on Britt's phone. |
| `guest.done` | Klaar | Done |
| `guest.thanks` | Dank je! Geef de gsm terug aan Britt. | Thanks! Hand the phone back to Britt. |
| `guest.ownerHold` | Terug naar Britt (2 seconden vasthouden) | Back to Britt (hold 2 seconds) |

Reused: `add.namePlaceholder`, `add.companyPlaceholder`, `add.back`, `app.languageSwitch`,
`app.languageNl`, `app.languageEn`. Greeting, privacy, button and thank-you texts are the approved
fixed texts in `wiki/merk-en-stijl.md`. `guest.name` and `guest.company` are new wording, friendlier
than the owner's "Naam" / "Bedrijf (optioneel)"; Britt can tune them.
