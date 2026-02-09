import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import toml from '@iarna/toml'
import { parse as parseYamlDoc } from 'yaml'

/**
 * @typedef {Object} SkillFinding
 * @property {string} level
 * @property {string} message
 */

/**
 * Validate a skill name against the Open Agent Skills specification.
 * @param {string} name - Skill name from frontmatter.
 * @returns {SkillFinding[]} Findings.
 */
const validateSkillName = name => {
  const findings = []
  if (name.length > 64) {
    findings.push({
      level: 'error',
      message: `Name exceeds 64 characters (${name.length}).`
    })
  }
  if (/[^a-z0-9-]/.test(name)) {
    findings.push({
      level: 'error',
      message: 'Name must contain only lowercase letters, numbers, and hyphens.'
    })
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    findings.push({
      level: 'error',
      message: 'Name must not start or end with a hyphen.'
    })
  }
  if (name.includes('--')) {
    findings.push({
      level: 'error',
      message: 'Name must not contain consecutive hyphens.'
    })
  }
  return findings
}

/**
 * Validate description length against the Open Agent Skills specification.
 * @param {string} description - Skill description.
 * @returns {SkillFinding[]} Findings.
 */
const validateDescription = description => {
  const findings = []
  if (description.length > 1024) {
    findings.push({
      level: 'error',
      message: `Description exceeds 1024 characters (${description.length}).`
    })
  }
  return findings
}

/**
 * @typedef {Object} SkillRecord
 * @property {string} name
 * @property {string} description
 * @property {string} skillDir
 * @property {string} skillFile
 * @property {boolean} isSymlink
 * @property {string | null} realPath
 * @property {SkillFinding[]} findings
 */

let repoRootCache = null
let repoRootCacheCwd = null

/**
 * Determine the repository root by walking up to a .git directory.
 * @param {string} startDir - Starting directory.
 * @returns {Promise<string>} Repository root or the starting directory.
 */
export const findRepoRoot = async startDir => {
  let currentDir = startDir
  while (true) {
    const candidate = path.join(currentDir, '.git')
    try {
      const stat = await fs.stat(candidate)
      if (stat.isDirectory() || stat.isFile()) {
        return currentDir
      }
    } catch (error) {
      // continue walking up
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return startDir
    }
    currentDir = parentDir
  }
}

/**
 * Collect skill roots from CWD to repo root.
 * @param {string} cwd - Current working directory.
 * @param {string} repoDir - Repository root.
 * @returns {Promise<string[]>} Skill root directories.
 */
export const collectSkillRoots = async (cwd, repoDir) => {
  const roots = []
  let currentDir = cwd
  while (true) {
    const skillsDir = path.join(currentDir, '.claude', 'skills')
    try {
      const stat = await fs.stat(skillsDir)
      if (stat.isDirectory()) {
        roots.push(skillsDir)
      }
    } catch (error) {
      // skip missing skill root
    }
    if (currentDir === repoDir) {
      break
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      break
    }
    currentDir = parentDir
  }
  return roots
}

/**
 * Recursively find skill directories containing SKILL.md.
 * @param {string} rootDir - Skill root directory.
 * @returns {Promise<string[]>} Skill directory paths.
 */
export const findSkillDirs = async (rootDir, visited) => {
  if (!visited) {
    visited = new Set()
  }

  try {
    const realRoot = await fs.realpath(rootDir)
    visited.add(realRoot)
  } catch (error) {
    // ignore errors resolving rootDir
  }
  let entries = []
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true })
  } catch (error) {
    return []
  }
  const skillDirs = []
  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name)
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    let realPath
    try {
      realPath = await fs.realpath(entryPath)
      if (visited.has(realPath)) {
        continue
      }
      visited.add(realPath)
    } catch (error) {
      console.warn(`Could not resolve path, skipping: ${entryPath}`)
      continue
    }

    const skillFile = path.join(entryPath, 'SKILL.md')
    try {
      const stat = await fs.stat(skillFile)
      if (stat.isFile()) {
        skillDirs.push(entryPath)
        continue
      }
    } catch (error) {
      // continue recursive search
    }
    const nested = await findSkillDirs(entryPath, visited)
    skillDirs.push(...nested)
  }
  return skillDirs
}

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * @param {string} contents - File contents.
 * @returns {{name: string, description: string} | null} Parsed frontmatter.
 */
export const parseFrontmatter = contents => {
  const normalized = contents.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) return null
  const data = parseYamlDoc(match[1]) || {}
  if (!data.name || !data.description) return null
  return { name: data.name, description: data.description }
}

/**
 * Parse a simple YAML file into a nested object using indentation.
 * @param {string} contents - YAML contents.
 * @returns {Object} Parsed object.
 */
export const parseYaml = contents => parseYamlDoc(contents) || {}

