/**
 * INFRATEK blog rewrite — OpenRouter (default: openai/gpt-5.5)
 *
 * Usage (from website/):
 *   node ./scripts/blog-rewrite.mjs --dry-run --only=coordinacion-bim-inteligente --locale=es
 *   node ./scripts/blog-rewrite.mjs --locale=es --max=2 --offset=0
 *   node ./scripts/blog-rewrite.mjs --build
 *
 * Env: OPENROUTER_API_KEY (required), OPENROUTER_MODEL, REWRITE_BASE_DATE (YYYY-MM-DD),
 *      BLOG_REWRITE_EXTRA_CONTEXT (optional text appended to system)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import matter from "gray-matter";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = join(__dirname, "..");
dotenv.config({ path: join(WEBSITE_ROOT, ".env") });

const BLOG_ROOT = join(WEBSITE_ROOT, "src", "data", "blog");
const SYSTEM_PROMPT_PATH = join(__dirname, "prompts", "blog-rewrite-system.md");
const EXTRA_ICP_PATH = join(WEBSITE_ROOT, "..", ".agents", "product-marketing-context.md");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function optValue(argv, prefix) {
  const a = argv.find((x) => x.startsWith(prefix));
  if (!a) return null;
  return a.slice(prefix.length);
}

function parseArgs(argv) {
  const maxStr = optValue(argv, "--max=");
  const maxParsed = maxStr ? parseInt(maxStr, 10) : 0;
  const offsetStr = optValue(argv, "--offset=");
  const offsetParsed = offsetStr ? parseInt(offsetStr, 10) : 0;
  return {
    dryRun: argv.includes("--dry-run"),
    build: argv.includes("--build"),
    locale: optValue(argv, "--locale="),
    only: optValue(argv, "--only="),
    max: Number.isFinite(maxParsed) && maxParsed > 0 ? maxParsed : 0,
    offset: Number.isFinite(offsetParsed) && offsetParsed >= 0 ? offsetParsed : 0,
  };
}

function listPosts({ locale, only }) {
  const locales = locale ? [locale] : ["es", "en"];
  const posts = [];
  for (const loc of locales) {
    const dir = join(BLOG_ROOT, loc);
    if (!existsSync(dir)) continue;
    const names = readdirSync(dir, { withFileTypes: true })
      .filter((ent) => ent.isDirectory())
      .map((ent) => ent.name)
      .sort((a, b) => a.localeCompare(b, "en"));
    for (const slug of names) {
      if (only && slug !== only) continue;
      const file = join(dir, slug, "index.mdx");
      if (!existsSync(file)) continue;
      posts.push({ locale: loc, slug, file });
    }
  }
  return posts;
}

function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** YYYY-MM-DD: base (REWRITE_BASE_DATE or today UTC) + hash(slug) % 21 days */
function staggeredUpdatedDate(slug) {
  const baseStr = process.env.REWRITE_BASE_DATE?.trim();
  const base = baseStr
    ? new Date(`${baseStr}T12:00:00.000Z`)
    : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new Error(`Invalid REWRITE_BASE_DATE: ${process.env.REWRITE_BASE_DATE}`);
  }
  const days = hashSlug(slug) % 21;
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadSystemPrompt() {
  let system = readFileSync(SYSTEM_PROMPT_PATH, "utf8");
  if (existsSync(EXTRA_ICP_PATH)) {
    try {
      const extra = readFileSync(EXTRA_ICP_PATH, "utf8");
      system += "\n\n## Extra ICP context (from repository)\n\n" + extra;
    } catch {
      /* ignore */
    }
  }
  if (process.env.BLOG_REWRITE_EXTRA_CONTEXT?.trim()) {
    system +=
      "\n\n## Extra ICP context (from env)\n\n" + process.env.BLOG_REWRITE_EXTRA_CONTEXT.trim();
  }
  return system;
}

function extractJson(text) {
  const t = text.trim();
  const fence = /^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/;
  const m = t.match(fence);
  const raw = m ? m[1].trim() : t;
  return JSON.parse(raw);
}

function truncateDescription(s, max = 160) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function validatePayload(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Response is not an object");
  const { title, description, categories, body_md } = obj;
  if (typeof title !== "string" || !title.trim()) throw new Error("Missing or invalid title");
  if (typeof description !== "string" || !description.trim())
    throw new Error("Missing or invalid description");
  if (!Array.isArray(categories) || categories.length === 0)
    throw new Error("Missing or invalid categories");
  if (typeof body_md !== "string") throw new Error("Missing or invalid body_md");
  return {
    title: title.trim(),
    description: truncateDescription(description.trim()),
    categories: categories.map((c) => String(c).trim()).filter(Boolean),
    body_md: body_md.trim(),
    notes: typeof obj.notes === "string" ? obj.notes : undefined,
  };
}

