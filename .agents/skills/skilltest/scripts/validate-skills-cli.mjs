#!/usr/bin/env node
import {
  discoverSkills,
  formatSummary,
  writeReport,
  buildReport,
  readDisabledSkills
} from './skilltest-lib.mjs'

const run = async () => {
  const includeUserSkills = process.argv.includes('--include-user')
  const records = await discoverSkills({ includeUserSkills })
  const disabled = await readDisabledSkills()
  const report = buildReport(records, [], disabled)
  await writeReport(report)
  console.log(formatSummary(report))
  if (report.summary.fail > 0) {
    process.exitCode = 1
  }
}

run().catch(error => {
  console.error('Skill validation failed.', error)
  process.exitCode = 1
})
