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

/**
 * * returns "humanized" text. runs slugify() and then replaces - with space and upper case first letter of every word, and lower case the rest
 * @param text: string - text to humanize
 */
export function humanize(text: string): string {
  const slugifiedText = slugify(text);
  return (
    slugifiedText
      .replace(/-/g, " ") // replace "-" with space
      // .toLowerCase();
      .replace(
        // upper case first letter of every word, and lower case the rest
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      )
  );
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
