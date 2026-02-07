import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReport,
  discoverSkills,
  formatSummary,
  loadSkillCases,
  runPromptCases
} from '../../scripts/skills/skilltest-lib.mjs'

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
