/**
 * diffScreenshots.test.js
 *
 * Pins diff-screenshots.js behavior: a comparison that could not run
 * (pixelmatch/pngjs missing) must not be reported as a pass.
 */

import { test, describe, after } from 'node:test'
import { strictEqual, ok } from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const scriptPath = path.resolve(
  '.claude/skills/playwright-screenshot/scripts/diff-screenshots.js'
)

const tempDirs = []

function makeDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'diff-shots-'))
  tempDirs.push(dir)
  return dir
}

function runDiff(beforeDir, afterDir) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))
  )
  return spawnSync(process.execPath, [scriptPath, beforeDir, afterDir], {
    env,
    encoding: 'utf8'
  })
}

after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true })
})

describe('diff-screenshots.js', () => {
  test('reports NOT COMPARED and exits 1 when pixelmatch/pngjs are missing', async t => {
    const hasPixelmatch = await import('pixelmatch').then(
      () => true,
      () => false
    )
    const hasPngjs = await import('pngjs').then(
      () => true,
      () => false
    )
    if (hasPixelmatch && hasPngjs) {
      t.skip('pixelmatch+pngjs installed')
      return
    }

    const before = makeDir()
    const after = makeDir()
    fs.writeFileSync(path.join(before, 'a.png'), Buffer.from('fake'))
    fs.writeFileSync(path.join(after, 'a.png'), Buffer.from('fake'))

    const res = runDiff(before, after)
    const output = `${res.stdout}${res.stderr}`
    strictEqual(res.status, 1)
    ok(output.includes('NOT COMPARED'), output)
    ok(!output.includes('✓ a.png'), output)
  })

  test('a file present only in before exits 1 (missing-after)', () => {
    const before = makeDir()
    const after = makeDir()
    fs.writeFileSync(path.join(before, 'a.png'), Buffer.from('fake'))

    const res = runDiff(before, after)
    strictEqual(res.status, 1)
  })
})
