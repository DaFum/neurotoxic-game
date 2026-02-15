#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

/**
 * @typedef {Object} LintItem
 * @property {string} name
 * @property {string} command
 * @property {string[]} args
 * @property {string[]} [fixArgs]
 */

const findRepoRoot = async startDir => {
  let currentDir = startDir
  while (true) {
    const candidate = path.join(currentDir, '.git')
    try {
      const stat = await fs.stat(candidate)
      if (stat.isDirectory() || stat.isFile()) {
        return currentDir
      }
    } catch (error) {
      // continue walking up
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return startDir
    }
    currentDir = parentDir
  }
}

const repoRoot = await findRepoRoot(process.cwd())
const configPath = path.resolve(
  repoRoot,
  '.claude',
  'skills',
  'mega-lint-snapshot',
  'assets',
  'mega-lint.config.json'
)

/**
 * Create a timestamp string for log entries.
 * @returns {string} Timestamp in YYYY-MM-DD HH:mm:ss format.
 */
const getTimestamp = () => {
  const now = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

/**
 * Print a log line with a consistent prefix.
 * @param {string} level - Log level.
 * @param {string} message - Log message.
 * @returns {void}
 */
const logLine = (level, message) => {
  console.log(`[${getTimestamp()}] [${level}] ${message}`)
}

/**
 * Run a command and capture stdout/stderr.
 * @param {string} command - Command to execute.
 * @param {string[]} args - Arguments for the command.
 * @returns {Promise<{code: number, stdout: string, stderr: string}>} Result.
 */
const runCommand = (command, args) =>
  new Promise(resolve => {
    const child = spawn(command, args, { cwd: repoRoot })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', chunk => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', chunk => {
      stderr += chunk.toString()
    })
    child.on('error', error => {
      resolve({ code: 127, stdout: '', stderr: error.message })
    })
    child.on('close', code => {
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })

/**
 * Format the report output for a single lint item.
 * @param {LintItem} item - Lint item configuration.
 * @param {boolean} useFix - Whether to run fix arguments.
 * @returns {Promise<number>} Exit code.
 */
const runItem = async (item, useFix) => {
  console.log(item.name)
  logLine('INFO', `Linting ${item.name} items...`)

  const args = useFix && item.fixArgs ? item.fixArgs : item.args
  const { code, stdout, stderr } = await runCommand(item.command, args)

  if (code === 0) {
    logLine('NOTICE', `${item.name} linted successfully`)
    return 0
  }

  logLine('ERROR', `Found errors in ${item.name}. Exit code: ${code}`)
  if (stdout) {
    logLine('INFO', `Command output for ${item.name}:`)
    console.log(stdout.trimEnd())
  }
  if (stderr) {
    logLine('INFO', `Stderr contents for ${item.name}:`)
    console.log(stderr.trimEnd())
  }
  return code
}

/**
 * Load lint configuration from the JSON file.
 * @returns {Promise<LintItem[]>} Lint items.
 */
const loadConfig = async () => {
  const contents = await fs.readFile(configPath, 'utf8')
  const data = JSON.parse(contents)
  return data.items || []
}

const run = async () => {
  const useFix = process.argv.includes('--fix')
  const items = await loadConfig()
  let hasFailures = false

  for (const item of items) {
    const code = await runItem(item, useFix)
    if (code !== 0) {
      hasFailures = true
    }
    console.log('------')
  }

  if (hasFailures) {
    logLine('ERROR', 'Mega-lint snapshot completed with failures.')
    process.exitCode = 1
  } else {
    logLine('NOTICE', 'Mega-lint snapshot completed successfully.')
  }
}

run().catch(error => {
  logLine('ERROR', `Mega-lint snapshot failed: ${error.message}`)
  process.exitCode = 1
})
