import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHarness } from '../../../../scripts/skilltest/harness.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const casesDir = path.resolve(__dirname, '..', 'tests', 'cases')

const resolveUserRoots = () => {
  const roots = []
  const codexHome = process.env.CODEX_HOME
  if (codexHome) {
    roots.push(path.join(codexHome, 'skills'))
  } else {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    if (homeDir) {
      roots.push(path.join(homeDir, '.codex', 'skills'))
    }
  }
  return roots
}

const harness = createHarness({
  treeName: '.agents',
  casesDir,
  resolveUserRoots
})

export const {
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
} = harness
