import { availableParallelism } from 'node:os'
import { spawnSync } from 'node:child_process'

const rawArgs = process.argv.slice(2)
const vitestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasMaxWorkers = vitestArgs.some((arg) =>
  arg.startsWith('--maxWorkers')
)
const hasPool = vitestArgs.some((arg) => arg.startsWith('--pool'))

const defaultWorkers = Math.max(1, availableParallelism() - 1)
const configuredWorkers = Number.parseInt(
  process.env.VITEST_MAX_WORKERS ?? `${defaultWorkers}`,
  10
)
const maxWorkers = Number.isFinite(configuredWorkers)
  ? Math.max(1, configuredWorkers)
  : defaultWorkers

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
