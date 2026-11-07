/**
 * Canonical Skilltest Harness Core Factory.
 *
 * @remarks
 * Root Contract & Architectural Guarantees:
 * 1. Tree Name: Configured per-tree (e.g. '.agents' or '.claude').
 * 2. Cases Directory: Absolute path to the tree's prompt test cases directory (`casesDir`).
 * 3. User-Root Resolver: Pure tree-specific function resolving user skills directories
 *    (e.g., CODEX_HOME or ~/.codex/skills for .agents; ~/.claude/skills for .claude).
 * 4. Deprecation Replacement Text: Message emitted when invoking legacy validate-skills.mjs.
 * 5. Shared Disabled-Config Path: ~/.codex/config.toml across both trees.
 * 6. Report Output Path: reports/skills/skilltest-report.json relative to repository root.
 * 7. Repository & Skill-Root Resolution: Repository root is detected by walking up to `.git`.
 *    Skill roots are collected from CWD up to repository root (preserving discovery order).
 * 8. Traversal Rules: Symlinks are resolved, cycles prevented using visited Set, and
 *    `SKILL.md` (exact casing) validated.
 * 9. Quality-Gate Commands: Runs `pnpm run lint`, `pnpm run test`, `pnpm run build` in order.
 *    On Windows, delegates via `cmd.exe /d /s /c pnpm ...`.
 * 10. Process-Global State & Per-Instance Cache: No shared mutable module state across harness
 *     instances. `repoRootCache` and its CWD key remain isolated inside each factory closure.
 * 11. Repository-Bound Packaging: Core logic is housed in `scripts/skilltest/`, with trees
 *     exporting configured wrappers bound to their respective roots.
 */

import fs from 'node:fs/promises'
import nodePath from 'node:path'
import { spawn } from 'node:child_process'
import toml from '@iarna/toml'
import { parse as parseYamlDoc } from 'yaml'

/**
 * Pure helper to match whether a file path falls under any disabled entry.
 *
 * @param {string} targetPath - Path to test.
 * @param {Set<string> | Iterable<string>} disabledSet - Set of disabled path strings.
 * @param {import('node:path')} [pathImpl=nodePath] - Path implementation to use.
 * @returns {boolean} Whether the path is disabled.
 */
export const isPathDisabled = (targetPath, disabledSet, pathImpl = nodePath) => {
  const normalizePath = value => pathImpl.normalize(pathImpl.resolve(value))
  const normalizedTarget = normalizePath(targetPath)
  for (const entry of disabledSet) {
    const normalizedEntry = normalizePath(entry)
    if (normalizedTarget === normalizedEntry) {
      return true
    }
    if (normalizedTarget.startsWith(`${normalizedEntry}${pathImpl.sep}`)) {
      return true
    }
  }
  return false
}

/**
 * Validate a skill name against Open Agent Skills specification.
 * @param {string} name
 * @returns {Array<{level: string, message: string}>}
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
 * Validate description length.
 * @param {string} description
 * @returns {Array<{level: string, message: string}>}
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
 * Check whether a skill description contains trigger guidance.
 * @param {string} description
 * @returns {boolean}
 */
const isDescriptionAdequate = description => {
  const normalized = description.toLowerCase()
  const triggerHints = ['use when', 'use this', 'when', 'trigger', 'apply']
  const hasTriggerHint = triggerHints.some(hint => normalized.includes(hint))
  const isLongEnough = description.length >= 60
  return hasTriggerHint || isLongEnough
}

/**
 * Determine the repository root by walking up to a .git directory.
 * @param {string} startDir - Starting directory.
 * @returns {Promise<string>} Repository root or the starting directory.
 */
export const findRepoRoot = async startDir => {
  let currentDir = startDir
  while (true) {
    const candidate = nodePath.join(currentDir, '.git')
    try {
      const stat = await fs.stat(candidate)
      if (stat.isDirectory() || stat.isFile()) {
        return currentDir
      }
    } catch (_error) {
      // continue walking up
    }
    const parentDir = nodePath.dirname(currentDir)
    if (parentDir === currentDir) {
      return startDir
    }
    currentDir = parentDir
  }
}

