import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

// `tsconfig.json` keeps `skipLibCheck: true` because third-party declarations
// (@webgpu/types against lib.dom, tone, @vercel/speed-insights) do not check
// cleanly. That flag also skips the project's own `.d.ts` files, so a type
// referenced in `src/types/*.d.ts` without its `import type` silently became
// `any` instead of an error. This guard re-runs the project check with
// `skipLibCheck` off and fails on any error outside `node_modules`.
test(
  'project declaration files type-check with skipLibCheck disabled',
  { timeout: 300_000 },
  () => {
    const tscPath = require.resolve('typescript/bin/tsc')
    const result = spawnSync(
      process.execPath,
      [
        tscPath,
        '-p',
        'tsconfig.json',
        '--noEmit',
        '--pretty',
        'false',
        '--skipLibCheck',
        'false'
      ],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    )

    assert.equal(result.error, undefined, String(result.error))
    assert.equal(typeof result.status, 'number', 'tsc terminated unexpectedly')

    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    const projectErrors = output
      .split(/\r?\n/)
      .filter(
        line =>
          /error TS\d+:/.test(line) && !/(^|[\\/])node_modules[\\/]/.test(line)
      )

    assert.deepEqual(
      projectErrors,
      [],
      `Project files have type errors that skipLibCheck hides:\n${projectErrors.join('\n')}`
    )
  }
)
