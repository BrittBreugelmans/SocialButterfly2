# Contract: Hosting and Installation

What the published app MUST deliver to the iPhone (FR-001 – FR-005, FR-008, FR-009).

## Cloudflare Pages project

| Setting | Value |
|---|---|
| Repository | `BrittBreugelmans/SocialButterfly2` (GitHub) |
| Production branch | `main` |
| Root directory | `app` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `NODE_VERSION` = exact version in `app/.nvmrc` (Node 24) |
| Address | `https://socialbutterfly2.pages.dev/` |
| Web Analytics | **Off** |

These build settings become active in the same push in which `app/package.json` first exists
(see "Rollout" in [../plan.md](../plan.md)). A failed build leaves the last successful version
online.

## HTTP headers (`_headers` in the build output)

```text
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
```

- `connect-src 'self'` blocks sending data to any other server (FR-008). Opening LinkedIn later
  (F2+) is navigation, not a request, so it is not blocked.
- Any later change that loosens the policy MUST be justified against constitution IV/VI.

## Web app manifest and iOS tags

| Item | Value |
|---|---|
| `short_name` / `apple-mobile-web-app-title` | `SB` (home-screen label, FR-003) |
| `name` | `De Sociale Vlinder` (in-app name follows the language; see [i18n.md](i18n.md) `app.title`) |
| `display` | `standalone` |
| `start_url` / `scope` | `/` |
| `theme_color` / `background_color` | LinkedIn-like blue / white (final values in F11) |
| Icons | `apple-touch-icon-180x180.png`; manifest `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`; generated from `public/icon.svg` (placeholder butterfly, no LinkedIn logo) |
| `lang` | `nl` |

## Service worker

- Precaches the app shell only; never caches or stores personal data.
- `autoUpdate` with immediate registration: a new version activates on the next real launch
  without reinstalling (FR-009).
- Offline launch shows the app's own "needs internet" screen (FR-005).