/**
 * Check whether a skill description contains trigger guidance.
 * @param {string} description - Skill description.
 * @returns {boolean} Whether the description looks adequate.
 */
const isDescriptionAdequate = description => {
  const normalized = description.toLowerCase()
  const triggerHints = ['use when', 'use this', 'when', 'trigger', 'apply']
  const hasTriggerHint = triggerHints.some(hint => normalized.includes(hint))
  const isLongEnough = description.length >= 60
  return hasTriggerHint || isLongEnough
}

/**
 * Validate executable scripts in a directory.
 * @param {string} scriptsDir - Scripts directory.
 * @returns {Promise<SkillFinding[]>} Findings.
 */
export const validateScripts = async scriptsDir => {
  const findings = []
  try {
    const entries = await fs.readdir(scriptsDir)
    for (const entry of entries) {
      const entryPath = path.join(scriptsDir, entry)
      const stat = await fs.stat(entryPath)
      if (!stat.isFile()) continue
      const isExecutable = (stat.mode & 0o111) !== 0
      if (!isExecutable) {
        findings.push({
          level: 'warning',
          message: `Script is not executable: ${entry}`
        })
        continue
      }
      const contents = await fs.readFile(entryPath, 'utf8')
      if (!contents.startsWith('#!')) {
        findings.push({
          level: 'warning',
          message: `Executable script missing shebang: ${entry}`
        })
      }
    }
  } catch (error) {
    return findings
  }
  return findings
}

/**
 * Validate relative markdown links in SKILL.md.
 * @param {string} skillDir - Skill directory.
 * @param {string} contents - File contents.
 * @returns {Promise<SkillFinding[]>} Findings.
 */
export const validateLinks = async (skillDir, contents) => {
  const findings = []
  const regex = /\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(contents)) !== null) {
    const target = match[1].split(/\s/)[0]
    if (!target || target.startsWith('http') || target.startsWith('#')) continue
    const resolved = path.resolve(skillDir, target)
    try {
      await fs.stat(resolved)
    } catch (error) {
      findings.push({
        level: 'warning',
        message: `Broken link target: ${target}`
      })
    }
  }
  return findings
}

/**
 * Validate optional agents/openai.yaml file.
 * @param {string} skillDir - Skill directory.
 * @returns {Promise<SkillFinding[]>} Findings.
 */
export const validateOpenAIYaml = async skillDir => {
  const findings = []
  const yamlPath = path.join(skillDir, 'agents', 'openai.yaml')
  let contents = ''
  try {
    contents = await fs.readFile(yamlPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      return findings
    }
    findings.push({
      level: 'warning',
      message: `Could not read agents/openai.yaml: ${error.message}`
    })
    return findings
  }

  let data = {}
  try {
    data = parseYaml(contents)
  } catch (error) {
    findings.push({
      level: 'warning',
      message: `Could not parse agents/openai.yaml: ${error.message}`
    })
    return findings
  }

  try {
    const interfaceData = data.interface || {}
    const iconSmall = interfaceData.icon_small
    const iconLarge = interfaceData.icon_large
    const brandColor = interfaceData.brand_color
    if (iconSmall) {
      const iconPath = path.resolve(skillDir, iconSmall)
      try {
        await fs.stat(iconPath)
      } catch (error) {
        findings.push({
          level: 'warning',
          message: `Icon path not found: ${iconSmall}`
        })
      }
    }
    if (iconLarge) {
      const iconPath = path.resolve(skillDir, iconLarge)
      try {
        await fs.stat(iconPath)
      } catch (error) {
        findings.push({
          level: 'warning',
          message: `Icon path not found: ${iconLarge}`
        })
      }
    }
    if (brandColor && !/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(brandColor)) {
      findings.push({
        level: 'warning',
        message: `Invalid brand_color hex: ${brandColor}`
      })
    }
    const urlMatches = contents.match(/url:\s*([^\s]+)/g) || []
    urlMatches.forEach(match => {
      const url = match.replace('url:', '').trim()
      if (!url.startsWith('http')) {
        findings.push({
          level: 'warning',
          message: `Suspicious dependency URL: ${url}`
        })
      }
    })
  } catch (error) {
    findings.push({
      level: 'warning',
      message: `Could not validate agents/openai.yaml: ${error.message}`
    })
  }
  return findings
}

/**
 * Load and validate a single skill directory.
 * @param {string} skillDir - Skill directory.
 * @returns {Promise<SkillRecord>} Skill record.
 */
