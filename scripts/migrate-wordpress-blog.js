import fs from "node:fs/promises";
import path from "node:path";

const wpApiUrl = "https://infratekint.com/wp-json/wp/v2/posts?per_page=100&status=publish&_embed=1";
const root = process.cwd();
const blogRoot = path.join(root, "src", "data", "blog", "es");
const docsRoot = path.join(root, "docs");
const placeholderHero = path.join(blogRoot, "tsconfig-paths-setup", "heroImage.jpg");
const authorId = "royner-tineo";

const report = {
  source: wpApiUrl,
  total: 0,
  created: [],
  skippedExisting: [],
  heroDownloaded: [],
  heroPlaceholder: [],
  inlineDownloaded: [],
  inlineMissing: [],
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
  "#8243": '"',
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
  if (!normalized) return "Migrated from the INFRATEK WordPress blog.";

  return normalized.length > 220 ? `${normalized.slice(0, 217).trim()}...` : normalized;
}

function getTerms(post, taxonomy) {
  return (post._embedded?.["wp:term"] ?? [])
    .flat()
    .filter((term) => term.taxonomy === taxonomy)
    .map((term) => term.name);
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
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buffer);
}

async function prepareHero(post, postDir, slug) {
  const mediaUrl = getFeaturedMedia(post);
  if (!mediaUrl) {
    await fs.copyFile(placeholderHero, path.join(postDir, "heroImage.jpg"));
    report.heroPlaceholder.push({ slug, reason: "no featured media" });
    return "heroImage.jpg";
  }

  const heroName = `heroImage${getFileExtension(mediaUrl)}`;
  try {
    await downloadFile(mediaUrl, path.join(postDir, heroName));
    report.heroDownloaded.push({ slug, source: mediaUrl });
    return heroName;
  } catch (error) {
    await fs.copyFile(placeholderHero, path.join(postDir, "heroImage.jpg"));
    report.heroPlaceholder.push({ slug, source: mediaUrl, reason: error.message });
    return "heroImage.jpg";
  }
}

async function replaceInlineImages(html, postDir) {
  let index = 0;

  return html.replace(/<img\b([^>]*?)>/gi, (_tag, attrs) => {
    index += 1;
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const alt = decodeEntities(attrs.match(/\balt=["']([^"']*)["']/i)?.[1] ?? "");
    if (!src) return "";
    if (src.startsWith("data:")) return "";

    const absoluteSrc = src.startsWith("//")
      ? `https:${src}`
      : src.startsWith("/")
        ? `https://infratekint.com${src}`
        : src;
    const fileName = safeImageName(absoluteSrc, index);
    const destination = path.join(postDir, fileName);

    return `\n\n<InlineImagePending data-src="${absoluteSrc}" data-dest="${destination}" data-name="${fileName}" data-alt="${alt}" />\n\n`;
  });
}

async function resolveInlineImagePlaceholders(markdownishHtml, slug) {
  const pending = [
    ...markdownishHtml.matchAll(
      /<InlineImagePending data-src="([^"]+)" data-dest="([^"]+)" data-name="([^"]+)" data-alt="([^"]*)" \/>/g,
    ),
  ];

  let output = markdownishHtml;
  for (const match of pending) {
    const [, source, destination, fileName, alt] = match;
    try {
      await downloadFile(source, destination);
      output = output.replace(match[0], `![${alt || "Imagen del artículo"}](./${fileName})`);
      report.inlineDownloaded.push({ slug, source, fileName });
    } catch (error) {
      output = output.replace(match[0], "");
      report.inlineMissing.push({ slug, source, reason: error.message });
    }
  }

  return output;
}

function htmlToMarkdown(html = "") {
  let content = decodeEntities(html)
    .replace(/\r/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\[\/?fusion[^\]]*]/gi, "")
    .replace(/\[\/?avada[^\]]*]/gi, "");

  content = content
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
      if (!cleanText) return "";
      if (href.includes("/cdn-cgi/l/email-protection")) return cleanText;
      return `[${cleanText}](${href})`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => `\n- ${stripTags(item)}`)
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, "\n\n$1\n\n")
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return content;
}

