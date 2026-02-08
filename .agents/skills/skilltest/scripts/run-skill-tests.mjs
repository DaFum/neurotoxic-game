#!/usr/bin/env node
import {
  discoverSkills,
  loadSkillCases,
  readDisabledSkills,
  runQualityGate,
  runReporting
} from './skilltest-lib.mjs'

const run = async () => {
  const skipGate = process.argv.includes('--skip-gate')

  console.warn(
    'Deprecated: use ".agents/skills/skilltest/scripts/skilltest.mjs" instead.'
  )

  if (!skipGate) {
    await runQualityGate()
  }

  const records = await discoverSkills({ includeUserSkills: false })
  const cases = await loadSkillCases()
  const disabled = await readDisabledSkills()
  await runReporting(records, cases, disabled)
}

run().catch(error => {
  console.error('Skill test harness failed.', error)
  process.exitCode = 1
})
