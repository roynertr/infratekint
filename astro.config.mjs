import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import compress from "@playform/compress";
import AutoImport from "astro-auto-import";
import icon from "astro-icon";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://infratekint.com",
  output: "server",
  // Production: Vercel Image Optimization (`/_vercel/image`); dev stays on Sharp via the adapter default.
  adapter: vercel({
    imageService: true,
    webAnalytics: { enabled: true },
  }),
  redirects: {
    "/admin": "/keystatic",
  },
  // i18n configuration must match src/config/translations.json.ts
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      // Shiki Themes: https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: "dracula",
      wrap: true,
    },
  },
  integrations: [
    // example auto import component into mdx files
    AutoImport({
      imports: [
        // https://github.com/delucis/astro-auto-import
        "@components/Admonition/Admonition.astro",
      ],
    }),
    mdx(),
    react(),
    icon({
      include: {
        // FeatureCardsSmall uses Iconify "tabler:code" (local SVG for this name was unreliable in astro-icon’s pipeline)
        tabler: ["code"],
      },
    }),
    keystatic(),
    sitemap({
      filter: (page) => !page.includes("/examples"),
    }),
    compress({
      HTML: true,
      JavaScript: true,
      CSS: false, // enabling this can cause issues
      Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
      SVG: false, // astro-icon handles this
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    // Ignore adapter/build output so `astro dev` does not watch thousands of files or
    // retrigger content sync (can race on OneDrive/antivirus and break `/es/` with 500).
    server: {
      watch: {
        ignored: ["**/.vercel/**", "**/dist/**"],
      },
    },
    // stop inlining short scripts to fix issues with ClientRouter
    build: {
      assetsInlineLimit: 0,
    },
    // Keystatic: pre-bundle in dev so the browser uses `.vite/deps/*`, not `/node_modules/*`
    // (SSR catch‑all `[...page].astro` may otherwise intercept `/node_modules/...` in dev).
    optimizeDeps: {
      include: ["@keystatic/core", "@keystatic/core/ui", "lodash/debounce"],
    },
  },
});
