#!/usr/bin/env node
import {
  discoverSkills,
  loadSkillCases,
  readDisabledSkills,
  runQualityGate,
  runReporting
} from './skilltest-lib.mjs'

const run = async () => {
  const includeUserSkills = process.argv.includes('--include-user')
  const skipGate = process.argv.includes('--skip-gate')

  if (!skipGate) {
    await runQualityGate()
  }

  const records = await discoverSkills({ includeUserSkills })
  const cases = await loadSkillCases()
  const disabled = await readDisabledSkills()
  await runReporting(records, cases, disabled)
}

run().catch(error => {
  console.error('Skilltest failed.', error)
  process.exitCode = 1
})
