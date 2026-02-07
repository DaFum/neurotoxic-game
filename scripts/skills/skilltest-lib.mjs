import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

/**
 * @typedef {Object} SkillFinding
 * @property {string} level
 * @property {string} message
 */

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

const repoRoot = process.cwd()

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
      if (stat.isDirectory()) {
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
    const skillsDir = path.join(currentDir, '.agents', 'skills')
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
export const findSkillDirs = async rootDir => {
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  const skillDirs = []
  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
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
      const nested = await findSkillDirs(entryPath)
      skillDirs.push(...nested)
    }
  }
  return skillDirs
}

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * @param {string} contents - File contents.
 * @returns {{name: string, description: string} | null} Parsed frontmatter.
 */
export const parseFrontmatter = contents => {
  const match = contents.match(/^---\n([\s\S]*?)\n---\n/m)
  if (!match) return null
  const lines = match[1].split('\n')
  const data = {}
  lines.forEach(line => {
    const [key, ...rest] = line.split(':')
    if (!key || rest.length === 0) return
    data[key.trim()] = rest.join(':').trim()
  })
  if (!data.name || !data.description) return null
  return { name: data.name, description: data.description }
}

/**
 * Parse a simple YAML file into a nested object using indentation.
 * @param {string} contents - YAML contents.
 * @returns {Object} Parsed object.
 */
export const parseYaml = contents => {
  const result = {}
  const stack = [{ indent: -1, value: result }]
  const lines = contents.split('\n')
  lines.forEach(line => {
    if (!line.trim() || line.trim().startsWith('#')) return
    const indent = line.match(/^\s*/)[0].length
    const [rawKey, ...rest] = line.trim().split(':')
    const key = rawKey.trim()
    const value = rest.join(':').trim()
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }
    const parent = stack[stack.length - 1].value
    if (value) {
      parent[key] = value.replace(/^"|"$/g, '')
    } else {
      parent[key] = parent[key] || {}
      stack.push({ indent, value: parent[key] })
    }
  })
  return result
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
    const target = match[1]
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
  try {
    const contents = await fs.readFile(yamlPath, 'utf8')
    const data = parseYaml(contents)
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
    return findings
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
  if (name && path.basename(skillDir) !== name) {
    findings.push({
      level: 'error',
      message: 'Frontmatter name does not match directory name.'
    })
  }
  if (description && (!description.includes('Use') || description.length < 60)) {
    findings.push({
      level: 'warning',
      message: 'Description may be too short or missing trigger guidance.'
    })
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
      roots.push(path.join(homeDir, '.agents', 'skills'))
    }
  }

  const skillDirs = new Set()
  for (const root of roots) {
    try {
      const discovered = await findSkillDirs(root)
      discovered.forEach(dir => skillDirs.add(dir))
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
      record.findings.push({
        level: 'warning',
        message: 'Duplicate skill name detected.'
      })
      nameMap.get(record.name).findings.push({
        level: 'warning',
        message: 'Duplicate skill name detected.'
      })
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
  const casesDir = path.join(repoRoot, 'tests', 'skills')
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
    const blocks = contents.split('[[skills.config]]')
    blocks.forEach(block => {
      const pathMatch = block.match(/path\s*=\s*"([^"]+)"/)
      const enabledMatch = block.match(/enabled\s*=\s*(false|true)/)
      if (pathMatch && enabledMatch && enabledMatch[1] === 'false') {
        disabled.add(pathMatch[1])
      }
    })
  } catch (error) {
    return disabled
  }
  return disabled
}

/**
 * Run the repository quality gate (lint, test, build).
 * @returns {Promise<void>} Promise resolving when complete.
 */
export const runQualityGate = async () => {
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
  const normalized = records.map(record => {
    const disabledMatch = Array.from(disabled).some(entry =>
      record.skillFile.includes(entry)
    )
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
