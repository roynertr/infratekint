export type ContactFormStrings = {
  okTitle: string;
  ok: string;
  errTitle: string;
  err: string;
  netTitle: string;
  net: string;
  loading: string;
  sending: string;
  send: string;
};

const iconCheck =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>';
const iconAlert =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
const iconSpinner =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 shrink-0 animate-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';

let activeController: AbortController | null = null;

function clearLegacyQueryParams() {
  if (!window.location.search) return;
  if (!window.location.pathname.includes("contact")) return;
  window.history.replaceState({}, "", window.location.pathname);
}

function readStrings(form: HTMLFormElement): ContactFormStrings | null {
  const raw = form.dataset.i18n;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ContactFormStrings;
  } catch {
    return null;
  }
}

export function initContactForm() {
  activeController?.abort();
  activeController = new AbortController();
  const { signal } = activeController;

  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  if (!form) return;

  const strings = readStrings(form);
  if (!strings) return;

  clearLegacyQueryParams();

  const statusEl = document.getElementById("contact-form-status");
  const statusIcon = document.getElementById("contact-form-status-icon");
  const statusTitle = document.getElementById("contact-form-status-title");
  const statusDetail = document.getElementById("contact-form-status-detail");
  const submitBtn = document.getElementById("contact-submit") as HTMLButtonElement | null;

  function setStatus(state: "loading" | "success" | "error", title: string, detail: string) {
    if (!statusEl || !statusIcon || !statusTitle || !statusDetail) return;

    statusEl.classList.remove(
      "hidden",
      "contact-form-status--loading",
      "contact-form-status--success",
      "contact-form-status--error",
    );
    statusEl.classList.add(`contact-form-status--${state}`);
    statusEl.setAttribute("role", state === "error" ? "alert" : "status");

    statusTitle.textContent = title;
    statusDetail.textContent = detail;

    if (state === "loading") statusIcon.innerHTML = iconSpinner;
    else if (state === "success") statusIcon.innerHTML = iconCheck;
    else statusIcon.innerHTML = iconAlert;

    statusEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideStatus() {
    if (!statusEl || !statusTitle || !statusDetail || !statusIcon) return;
    statusEl.classList.add("hidden");
    statusEl.classList.remove(
      "contact-form-status--loading",
      "contact-form-status--success",
      "contact-form-status--error",
    );
    statusTitle.textContent = "";
    statusDetail.textContent = "";
    statusIcon.innerHTML = "";
  }

  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();
      if (!submitBtn) return;

      hideStatus();
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.textContent = strings.sending;
      form.setAttribute("aria-busy", "true");
      setStatus("loading", strings.sending, strings.loading);

      const fd = new FormData(form);
      const payload = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        message: String(fd.get("message") || "").trim(),
      };

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

        if (res.ok && data.ok) {
          setStatus("success", strings.okTitle, strings.ok);
          form.reset();
          clearLegacyQueryParams();
        } else {
          setStatus("error", strings.errTitle, data.error || strings.err);
        }
      } catch {
        setStatus("error", strings.netTitle, strings.net);
      } finally {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.textContent = strings.send;
        form.removeAttribute("aria-busy");
      }
    },
    { signal },
  );
}