async function callOpenRouter(system, userContent) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set (add it to website/.env)");
  }
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-5.5";
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://infratekint.com",
      "X-Title": "INFRATEK blog-rewrite",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${rawText.slice(0, 2000)}`);
  }
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`OpenRouter returned non-JSON: ${rawText.slice(0, 500)}`);
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error(`Unexpected OpenRouter payload: ${rawText.slice(0, 800)}`);
  }
  return extractJson(text);
}

function buildUserMessage({ locale, slug, matterData, body }) {
  const site = (process.env.SITE || "https://infratekint.com").replace(/\/$/, "");
  const path = locale === "es" ? `/es/blog/${slug}` : `/blog/${slug}`;
  const metaJson = JSON.stringify(matterData, null, 2);
  return [
    "## Article metadata",
    `- locale: ${locale}`,
    `- slug: ${slug}`,
    `- canonical (hint): ${site}${path}`,
    "",
    "## Frontmatter (JSON — preserve factual accuracy; the site file will keep authors, pubDate, heroImage, mappingKey, draft, etc. Script merges your title, description, categories, and body.)",
    "```json",
    metaJson,
    "```",
    "",
    "## Body (MDX / markdown)",
    body.trim(),
  ].join("\n");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runBuildGate() {
  console.error("\n[blog-rewrite] Running npm run build …");
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    cwd: WEBSITE_ROOT,
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) {
    throw new Error(`Build failed with exit code ${r.status}`);
  }
  console.error("[blog-rewrite] Build OK.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const system = loadSystemPrompt();
  let posts = listPosts({ locale: args.locale, only: args.only });
  posts.sort((a, b) => `${a.locale}/${a.slug}`.localeCompare(`${b.locale}/${b.slug}`, "en"));
  posts = posts.filter((p) => {
    try {
      const { data } = matter(readFileSync(p.file, "utf8"));
      return data.draft !== true;
    } catch {
      return false;
    }
  });
  const { offset, max } = args;
  if (max > 0) {
    posts = posts.slice(offset, offset + max);
  } else {
    posts = posts.slice(offset);
  }
  if (posts.length === 0) {
    console.error(
      `[blog-rewrite] No posts in window offset=${offset} max=${max || "all"} (list exhausted or invalid filter).`,
    );
    process.exit(2);
  }

  console.error(
    `[blog-rewrite] ${posts.length} post(s) to process (offset=${offset}${max ? `, max=${max}` : ""}). dryRun=${args.dryRun}`,
  );

  let processed = 0;
  for (const { locale, slug, file } of posts) {
    const raw = readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    if (data.draft === true) {
      console.error(`[blog-rewrite] skip draft: ${locale}/${slug}`);
      continue;
    }

    const userMsg = buildUserMessage({ locale, slug, matterData: data, body: content });
    console.error(`[blog-rewrite] → ${locale}/${slug} …`);

    let payload;
    try {
      payload = validatePayload(await callOpenRouter(system, userMsg));
    } catch (e) {
      console.error(`[blog-rewrite] ERROR ${locale}/${slug}:`, e.message || e);
      process.exit(1);
    }

    const logEntry = {
      at: new Date().toISOString(),
      locale,
      slug,
      model: process.env.OPENROUTER_MODEL || "openai/gpt-5.5",
      notes: payload.notes,
    };

    if (args.dryRun) {
      console.log(JSON.stringify({ locale, slug, ...payload }, null, 2));
      processed++;
      await sleep(1500);
      continue;
    }

    const updatedDate = staggeredUpdatedDate(slug);
    const merged = {
      ...data,
      title: payload.title,
      description: payload.description,
      categories: payload.categories,
      updatedDate,
    };

    const out = matter.stringify(payload.body_md.endsWith("\n") ? payload.body_md : payload.body_md + "\n", merged);
    writeFileSync(file, out, "utf8");
    const logPath = join(dirname(file), "index.rewrite-log.json");
    writeFileSync(
      logPath,
      JSON.stringify({ ...logEntry, updatedDate, descriptionLen: payload.description.length }, null, 2) + "\n",
    );
    console.error(`[blog-rewrite] wrote ${locale}/${slug} updatedDate=${updatedDate}`);
    processed++;
    await sleep(2000);
  }

  if (processed === 0) {
    console.error("[blog-rewrite] Nothing processed.");
    process.exit(1);
  }

  if (args.build && !args.dryRun && processed > 0) {
    runBuildGate();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
