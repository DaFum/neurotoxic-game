import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let tscPath
try {
  tscPath = require.resolve('typescript/bin/tsc')
} catch (err) {
  console.error(
    'Failed to resolve TypeScript binary. Ensure "typescript" is installed.'
  )
  console.error(err?.message ?? err)
  process.exit(1)
}

const tsc = spawnSync(
  process.execPath,
  [tscPath, '--noEmit', '--pretty', 'false'],
  {
    encoding: 'utf8'
  }
)

const output = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`

if (tsc.error) {
  console.error('Failed to execute TypeScript compiler process.')
  console.error(tsc.error.message)
  process.exit(1)
}

if (typeof tsc.status !== 'number') {
  console.error('TypeScript compiler process terminated unexpectedly.')
  process.exit(1)
}

const reducerErrorPattern =
  /src[\\/]+context[\\/]+(gameReducer|reducers[\\/]+(bandReducer|eventReducer|sceneReducer))\.ts\(\d+,\d+\): error TS\d+:/g

const reducerErrors = output.match(reducerErrorPattern) ?? []

if (reducerErrors.length > 0) {
  console.error('Reducer typecheck errors found:')
  for (const entry of reducerErrors) {
    console.error(entry)
  }
  process.exit(1)
}

if (tsc.status !== 0) {
  console.error('TypeScript compiler reported non-zero exit status.')
  console.error(tsc.stdout ?? tsc.stderr ?? '')
  process.exit(tsc.status)
}

console.log('Reducer typecheck passed (no TS errors in scoped reducer files).')
process.exit(0)
