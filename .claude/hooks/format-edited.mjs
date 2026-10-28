// PostToolUse hook (Edit|Write): format the edited file with the project's Prettier.
// ESLint --fix is intentionally not run here (~3s+ per file); lint-staged runs it on commit.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const filePath = input?.tool_input?.file_path
  if (typeof filePath === 'string' && SOURCE_FILE.test(filePath)) {
    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
    spawnSync(
      process.execPath,
      [resolve(root, 'node_modules/prettier/bin/prettier.cjs'), '--write', '--log-level', 'silent', filePath],
      { cwd: root, stdio: 'ignore' }
    )
  }
} catch {
  // Formatting is best-effort; never block an edit.
}