/**
 * Recursively find skill directories containing SKILL.md.
 * @param {string} rootDir - Skill root directory.
 * @param {Set<string>} [visited]
 * @returns {Promise<string[]>} Skill directory paths.
 */
export const findSkillDirs = async (rootDir, visited) => {
  if (!visited) {
    visited = new Set()
  }

  try {
    const realRoot = await fs.realpath(rootDir)
    visited.add(realRoot)
  } catch (_error) {
    // ignore errors resolving rootDir
  }
  let entries
  try {
    entries = await fs.readdir(rootDir, { withFileTypes: true })
  } catch (_error) {
    return []
  }
  const skillDirs = []
  for (const entry of entries) {
    const entryPath = nodePath.join(rootDir, entry.name)
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    let realPath
    try {
      realPath = await fs.realpath(entryPath)
      if (visited.has(realPath)) {
        continue
      }
      visited.add(realPath)
    } catch (_error) {
      console.warn(`Could not resolve path, skipping: ${entryPath}`)
      continue
    }

    const skillFile = nodePath.join(entryPath, 'SKILL.md')
    try {
      const stat = await fs.stat(skillFile)
      if (stat.isFile()) {
        skillDirs.push(entryPath)
        continue
      }
    } catch (_error) {
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
 * @returns {{name: string, description: string} | null} Parsed frontmatter,
 *   or `null` when the frontmatter is missing, is not valid YAML, is not a
 *   mapping, or lacks a non-empty string `name` and `description`.
 */
export const parseFrontmatter = contents => {
  const normalized = contents.replace(/\r\n/g, '\n')
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) return null
  let data
  try {
    data = parseYamlDoc(match[1])
  } catch (_error) {
    return null
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const { name, description } = data
  if (typeof name !== 'string' || !name) return null
  if (typeof description !== 'string' || !description) return null
  return { name, description }
}

/**
 * Parse YAML contents.
 * @param {string} contents
 * @returns {Object}
 */
export const parseYaml = contents => parseYamlDoc(contents) || {}

/**
 * Validate executable scripts in a directory.
 * @param {string} scriptsDir - Scripts directory.
 * @returns {Promise<Array<{level: string, message: string}>>} Findings.
 */
export const validateScripts = async scriptsDir => {
  const findings = []
  try {
    const entries = await fs.readdir(scriptsDir)
    for (const entry of entries) {
      const entryPath = nodePath.join(scriptsDir, entry)
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
  } catch (_error) {
    return findings
  }
  return findings
}

/**
 * Validate relative markdown links in SKILL.md.
 * @param {string} skillDir - Skill directory.
 * @param {string} contents - File contents.
 * @returns {Promise<Array<{level: string, message: string}>>} Findings.
 */
export const validateLinks = async (skillDir, contents) => {
  const findings = []
  const regex = /\[[^\]]*\]\(([^)]+)\)/g
  let match
  while ((match = regex.exec(contents)) !== null) {
    const target = match[1].split(/\s/)[0]
    if (!target || target.startsWith('http') || target.startsWith('#')) continue
    const resolved = nodePath.resolve(skillDir, target)
    try {
      await fs.stat(resolved)
    } catch (_error) {
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
 * @returns {Promise<Array<{level: string, message: string}>>} Findings.
 */
export const validateOpenAIYaml = async skillDir => {
  const findings = []
  const yamlPath = nodePath.join(skillDir, 'agents', 'openai.yaml')
  let contents
  try {
    contents = await fs.readFile(yamlPath, 'utf8')
  } catch (_error) {
    if (_error.code === 'ENOENT') {
      return findings
    }
    findings.push({
      level: 'warning',
      message: `Could not read agents/openai.yaml: ${_error.message}`
    })
    return findings
  }

  let data
  try {
    data = parseYaml(contents)
  } catch (_error) {
    findings.push({
      level: 'warning',
      message: `Could not parse agents/openai.yaml: ${_error.message}`
    })
    return findings
  }

  try {
    const interfaceData = data.interface || {}
    const iconSmall = interfaceData.icon_small
    const iconLarge = interfaceData.icon_large
    const brandColor = interfaceData.brand_color
    if (iconSmall) {
      const iconPath = nodePath.resolve(skillDir, iconSmall)
      try {
        await fs.stat(iconPath)
      } catch (_error) {
        findings.push({
          level: 'warning',
          message: `Icon path not found: ${iconSmall}`
        })
      }
    }
    if (iconLarge) {
      const iconPath = nodePath.resolve(skillDir, iconLarge)
      try {
        await fs.stat(iconPath)
      } catch (_error) {
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
  } catch (_error) {
    findings.push({
      level: 'warning',
      message: `Could not validate agents/openai.yaml: ${_error.message}`
    })
  }
  return findings
}

/**
 * Load and validate a single skill directory.
 * @param {string} skillDir - Skill directory.
 * @returns {Promise<Object>} Skill record.
 */
export const loadSkillRecord = async skillDir => {
  const findings = []
  const stat = await fs.lstat(skillDir)
  const isSymlink = stat.isSymbolicLink()
  let realPath = null
  if (isSymlink) {
    try {
      realPath = await fs.realpath(skillDir)
    } catch (_error) {
      findings.push({ level: 'error', message: 'Broken symlink target.' })
    }
  }

  const skillFile = nodePath.join(skillDir, 'SKILL.md')
  const altSkillFile = nodePath.join(skillDir, 'SKILL.MD')
  let contents
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
  } catch (_error) {
    try {
      await fs.stat(altSkillFile)
      findings.push({
        level: 'error',
        message: 'SKILL.md is mis-capitalized (found SKILL.MD).'
      })
    } catch (_altError) {
      findings.push({ level: 'error', message: 'Missing SKILL.md.' })
    }
  }

  const name = meta?.name || ''
  const description = meta?.description || ''
  if (name) {
    if (nodePath.basename(skillDir) !== name) {
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

  const scriptsDir = nodePath.join(skillDir, 'scripts')
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
 * Run prompt-case checks against SKILL.md contents.
 * @param {Array<Object>} records - Skill records.
 * @param {Array<Object>} cases - Skill cases.
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
  const configPath = nodePath.join(homeDir, '.codex', 'config.toml')
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
  } catch (_error) {
    if (_error.code && _error.code === 'ENOENT') {
      return disabled
    }
    console.warn(`Could not parse ~/.codex/config.toml: ${_error.message}`)
    return disabled
  }
  return disabled
}

/**
 * Run the repository quality gate (lint, test, build).
 * @returns {Promise<void>}
 */
export const runQualityGate = async () => {
  const createPnpmCommand = args => {
    if (process.platform === 'win32') {
      return {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', 'pnpm', ...args],
        label: `pnpm ${args.join(' ')}`
      }
    }
    return {
      command: 'pnpm',
      args,
      label: `pnpm ${args.join(' ')}`
    }
  }

  const runCommand = ({ command, args, label }) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit' })
      child.on('error', _error => {
        reject(new Error(`${label} failed to start: ${_error.message}`))
      })
      child.on('exit', (code, signal) => {
        if (code === 0) {
          resolve()
        } else {
          reject(
            new Error(`${label} failed with code ${code}, signal ${signal}`)
          )
        }
      })
    })

  await runCommand(createPnpmCommand(['run', 'lint']))
  await runCommand(createPnpmCommand(['run', 'test']))
  await runCommand(createPnpmCommand(['run', 'build']))
}

/**
 * Build a JSON report from skill validation results.
 * @param {Array<Object>} records - Skill records.
 * @param {string[]} promptFailures - Prompt-case failures.
 * @param {Set<string>} disabled - Disabled skills.
 * @returns {Object} Report data.
 */
export const buildReport = (records, promptFailures, disabled) => {
  const normalized = records.map(record => {
    const disabledMatch = isPathDisabled(record.skillFile, disabled)
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

/**
 * Factory creating configured skilltest harness instance.
 *
 * @param {Object} config
 * @param {string} config.treeName - Name of tree (e.g. '.agents' or '.claude').
 * @param {string} config.casesDir - Absolute path to cases directory.
 * @param {() => Promise<string[]> | string[]} config.resolveUserRoots - Resolver returning user skill roots.
 * @returns {Object} Configured harness instance.
 */
export const createHarness = config => {
  if (!config || typeof config !== 'object') {
    throw new TypeError('Harness config must be an object.')
  }
  if (!config.treeName || typeof config.treeName !== 'string') {
    throw new TypeError('Harness config.treeName must be a non-empty string.')
  }
  if (!config.casesDir || typeof config.casesDir !== 'string') {
    throw new TypeError('Harness config.casesDir must be a non-empty string.')
  }
  if (typeof config.resolveUserRoots !== 'function') {
    throw new TypeError('Harness config.resolveUserRoots must be a function.')
  }

  const { treeName, casesDir, resolveUserRoots } = config

  let repoRootCache = null
  let repoRootCacheCwd = null

  const getTreeName = () => treeName

  const getRepoRoot = async () => {
    const cwd = process.cwd()
    if (!repoRootCache || repoRootCacheCwd !== cwd) {
      repoRootCache = await findRepoRoot(cwd)
      repoRootCacheCwd = cwd
    }
    return repoRootCache
  }

  const resetRepoRootCache = () => {
    repoRootCache = null
    repoRootCacheCwd = null
  }

  const collectSkillRoots = async (cwd, repoDir, targetTree = treeName) => {
    const roots = []
    let currentDir = cwd
    while (true) {
      const skillsDir = nodePath.join(currentDir, targetTree, 'skills')
      try {
        const stat = await fs.stat(skillsDir)
        if (stat.isDirectory()) {
          roots.push(skillsDir)
        }
      } catch (_error) {
        // skip missing skill root
      }
      if (currentDir === repoDir) {
        break
      }
      const parentDir = nodePath.dirname(currentDir)
      if (parentDir === currentDir) {
        break
      }
      currentDir = parentDir
    }
    return roots
  }

  const discoverSkills = async ({ includeUserSkills }) => {
    const cwd = process.cwd()
    const repoDir = await findRepoRoot(cwd)
    const roots = await collectSkillRoots(cwd, repoDir)
    if (includeUserSkills) {
      const userRoots = await resolveUserRoots()
      roots.push(...userRoots)
    }

    const skillDirs = new Set()
    for (const root of roots) {
      try {
        const discovered = await findSkillDirs(root)
        discovered.forEach(dir => {
          skillDirs.add(dir)
        })
      } catch (_error) {
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

  const loadSkillCases = async () => {
    const entries = await fs.readdir(casesDir)
    const caseFiles = entries.filter(entry => entry.endsWith('.cases.json'))
    const cases = []
    for (const file of caseFiles) {
      const contents = await fs.readFile(nodePath.join(casesDir, file), 'utf8')
      try {
        cases.push(...JSON.parse(contents))
      } catch (_error) {
        throw new Error(`Failed to parse ${file}: ${_error.message}`, {
          cause: _error
        })
      }
    }
    return cases
  }

  const writeReport = async report => {
    const repoRoot = await getRepoRoot()
    const reportDir = nodePath.join(repoRoot, 'reports', 'skills')
    await fs.mkdir(reportDir, { recursive: true })
    const reportPath = nodePath.join(reportDir, 'skilltest-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  }

  const runReporting = async (records, cases, disabled) => {
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
    } catch (_error) {
      console.error('Reporting failed:', _error)
      process.exitCode = 1
    }
  }

  return {
    buildReport,
    collectSkillRoots,
    discoverSkills,
    findRepoRoot,
    findSkillDirs,
    formatSummary,
    getTreeName,
    loadSkillCases,
    loadSkillRecord,
    parseFrontmatter,
    parseYaml,
    readDisabledSkills,
    resetRepoRootCache,
    runPromptCases,
    runQualityGate,
    runReporting,
    validateLinks,
    validateOpenAIYaml,
    validateScripts,
    writeReport
  }
}
