import { defineMiddleware } from "astro:middleware";

const LOCALE_COOKIE = "infratek_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Production: block template demo routes (still available locally via `astro dev`). */
function isExamplesPath(pathname: string): boolean {
  return (
    pathname === "/examples" ||
    pathname.startsWith("/examples/") ||
    pathname === "/es/examples" ||
    pathname.startsWith("/es/examples/")
  );
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
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/admin")
  ) {
    return next();
  }

  if (/\.[a-z0-9]{2,10}$/i.test(pathname)) {
    return next();
  }

  // Demo/template pages are not served in production deployments.
  if (import.meta.env.PROD && isExamplesPath(pathname)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  }

  const cookieLocale = readCookie(context.request.headers.get("cookie"), LOCALE_COOKIE);
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

    const preferEs = prefersSpanishFromAcceptLanguage(acceptLang);

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
