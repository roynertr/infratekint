import fs from "node:fs/promises";
import path from "node:path";

const wpApiUrl =
  "https://infratekint.com/wp-json/wp/v2/avada_portfolio?per_page=100&status=publish&_embed=1";
const root = process.cwd();
const portfolioRoot = path.join(root, "src", "data", "portfolio");
const docsRoot = path.join(root, "docs");
const locales = ["en", "es"];

const report = {
  source: wpApiUrl,
  total: 0,
  created: [],
  skippedExisting: [],
  heroDownloaded: [],
  heroMissing: [],
  inlineDownloaded: [],
  inlineMissing: [],
  taxonomies: {},
  errors: [],
};

const entityMap = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
  "#8216": "'",
  "#8217": "'",
  "#8220": '"',
  "#8221": '"',
  "#8226": "-",
  "#8230": "...",
};

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z0-9#]+);/g, (match, key) => entityMap[key] ?? match);
}

function stripTags(html = "") {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function slugify(value = "") {
  return decodeEntities(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function yamlString(value = "") {
  return JSON.stringify(decodeEntities(value).replace(/\r?\n/g, " ").trim());
}

function yamlFolded(value = "") {
  const normalized = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!normalized) return "Selected INFRATEK portfolio project migrated from WordPress.";

  return normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
}

function getTerms(post, taxonomy) {
  return (post._embedded?.["wp:term"] ?? [])
    .flat()
    .filter((term) => term.taxonomy === taxonomy)
    .map((term) => term.name);
}

function trackTaxonomy(taxonomy, terms) {
  if (!report.taxonomies[taxonomy]) report.taxonomies[taxonomy] = new Set();

  terms.forEach((term) => report.taxonomies[taxonomy].add(term));
}

function getFeaturedMedia(post) {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
}

function getFileExtension(url, fallback = ".jpg") {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;
  } catch {
    // Keep fallback.
  }

  return fallback;
}

function safeImageName(url, index) {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, "-");
    return basename || `inline-${index}${getFileExtension(url)}`;
  } catch {
    return `inline-${index}${getFileExtension(url)}`;
  }
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
}

async function prepareHero(post, projectDir, slug, locale) {
  const mediaUrl = getFeaturedMedia(post);
  if (!mediaUrl) {
    report.heroMissing.push({ slug, locale, reason: "no featured media" });
    return null;
  }

  const heroName = `heroImage${getFileExtension(mediaUrl)}`;
  try {
    await downloadFile(mediaUrl, path.join(projectDir, heroName));
    report.heroDownloaded.push({ slug, locale, source: mediaUrl });
    return heroName;
  } catch (error) {
    report.heroMissing.push({ slug, locale, source: mediaUrl, reason: error.message });
    return null;
  }
}

async function replaceInlineImages(html, projectDir, slug, locale) {
  let index = 0;

  const pendingHtml = html.replace(/<img\b([^>]*?)>/gi, (_tag, attrs) => {
    index += 1;
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const alt = decodeEntities(attrs.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "");
    if (!src || src.startsWith("data:")) return "";

    const absoluteSrc = src.startsWith("//")
      ? `https:${src}`
      : src.startsWith("/")
        ? `https://infratekint.com${src}`
        : src;
    const fileName = safeImageName(absoluteSrc, index);
    const destination = path.join(projectDir, fileName);

    return `\n\n<InlineImagePending data-src="${absoluteSrc}" data-dest="${destination}" data-name="${fileName}" data-alt="${alt}" />\n\n`;
  });

  const pending = [
    ...pendingHtml.matchAll(
      /<InlineImagePending data-src="([^"]+)" data-dest="([^"]+)" data-name="([^"]+)" data-alt="([^"]*)" \/>/g,
    ),
  ];

  let output = pendingHtml;
  for (const match of pending) {
    const [, source, destination, fileName, alt] = match;
    try {
      await downloadFile(source, destination);
      output = output.replace(match[0], `![${alt || "Imagen del proyecto"}](./${fileName})`);
      report.inlineDownloaded.push({ slug, locale, source, fileName });
    } catch (error) {
      output = output.replace(match[0], "");
      report.inlineMissing.push({ slug, locale, source, reason: error.message });
    }
  }

  return output;
}

function htmlToMarkdown(html = "") {
  return decodeEntities(html)
    .replace(/\r/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\[\/?fusion[^\]]*]/gi, "")
    .replace(/\[\/?avada[^\]]*]/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n## $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n### $1\n\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n\n> $1\n\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "_$1_")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "_$1_")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const cleanText = stripTags(text);
      return cleanText ? `[${cleanText}](${href})` : "";
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${stripTags(item)}`)
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
    .replace(/<div[^>]*>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildFrontmatter({ post, heroFile, categories, tags, description }) {
  const categoriesYaml = categories.length
    ? `categories:\n${categories.map((category) => `  - ${yamlString(slugify(category))}`).join("\n")}`
    : "categories: []";
  const tagsYaml = tags.length
    ? `tags:\n${tags.map((tag) => `  - ${yamlString(slugify(tag))}`).join("\n")}`
    : "tags: []";

  return `---
