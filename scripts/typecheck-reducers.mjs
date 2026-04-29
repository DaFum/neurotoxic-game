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
  const strictEnv = (process.env.TYPECHECK_STRICT ?? '').trim().toLowerCase()
  const ciEnv = (process.env.CI ?? '').trim().toLowerCase()
  const shouldFailOnNonReducerErrors =
    strictEnv === '1' || strictEnv === 'true' || (ciEnv !== '' && ciEnv !== '0')
  if (shouldFailOnNonReducerErrors) {
    console.error(
      'Non-reducer TypeScript errors detected while strict mode is enabled.'
    )
    if (output.trim()) {
      console.error(output.trim())
    }
    process.exit(tsc.status)
  }
  console.log(
    'Reducer typecheck passed (no reducer TS errors). Non-reducer TS errors were ignored by this scoped gate; run `pnpm run typecheck:core` for full project checks.'
  )
  process.exit(0)
}

console.log('Reducer typecheck passed (no TS errors in scoped reducer files).')
process.exit(0)
