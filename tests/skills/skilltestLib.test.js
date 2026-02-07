import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import {
  buildReport,
  discoverSkills,
  formatSummary,
  loadSkillCases,
  parseYaml,
  readDisabledSkills,
  runPromptCases
} from '../../scripts/skills/skilltest-lib.mjs'

/**
 * Run a callback with a temporary HOME directory.
 * @param {string} configContents - TOML config contents.
 * @param {() => Promise<void>} callback - Callback to run.
 * @returns {Promise<void>} Promise resolving when complete.
 */
const withTempHome = async (configContents, callback) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skilltest-home-'))
  const configDir = path.join(tempDir, '.codex')
  await fs.mkdir(configDir, { recursive: true })
  await fs.writeFile(path.join(configDir, 'config.toml'), configContents)
  const previousHome = process.env.HOME
  process.env.HOME = tempDir
  try {
    await callback()
  } finally {
    process.env.HOME = previousHome
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

test('discoverSkills finds repo skills', async () => {
  const records = await discoverSkills({ includeUserSkills: false })
  assert.ok(records.length > 0)
  assert.ok(records.some(record => record.name === 'skilltest'))
})

test('runPromptCases validates expected snippets', async () => {
  const records = await discoverSkills({ includeUserSkills: false })
  const cases = await loadSkillCases()
  const failures = await runPromptCases(records, cases)
  assert.equal(failures.length, 0)
})

test('buildReport creates a summary for skills', async () => {
  const records = await discoverSkills({ includeUserSkills: false })
  const report = buildReport(records, [], new Set())
  assert.ok(report.summary.total > 0)
  assert.ok(formatSummary(report).length > 0)
})

test('parseYaml handles nested mappings', () => {
  const parsed = parseYaml('interface:\n  icon_small: assets/icon.png\n')
  assert.equal(parsed.interface.icon_small, 'assets/icon.png')
})

test('readDisabledSkills parses config.toml entries', async () => {
  await withTempHome(
    `[[skills.config]]
path = "skills/example-a"
enabled = false

[[skills.config]]
path = "skills/example-b"
enabled = true
`,
    async () => {
      const disabled = await readDisabledSkills()
      assert.ok(disabled.has('skills/example-a'))
      assert.ok(!disabled.has('skills/example-b'))
    }
  )
})
