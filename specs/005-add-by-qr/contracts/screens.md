# Contract: Screens and texts (F5)

What the owner sees. Reuses F2's form texts, same-name question and note step
([F2 screens](../../003-add-by-name/contracts/screens.md)), and F4's link display.

## Screen flow

```text
Start ──"Scan QR"──▶ Scan ──profile code──▶ Confirm ──"Save and open LinkedIn"──▶ Note step (F2)
                      │                        │        (met today: "Go to the note", no LinkedIn)
                      │                        ├─ same name, no link ─▶ Same-name question (F2)
                      │                        ├─ "Scan again" ─▶ Scan
                      │                        └─ Back ─▶ Start (nothing saved)
                      ├─ other code ─▶ message, keeps scanning
                      ├─ camera refused/missing ─▶ message + "Add by name" ─▶ F2 form
                      └─ Back ─▶ Start (camera stops)
```

## Start screen (changed)

| Element | Behaviour |
|---|---|
| "Scan QR" (`start.scanQr`) | Big primary button under "Add by name" (FR-001). |

## Scan screen

| Element | Behaviour |
|---|---|
| Title | `qr.title` |
| Camera view | Full width, square, `playsInline muted autoPlay`; starts at once (FR-002). |
| Hint | `qr.hint` under the view. |
| Message (`role="status"`, class `qr-message`) | `qr.notProfile` or `qr.shortLink` after a wrong code; cleared on the next profile code. |
| Camera refused / missing | Instead of the view: `qr.cameraDenied` or `qr.cameraUnavailable`, and a button `start.addByName` to the F2 form. |
| Back (`add.back`) | Stops the camera, to Start. |

## Confirm screen

| Element | New Person | Known by link (B8) |
|---|---|---|
| Title | `qr.confirmTitle` | `qr.confirmTitle` |
| Context | F1 context bar, read-only | same |
| Name | Input `add.name`, derived name, `maxLength` 100, required | Text, with `qr.known` |
| Company | Input `add.company` (optional, empty, `maxLength` 100, B22) | Text (or nothing) |
| Link | `shortProfileUrl(url)` | same |
| Main action | Link `qr.save` to the profile (`target="_blank"`); disabled while the name is blank or the same-name check runs (`aria-busy`) | Link `qr.save`; when met today a button `qr.saveMetToday` (no LinkedIn, B19) |
| `qr.scanAgain` | Back to scanning | same |
| Back (`add.back`) | To Start, nothing saved | same |

A same-name match (only Persons **without** a profile link) shows F2's question; picking a Person
or "No, new person" opens the scanned profile.

## New text keys (NL / EN)

| Key | NL | EN |
|---|---|---|
| `start.scanQr` | Scan QR | Scan QR |
| `qr.title` | Scan een LinkedIn-QR | Scan a LinkedIn QR code |
| `qr.hint` | Vraag de QR-code in de LinkedIn-app (zoekbalk → QR-icoon). | Ask for the QR code in the LinkedIn app (search bar → QR icon). |
| `qr.notProfile` | Dit is geen LinkedIn-profielcode. | This is not a LinkedIn profile code. |
| `qr.shortLink` | Dit is een korte link. Vraag de profiel-QR uit de LinkedIn-app. | This is a short link. Ask for the profile QR code from the LinkedIn app. |
| `qr.cameraDenied` | De app mag je camera niet gebruiken. Sta het toe in je iPhone-instellingen, of voeg toe via naam. | The app may not use your camera. Allow it in your iPhone settings, or add by name. |
| `qr.cameraUnavailable` | De camera is niet beschikbaar. Voeg toe via naam. | The camera is not available. Add by name instead. |
| `qr.confirmTitle` | Wie heb je gescand? | Who did you scan? |
| `qr.known` | Je kent {name} al. | You already know {name}. |
| `qr.save` | Bewaar en open LinkedIn | Save and open LinkedIn |
| `qr.saveMetToday` | Naar de notitie | Go to the note |
| `qr.scanAgain` | Opnieuw scannen | Scan again |

Tone per `wiki/merk-en-stijl.md`: friendly, short.
