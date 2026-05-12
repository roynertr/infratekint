/**
 * Generates public/images/infratek-og.jpg (1200×630) for Open Graph.
 * Prefers horizontal logo PNG if present; otherwise falls back to SVG text.
 *
 * Run from website/: node scripts/generate-og.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("Run from website folder: npm install sharp --save-dev");
  process.exit(1);
}

const width = 1200;
const height = 630;
const publicDir = join(__dirname, "..", "public", "images");
const logoPng = join(publicDir, "Logos PNG + SVG", "Logo Horizontal", "Recurso 40.png");
const out = join(publicDir, "infratek-og.jpg");

// Brand: Big Stone #0A2333
const bgRgb = { r: 10, g: 35, b: 51 };

async function fromLogoPng() {
  if (!existsSync(logoPng)) {
    return null;
  }
  const logoBuffer = await sharp(logoPng)
    .resize({
      width: 820,
      height: 300,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  const buf = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: bgRgb,
    },
  })
    .composite([{ input: logoBuffer, gravity: "centre" }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return buf;
}

async function fromSvgFallback() {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0A2333"/>
  <text x="72" y="320" font-family="system-ui,-apple-system,sans-serif" font-size="46" font-weight="700" fill="#66CBFF">INFRATEK</text>
  <text x="72" y="390" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="500" fill="#BFD8E4">BIM • COBie • Digital twins • Reality capture</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

const fromPng = await fromLogoPng();
const buf = fromPng ?? (await fromSvgFallback());

writeFileSync(out, buf);
if (fromPng) {
  console.log("Wrote", out, "(from", logoPng + ")");
} else {
  console.warn("Logo PNG not found at:", logoPng);
  console.log("Wrote", out, "(SVG fallback)");
}
