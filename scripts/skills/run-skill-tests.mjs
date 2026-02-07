import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { formatReport, validateSkills } from './validate-skills.mjs'

/**
 * @typedef {Object} SkillCase
 * @property {string} skill
 * @property {string} prompt
 * @property {string[]} expectIncludes
 */

const repoRoot = process.cwd()
const casesDir = path.join(repoRoot, 'tests', 'skills')

/**
 * Run a shell command with inherited stdio.
 * @param {string} command - Command to run.
 * @param {string[]} args - Command arguments.
 * @returns {Promise<void>} Promise resolving when command completes.
 */
const runCommand = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with ${code}`))
      }
    })
  })

/**
 * Load test cases from JSON files.
 * @returns {Promise<SkillCase[]>} Test cases.
 */
const loadCases = async () => {
  const entries = await fs.readdir(casesDir)
  const caseFiles = entries.filter(entry => entry.endsWith('.cases.json'))
  const cases = []
  for (const file of caseFiles) {
    const contents = await fs.readFile(path.join(casesDir, file), 'utf8')
    cases.push(...JSON.parse(contents))
  }
  return cases
}

/**
 * Run text-based checks against SKILL.md.
 * @param {SkillCase[]} cases - Test cases.
 * @returns {Promise<string[]>} List of failures.
 */
const runCaseChecks = async cases => {
  const failures = []
  const skills = await validateSkills({ includeUserSkills: false })
  const skillMap = new Map(skills.map(meta => [meta.name, meta]))

  for (const testCase of cases) {
    const skillMeta = skillMap.get(testCase.skill)
    if (!skillMeta) {
      failures.push(`Missing skill: ${testCase.skill}`)
      continue
    }
    const contents = await fs.readFile(skillMeta.skillFile, 'utf8')
    const missing = testCase.expectIncludes.filter(
      snippet => !contents.includes(snippet)
    )
    if (missing.length > 0) {
      failures.push(
        `${testCase.skill} missing expected snippets: ${missing.join(', ')}`
      )
    }
  }

  return failures
}

const run = async () => {
  const skipGate = process.argv.includes('--skip-gate')

  if (!skipGate) {
    await runCommand('npm', ['run', 'lint'])
    await runCommand('npm', ['run', 'test'])
    await runCommand('npm', ['run', 'build'])
  }

  const validationResults = await validateSkills({ includeUserSkills: false })
  console.log(formatReport(validationResults))
  const validationErrors = validationResults.some(meta => meta.errors.length > 0)

  const cases = await loadCases()
  const caseFailures = await runCaseChecks(cases)
  if (caseFailures.length > 0) {
    caseFailures.forEach(failure => console.error(`❌ ${failure}`))
  } else {
    console.log('✅ All skill test cases passed.')
  }

  if (validationErrors || caseFailures.length > 0) {
    process.exitCode = 1
  }
}

run().catch(error => {
  console.error('Skill test harness failed.', error)
  process.exitCode = 1
})
