import { spawn } from 'node:child_process'

export const runPnpmScript = (script, env) =>
  new Promise(resolve => {
    const isWindows = process.platform === 'win32'
    const command = isWindows ? 'cmd.exe' : 'pnpm'
    const args = isWindows ? ['/c', 'pnpm', 'run', script] : ['run', script]
    const child = spawn(command, args, { stdio: 'inherit', env })
    child.on('error', error => resolve({ script, code: 1, error }))
    child.on('close', code => resolve({ script, code: code ?? 1 }))
  })
