#!/usr/bin/env node
import {
  buildReport,
  discoverSkills,
  formatSummary,
  loadSkillCases,
  readDisabledSkills,
  runPromptCases,
  runQualityGate,
  writeReport
} from '../../../../scripts/skills/skilltest-lib.mjs'

const run = async () => {
  const includeUserSkills = process.argv.includes('--include-user')
  const skipGate = process.argv.includes('--skip-gate')

  if (!skipGate) {
    await runQualityGate()
  }

  const records = await discoverSkills({ includeUserSkills })
  const cases = await loadSkillCases()
  const promptFailures = await runPromptCases(records, cases)
  const disabled = await readDisabledSkills()
  const report = buildReport(records, promptFailures, disabled)
  await writeReport(report)

  console.log(formatSummary(report))
  if (promptFailures.length > 0) {
    promptFailures.forEach(failure => console.error(`❌ ${failure}`))
  }

  if (report.summary.fail > 0 || promptFailures.length > 0) {
    process.exitCode = 1
  }
}

run().catch(error => {
  console.error('Skilltest failed.', error)
  process.exitCode = 1
})
