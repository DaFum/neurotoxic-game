import { spawnSync } from 'node:child_process'

const rawArgs = process.argv.slice(2)
const vitestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const result = spawnSync(
  'pnpm',
  ['exec', 'vitest', 'run', ...vitestArgs],
  {
    stdio: 'inherit'
  }
)

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