export const loadSkillRecord = async skillDir => {
  const findings = []
  const stat = await fs.lstat(skillDir)
  const isSymlink = stat.isSymbolicLink()
  let realPath = null
  if (isSymlink) {
    try {
      realPath = await fs.realpath(skillDir)
    } catch (error) {
      findings.push({ level: 'error', message: 'Broken symlink target.' })
    }
  }

  const skillFile = path.join(skillDir, 'SKILL.md')
  const altSkillFile = path.join(skillDir, 'SKILL.MD')
  let contents = ''
  let meta = null

  try {
    contents = await fs.readFile(skillFile, 'utf8')
    meta = parseFrontmatter(contents)
    if (!meta) {
      findings.push({
        level: 'error',
        message: 'Missing or invalid frontmatter (name/description).'
      })
    }
  } catch (error) {
    try {
      await fs.stat(altSkillFile)
      findings.push({
        level: 'error',
        message: 'SKILL.md is mis-capitalized (found SKILL.MD).'
      })
    } catch (altError) {
      findings.push({ level: 'error', message: 'Missing SKILL.md.' })
    }
  }

  const name = meta?.name || ''
  const description = meta?.description || ''
  if (name) {
    // Per Open Agent Skills spec: name must match parent directory name.
    if (path.basename(skillDir) !== name) {
      findings.push({
        level: 'error',
        message: 'Frontmatter name does not match directory name.'
      })
    }
    findings.push(...validateSkillName(name))
  }
  if (description) {
    findings.push(...validateDescription(description))
    if (!isDescriptionAdequate(description)) {
      findings.push({
        level: 'warning',
        message: 'Description may be too short or missing trigger guidance.'
      })
    }
  }

  if (contents) {
    findings.push(...(await validateLinks(skillDir, contents)))
  }

  const scriptsDir = path.join(skillDir, 'scripts')
  findings.push(...(await validateScripts(scriptsDir)))
  findings.push(...(await validateOpenAIYaml(skillDir)))

  return {
    name,
    description,
    skillDir,
    skillFile,
    isSymlink,
    realPath,
    findings
  }
}

/**
 * Discover skills across repo and user scope.
 * @param {Object} options - Options.
 * @param {boolean} options.includeUserSkills - Include user skills.
 * @returns {Promise<SkillRecord[]>} Skill records.
 */
export const discoverSkills = async ({ includeUserSkills }) => {
  const cwd = process.cwd()
  const repoDir = await findRepoRoot(cwd)
  const roots = await collectSkillRoots(cwd, repoDir)
  if (includeUserSkills) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    if (homeDir) {
      roots.push(path.join(homeDir, '.claude', 'skills'))
    }
  }

  const skillDirs = new Set()
  for (const root of roots) {
    try {
      const discovered = await findSkillDirs(root)
      discovered.forEach(dir => {
        skillDirs.add(dir)
      })
    } catch (error) {
      // skip missing roots
    }
  }

  const records = []
  for (const skillDir of skillDirs) {
    records.push(await loadSkillRecord(skillDir))
  }

  const nameMap = new Map()
  records.forEach(record => {
    if (!record.name) return
    if (nameMap.has(record.name)) {
      const message = 'Duplicate skill name detected.'
      if (!record.findings.some(finding => finding.message === message)) {
        record.findings.push({ level: 'error', message })
      }
      const existingRecord = nameMap.get(record.name)
      if (
        existingRecord &&
        !existingRecord.findings.some(finding => finding.message === message)
      ) {
        existingRecord.findings.push({ level: 'error', message })
      }
    } else {
      nameMap.set(record.name, record)
    }
  })

  return records
}

/**
 * Load prompt-case tests from JSON files.
 * @returns {Promise<Object[]>} Test cases.
 */
export const loadSkillCases = async () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const casesDir = path.join(__dirname, '..', 'tests', 'cases')
  const entries = await fs.readdir(casesDir)
  const caseFiles = entries.filter(entry => entry.endsWith('.cases.json'))
  const cases = []
  for (const file of caseFiles) {
    const contents = await fs.readFile(path.join(casesDir, file), 'utf8')
    try {
      cases.push(...JSON.parse(contents))
    } catch (error) {
      throw new Error(`Failed to parse ${file}: ${error.message}`)
    }
  }
  return cases
}

/**
 * Run prompt-case checks against SKILL.md contents.
 * @param {SkillRecord[]} records - Skill records.
 * @param {Object[]} cases - Skill cases.
 * @returns {Promise<string[]>} Failures.
 */
