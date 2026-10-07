# Constitution-prompt

Gebruik deze prompt om de constitution te genereren (bv. als input voor de constitution-stap van Spec Kit).
De context zit in de wiki; de prompt verwijst ernaar én herhaalt de harde beperkingen, zodat ze nooit verloren gaan.

---

```markdown
# Role
You are a senior product engineer helping me write the constitution for a
small personal app. The constitution holds the non-negotiable principles that
every later spec, plan and task must respect. You write for AI coding agents
that have NOT seen my conversations, so every principle must be explicit.

# Read first
- CLAUDE.md (how this repo is organised)
- wiki/visie.md, wiki/beslissingen.md, wiki/linkedin-beperkingen.md,
  wiki/begrippen.md, wiki/open-vragen.md
The wiki is written in Dutch; write the constitution in English and use the
English terms from wiki/begrippen.md.

# Project context
- Name: "De Sociale Vlinder" (The Social Butterfly)
- Purpose: help me (Britt, a developer) connect with people on LinkedIn at
  conferences and trade fairs, in a way that feels natural instead of awkward.
  The app is also a conversation starter and a showcase of my skills.
- Users:
  - Owner: me, on my iPhone.
  - Guest: the person I meet, who may type their own name on my phone
    ("guest mode").
- Core flows (v1): add a contact by name (opens LinkedIn people search),
  add by scanning a LinkedIn QR code, write a personal note, track open
  actions, show my own LinkedIn QR.

# Hard constraints (decided, do not reconsider)
1. LinkedIn rules: no scraping, no unofficial APIs, no automated sending of
   connection requests or messages. The app only opens LinkedIn URLs; I do
   the final tap myself. Reason: protect my LinkedIn account.
2. Zero cost: no paid services, APIs, or app store accounts.
3. Platform: web app (PWA) installed on an iPhone home screen via Safari.
   Reason: a native iOS app requires a paid developer account.
4. Online app, local data: the app is hosted online and requires an internet
   connection (LinkedIn search needs it); offline use is NOT a requirement.
   All personal data stays on my device in v1. The data model must allow
   adding cloud sync later without a rewrite.
5. LinkedIn-only: a person is only stored if they have (or will get) a
   LinkedIn profile URL. The URL is the unique identity of a person; meeting
   the same person again adds an Encounter to the existing Person.
6. Privacy: I store other people's data. Guests see a short notice that their
   data stays only on my phone. Notes are never shown in guest mode.
   Export (CSV) and delete must always be possible.
7. Guest-facing screens are bilingual (Dutch/English, switchable).
8. Branding: LinkedIn-like blue tones are allowed; LinkedIn's logo and
   trademarks are not.

# Quality values (ranked; resolve conflicts in this order)
1. Speed in the moment: adding someone at a busy event takes seconds and few taps.
2. Correctness of data: no lost contacts, no silent duplicates.
3. Delight: polished design and small animations (butterfly theme).
4. Simplicity: build only what v1 needs (YAGNI).

# Output rules
- Format: Markdown, max ~2 pages.
- 6–10 principles. Each has: a short title, a rule written with MUST / SHOULD /
  MUST NOT, a one-sentence rationale, and how a reviewer can verify it.
- Include sections: Purpose, Principles, Out of scope (v1), Governance
  (how the constitution is amended, semantic versioning, date).
- No implementation details (no frameworks, libraries, or file names) —
  those belong in the plan, not the constitution.
- Do not invent requirements. If something is ambiguous or missing,
  list it under "Open questions" at the end instead of guessing, and
  reference the matching item in wiki/open-vragen.md where one exists.
```
