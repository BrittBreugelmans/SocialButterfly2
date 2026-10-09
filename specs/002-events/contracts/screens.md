# Contract: Screens and texts (F1)

What the owner sees. All texts come from the dictionaries ([F0 i18n contract](../../001-app-foundation/contracts/i18n.md)).

## Screen flow

```text
app opens / comes back to the foreground
   │
   ├─ started offline? ──▶ F0 offline screen (unchanged)
   │
   ├─ needsDailyChoice? ──▶ Choice ──┬─ tap Event ──────▶ Start
   │                                 ├─ tap casual ─────▶ Start
   │                                 └─ "New event" ───▶ New event form ──save──▶ Start
   │                                                         └─ back ─▶ Choice
   └─ otherwise ─────────────────────────────────────────────────────▶ Start

Start: context bar (Event name + dates, or "Casual networking") ──tap──▶ Choice
```

- The choice is **never** shown while the app is visible and in use; only on start or when it
  returns to the foreground (research R1).
- Banners (F0) stay visible above every screen.

## Choice screen

| Element | Behaviour |
|---|---|
| Title | `choice.title` |
| "Continue with …" | Only when the previous Event is still current: a highlighted first button `choice.continue` with the Event name and dates. One tap (FR-005). |
| Current Events | Heading `choice.current`; one button per Event with name and date range |
| "New event" | Button `choice.newEvent` → New event form |
| "Casual networking" | Button `choice.casual` |
| Upcoming Events | Heading `choice.upcoming` |
| Past Events | Heading `choice.past`; listed last |
| No Events at all | Only "New event" and "Casual networking" (US2 scenario 4) |

## New event form

| Field | Default | Rule |
|---|---|---|
| Name (`event.name`) | empty, focused | required; `maxLength` 80 |
| Start date (`event.startDate`) | today | moving it past the end date sets the end date to it |
| End date (`event.endDate`) | = start date | `min` = start date |
| Save (`event.save`) | | disabled while the name is empty; on a `ValidationError` shows `event.errorName` or `event.errorDates` |
| Back (`event.back`) | | returns to the choice without saving |

Saving calls `createAndActivateEvent` and opens the start screen.

## Start screen (changed)

A **context bar** at the top of the start screen:
- with an active Event: `context.at` + Event name + date range;
- otherwise: `context.casual`;
- `aria-label` = `context.change`; one tap opens the choice (FR-008).

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `choice.title` | Waar ben je vandaag? | Where are you today? |
| `choice.continue` | Verder met {name} | Continue with {name} |
| `choice.current` | Nu bezig | Happening now |
| `choice.upcoming` | Binnenkort | Coming up |
| `choice.past` | Voorbij | Past |
| `choice.newEvent` | Nieuw evenement | New event |
| `choice.casual` | Netwerken zonder evenement | Casual networking |
| `event.title` | Nieuw evenement | New event |
| `event.name` | Naam | Name |
| `event.namePlaceholder` | bv. Devoxx 2026 | e.g. Devoxx 2026 |
| `event.startDate` | Van | From |
| `event.endDate` | Tot en met | Until |
| `event.save` | Opslaan en starten | Save and start |
| `event.back` | Terug | Back |
| `event.errorName` | Geef het evenement een naam. | Give the event a name. |
| `event.errorDates` | De einddatum kan niet vóór de startdatum liggen. | The end date can't be before the start date. |
| `context.at` | Je bent op | You're at |
| `context.casual` | Netwerken zonder evenement | Casual networking |
| `context.change` | Wijzig evenement | Change event |

Tone per `wiki/merk-en-stijl.md`: friendly, short. Final wording can be tuned in F11.
