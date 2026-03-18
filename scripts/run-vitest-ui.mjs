import { spawnSync } from 'node:child_process'

const rawArgs = process.argv.slice(2)
const vitestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const isWindows = process.platform === 'win32'
const command = isWindows ? 'cmd.exe' : 'pnpm'
const args = isWindows
  ? ['/c', 'pnpm', 'exec', 'vitest', 'run', ...vitestArgs]
  : ['exec', 'vitest', 'run', ...vitestArgs]

const result = spawnSync(command, args, { stdio: 'inherit' })

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
