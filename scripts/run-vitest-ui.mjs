import { spawnSync } from 'node:child_process'
import { computeWorkerCount } from './utils/parallelism.mjs'

const rawArgs = process.argv.slice(2)
const vitestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasMaxWorkers = vitestArgs.some(
  arg =>
    arg === '--maxWorkers' ||
    arg.startsWith('--maxWorkers=') ||
    arg === '--max-workers' ||
    arg.startsWith('--max-workers=')
)
const hasPool = vitestArgs.some(
  arg => arg === '--pool' || arg.startsWith('--pool=')
)
const maxWorkers = computeWorkerCount('VITEST_MAX_WORKERS')

const isWindows = process.platform === 'win32'
const command = isWindows ? 'cmd.exe' : 'pnpm'
const args = isWindows
  ? [
      '/c',
      'pnpm',
      'exec',
      'vitest',
      'run',
      ...(hasPool ? [] : ['--pool=threads']),
      ...(hasMaxWorkers ? [] : [`--maxWorkers=${maxWorkers}`]),
      ...vitestArgs
    ]
  : [
      'exec',
      'vitest',
      'run',
      ...(hasPool ? [] : ['--pool=threads']),
      ...(hasMaxWorkers ? [] : [`--maxWorkers=${maxWorkers}`]),
      ...vitestArgs
    ]

const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: process.env
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