title: ${yamlString(post.title.rendered)}
description: >-
  ${yamlFolded(description)}
draft: false
pubDate: ${post.date.slice(0, 10)}
heroImage: ../${post.slug}/${heroFile}
${categoriesYaml}
${tagsYaml}
sourceId: ${post.id}
sourceUrl: ${yamlString(post.link)}
mappingKey: ${post.slug}
---
`;
}

async function migrateProjectForLocale(post, locale) {
  const slug = post.slug;
  const projectDir = path.join(portfolioRoot, locale, slug);
  const indexPath = path.join(projectDir, "index.mdx");

  try {
    await fs.access(indexPath);
    report.skippedExisting.push(`${locale}/${slug}`);
    return;
  } catch {
    // Continue creating missing projects.
  }

  await fs.mkdir(projectDir, { recursive: true });

  const htmlWithImages = await replaceInlineImages(post.content.rendered, projectDir, slug, locale);
  const markdown = htmlToMarkdown(htmlWithImages);
  const heroFile = await prepareHero(post, projectDir, slug, locale);
  if (!heroFile) throw new Error("missing featured image");

  const categories = getTerms(post, "portfolio_category");
  const tags = getTerms(post, "portfolio_tags");
  trackTaxonomy("portfolio_category", categories);
  trackTaxonomy("portfolio_tags", tags);

  const description =
    stripTags(post.excerpt.rendered) ||
    stripTags(post.content.rendered) ||
    `Portfolio project: ${stripTags(post.title.rendered)}`;

  const frontmatter = buildFrontmatter({
    post,
    heroFile,
    categories,
    tags,
    description,
  });

  await fs.writeFile(indexPath, `${frontmatter}\n${markdown}\n`, "utf8");
  report.created.push(`${locale}/${slug}`);
}

async function writeReport() {
  await fs.mkdir(docsRoot, { recursive: true });

  const taxonomyLines = Object.entries(report.taxonomies).flatMap(([taxonomy, values]) => [
    `### ${taxonomy}`,
    "",
    ...[...values].sort().map((value) => `- ${value}`),
    "",
  ]);

  const lines = [
    "# Migración completa del portfolio WordPress",
    "",
    `**Fuente:** ${wpApiUrl}`,
    `**Proyectos publicados en WordPress:** ${report.total}`,
    `**Entradas MDX creadas:** ${report.created.length}`,
    `**Entradas existentes preservadas:** ${report.skippedExisting.length}`,
    `**Featured images descargadas:** ${report.heroDownloaded.length}`,
    `**Featured images faltantes:** ${report.heroMissing.length}`,
    `**Imágenes inline descargadas:** ${report.inlineDownloaded.length}`,
    `**Imágenes inline omitidas:** ${report.inlineMissing.length}`,
    "",
    "## Proyectos creados",
    "",
    ...report.created.map((slug) => `- \`${slug}\``),
    "",
    "## Proyectos existentes preservados",
    "",
    ...(report.skippedExisting.length
      ? report.skippedExisting.map((slug) => `- \`${slug}\``)
      : ["- Ninguno"]),
    "",
    "## Taxonomías detectadas",
    "",
    ...taxonomyLines,
    "## Featured images faltantes",
    "",
    ...(report.heroMissing.length
      ? report.heroMissing.map((item) => `- \`${item.locale}/${item.slug}\`: ${item.reason}`)
      : ["- Ninguna"]),
    "",
    "## Imágenes inline omitidas",
    "",
    ...(report.inlineMissing.length
      ? report.inlineMissing.map(
          (item) => `- \`${item.locale}/${item.slug}\`: ${item.source} (${item.reason})`,
        )
      : ["- Ninguna"]),
    "",
    "## Errores",
    "",
    ...(report.errors.length
      ? report.errors.map((item) => `- \`${item.slug}\`: ${item.error}`)
      : ["- Ninguno"]),
    "",
  ];

  await fs.writeFile(path.join(docsRoot, "PORTFOLIO-MIGRATION-ALL.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const response = await fetch(wpApiUrl);
  if (!response.ok) throw new Error(`WordPress API returned HTTP ${response.status}`);

  const posts = await response.json();
  report.total = posts.length;

  for (const post of posts) {
    for (const locale of locales) {
      try {
        await migrateProjectForLocale(post, locale);
      } catch (error) {
        report.errors.push({ slug: `${locale}/${post.slug}`, error: error.message });
      }
    }
  }

  await writeReport();

  console.log(`WordPress portfolio projects found: ${report.total}`);
  console.log(`Created: ${report.created.length}`);
  console.log(`Skipped existing: ${report.skippedExisting.length}`);
  console.log(`Featured images downloaded: ${report.heroDownloaded.length}`);
  console.log(`Featured images missing: ${report.heroMissing.length}`);
  if (report.errors.length) {
    console.error(`Errors: ${report.errors.length}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