export const runPromptCases = async (records, cases) => {
  const failures = []
  const recordMap = new Map(records.map(record => [record.name, record]))
  for (const testCase of cases) {
    const record = recordMap.get(testCase.skill)
    if (!record) {
      failures.push(`Missing skill: ${testCase.skill}`)
      continue
    }
    const contents = await fs.readFile(record.skillFile, 'utf8')
    const missing = (testCase.expectIncludes || []).filter(
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

/**
 * Read disabled skills from ~/.codex/config.toml.
 * @returns {Promise<Set<string>>} Disabled skill paths.
 */
export const readDisabledSkills = async () => {
  const disabled = new Set()
  const homeDir = process.env.HOME || process.env.USERPROFILE || ''
  if (!homeDir) return disabled
  const configPath = path.join(homeDir, '.codex', 'config.toml')
  try {
    const contents = await fs.readFile(configPath, 'utf8')
    const data = toml.parse(contents)
    const skillConfigs = data?.skills?.config
    const configList = Array.isArray(skillConfigs)
      ? skillConfigs
      : skillConfigs
        ? [skillConfigs]
        : []
    configList.forEach(config => {
      if (config?.enabled === false && typeof config?.path === 'string') {
        disabled.add(config.path)
      }
    })
  } catch (error) {
    if (error.code && error.code === 'ENOENT') {
      return disabled
    }
    console.warn(`Could not parse ~/.codex/config.toml: ${error.message}`)
    return disabled
  }
  return disabled
}

/**
 * Resolve and cache the repository root path.
 * @returns {Promise<string>} Repository root.
 */
const getRepoRoot = async () => {
  const cwd = process.cwd()
  if (!repoRootCache || repoRootCacheCwd !== cwd) {
    repoRootCache = await findRepoRoot(cwd)
    repoRootCacheCwd = cwd
  }
  return repoRootCache
}

/**
 * Reset the cached repository root. Useful when tests change cwd.
 */
export const resetRepoRootCache = () => {
  repoRootCache = null
  repoRootCacheCwd = null
}

/**
 * Run the repository quality gate (lint, test, build).
 * @returns {Promise<void>} Promise resolving when complete.
 */
export const runQualityGate = async () => {
  const runCommand = (command, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit', shell: true })
      child.on('error', error => {
        reject(
          new Error(
            `${command} ${args.join(' ')} failed to start: ${error.message}`
          )
        )
      })
      child.on('exit', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`${command} ${args.join(' ')} failed with ${code}`))
        }
      })
    })

  await runCommand('npm', ['run', 'lint'])
  await runCommand('npm', ['run', 'test'])
  await runCommand('npm', ['run', 'build'])
}

/**
 * Build a JSON report from skill validation results.
 * @param {SkillRecord[]} records - Skill records.
 * @param {string[]} promptFailures - Prompt-case failures.
 * @param {Set<string>} disabled - Disabled skills.
 * @returns {Object} Report data.
 */
export const buildReport = (records, promptFailures, disabled) => {
  const normalizePath = value => path.normalize(path.resolve(value))
  const disabledEntries = Array.from(disabled).map(normalizePath)
  const normalized = records.map(record => {
    const recordFile = normalizePath(record.skillFile)
    const disabledMatch = disabledEntries.some(entry => {
      if (recordFile === entry) return true
      return recordFile.startsWith(`${entry}${path.sep}`)
    })
    const status = record.findings.some(f => f.level === 'error')
      ? 'fail'
      : record.findings.some(f => f.level === 'warning')
        ? 'warn'
        : 'pass'
    return {
      name: record.name,
      skillDir: record.skillDir,
      status: disabledMatch ? 'disabled' : status,
      findings: record.findings
    }
  })

  return {
    summary: {
      total: normalized.length,
      fail: normalized.filter(item => item.status === 'fail').length,
      warn: normalized.filter(item => item.status === 'warn').length,
      pass: normalized.filter(item => item.status === 'pass').length,
      disabled: normalized.filter(item => item.status === 'disabled').length
    },
    promptFailures,
    skills: normalized
  }
}

/**
 * Write the report to disk.
 * @param {Object} report - Report data.
 * @returns {Promise<void>} Promise resolving when complete.
 */
export const writeReport = async report => {
  const repoRoot = await getRepoRoot()
  const reportDir = path.join(repoRoot, 'reports', 'skills')
  await fs.mkdir(reportDir, { recursive: true })
  const reportPath = path.join(reportDir, 'skilltest-report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
}

/**
 * Format a console summary for the report.
 * @param {Object} report - Report data.
 * @returns {string} Report summary.
 */
export const formatSummary = report => {
  return report.skills
    .map(skill => {
      const icon =
        skill.status === 'fail'
          ? '❌'
          : skill.status === 'warn'
            ? '⚠️'
            : skill.status === 'disabled'
              ? '⏭️'
              : '✅'
      return `${icon} ${skill.name} (${skill.skillDir})`
    })
    .join('\n')
}

export const runReporting = async (records, cases, disabled) => {
  try {
    const promptFailures = await runPromptCases(records, cases)
    const report = buildReport(records, promptFailures, disabled)
    await writeReport(report)

    console.log(formatSummary(report))
    if (promptFailures.length > 0) {
      promptFailures.forEach(failure => {
        console.error(`❌ ${failure}`)
      })
    }

    if (report.summary.fail > 0 || promptFailures.length > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error('Reporting failed:', error)
    process.exitCode = 1
  }
}
