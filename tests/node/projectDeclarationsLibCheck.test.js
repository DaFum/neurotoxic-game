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

const TSC_ERROR = /error TS\d+:/
const TSC_ERROR_LOCATION = /^(.+?)\(\d+,\d+\): error TS\d+:/
const NODE_MODULES_SEGMENT = /(^|[\\/])node_modules[\\/]/

/**
 * Keeps the tsc error lines that belong to the project.
 *
 * @remarks
 * Only the error's own file location decides: a project-file error whose
 * message names a `node_modules` path (e.g. a stale `import('tone').X`) is
 * still a project error. Location-less errors (config/option errors) are kept.
 *
 * @param {string} output - Raw `tsc --pretty false` output.
 * @returns {string[]} Error lines not located inside `node_modules`.
 */
const selectProjectErrors = output =>
  output.split(/\r?\n/).filter(line => {
    if (!TSC_ERROR.test(line)) return false
    const location = TSC_ERROR_LOCATION.exec(line)
    return !(location && NODE_MODULES_SEGMENT.test(location[1] ?? ''))
  })

test('selectProjectErrors keeps a project error whose message names node_modules', () => {
  const posix =
    "src/types/audio.d.ts(1,94): error TS2694: Namespace '\"/repo/node_modules/tone/build/esm/index\"' has no exported member 'NoSuchType'."
  const windows =
    "src\\types\\audio.d.ts(1,94): error TS2694: Namespace '\"C:/repo/node_modules/tone/build/esm/index\"' has no exported member 'NoSuchType'."
  assert.deepEqual(selectProjectErrors(`${posix}\n${windows}`), [
    posix,
    windows
  ])
})

test('selectProjectErrors drops errors located inside node_modules', () => {
  const posix =
    'node_modules/.pnpm/@webgpu+types@0.1.70/node_modules/@webgpu/types/dist/index.d.ts(1,1): error TS2300: Duplicate identifier.'
  const windows =
    'C:\\repo\\node_modules\\tone\\build\\esm\\core\\type\\Time.d.ts(3,4): error TS2416: Property is not assignable.'
  assert.deepEqual(selectProjectErrors(`${posix}\r\n${windows}\r\n`), [])
})

test('selectProjectErrors keeps location-less errors', () => {
  const line = "error TS5023: Unknown compiler option 'nope'."
  assert.deepEqual(selectProjectErrors(line), [line])
})

test('selectProjectErrors ignores non-error output lines', () => {
  assert.deepEqual(
    selectProjectErrors(
      "  Type 'string' is not assignable to type 'number'.\nFound 0 errors."
    ),
    []
  )
})

// `tsconfig.json` keeps `skipLibCheck: true` because third-party declarations
// (@webgpu/types against lib.dom, tone, @vercel/speed-insights) do not check
// cleanly. That flag also skips the project's own `.d.ts` files, so a type
// referenced in `src/types/*.d.ts` without its `import type` silently became
// `any` instead of an error. This guard re-runs the project check with
// `skipLibCheck` off and fails on any error not located in `node_modules`.
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
    const projectErrors = selectProjectErrors(output)

    assert.deepEqual(
      projectErrors,
      [],
      `Project files have type errors that skipLibCheck hides:\n${projectErrors.join('\n')}`
    )
  }
)
