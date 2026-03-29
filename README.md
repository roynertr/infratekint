# InfraTek — infratekint.com

Astro 5 site for **InfraTek INT LLC** (BIM, COBie, digital twins, reality capture). Based on the Atlas template (Cosmic Themes).

## Stack

- **Hosting:** Cloudflare Pages (SSR via `@astrojs/cloudflare`)
- **i18n:** English (default) + Spanish (`/es/…`), geo hint via `CF-IPCountry` + `infratek_locale` cookie (`src/middleware.ts`)
- **Contact:** `POST /api/contact` → Resend → `info@infratekint.com` (configure env vars)

## Local

```bash
npm install
npm run dev
npm run build
```

Copy `.env.example` to `.env` and add `RESEND_API_KEY` to test email locally.

## Cloudflare Pages

1. Create GitHub repository `infratekint` and push this directory as the repo root (or set **Root directory** in Pages to `website/` if the monorepo keeps a parent folder).
2. **Workers & Pages** → **Create** → **Connect to Git** → pick the repo.
3. **Build command:** `npm run build`  
   **Build output directory:** `dist`  
   **Environment variables:** `RESEND_API_KEY` (required for contact form), optional `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` (defaults to `info@infratekint.com`).
4. **Custom domains:** add `infratekint.com` and point DNS as Cloudflare instructs.
5. **Preview URLs:** Git integration enables preview deployments per branch/PR automatically.

## Resend

- Add API key in Cloudflare **Settings → Environment variables** for Production and Preview.
- Verify sending domain in Resend, then set `CONTACT_FROM_EMAIL` to e.g. `InfraTek <info@infratekint.com>`.
- The default `onboarding@resend.dev` sender only works for Resend account test recipients until a domain is verified.

## Keystatic

CMS remains at `/keystatic` (see `keystatic.config.tsx`). Production uses Keystatic Cloud; adjust `cloud.project` if you use your own team.
