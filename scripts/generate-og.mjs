/**
 * Generates public/images/infratek-og.jpg (1200×630) for Open Graph.
 * Uses the full-color horizontal logo on Big Stone.
 *
 * Run from website/: npm run generate:og
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
const logoPng = join(publicDir, "Logos PNG + SVG", "Logo Horizontal", "Logo Full Color.png");
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
      height: 200,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  return sharp({
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
}

async function fromSvgFallback() {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0A2333"/>
  <text x="600" y="300" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="700" fill="#66CBFF">INFRATEK</text>
  <text x="600" y="370" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="500" fill="#BFD8E4">BIM • COBie • Digital twins • Reality capture</text>
</svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

const fromLogo = await fromLogoPng();
const buf = fromLogo ?? (await fromSvgFallback());

writeFileSync(out, buf);
if (fromLogo) {
  console.log("Wrote", out, "(from", logoPng + ")");
} else {
  console.warn("Logo PNG not found at:", logoPng);
  console.log("Wrote", out, "(SVG text fallback)");
}
