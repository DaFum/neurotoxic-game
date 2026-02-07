import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatReport, validateSkills } from '../scripts/validate-skills.mjs'

const hasErrorLines = report => report.includes('❌')

/**
 * Build a minimal assertion that repo skills are discoverable.
 * @param {string} report - Validation report.
 * @returns {boolean} Whether the report contains repo skills.
 */
const includesRepoSkills = report => report.includes('.agents/skills')

test('validateSkills discovers repo skills without throwing', async () => {
  const results = await validateSkills({ includeUserSkills: false })
  assert.ok(results.length > 0)
})

test('formatReport includes repo skill paths', async () => {
  const results = await validateSkills({ includeUserSkills: false })
  const report = formatReport(results)
  assert.ok(includesRepoSkills(report))
  assert.equal(hasErrorLines(report), false)
})
