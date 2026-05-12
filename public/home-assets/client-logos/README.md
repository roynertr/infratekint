# Client logos (legacy path)

Logos for the home **Trusted by** strip are managed in **Keystatic** (`/admin`):

- **Home — Trusted by (copy)** — bilingual eyebrow, title, and summary  
  `src/data/home-trusted-by/home-trusted-by/index.yaml`
- **Home — Client logos** — one entry per brand (logo image, alt text, sort order, draft)  
  `src/data/client-logos/<slug>/index.yaml`

Adding a logo: create a new entry under **Home — Client logos**, upload the image, set **Sort order**, and publish.

The PNG files that used to live only under `public/home-assets/client-logos/` are superseded by `src/data/client-logos/` so uploads and builds stay in sync.
