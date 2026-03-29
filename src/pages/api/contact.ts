import type { APIRoute } from "astro";

export const prerender = false;

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

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      name = String(body.name ?? "").trim();
      email = String(body.email ?? "").trim();
      phone = String(body.phone ?? "").trim();
      message = String(body.message ?? "").trim();
    } else {
      const form = await request.formData();
      name = String(form.get("name") ?? "").trim();
      email = String(form.get("email") ?? "").trim();
      phone = String(form.get("phone") ?? "").trim();
      message = String(form.get("message") ?? "").trim();
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
    "InfraTek Website <onboarding@resend.dev>";

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
      subject: `InfraTek contact: ${name}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Phone:</strong> ${escapeHtml(phone || "—")}</p>
<p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(JSON.stringify({ ok: false, error: errText || "Email send failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
