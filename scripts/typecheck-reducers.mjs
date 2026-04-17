import { spawnSync } from 'node:child_process'

const tsc = spawnSync('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false'], {
  encoding: 'utf8'
})

const output = `${tsc.stdout ?? ''}${tsc.stderr ?? ''}`
const reducerErrorPattern =
  /src\/context\/(gameReducer|reducers\/(bandReducer|eventReducer|sceneReducer))\.ts\(\d+,\d+\): error TS\d+:/g

const reducerErrors = output.match(reducerErrorPattern) ?? []

if (reducerErrors.length > 0) {
  console.error('Reducer typecheck errors found:')
  for (const entry of reducerErrors) {
    console.error(entry)
  }
  process.exit(1)
}

console.log('Reducer typecheck passed (no TS errors in scoped reducer files).')
process.exit(0)
