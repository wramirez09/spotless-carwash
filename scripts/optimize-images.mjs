/**
 * Optimize the images in public/images for the web.
 *
 * Run with:
 *   node scripts/optimize-images.mjs            # apply
 *   node scripts/optimize-images.mjs --dry-run  # report only
 *
 * These are served through next/image, which already resizes and re-encodes
 * to WebP/AVIF per request — so this is not about what a visitor downloads.
 * It is about the SOURCE files: a 26-megapixel phone photo bloats the repo
 * and every deployment, and makes the first request for each size a slow
 * cold transform.
 *
 * Rules:
 *   - Cap the longest edge at MAX_EDGE. The largest display size in the
 *     components is 600 CSS px (`sizes`), so ~1536px covers a 2x retina
 *     full-width phone. The cap leaves generous headroom above that.
 *   - Never upscale. Enlarging a smaller source adds no detail, only bytes.
 *   - A PNG holding a fully opaque photo is re-encoded as JPEG; PNG is the
 *     wrong container for photographic content and costs several MB.
 *   - Never write a file that came out bigger than the original.
 *
 * Re-running is safe: already-optimized files hit the size guard and are left
 * alone.
 */
import sharp from 'sharp'
import { readdir, stat, rename, unlink } from 'node:fs/promises'
import path from 'node:path'

const MAX_EDGE = 2400
const JPEG_QUALITY = 85
const DIR = 'public/images'

// og-image is referenced by extension in the OpenGraph tags and served raw to
// social scrapers (which are patchy about modern formats), so it keeps its
// name and container — it is only recompressed.
const KEEP_AS_PNG = new Set(['og-image.png'])

const dryRun = process.argv.includes('--dry-run')
const kb = (n) => (n / 1024).toFixed(1).padStart(9) + ' KB'

const results = []

for (const name of (await readdir(DIR)).sort()) {
  const ext = path.extname(name).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue

  const file = path.join(DIR, name)
  const before = (await stat(file)).size
  const meta = await sharp(file).metadata()
  const { isOpaque } = await sharp(file).stats()

  const toJpeg = ext === '.png' && isOpaque && !KEEP_AS_PNG.has(name)
  const outName = toJpeg ? name.replace(/\.png$/i, '.jpg') : name
  const outFile = path.join(DIR, outName)
  const tmp = outFile + '.tmp'

  let pipeline = sharp(file)
    // Honour the EXIF orientation flag, then drop it — phone photos carry one
    // and a resized copy that kept the flag would come out rotated.
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })

  pipeline =
    ext === '.png' && !toJpeg
      ? pipeline.png({ compressionLevel: 9, effort: 10 })
      : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })

  await pipeline.toFile(tmp)
  const after = (await stat(tmp)).size
  const outMeta = await sharp(tmp).metadata()
  await unlink(tmp).catch(() => {})

  const grew = after >= before && !toJpeg
  if (!grew && !dryRun) {
    await sharp(file)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      [ext === '.png' && !toJpeg ? 'png' : 'jpeg'](
        ext === '.png' && !toJpeg
          ? { compressionLevel: 9, effort: 10 }
          : { quality: JPEG_QUALITY, mozjpeg: true, progressive: true },
      )
      .toFile(outFile + '.out')
    await rename(outFile + '.out', outFile)
    if (toJpeg) await unlink(file)
  }

  results.push({
    name: toJpeg ? `${name} → ${outName}` : name,
    before,
    after: grew ? before : after,
    was: `${meta.width}x${meta.height}`,
    now: grew ? `${meta.width}x${meta.height}` : `${outMeta.width}x${outMeta.height}`,
    note: grew ? 'already optimal — left alone' : '',
  })
}

let totalBefore = 0
let totalAfter = 0
console.log(
  'FILE'.padEnd(34) + 'BEFORE'.padStart(12) + 'AFTER'.padStart(12) +
  '   WAS'.padEnd(13) + 'NOW'.padEnd(12) + 'SAVED',
)
for (const r of results) {
  totalBefore += r.before
  totalAfter += r.after
  const saved = (100 - (r.after * 100) / r.before).toFixed(1) + '%'
  console.log(
    r.name.padEnd(34) + kb(r.before) + kb(r.after) + '   ' +
    r.was.padEnd(11) + r.now.padEnd(12) + saved.padStart(6) +
    (r.note ? '  ' + r.note : ''),
  )
}
console.log('')
console.log(
  `TOTAL  ${(totalBefore / 1048576).toFixed(1)} MB → ${(totalAfter / 1048576).toFixed(1)} MB` +
  `   saved ${(100 - (totalAfter * 100) / totalBefore).toFixed(1)}%` +
  (dryRun ? '   (dry run — nothing written)' : ''),
)
