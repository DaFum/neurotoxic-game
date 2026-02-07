import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * @typedef {Object} SkillMeta
 * @property {string} name
 * @property {string} description
 * @property {string} skillDir
 * @property {string} skillFile
 * @property {string[]} errors
 */

const repoRoot = process.cwd()
const repoSkillsDir = path.join(repoRoot, '.agents', 'skills')
const userSkillsDir = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.agents',
  'skills'
)

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * @param {string} contents - File contents.
 * @returns {{name: string, description: string} | null} Parsed frontmatter.
 */
const parseFrontmatter = contents => {
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
 * Collect skill directories.
 * @param {string} rootDir - Skills root.
 * @returns {Promise<string[]>} List of directories.
 */
const listSkillDirs = async rootDir => {
  try {
    const entries = await fs.readdir(rootDir, { withFileTypes: true })
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
  } catch (error) {
    return []
  }
}

/**
 * Load skill metadata from a skill directory.
 * @param {string} skillsRoot - Root directory.
 * @param {string} skillDirName - Skill directory name.
 * @returns {Promise<SkillMeta>} Skill metadata.
 */
export const loadSkillMeta = async (skillsRoot, skillDirName) => {
  const skillDir = path.join(skillsRoot, skillDirName)
  const skillFile = path.join(skillDir, 'SKILL.md')
  const errors = []
  let meta = null
  try {
    const contents = await fs.readFile(skillFile, 'utf8')
    meta = parseFrontmatter(contents)
    if (!meta) {
      errors.push('Missing or invalid frontmatter (name/description).')
    }
  } catch (error) {
    errors.push('Missing SKILL.md.')
  }

  const name = meta?.name || ''
  const description = meta?.description || ''
  if (name && name !== skillDirName) {
    errors.push('Frontmatter name does not match directory name.')
  }

  return {
    name,
    description,
    skillDir,
    skillFile,
    errors
  }
}

/**
 * Validate all skills under repo/user scope.
 * @param {Object} options - Options.
 * @param {boolean} options.includeUserSkills - Whether to include user skills.
 * @returns {Promise<SkillMeta[]>} List of skill metadata.
 */
export const validateSkills = async ({ includeUserSkills }) => {
  const repoSkillDirs = await listSkillDirs(repoSkillsDir)
  const userSkillDirs = includeUserSkills ? await listSkillDirs(userSkillsDir) : []
  const results = []

  for (const dirName of repoSkillDirs) {
    results.push(await loadSkillMeta(repoSkillsDir, dirName))
  }

  for (const dirName of userSkillDirs) {
    results.push(await loadSkillMeta(userSkillsDir, dirName))
  }

  const nameMap = new Map()
  results.forEach(meta => {
    if (!meta.name) return
    if (nameMap.has(meta.name)) {
      meta.errors.push('Duplicate skill name detected.')
      nameMap.get(meta.name).errors.push('Duplicate skill name detected.')
    } else {
      nameMap.set(meta.name, meta)
    }
  })

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const includeUserSkills = process.argv.includes('--include-user')
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
