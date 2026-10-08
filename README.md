# De Sociale Vlinder (The Social Butterfly)

A personal web app (PWA for iPhone) that helps Britt connect with people on LinkedIn at
conferences and trade fairs, in a way that feels natural. All personal data stays on the phone.

**Live:** <https://socialbutterfly2.pages.dev/> (add it to the iPhone home screen via Safari → Share
→ Add to Home Screen; the icon is labelled "SB").

## Run locally

```bash
cd app
nvm use            # Node version from app/.nvmrc
npm install
npm run dev        # development server
npm test           # tests
npm run typecheck
npm run build      # production build in app/dist
```

Cloudflare Pages builds `app/` on every push to `main` (settings in
[specs/001-app-foundation/contracts/hosting.md](specs/001-app-foundation/contracts/hosting.md)).

## Repository

- [CLAUDE.md](CLAUDE.md): how the knowledge in this repo is organised; read first.
- [wiki/](wiki/): vision, decisions, glossary and open questions (Dutch).
- [specs/](specs/): constitution prompt, feature list and Spec Kit specs, plans and tasks (English).
- [app/](app/): the app.
