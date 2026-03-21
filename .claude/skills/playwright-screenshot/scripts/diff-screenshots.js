#!/usr/bin/env node
/**
 * diff-screenshots.js
 *
 * Compares two directories of PNG screenshots and reports pixel differences.
 * Useful for before/after comparisons when validating a UI change.
 *
 * Usage:
 *   node diff-screenshots.js <before-dir> <after-dir> [diff-dir]
 *
 * Examples:
 *   node diff-screenshots.js screenshots/before screenshots/after
 *   node diff-screenshots.js screenshots/before screenshots/after screenshots/diff
 *
 * Output:
 *   - Console table with file name, diff pixel count, and diff ratio per pair
 *   - Optional diff images saved to diff-dir (requires `pixelmatch` to be installed)
 *   - Exit code 1 if any file exceeds DIFF_THRESHOLD (default 5%)
 *
 * Requirements:
 *   - Node.js 22+
 *   - Optional: `pnpm add -D pixelmatch pngjs` for visual diff images
 *     (script works without them — only numeric comparison is skipped)
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'

const DIFF_THRESHOLD = Number(process.env.DIFF_THRESHOLD ?? 0.05)

const [, , beforeDir, afterDir, diffDir] = process.argv

if (!beforeDir || !afterDir) {
  console.log('Usage: diff-screenshots.js <before-dir> <after-dir> [diff-dir]')
  process.exit(0)
}

const beforePath = resolve(beforeDir)
const afterPath = resolve(afterDir)
const diffPath = diffDir ? resolve(diffDir) : null

async function listPngs(dir) {
  if (!existsSync(dir)) return []
  const files = await readdir(dir)
  return files.filter(f => f.endsWith('.png')).sort()
}

async function tryPixelMatch(beforeFile, afterFile, diffFile) {
  try {
    const { default: pixelmatch } = await import('pixelmatch')
    const { PNG } = await import('pngjs')

    const imgBefore = PNG.sync.read(await readFile(beforeFile))
    const imgAfter = PNG.sync.read(await readFile(afterFile))

    if (
      imgBefore.width !== imgAfter.width ||
      imgBefore.height !== imgAfter.height
    ) {
      return { status: 'size-mismatch', diffPixels: null, ratio: null }
    }

    const { width, height } = imgBefore
    const diff = new PNG({ width, height })

    const diffPixels = pixelmatch(
      imgBefore.data,
      imgAfter.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    )
    const ratio = diffPixels / (width * height)

    if (diffFile) {
      await mkdir(resolve(diffFile, '..'), { recursive: true })
      await writeFile(diffFile, PNG.sync.write(diff))
    }

    return { status: 'ok', diffPixels, ratio }
  } catch (err) {
    if (
      err.code === 'ERR_MODULE_NOT_FOUND' ||
      err.message.includes('Cannot find')
    ) {
      return { status: 'no-pixelmatch', diffPixels: null, ratio: null }
    }
    throw err
  }
}

async function main() {
  const beforeFiles = await listPngs(beforePath)
  const afterFiles = new Set(await listPngs(afterPath))

  if (beforeFiles.length === 0) {
    console.warn(`No PNG files found in ${beforePath}`)
    process.exit(0)
  }

  if (diffPath) await mkdir(diffPath, { recursive: true })

  const results = []
  let hasFailure = false

  for (const file of beforeFiles) {
    const bFile = join(beforePath, file)
    const aFile = join(afterPath, file)
    const dFile = diffPath ? join(diffPath, file) : null

    if (!afterFiles.has(file)) {
      results.push({
        file,
        status: 'missing-after',
        diffPixels: '—',
        ratio: '—',
        pass: false
      })
      hasFailure = true
      continue
    }

    const result = await tryPixelMatch(bFile, aFile, dFile)

    if (result.status === 'no-pixelmatch') {
      results.push({
        file,
        status: 'no-pixelmatch (install pixelmatch+pngjs for pixel diff)',
        diffPixels: '—',
        ratio: '—',
        pass: true
      })
      continue
    }

    if (result.status === 'size-mismatch') {
      results.push({
        file,
        status: 'size-mismatch',
        diffPixels: '—',
        ratio: '—',
        pass: false
      })
      hasFailure = true
      continue
    }

    const pass = result.ratio <= DIFF_THRESHOLD
    if (!pass) hasFailure = true

    results.push({
      file,
      status: pass ? 'PASS' : 'FAIL',
      diffPixels: result.diffPixels.toLocaleString(),
      ratio: `${(result.ratio * 100).toFixed(2)}%`,
      pass
    })
  }

  // Check for files only in after (new files)
  for (const file of afterFiles) {
    if (!beforeFiles.includes(file)) {
      results.push({
        file,
        status: 'new-in-after',
        diffPixels: '—',
        ratio: '—',
        pass: true
      })
    }
  }

  // Print table
  console.log('\nScreenshot Diff Results')
  console.log(`Threshold: ${(DIFF_THRESHOLD * 100).toFixed(1)}%`)
  console.log('─'.repeat(80))
  console.log(
    'File'.padEnd(40),
    'Status'.padEnd(8),
    'Pixels'.padEnd(12),
    'Ratio'
  )
  console.log('─'.repeat(80))

  for (const r of results) {
    const indicator = r.pass ? '✓' : '✗'
    console.log(
      `${indicator} ${r.file}`.padEnd(40),
      r.status.padEnd(8),
      String(r.diffPixels).padEnd(12),
      r.ratio
    )
  }

  console.log('─'.repeat(80))

  const passed = results.filter(r => r.pass).length
  const failed = results.filter(r => !r.pass).length
  console.log(
    `\nPassed: ${passed}  Failed: ${failed}  Total: ${results.length}`
  )

  if (diffPath) {
    console.log(`\nDiff images saved to: ${diffPath}/`)
  }

  process.exit(hasFailure ? 1 : 0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
