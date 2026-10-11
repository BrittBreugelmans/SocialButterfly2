# Contract: Screens and texts (F8)

What the owner sees. Reuses F7's tab bar, `PersonDetail` and `ProfileLinkControl`, F4's link texts
and merge question, and F2's note texts.

## Screen flow

```text
Tab bar ──"Acties" (badge: open count)──▶ Actions list
                                            ├─ card: name ─▶ Person detail (F7) ──Back──▶ Actions list
                                            ├─ "Schrijf notitie" ─▶ note field on the card ─▶ Save / Cancel
                                            ├─ LinkedIn link ─▶ LinkedIn (profile or search)
                                            ├─ "Ik heb geconnecteerd" ─▶ Action gone
                                            ├─ "Plak LinkedIn-link" ─▶ linked / F4 message / merge question
                                            └─ "Afwijzen" ─▶ Action gone + status line with "Ongedaan maken"
                                          (no open Actions) ─▶ empty state
```

## Tab bar (changed)

| Element | Behaviour |
|---|---|
| Actions tab | Badge with the open count on the icon (blue pill, white number); "99+" above 99; none at 0. Accessible name `tab.actionsCount` ("Acties, 4 open") when the count > 0, otherwise `tab.actions`. |

## Actions list

| Element | Behaviour |
|---|---|
| Title | `actions.title` |
| Status line (`role="status"`) | After a dismiss: `actions.dismissed` (Action label, name) + button `actions.undo`. Cleared on the next change on the tab. |
| Card (`<article>`) | One per Person with open Actions, newest last Encounter first. |
| Card header | Name as a button (opens the detail), company (muted), `{event} · {date}` of the last Encounter (Event name or `contacts.casual`). |
| LinkedIn link | Only when `notConnected` or `profileLinkMissing` is open: `person.openProfile` (profile) or `person.searchLinkedIn` (search link), `target="_blank" rel="noopener"`. |
| Action row: note missing | Label `actions.noteMissing`; button `actions.writeNote`; then a textarea (label `person.noteFor` with date and Event, placeholder `note.placeholder`), `note.save` (disabled while blank) and `link.cancel`. |
| Action row: not connected | Label `actions.notConnected`; button `actions.connected`. |
| Action row: profile link missing | Label `actions.profileLinkMissing`; F7's `ProfileLinkControl` (`link.paste`, F4 messages, merge question). |
| Dismiss (each row) | Text button `actions.dismiss`; accessible name `actions.dismissLabel` (Action label + name). |
| Empty state | Butterfly + `actions.empty` (fixed text, `wiki/merk-en-stijl.md`). |

Notes are never shown on this tab (FR-013).

## Person detail

F7's `PersonDetail`, unchanged; Back returns to the Actions list, which reloads.

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `tab.actionsCount` | Acties, {count} open | Actions, {count} open |
| `actions.title` | Acties | Actions |
| `actions.noteMissing` | Notitie ontbreekt | Note missing |
| `actions.notConnected` | Nog niet geconnecteerd | Not connected yet |
| `actions.profileLinkMissing` | Profiel-link ontbreekt | Profile link missing |
| `actions.writeNote` | Schrijf notitie | Write note |
| `actions.connected` | Ik heb geconnecteerd | I connected |
| `actions.dismiss` | Afwijzen | Dismiss |
| `actions.dismissLabel` | {action} afwijzen voor {name} | Dismiss {action} for {name} |
| `actions.dismissed` | "{action}" afgewezen voor {name}. | "{action}" dismissed for {name}. |
| `actions.undo` | Ongedaan maken | Undo |
| `actions.empty` | Alles gedaan, tijd om verder te fladderen. | All done — time to flutter on. |

Reused: `contacts.casual`, `person.openProfile`, `person.searchLinkedIn`, `person.noteFor`,
`note.placeholder`, `note.save`, `link.*`.
Tone per `wiki/merk-en-stijl.md`: friendly, short. `actions.empty` is the fixed text from that page.
