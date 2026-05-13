/**
 * Regenerates raster favicons from public/favicons/favicon-source.png (requires sharp).
 * Replace favicon-source.png (e.g. with assets/Isotipo/Recurso 57.png), then run: npm run generate:favicons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "favicons");
const sourcePath = path.join(outDir, "favicon-source.png");

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Missing ${sourcePath}`);
    process.exit(1);
  }

  const writePng = async (size, filename) => {
    const buf = await sharp(sourcePath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(outDir, filename), buf);
    return buf;
  };

  const icon16 = await writePng(16, "favicon-16x16.png");
  const icon32 = await writePng(32, "favicon-32x32.png");
  await writePng(180, "apple-touch-icon.png");
  await writePng(192, "android-chrome-192x192.png");
  await writePng(512, "android-chrome-512x512.png");
  await writePng(150, "mstile-150x150.png");

  const ico = await pngToIco([icon16, icon32]);
  fs.writeFileSync(path.join(outDir, "favicon.ico"), ico);

  console.log("Favicons updated from favicon-source.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
