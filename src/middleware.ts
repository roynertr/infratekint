import { defineMiddleware } from "astro:middleware";

const LOCALE_COOKIE = "infratek_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** ISO 3166-1 alpha-2 — Spanish as primary language */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  "ES",
  "MX",
  "AR",
  "CO",
  "CL",
  "PE",
  "VE",
  "EC",
  "GT",
  "CU",
  "BO",
  "DO",
  "HN",
  "PY",
  "SV",
  "NI",
  "CR",
  "PA",
  "UY",
  "PR",
  "GQ",
]);

function prefersSpanishFromCountry(country: string | null): boolean {
  if (!country || country === "XX") return false;
  return SPANISH_SPEAKING_COUNTRIES.has(country.toUpperCase());
}

function prefersSpanishFromAcceptLanguage(header: string | null): boolean {
  if (!header) return false;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("es");
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  const v = m?.[1];
  if (v === "en" || v === "es") return v;
  return null;
}

function buildCookie(value: "en" | "es", secure: boolean): string {
  const base = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  return secure ? `${base}; Secure` : base;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const pathname = url.pathname;
  const secure = url.protocol === "https:";

  if (
    pathname.startsWith("/_astro") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/keystatic") ||
    pathname.startsWith("/_image") ||
    pathname.startsWith("/admin")
  ) {
    return next();
  }

  if (/\.[a-z0-9]{2,10}$/i.test(pathname)) {
    return next();
  }

  const cookieLocale = readCookie(context.request.headers.get("cookie"), LOCALE_COOKIE);
  const cfCountry = context.request.headers.get("cf-ipcountry");
  const acceptLang = context.request.headers.get("accept-language");

  if (pathname === "/es" || pathname.startsWith("/es/")) {
    if (!cookieLocale) {
      const res = await next();
      const h = new Headers(res.headers);
      h.append("Set-Cookie", buildCookie("es", secure));
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
    }
    return next();
  }

  if (pathname === "/" || pathname === "") {
    if (cookieLocale === "es") {
      const dest = new URL("/es/", url.origin);
      dest.search = url.search;
      return new Response(null, {
        status: 302,
        headers: { Location: dest.pathname + dest.search },
      });
    }
    if (cookieLocale === "en") {
      return next();
    }

    let preferEs = prefersSpanishFromCountry(cfCountry);
    if (!cfCountry || cfCountry === "XX") {
      preferEs = prefersSpanishFromAcceptLanguage(acceptLang);
    }

    if (preferEs) {
      const dest = new URL("/es/", url.origin);
      dest.search = url.search;
      return new Response(null, {
        status: 302,
        headers: {
          Location: dest.pathname + dest.search,
          "Set-Cookie": buildCookie("es", secure),
        },
      });
    }

    const res = await next();
    const h = new Headers(res.headers);
    h.append("Set-Cookie", buildCookie("en", secure));
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }

  if (!cookieLocale) {
    const res = await next();
    const h = new Headers(res.headers);
    h.append("Set-Cookie", buildCookie("en", secure));
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }

  return next();
});
