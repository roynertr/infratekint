# INFRATEK — infratekint.com

Astro 5 site for **INFRATEK INT LLC** (BIM, COBie, digital twins, reality capture). Based on the Atlas template (Cosmic Themes).

## Stack

- **Hosting:** [Vercel](https://vercel.com/) (SSR via `@astrojs/vercel`)
- **i18n:** English (default) + Spanish (`/es/…`), locale cookie `infratek_locale` + `Accept-Language` on first visit to `/` (`src/middleware.ts`)
- **Contact:** `POST /api/contact` → Resend → `info@infratekint.com` (requires env vars on Vercel)

## Local

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to `.env` and add `RESEND_API_KEY` to test email locally.

Generate the default Open Graph image (writes `public/images/infratek-og.jpg`):

```bash
npm run generate:og
```

Smoke test (with key set): send a JSON POST to `http://localhost:4321/api/contact` with `{"name":"Test","email":"you@example.com","message":"hello"}` and expect `{"ok":true}`.

## Deploy on Vercel (GitHub)

1. Push this repo to GitHub (set **Root Directory** to `website` if the repo root is above this folder).
2. Vercel → **Add New** → **Project** → import the repo.
3. Framework: **Astro** (auto). **Build Command:** `npm run build`. **Output Directory:** `dist`.
4. **Environment variables** (Production and Preview):
   - `RESEND_API_KEY` — required for the contact form (502/503 without it).
   - `CONTACT_TO_EMAIL` — optional (default `info@infratekint.com`).
   - `CONTACT_FROM_EMAIL` — optional; use a verified domain in Resend, e.g. `INFRATEK <info@infratekint.com>`.
5. Custom domain: add `infratekint.com` in Vercel → **Domains**.
6. **Preview deployments:** enabled per branch/PR when using the Git integration.

## Resend

- Add the API key in Vercel **Settings → Environment Variables** for Production and Preview (and in `.env` locally).
- Verify your sending domain in Resend; set `CONTACT_FROM_EMAIL` accordingly.
- The default `onboarding@resend.dev` sender only works for Resend-approved test recipients until a domain is verified.

## Demo routes (`/examples`)

Template demo pages remain in the repo for local development but return **404 in production** (see `src/middleware.ts`). Sitemap excludes `/examples` URLs.

## Keystatic

CMS at `/keystatic` (see `keystatic.config.tsx`). In dev, storage is **local**. In production, Keystatic uses **Cloud** mode; set `cloud.project` to your team when you leave the template defaults.

## Blog rewrite (OpenRouter)

Automated editorial pass for `src/data/blog/**/index.mdx` using GPT via [OpenRouter](https://openrouter.ai/) (default model `openai/gpt-5.5`). System prompt: `scripts/prompts/blog-rewrite-system.md`.

Set in `.env` (never commit secrets):

- `OPENROUTER_API_KEY` — required to call the API
- `OPENROUTER_MODEL` — optional, defaults to `openai/gpt-5.5`
- `REWRITE_BASE_DATE` — optional `YYYY-MM-DD` anchor for staggered `updatedDate` (per-slug hash spread)
- `SITE` — optional canonical origin (defaults to `https://infratekint.com`)

Commands (from `website/`):

```bash
# Preview model output without writing files
npm run blog:rewrite -- --dry-run --only=coordinacion-bim-inteligente --locale=es

# Rewrite up to 3 posts (Spanish), then run `astro build` as a gate
npm run blog:rewrite -- --locale=es --max=3 --build

# Batches: stable slug order; `--offset` skips N posts (exit code 2 = no posts in window)
npm run blog:rewrite -- --locale=es --max=5 --offset=0
npm run blog:rewrite -- --locale=es --max=5 --offset=5
```

`--build` is ignored with `--dry-run`. Logs are written next to each post as `index.rewrite-log.json` (gitignored).
