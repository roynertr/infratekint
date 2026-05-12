import { locales } from "@config/siteSettings.json";

import { humanize, slugify } from "@/js/textUtils";

type SiteLocale = (typeof locales)[number];

/** Canonical slug (matches YAML / countItems keys) → localized label for blog category chips and headings */
const BLOG_CATEGORY_LABELS: Record<string, { en: string; es: string }> = {
  "4d-bim": { en: "4D BIM", es: "4D BIM" },
  "5d-bim": { en: "5D BIM", es: "5D BIM" },
  "5d-bim-costes": { en: "5D BIM — Cost", es: "5D BIM — Costes" },
  "administracion-publica": { en: "Public administration", es: "Administración pública" },
  bim: { en: "BIM", es: "BIM" },
  blogging: { en: "Blogging", es: "Blog" },
  "cool-code": { en: "Cool code", es: "Código" },
  construccion: { en: "Construction", es: "Construcción" },
  "coordinacion-bim": { en: "BIM coordination", es: "Coordinación BIM" },
  diseno: { en: "Design", es: "Diseño" },
  "facility-management": { en: "Facility management", es: "Gestión de instalaciones" },
  "gestion-de-proyectos": { en: "Project management", es: "Gestión de proyectos" },
  implementacion: { en: "Implementation", es: "Implementación" },
  ipd: { en: "IPD", es: "IPD" },
  "lean-construction": { en: "Lean Construction", es: "Lean Construction" },
  openbim: { en: "OpenBIM", es: "OpenBIM" },
  productivity: { en: "Productivity", es: "Productividad" },
  sostenibilidad: { en: "Sustainability", es: "Sostenibilidad" },
};

/**
 * Localized display label for a blog category slug (or raw frontmatter value).
 */
export function formatBlogCategoryLabel(category: string, locale: SiteLocale): string {
  const key = slugify(category);
  const row = BLOG_CATEGORY_LABELS[key];
  if (row) return locale === "es" ? row.es : row.en;
  return humanize(category);
}
