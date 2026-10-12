# Begrippen

Gebruik deze woorden consequent. De Engelse term is de naam in specs en code.

| NL | EN (code) | Betekenis |
|---|---|---|
| Persoon | `Person` | Iemand met een LinkedIn-profiel. Uniek geïdentificeerd door de **profiel-URL** (zodra gekend). |
| Ontmoeting | `Encounter` | Eén keer dat Britt een persoon ontmoette: hoort bij één evenement, heeft een datum en een notitie. Een persoon kan meerdere ontmoetingen hebben. |
| Evenement | `Event` | Conferentie, beurs of meetup (bv. "Devoxx 2026"). Heeft een startdatum en een einddatum (kan dezelfde dag zijn). |
| Zonder evenement | casual networking | Netwerken buiten een evenement. Ontmoetingen hebben dan geen evenement; er is geen actief evenement. |
| Actief evenement | `activeEvent` | Het evenement dat nu loopt; nieuwe ontmoetingen komen er automatisch onder. |
| Notitie | `note` | Britts persoonlijke notitie bij een ontmoeting, om later een persoonlijk bericht te kunnen sturen. Nooit zichtbaar voor gasten. |
| Profiel-URL | `profileUrl` | Genormaliseerde LinkedIn-URL, bv. `https://www.linkedin.com/in/britt-breugelmans`. |
| Zoek-link | `searchUrl` | LinkedIn-zoekpagina met naam + bedrijf, gebruikt zolang de profiel-URL ontbreekt. |
| Actie | `Action` | Openstaande taak op de Acties-tab, per persoon. Types: notitie ontbreekt (geen enkele ontmoeting heeft een notitie, B31), nog niet geconnecteerd, profiel-link ontbreekt. |
| Afgewezen actie | `dismissed` | Actie die Britt bewust negeert (bv. geen notitie nodig). Verschijnt niet meer, tot Britt de persoon opnieuw ontmoet (B30). |
| Connectiestatus | `connectionStatus` | Of Britt al op "Connect" tikte in LinkedIn: "nog niet geconnecteerd" (`notConnected`) of "geconnecteerd" (`connected`). Britt zet het met "Ik heb geconnecteerd" (B16). |
| Doorgeef-modus | `guestMode` | Scherm voor de gast: groot, vriendelijk, tweetalig, zonder Britts lijst of notities. |
| Snelle modus | `quickMode` | Britt vult zelf in; compact en snel. |
| Mijn QR | `myQr` | Scherm met Britts eigen LinkedIn-QR (met vlinder). |
| Eigen profiel-URL | `ownerProfileUrl` | Britts eigen genormaliseerde profiel-URL; alleen gebruikt voor Mijn QR. Geen persoon (B33). |
| Back-up | `backup` | CSV-bestand met alle personen, ontmoetingen, evenementen en notities; één rij per ontmoeting (B35). Alleen exporteren (B36). |
| Back-upherinnering | `backupReminder` | Melding op Toevoegen om een back-up te maken: de dag na een evenement of na netwerken zonder evenement, of na wijzigingen (T10, T11, B40). "Later" = niet meer vandaag. |
| Alle data wissen | `deleteAllData` | Alles van het toestel verwijderen behalve de taal; pas na het typen van "WISSEN" (B41). |
| Gast | `guest` | De persoon die de doorgeef-modus gebruikt. |
| Eigenaar | `owner` | Britt. |
