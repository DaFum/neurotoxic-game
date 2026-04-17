import { spawnSync } from 'node:child_process'

const tsc = spawnSync('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false'], {
  encoding: 'utf8'
})

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
  process.exit(tsc.status)
}

console.log('Reducer typecheck passed (no TS errors in scoped reducer files).')
process.exit(0)
