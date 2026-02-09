import { fileURLToPath } from 'node:url'
import nodePath from 'node:path'
import { discoverSkills } from './skilltest-lib.mjs'

/**
 * @typedef {Object} SkillMeta
 * @property {string} name
 * @property {string} description
 * @property {string} skillDir
 * @property {string} skillFile
 * @property {string[]} errors
 */

/**
 * Validate all skills under repo/user scope.
 * @param {Object} options - Options.
 * @param {boolean} options.includeUserSkills - Whether to include user skills.
 * @returns {Promise<SkillMeta[]>} List of skill metadata.
 */
export const validateSkills = async ({ includeUserSkills }) => {
  const records = await discoverSkills({ includeUserSkills })
  const results = records.map(record => ({
    name: record.name,
    description: record.description,
    skillDir: record.skillDir,
    skillFile: record.skillFile,
    errors: record.findings
      .filter(finding => finding.level === 'error')
      .map(finding => finding.message)
  }))
  // Duplicate detection is now handled by discoverSkills (as warnings/errors).
  return results
}

/**
 * Format validation results for CLI output.
 * @param {SkillMeta[]} results - Validation results.
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

const __filename = fileURLToPath(import.meta.url)
const isMainModule =
  process.argv[1] &&
  nodePath.resolve(__filename) === nodePath.resolve(process.argv[1])

if (isMainModule) {
  const includeUserSkills = process.argv.includes('--include-user')
  console.warn(
    'Deprecated: use ".claude/skills/skilltest/scripts/skilltest.mjs" instead.'
  )
  validateSkills({ includeUserSkills })
    .then(results => {
      console.log(formatReport(results))
      const hasErrors = results.some(meta => meta.errors.length > 0)
      if (hasErrors) {
        process.exitCode = 1
      }
    })
    .catch(error => {
      console.error('Skill validation failed.', error)
      process.exitCode = 1
    })
}
