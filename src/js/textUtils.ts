import { locales, localeMap } from "@/config/siteSettings.json";

/**
 * * returns "slugified" text.
 * @param text: string - text to slugify
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase() // convert to lowercase
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^\w-]+/g, "") // remove all non-word chars
    .replace(/--+/g, "-") // replace multiple dashes with single dash
    .replace(/^-+/, "") // trim dash from start of text
    .replace(/-+$/, ""); // trim dash from end of text
}

/** Industry / product acronyms that should stay uppercase when humanizing slugs. */
const HUMANIZE_ACRONYMS = new Set([
  "acc",
  "bim",
  "cad",
  "cde",
  "cobie",
  "dwg",
  "ifc",
  "ifc4",
  "ipd",
  "iso",
  "lod",
  "mep",
  "og",
  "rvt",
  "vr",
]);

/**
 * * returns "humanized" text for slug-like labels (e.g. `bim-services` → `BIM Services`).
 * Preserves Unicode letters (accents). Does not strip characters the way slugify() does.
 * @param text: string - text to humanize
 */
export function humanize(text: string): string {
  return text
    .toString()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\S+/g, (word) => {
      const lower = word.toLocaleLowerCase("es");
      if (HUMANIZE_ACRONYMS.has(lower)) return lower.toUpperCase();
      // Keep short all-caps tokens (INICA, CDE, ISO…)
      if (word.length <= 6 && word === word.toLocaleUpperCase("es") && /\p{L}/u.test(word)) {
        return word;
      }
      return word.charAt(0).toLocaleUpperCase("es") + word.slice(1).toLocaleLowerCase("es");
    });
}

/**
 * Portfolio / content tags are authored as display labels (often with accents and acronyms).
 * Show them as written; only humanize pure slug-like values (e.g. `bim-modeling`).
 */
export function formatTagLabel(tag: string): string {
  const trimmed = tag.toString().trim();
  if (!trimmed) return "";
  const hasSpace = /\s/.test(trimmed);
  const hasUppercaseLetter = /\p{Lu}/u.test(trimmed);
  const hasNonAscii = /[^\u0000-\u007f]/.test(trimmed);
  // Already a display label — do not reformat (preserves accents, BIM, INICA, etc.)
  if (hasSpace || hasUppercaseLetter || hasNonAscii) return trimmed;
  return humanize(trimmed);
}

/**
 * WordPress/CMS excerpts often end with a bracketed ellipsis entity, e.g. `[&hellip;]`.
 * Normalizes that and common entity forms for plain-text cards, meta tags, and RSS.
 */
export function normalizeImportedExcerpt(text: string | undefined | null): string {
  if (text == null || text === "") return "";
  const ellipsis = "\u2026";
  return text
    .replace(/\s*\[&hellip;\]/gi, ellipsis)
    .replace(/\s*\[&#8230;\]/g, ellipsis)
    .replace(/&hellip;/gi, ellipsis)
    .replace(/&#8230;/g, ellipsis)
    .replace(/&#x2026;/gi, ellipsis)
    .replace(/\u2026{2,}/g, ellipsis)
    .trim();
}

// --------------------------------------------------------
/**
 * * returns "categorified" text. runs slugify() and then replaces - with space and upper cases everything
 * @param text: string - text to categorify
 * @returns string - categorified text
 */
export function categorify(text: string): string {
  const slugifiedText = slugify(text);
  return slugifiedText
    .replace(/-/g, " ") // replace "-" with space
    .toUpperCase();
}

// --------------------------------------------------------
/**
 * * returns a nicely formatted string of the date passed
 * @param date: string | number | Date - date to format
 * @param locale: string - locale to format the date in
 * @returns string - formatted date
 */
export function formatDate(date: string | number | Date, locale: (typeof locales)[number]): string {
  let localeString = "en-US";

  if (locales.includes(locale)) {
    localeString = localeMap[locale];
  }

  return new Date(date).toLocaleDateString(localeString, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
