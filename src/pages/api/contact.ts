/**
 * Contact form endpoint — runs as a Vercel Serverless Function (and locally in `astro dev`).
 * Env: RESEND_API_KEY (required); CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL (optional);
 *      TURNSTILE_SECRET_KEY (optional, recommended for bot protection).
 */
import type { APIRoute } from "astro";

export const prerender = false;

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";
  return request.headers.get("x-real-ip") || "";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") || "";
  let name = "";
  let email = "";
  let phone = "";
  let message = "";
  let turnstileToken = "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      name = String(body.name ?? "").trim();
      email = String(body.email ?? "").trim();
      phone = String(body.phone ?? "").trim();
      message = String(body.message ?? "").trim();
      turnstileToken = String(body.turnstileToken ?? "").trim();
    } else {
      const form = await request.formData();
      name = String(form.get("name") ?? "").trim();
      email = String(form.get("email") ?? "").trim();
      phone = String(form.get("phone") ?? "").trim();
      message = String(form.get("message") ?? "").trim();
      turnstileToken = String(form.get("cf-turnstile-response") ?? "").trim();
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ ok: false, error: "Name, email, and message are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email address." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = import.meta.env.RESEND_API_KEY as string | undefined;
  const turnstileSecretKey = import.meta.env.TURNSTILE_SECRET_KEY as string | undefined;

  if (turnstileSecretKey) {
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Please complete the captcha verification.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecretKey,
        response: turnstileToken,
        remoteip: getClientIp(request),
      }),
    });

    if (!verifyRes.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Captcha verification is unavailable. Please try again.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const verifyData = (await verifyRes.json()) as TurnstileResponse;
    if (!verifyData.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Captcha verification failed. Please try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Email is not configured (missing RESEND_API_KEY).",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const to = (import.meta.env.CONTACT_TO_EMAIL as string | undefined) || "info@infratekint.com";
  const from =
    (import.meta.env.CONTACT_FROM_EMAIL as string | undefined) ||
    "INFRATEK Website <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `INFRATEK contact: ${name}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let error = errText || "Email send failed";
    try {
      const j = JSON.parse(errText) as { message?: string; name?: string };
      if (j.message) error = [j.name, j.message].filter(Boolean).join(": ") || error;
    } catch {
      /* keep plain text body */
    }
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