function buildFrontmatter({ post, heroFile, categories, description }) {
  return `---
title: ${yamlString(post.title.rendered)}
description: >-
  ${yamlFolded(description)}
draft: false
authors:
  - ${authorId}
pubDate: ${post.date.slice(0, 10)}
heroImage: ../${post.slug}/${heroFile}
categories:
${categories.map((category) => `  - ${slugify(category)}`).join("\n")}
mappingKey: ${post.slug}
---
`;
}

async function migratePost(post) {
  const slug = post.slug;
  const postDir = path.join(blogRoot, slug);
  const indexPath = path.join(postDir, "index.mdx");

  try {
    await fs.access(indexPath);
    report.skippedExisting.push(slug);
    return;
  } catch {
    // Continue creating missing posts.
  }

  await fs.mkdir(postDir, { recursive: true });

  const htmlWithImagePlaceholders = await replaceInlineImages(post.content.rendered, postDir);
  const htmlWithImages = await resolveInlineImagePlaceholders(htmlWithImagePlaceholders, slug);
  const markdown = htmlToMarkdown(htmlWithImages);
  const heroFile = await prepareHero(post, postDir, slug);
  const categories = getTerms(post, "category");
  const description = stripTags(post.excerpt.rendered) || stripTags(post.content.rendered);
  const frontmatter = buildFrontmatter({
    post,
    heroFile,
    categories: categories.length ? categories : ["BIM"],
    description,
  });

  await fs.writeFile(indexPath, `${frontmatter}\n${markdown}\n`, "utf8");
  report.created.push(slug);
}

async function writeReport() {
  await fs.mkdir(docsRoot, { recursive: true });

  const lines = [
    "# Migración completa del blog WordPress",
    "",
    `**Fuente:** ${wpApiUrl}`,
    `**Total publicado en WordPress:** ${report.total}`,
    `**Posts creados en esta corrida:** ${report.created.length}`,
    `**Posts existentes preservados:** ${report.skippedExisting.length}`,
    `**Portadas descargadas:** ${report.heroDownloaded.length}`,
    `**Portadas con placeholder:** ${report.heroPlaceholder.length}`,
    `**Imágenes inline descargadas:** ${report.inlineDownloaded.length}`,
    `**Imágenes inline omitidas:** ${report.inlineMissing.length}`,
    "",
    "## Posts creados",
    "",
    ...report.created.map((slug) => `- \`${slug}\``),
    "",
    "## Posts existentes preservados",
    "",
    ...report.skippedExisting.map((slug) => `- \`${slug}\``),
    "",
    "## Portadas con placeholder",
    "",
    ...report.heroPlaceholder.map(
      (item) =>
        `- \`${item.slug}\`${item.source ? ` (${item.source})` : ""}: ${item.reason}`,
    ),
    "",
    "## Imágenes inline omitidas",
    "",
    ...report.inlineMissing.map((item) => `- \`${item.slug}\`: ${item.source} (${item.reason})`),
    "",
    "## Errores",
    "",
    ...(report.errors.length
      ? report.errors.map((item) => `- \`${item.slug}\`: ${item.error}`)
      : ["- Ninguno"]),
    "",
  ];

  await fs.writeFile(path.join(docsRoot, "BLOG-MIGRATION-ALL.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const response = await fetch(wpApiUrl);
  if (!response.ok) throw new Error(`WordPress API returned HTTP ${response.status}`);

  const posts = await response.json();
  report.total = posts.length;

  for (const post of posts) {
    try {
      await migratePost(post);
    } catch (error) {
      report.errors.push({ slug: post.slug, error: error.message });
    }
  }

  await writeReport();

  console.log(`WordPress posts found: ${report.total}`);
  console.log(`Created: ${report.created.length}`);
  console.log(`Skipped existing: ${report.skippedExisting.length}`);
  console.log(`Hero placeholders: ${report.heroPlaceholder.length}`);
  console.log(`Inline images omitted: ${report.inlineMissing.length}`);
  if (report.errors.length) {
    console.error(`Errors: ${report.errors.length}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
