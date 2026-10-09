# Contract: Screens and texts (F4)

What the owner sees. Changes only the note step from
[F2](../../003-add-by-name/contracts/screens.md). All texts come from the dictionaries.

## Note step (changed)

Order from top to bottom:

| Element | Behaviour |
|---|---|
| Title, "already met" line, "Open LinkedIn" | As in F2. "Open LinkedIn" opens the profile link once linked. |
| **"Paste LinkedIn link"** (`link.paste`) | Secondary button. Reads the clipboard in the tap handler (research R1). After a link: label `link.pasteAgain`. |
| **Linked line** | When the Person has a `profileUrl`: `link.linked` + short form `linkedin.com/in/<handle>`. |
| **Message** (`role="status"`) | `link.invalid`, `link.shortLink`, `link.unsupported` or `link.merged`. Cleared on the next paste. Nothing on a dismissed iOS bubble. |
| **Merge question** | Only on a conflict, in place of the paste button: `link.mergeQuestion` (or `link.mergeQuestionNoCompany`), buttons `link.merge` (primary) and `link.cancel` (secondary). |
| Note, "I connected", Save, Skip | As in F2. |

## Flow

```text
tap "Paste LinkedIn link" ─▶ iOS "Paste" bubble ─┬─ dismissed ─▶ nothing
                                                  └─ text ─▶ normalizeProfileUrl
                                                              ├─ not ok ─▶ message (invalid / shortLink)
                                                              └─ ok ─▶ linkProfileUrl
                                                                        ├─ linked / unchanged ─▶ linked line
                                                                        └─ conflict ─▶ merge question
                                                                                        ├─ Merge ─▶ mergePersons ─▶ note step of the
                                                                                        │                          remaining Person + link.merged
                                                                                        └─ Cancel ─▶ nothing stored
```

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `link.paste` | Plak LinkedIn-link | Paste LinkedIn link |
| `link.pasteAgain` | Andere link plakken | Paste another link |
| `link.linked` | Profiel gekoppeld: | Profile linked: |
| `link.invalid` | Geen LinkedIn-profiel-link gevonden. Kopieer in LinkedIn de link van het profiel (Delen → Link kopiëren). | No LinkedIn profile link found. In LinkedIn, copy the profile's link (Share → Copy link). |
| `link.shortLink` | Korte lnkd.in-links werken niet. Kopieer de volledige profiel-link. | Short lnkd.in links don't work. Copy the full profile link. |
| `link.unsupported` | Plakken werkt hier niet. Open de app via je beginscherm. | Pasting doesn't work here. Open the app from your home screen. |
| `link.mergeQuestion` | Dit profiel hoort bij {name} ({company}). Samenvoegen? | This profile belongs to {name} ({company}). Merge? |
| `link.mergeQuestionNoCompany` | Dit profiel hoort bij {name}. Samenvoegen? | This profile belongs to {name}. Merge? |
| `link.merge` | Samenvoegen | Merge |
| `link.cancel` | Annuleren | Cancel |
| `link.merged` | Samengevoegd met {name}. | Merged with {name}. |

Tone per `wiki/merk-en-stijl.md`: friendly, short.
