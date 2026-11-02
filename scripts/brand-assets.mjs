#!/usr/bin/env node
/**
 * Generates every logo file from the client's logo on a black background:
 *
 *   node scripts/brand-assets.mjs [source]     (default: brand/source/logo.jpg)
 *
 * The source is the square logo: "E+" mark, then "ECOM PLUS", then
 * "ACADEMY" between two rules, on (near) black. The black is cut out by
 * brightness: pixels brighter than SOLID keep their exact colour, darker
 * anti-aliasing becomes partial transparency with the colour un-multiplied,
 * so the result looks identical on the site's dark backgrounds.
 * When the client sends a sharper original (PNG/vector export, same layout),
 * drop it in brand/source/ and run the script again.
 *
 * Outputs:
 *   components/brand/assets/mark.png       "E+" mark
 *   components/brand/assets/wordmark.png   "ECOM PLUS" line
 *   components/brand/assets/logo.png       full stacked logo
 *   app/icon.png (64), app/apple-icon.png (180), app/favicon.ico (16/32/48)
 *   app/opengraph-image.png (1200×630)
 *
 * sharp ships with Next.js (image optimisation), no extra install needed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = process.argv[2] ?? join(root, "brand", "source", "logo.jpg");

/** Background is ≤ ~10 in the source (vignette); a little headroom. */
const FLOOR = 14;
/** At and above this brightness a pixel is fully opaque. */
const SOLID = 110;
const NIGHT = { r: 7, g: 7, b: 8 };
const PANEL = "#0c0c0e";

const { data, info } = await sharp(source).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// 1. Cut-out: RGBA with alpha from brightness.
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const v = Math.max(r, g, b);
  const alpha = Math.min(1, Math.max(0, (v - FLOOR) / (SOLID - FLOOR)));
  if (alpha === 0) continue;
  const k = alpha >= 1 ? 1 : 1 / alpha;
  rgba[j] = Math.min(255, Math.round(r * k));
  rgba[j + 1] = Math.min(255, Math.round(g * k));
  rgba[j + 2] = Math.min(255, Math.round(b * k));
  rgba[j + 3] = Math.round(alpha * 255);
}
const alphaAt = (x, y) => rgba[(y * W + x) * 4 + 3];

// 2. Find the three horizontal bands (mark, ECOM PLUS, ACADEMY).
const rowHasInk = (y) => {
  for (let x = 0; x < W; x++) if (alphaAt(x, y) > 24) return true;
  return false;
};
const bands = [];
for (let y = 0, start = -1, gap = 0; y <= H; y++) {
  const ink = y < H && rowHasInk(y);
  if (ink) {
    if (start < 0) start = y;
    gap = 0;
  } else if (start >= 0 && ++gap >= 10) {
    bands.push({ top: start, bottom: y - gap });
    start = -1;
  }
}
if (bands.length !== 3) {
  console.error(`3 bant bekleniyordu (işaret, ECOM PLUS, ACADEMY), ${bands.length} bulundu:`, bands);
  process.exit(1);
}

function bounds(top, bottom) {
  let left = W;
  let right = -1;
  for (let y = top; y <= bottom; y++)
    for (let x = 0; x < W; x++)
      if (alphaAt(x, y) > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

const PAD = 4;
const cutout = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
async function crop(box, pad = PAD) {
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const width = Math.min(W - left, box.width + 2 * pad);
  const height = Math.min(H - top, box.height + 2 * pad);
  return cutout.clone().extract({ left, top, width, height }).png({ compressionLevel: 9, effort: 10 }).toBuffer();
}

const [markBand, wordBand, academyBand] = bands;
const mark = await crop(bounds(markBand.top, markBand.bottom));
const wordmark = await crop(bounds(wordBand.top, wordBand.bottom));
const full = await crop(bounds(markBand.top, academyBand.bottom), 8);

function write(path, buffer) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buffer);
  console.log(`  ${path}  ${(buffer.length / 1024).toFixed(1)} KB`);
}

write("components/brand/assets/mark.png", mark);
write("components/brand/assets/wordmark.png", wordmark);
write("components/brand/assets/logo.png", full);

// 3. Icons: the mark on a dark tile (a silver mark would vanish on light browser tabs).
async function tile(size, { radius, inset }) {
  const box = Math.round(size * (1 - 2 * inset));
  const glyph = await sharp(mark).resize(box, box, { fit: "inside", kernel: "lanczos3" }).toBuffer();
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${PANEL}"/></svg>`,
  );
  return sharp(bg).composite([{ input: glyph, gravity: "center" }]).png({ compressionLevel: 9 }).toBuffer();
}

write("app/icon.png", await tile(64, { radius: 14, inset: 0.12 }));
// iOS rounds the corners itself: square tile, more breathing room.
write("app/apple-icon.png", await tile(180, { radius: 0, inset: 0.17 }));

// favicon.ico with PNG-compressed entries (supported by every current browser).
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((s) => tile(s, { radius: Math.round(s * 0.2), inset: 0.08 })));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(icoImages[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += icoImages[i].length;
});
write("app/favicon.ico", Buffer.concat([header, ...icoImages]));

// 4. Open Graph image: the full logo on the site's night background with a soft glow.
const OG_W = 1200;
const OG_H = 630;
const logoHeight = 380;
const ogLogo = await sharp(full).resize({ height: logoHeight, kernel: "lanczos3" }).toBuffer();
const glow = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="46%" r="62%">
        <stop offset="0" stop-color="#1b1b1f"/>
        <stop offset="0.55" stop-color="#0c0c0e"/>
        <stop offset="1" stop-color="rgb(${NIGHT.r},${NIGHT.g},${NIGHT.b})"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`,
);
write(
  "app/opengraph-image.png",
  await sharp(glow)
    .composite([{ input: ogLogo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer(),
);
writeFileSync(join(root, "app", "opengraph-image.alt.txt"), "Ecom Plus Academy logosu");
console.log("  app/opengraph-image.alt.txt");
console.log("\nBantlar:", bands.map((b) => `${b.top}–${b.bottom}`).join(", "));
