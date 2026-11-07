/**
 * Shared CLI flows for Skilltest runners and validators.
 */

/**
 * Execute the full skilltest runner CLI flow.
 *
 * @param {Object} harness - Configured harness instance.
 * @param {string[]} [argv=process.argv] - Command line arguments.
 * @returns {Promise<void>}
 */
export const runSkilltestCli = async (harness, argv = process.argv) => {
  const includeUserSkills = argv.includes('--include-user')
  const skipGate = argv.includes('--skip-gate')

  try {
    if (!skipGate) {
      await harness.runQualityGate()
    }

    const records = await harness.discoverSkills({ includeUserSkills })
    const cases = await harness.loadSkillCases()
    const disabled = await harness.readDisabledSkills()
    await harness.runReporting(records, cases, disabled)
  } catch (error) {
    console.error('Skilltest failed.', error)
    process.exitCode = 1
  }
}

/**
 * Execute the JSON validation and summary reporting CLI flow.
 *
 * @param {Object} harness - Configured harness instance.
 * @param {string[]} [argv=process.argv] - Command line arguments.
 * @returns {Promise<void>}
 */
export const runValidateSkillsCli = async (harness, argv = process.argv) => {
  const includeUserSkills = argv.includes('--include-user')

  try {
    const records = await harness.discoverSkills({ includeUserSkills })
    const disabled = await harness.readDisabledSkills()
    const report = harness.buildReport(records, [], disabled)
    await harness.writeReport(report)
    console.log(harness.formatSummary(report))
    if (report.summary.fail > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Skill validation failed.', error)
    process.exitCode = 1
  }
}

/**
 * Validate skills under repo/user scope and format summary records for legacy CLI.
 *
 * @param {Object} harness - Configured harness instance.
 * @param {Object} options - Options.
 * @param {boolean} options.includeUserSkills - Whether to include user skills.
 * @returns {Promise<Array<Object>>}
 */
export const validateSkills = async (harness, { includeUserSkills }) => {
  const records = await harness.discoverSkills({ includeUserSkills })
  return records.map(record => ({
    name: record.name,
    description: record.description,
    skillDir: record.skillDir,
    skillFile: record.skillFile,
    errors: record.findings
      .filter(finding => finding.level === 'error')
      .map(finding => finding.message)
  }))
}

/**
 * Format validation results for legacy CLI output.
 *
 * @param {Array<Object>} results - Validation results.
 * @returns {string} Formatted report.
 */
export const formatReport = results => {
  if (results.length === 0) {
    return 'No skills found.'
  }
  return results
    .map(meta => {
      const status = meta.errors.length === 0 ? '✅' : '❌'
      const errorBlock = meta.errors.length
        ? `\n  - ${meta.errors.join('\n  - ')}`
        : ''
      return `${status} ${meta.name || '(unknown)'} (${meta.skillDir})${errorBlock}`
    })
    .join('\n')
}

/**
 * Execute the legacy validate-skills CLI flow with deprecation warning.
 *
 * @param {Object} harness - Configured harness instance.
 * @param {string} deprecationMessage - Warning to display on stderr.
 * @param {string[]} [argv=process.argv] - Command line arguments.
 * @returns {Promise<void>}
 */
export const runLegacyValidateSkillsCli = async (
  harness,
  deprecationMessage,
  argv = process.argv
) => {
  const includeUserSkills = argv.includes('--include-user')
  console.warn(deprecationMessage)
  try {
    const results = await validateSkills(harness, { includeUserSkills })
    console.log(formatReport(results))
    const hasErrors = results.some(meta => meta.errors.length > 0)
    if (hasErrors) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Skill validation failed.', error)
    process.exitCode = 1
  }
}
