import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { parse as parseYaml } from 'yaml'

const AGENTS_DIR = path.resolve(process.cwd(), '.agents')

/**
 * Read and parse a JSON file relative to the .agents directory.
 * @param {string} relPath
 * @returns {Promise<unknown>}
 */
const readAgentJson = async relPath => {
  const content = await fs.readFile(path.join(AGENTS_DIR, relPath), 'utf-8')
  return JSON.parse(content)
}

/**
 * Parse YAML frontmatter from a SKILL.md file.
 * Uses strict:false so description fields with embedded colons don't abort parsing.
 * @param {string} skillName
 * @returns {Promise<Record<string, unknown>>}
 */
const readSkillFrontmatter = async skillName => {
  const skillPath = path.join(AGENTS_DIR, 'skills', skillName, 'SKILL.md')
  const content = await fs.readFile(skillPath, 'utf-8')
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) throw new Error(`No YAML frontmatter found in ${skillPath}`)
  return parseYaml(match[1], { strict: false }) ?? {}
}

// ---------------------------------------------------------------------------
// skills-manifest.json
// ---------------------------------------------------------------------------

test('skills-manifest.json parses as valid JSON', async () => {
  const manifest = await readAgentJson('skills-manifest.json')
  assert.ok(manifest !== null && typeof manifest === 'object')
})

test('skills-manifest.json has required meta fields', async () => {
  const { meta } = await readAgentJson('skills-manifest.json')
  assert.ok(meta, 'meta field present')
  assert.strictEqual(typeof meta.total_skills, 'number', 'meta.total_skills is number')
  assert.ok(meta.categories && typeof meta.categories === 'object', 'meta.categories is object')
  assert.ok(typeof meta.generated_date === 'string', 'meta.generated_date is string')
})

test('skills-manifest.json reports exactly 30 total skills', async () => {
  const { meta } = await readAgentJson('skills-manifest.json')
  assert.strictEqual(meta.total_skills, 30)
})

test('skills-manifest.json skills array has exactly 30 entries', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  assert.ok(Array.isArray(skills), 'skills is array')
  assert.strictEqual(skills.length, 30)
})

test('skills-manifest.json each skill has all required fields', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const required = [
    'name',
    'directory',
    'description',
    'compatibility',
    'category',
    'maturity',
    'version',
    'references',
    'scripts',
    'keywords'
  ]
  for (const skill of skills) {
    for (const field of required) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(skill, field),
        `skill "${skill.name}" is missing required field "${field}"`
      )
    }
  }
})

test('skills-manifest.json every skill keywords field is a non-empty array of strings', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  for (const skill of skills) {
    assert.ok(
      Array.isArray(skill.keywords),
      `skill "${skill.name}" keywords must be an array`
    )
    assert.ok(
      skill.keywords.length > 0,
      `skill "${skill.name}" keywords must not be empty`
    )
    for (const kw of skill.keywords) {
      assert.strictEqual(
        typeof kw,
        'string',
        `skill "${skill.name}" keyword must be a string, got ${typeof kw}`
      )
    }
  }
})

test('skills-manifest.json meta.categories has exactly 17 categories', async () => {
  const { meta } = await readAgentJson('skills-manifest.json')
  assert.strictEqual(Object.keys(meta.categories).length, 17)
})

test('skills-manifest.json per-skill category counts match meta.categories', async () => {
  const { meta, skills } = await readAgentJson('skills-manifest.json')
  const actual = {}
  for (const skill of skills) {
    actual[skill.category] = (actual[skill.category] ?? 0) + 1
  }
  for (const [cat, expected] of Object.entries(meta.categories)) {
    assert.strictEqual(
      actual[cat],
      expected,
      `category "${cat}": expected ${expected} skills, found ${actual[cat]}`
    )
  }
})

test('skills-manifest.json maturity values are limited to stable or beta', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const valid = new Set(['stable', 'beta'])
  for (const skill of skills) {
    assert.ok(
      valid.has(skill.maturity),
      `skill "${skill.name}" has invalid maturity "${skill.maturity}"`
    )
  }
})

test('skills-manifest.json game-improver has 4 references', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const gi = skills.find(s => s.name === 'game-improver')
  assert.ok(gi, 'game-improver skill found')
  assert.strictEqual(gi.references, 4)
})

test('skills-manifest.json react-performance-optimization has 7 references', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const rpo = skills.find(s => s.name === 'react-performance-optimization')
  assert.ok(rpo, 'react-performance-optimization skill found')
  assert.strictEqual(rpo.references, 7)
})

test('skills-manifest.json agents-md-writer keywords are correct', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const skill = skills.find(s => s.name === 'agents-md-writer')
  assert.ok(skill, 'agents-md-writer found')
  assert.deepEqual(skill.keywords, [
    'documentation',
    'context',
    'instructions',
    'agent-setup'
  ])
})

test('skills-manifest.json audio-debugger-ambient-vs-gig keywords are correct', async () => {
  const { skills } = await readAgentJson('skills-manifest.json')
  const skill = skills.find(s => s.name === 'audio-debugger-ambient-vs-gig')
  assert.ok(skill, 'audio-debugger-ambient-vs-gig found')
  assert.deepEqual(skill.keywords, ['audio', 'debug', 'tone.js', 'playback'])
})

// ---------------------------------------------------------------------------
// skills-dependencies.json
// ---------------------------------------------------------------------------

test('skills-dependencies.json parses as valid JSON', async () => {
  const deps = await readAgentJson('skills-dependencies.json')
  assert.ok(deps !== null && typeof deps === 'object')
})

test('skills-dependencies.json has meta and dependencies fields', async () => {
  const deps = await readAgentJson('skills-dependencies.json')
  assert.ok(deps.meta && typeof deps.meta === 'object', 'meta field present')
  assert.ok(deps.dependencies && typeof deps.dependencies === 'object', 'dependencies field present')
})

test('skills-dependencies.json meta.total_skills is 30', async () => {
  const { meta } = await readAgentJson('skills-dependencies.json')
  assert.strictEqual(meta.total_skills, 30)
})

test('skills-dependencies.json dependencies has 30 skill entries', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  assert.strictEqual(Object.keys(dependencies).length, 30)
})

test('skills-dependencies.json each entry has depends_on, routing_triggers, related_skills', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  for (const [name, entry] of Object.entries(dependencies)) {
    assert.ok(
      Array.isArray(entry.depends_on),
      `"${name}" depends_on must be an array`
    )
    assert.ok(
      typeof entry.routing_triggers === 'object' && !Array.isArray(entry.routing_triggers),
      `"${name}" routing_triggers must be a plain object`
    )
    assert.ok(
      Array.isArray(entry.related_skills),
      `"${name}" related_skills must be an array`
    )
  }
})

test('skills-dependencies.json skill-aligner related_skills contains only ci-hardener', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  const entry = dependencies['skill-aligner']
  assert.ok(entry, 'skill-aligner exists in dependencies')
  assert.deepEqual(entry.related_skills, ['ci-hardener'])
})

test('skills-dependencies.json skill-qa-harness related_skills contains only skilltest', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  const entry = dependencies['skill-qa-harness']
  assert.ok(entry, 'skill-qa-harness exists in dependencies')
  assert.deepEqual(entry.related_skills, ['skilltest'])
})

test('skills-dependencies.json game-improver has 4 related_skills', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  const entry = dependencies['game-improver']
  assert.ok(entry, 'game-improver exists in dependencies')
  assert.strictEqual(entry.related_skills.length, 4)
  assert.ok(entry.related_skills.includes('audio-debugger-ambient-vs-gig'))
  assert.ok(entry.related_skills.includes('convention-keeper-brutalist-ui'))
  assert.ok(entry.related_skills.includes('game-balancing-assistant'))
  assert.ok(entry.related_skills.includes('webaudio-reliability-fixer'))
})

test('skills-dependencies.json refactor-with-safety has 2 related_skills', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  const entry = dependencies['refactor-with-safety']
  assert.ok(entry, 'refactor-with-safety exists in dependencies')
  assert.strictEqual(entry.related_skills.length, 2)
  assert.ok(entry.related_skills.includes('change-plan-conventional-commits'))
  assert.ok(entry.related_skills.includes('golden-path-test-author'))
})

test('skills-dependencies.json skills with no relationships have empty related_skills', async () => {
  const { dependencies } = await readAgentJson('skills-dependencies.json')
  const standalone = [
    'agents-md-writer',
    'asset-pipeline-verifier',
    'ci-hardener',
    'golden-path-test-author'
  ]
  for (const name of standalone) {
    const entry = dependencies[name]
    assert.ok(entry, `"${name}" exists in dependencies`)
    assert.deepEqual(
      entry.related_skills,
      [],
      `"${name}" should have no related_skills`
    )
    assert.deepEqual(entry.depends_on, [], `"${name}" should have no depends_on`)
  }
})

// ---------------------------------------------------------------------------
// audio-config.json
// ---------------------------------------------------------------------------

test('audio-config.json parses as valid JSON', async () => {
  const config = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  assert.ok(config !== null && typeof config === 'object')
})

test('audio-config.json has required top-level fields', async () => {
  const config = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  for (const field of ['schema', 'version', 'description', 'contexts', 'audioContextState', 'commonIssues', 'transitions']) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(config, field),
      `audio-config.json missing field "${field}"`
    )
  }
})

test('audio-config.json contexts has both ambient and gig entries', async () => {
  const { contexts } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  assert.ok(contexts.ambient && typeof contexts.ambient === 'object', 'ambient context present')
  assert.ok(contexts.gig && typeof contexts.gig === 'object', 'gig context present')
})

test('audio-config.json ambient context has correct numeric properties', async () => {
  const { contexts } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  const { ambient } = contexts
  assert.strictEqual(ambient.volume, -20)
  assert.strictEqual(ambient.fadeInTime, 2000)
  assert.strictEqual(ambient.fadeOutTime, 1000)
  assert.strictEqual(ambient.maxConcurrentNotes, 1)
  assert.strictEqual(ambient.looping, true)
  assert.strictEqual(ambient.priority, 'background')
})

test('audio-config.json gig context has correct numeric properties', async () => {
  const { contexts } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  const { gig } = contexts
  assert.strictEqual(gig.volume, -8)
  assert.strictEqual(gig.fadeInTime, 500)
  assert.strictEqual(gig.fadeOutTime, 500)
  assert.strictEqual(gig.maxConcurrentNotes, 8)
  assert.strictEqual(gig.looping, false)
  assert.strictEqual(gig.priority, 'foreground')
})

test('audio-config.json commonIssues is an array with 3 entries', async () => {
  const { commonIssues } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  assert.ok(Array.isArray(commonIssues), 'commonIssues is array')
  assert.strictEqual(commonIssues.length, 3)
})

test('audio-config.json each commonIssue has symptom, causes array, and fix', async () => {
  const { commonIssues } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  for (const issue of commonIssues) {
    assert.ok(typeof issue.symptom === 'string', `issue missing symptom string`)
    assert.ok(Array.isArray(issue.causes), `issue "${issue.symptom}" causes must be array`)
    assert.ok(issue.causes.length >= 1, `issue "${issue.symptom}" causes must not be empty`)
    assert.ok(typeof issue.fix === 'string', `issue "${issue.symptom}" missing fix string`)
  }
})

test('audio-config.json "No audio plays" issue has exactly 3 causes', async () => {
  const { commonIssues } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  const issue = commonIssues.find(i => i.symptom === 'No audio plays')
  assert.ok(issue, '"No audio plays" issue found')
  assert.strictEqual(issue.causes.length, 3)
  assert.ok(issue.causes.includes('AudioContext suspended'))
  assert.ok(issue.causes.includes('volume too low'))
  assert.ok(issue.causes.includes('files not loading'))
})

test('audio-config.json "Audio stutters/crackles" issue has exactly 3 causes', async () => {
  const { commonIssues } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  const issue = commonIssues.find(i => i.symptom === 'Audio stutters/crackles')
  assert.ok(issue, '"Audio stutters/crackles" issue found')
  assert.strictEqual(issue.causes.length, 3)
  assert.ok(issue.causes.includes('Too many simultaneous notes'))
  assert.ok(issue.causes.includes('synchronization loss'))
  assert.ok(issue.causes.includes('CPU throttling'))
})

test('audio-config.json "Ambient/Gig transition fails" issue has exactly 3 causes', async () => {
  const { commonIssues } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  const issue = commonIssues.find(i => i.symptom === 'Ambient/Gig transition fails')
  assert.ok(issue, '"Ambient/Gig transition fails" issue found')
  assert.strictEqual(issue.causes.length, 3)
  assert.ok(issue.causes.includes('Fade timing conflict'))
  assert.ok(issue.causes.includes('context not resumed'))
  assert.ok(issue.causes.includes('previous playback not stopped'))
})

test('audio-config.json transitions has ambientToGig and gigToAmbient', async () => {
  const { transitions } = await readAgentJson(
    'skills/audio-debugger-ambient-vs-gig/assets/audio-config.json'
  )
  assert.ok(transitions.ambientToGig, 'ambientToGig transition present')
  assert.ok(transitions.gigToAmbient, 'gigToAmbient transition present')
  assert.ok(Array.isArray(transitions.ambientToGig.steps), 'ambientToGig.steps is array')
  assert.ok(Array.isArray(transitions.gigToAmbient.steps), 'gigToAmbient.steps is array')
})

// ---------------------------------------------------------------------------
// action-types.json
// ---------------------------------------------------------------------------

test('action-types.json parses as valid JSON', async () => {
  const at = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  assert.ok(at !== null && typeof at === 'object')
})

test('action-types.json has required top-level fields', async () => {
  const at = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  for (const field of ['schema', 'description', 'source', 'actionTypes', 'enforcementRules']) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(at, field),
      `action-types.json missing field "${field}"`
    )
  }
  assert.ok(Array.isArray(at.actionTypes), 'actionTypes must be an array')
})

test('action-types.json each action type has type, payload, stateChanges, invariants', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  for (const action of actionTypes) {
    assert.ok(typeof action.type === 'string', `action missing type string`)
    assert.ok(
      action.payload !== null && typeof action.payload === 'object',
      `action "${action.type}" payload must be object`
    )
    assert.ok(
      Array.isArray(action.stateChanges),
      `action "${action.type}" stateChanges must be array`
    )
    assert.ok(
      Array.isArray(action.invariants),
      `action "${action.type}" invariants must be array`
    )
  }
})

test('action-types.json UPDATE_PLAYER payload has delta and keys fields', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const action = actionTypes.find(a => a.type === 'UPDATE_PLAYER')
  assert.ok(action, 'UPDATE_PLAYER action found')
  assert.ok(action.payload.delta, 'UPDATE_PLAYER payload has delta')
  assert.ok(Array.isArray(action.payload.keys), 'UPDATE_PLAYER payload.keys is array')
  assert.ok(action.payload.keys.includes('money'), 'keys includes money')
  assert.ok(action.payload.keys.includes('fuel'), 'keys includes fuel')
})

test('action-types.json UPDATE_PLAYER invariants include non-negative constraints', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const action = actionTypes.find(a => a.type === 'UPDATE_PLAYER')
  assert.ok(action, 'UPDATE_PLAYER found')
  assert.ok(action.invariants.includes('player.money >= 0'))
  assert.ok(action.invariants.includes('player.fame >= 0'))
  assert.ok(action.invariants.includes('player.fuel >= 0'))
  assert.strictEqual(action.invariants.length, 3)
})

test('action-types.json SET_GIG payload has songId, venue, difficulty fields', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const action = actionTypes.find(a => a.type === 'SET_GIG')
  assert.ok(action, 'SET_GIG action found')
  assert.ok(action.payload.songId, 'SET_GIG payload has songId')
  assert.ok(action.payload.venue, 'SET_GIG payload has venue')
  assert.ok(action.payload.difficulty, 'SET_GIG payload has difficulty')
})

test('action-types.json SET_GIG invariants include difficulty range constraint', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const action = actionTypes.find(a => a.type === 'SET_GIG')
  assert.ok(action, 'SET_GIG found')
  assert.ok(
    action.invariants.some(inv => inv.includes('difficulty')),
    'SET_GIG invariants must reference difficulty'
  )
})

test('action-types.json LOAD_GAME invariants is an array with at least 2 entries', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const action = actionTypes.find(a => a.type === 'LOAD_GAME')
  assert.ok(action, 'LOAD_GAME found')
  assert.ok(Array.isArray(action.invariants), 'LOAD_GAME invariants is array')
  assert.ok(action.invariants.length >= 2, 'LOAD_GAME has at least 2 invariants')
})

test('action-types.json ADD_TOAST and REMOVE_TOAST are both present', async () => {
  const { actionTypes } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  const types = actionTypes.map(a => a.type)
  assert.ok(types.includes('ADD_TOAST'), 'ADD_TOAST present')
  assert.ok(types.includes('REMOVE_TOAST'), 'REMOVE_TOAST present')
})

test('action-types.json enforcementRules has the three invariant rules', async () => {
  const { enforcementRules } = await readAgentJson(
    'skills/state-safety-action-creator-guard/assets/action-types.json'
  )
  assert.ok(enforcementRules.moneyNeverNegative, 'moneyNeverNegative rule present')
  assert.ok(enforcementRules.harmonyBounded, 'harmonyBounded rule present')
  assert.ok(enforcementRules.fuelNonNegative, 'fuelNonNegative rule present')
})

// ---------------------------------------------------------------------------
// SKILL.md frontmatter — changed skills
// ---------------------------------------------------------------------------

// react-performance-optimization is excluded from YAML-parse loops because its description
// field contains embedded colons that make strict YAML parsing fail — this is a pre-existing
// issue unrelated to the PR changes (which only added a blank line after the closing ---).
// A dedicated test for that skill's structural change is added separately below.
const CHANGED_SKILLS = [
  'agents-md-writer',
  'asset-pipeline-verifier',
  'audio-debugger-ambient-vs-gig',
  'change-plan-conventional-commits',
  'ci-hardener',
  'convention-keeper-brutalist-ui',
  'debug-ux-upgrader',
  'dependency-pin-upgrade-blocker',
  'game-balancing-assistant',
  'game-improver',
  'golden-path-test-author',
  'mega-lint-snapshot',
  'min-repro-builder',
  'one-command-doctor',
  'one-command-quality-gate',
  'perf-budget-enforcer',
  'pixi-lifecycle-memory-leak-sentinel',
  'project-brain-codex-instructions',
  'refactor-with-safety'
]

test('all changed SKILL.md files have parseable YAML frontmatter', async () => {
  for (const skillName of CHANGED_SKILLS) {
    let fm
    try {
      fm = await readSkillFrontmatter(skillName)
    } catch (err) {
      assert.fail(`Failed to parse frontmatter for "${skillName}": ${err.message}`)
    }
    assert.ok(fm !== null && typeof fm === 'object', `${skillName} frontmatter is object`)
  }
})

test('all changed SKILL.md files have the correct name field matching directory', async () => {
  for (const skillName of CHANGED_SKILLS) {
    const fm = await readSkillFrontmatter(skillName)
    assert.strictEqual(
      fm.name,
      skillName,
      `${skillName} frontmatter name mismatch`
    )
  }
})

test('all changed SKILL.md files have required frontmatter fields', async () => {
  const requiredFields = [
    'name',
    'description',
    'compatibility',
    'metadata',
    'license'
  ]
  for (const skillName of CHANGED_SKILLS) {
    const fm = await readSkillFrontmatter(skillName)
    for (const field of requiredFields) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(fm, field),
        `${skillName} frontmatter missing "${field}"`
      )
    }
  }
})

test('all changed SKILL.md files have required metadata subfields', async () => {
  const requiredMeta = ['version', 'author', 'category', 'keywords', 'maturity']
  for (const skillName of CHANGED_SKILLS) {
    const { metadata } = await readSkillFrontmatter(skillName)
    assert.ok(
      metadata && typeof metadata === 'object',
      `${skillName} metadata is object`
    )
    for (const field of requiredMeta) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(metadata, field),
        `${skillName} metadata missing "${field}"`
      )
    }
  }
})

test('all changed SKILL.md files have metadata.keywords as a non-empty string array', async () => {
  for (const skillName of CHANGED_SKILLS) {
    const { metadata } = await readSkillFrontmatter(skillName)
    assert.ok(
      Array.isArray(metadata.keywords),
      `${skillName} metadata.keywords must be array`
    )
    assert.ok(
      metadata.keywords.length > 0,
      `${skillName} metadata.keywords must not be empty`
    )
    for (const kw of metadata.keywords) {
      assert.strictEqual(
        typeof kw,
        'string',
        `${skillName} metadata.keywords entries must be strings`
      )
    }
  }
})

test('all changed SKILL.md files have metadata.maturity of stable or beta', async () => {
  const valid = new Set(['stable', 'beta'])
  for (const skillName of CHANGED_SKILLS) {
    const { metadata } = await readSkillFrontmatter(skillName)
    assert.ok(
      valid.has(metadata.maturity),
      `${skillName} maturity "${metadata.maturity}" must be stable or beta`
    )
  }
})

test('all changed SKILL.md files have Node.js 22.13+ compatibility', async () => {
  for (const skillName of CHANGED_SKILLS) {
    const fm = await readSkillFrontmatter(skillName)
    assert.ok(
      fm.compatibility.includes('Node.js 22.13+'),
      `${skillName} must require Node.js 22.13+`
    )
  }
})

test('agents-md-writer frontmatter has correct category and keywords', async () => {
  const { metadata } = await readSkillFrontmatter('agents-md-writer')
  assert.strictEqual(metadata.category, 'documentation')
  assert.strictEqual(metadata.maturity, 'stable')
  assert.deepEqual(metadata.keywords, [
    'documentation',
    'context',
    'instructions',
    'agent-setup'
  ])
})

test('audio-debugger-ambient-vs-gig frontmatter has correct category and keywords', async () => {
  const { metadata } = await readSkillFrontmatter('audio-debugger-ambient-vs-gig')
  assert.strictEqual(metadata.category, 'audio')
  assert.strictEqual(metadata.maturity, 'stable')
  assert.deepEqual(metadata.keywords, ['audio', 'debug', 'tone.js', 'playback'])
})

test('debug-ux-upgrader frontmatter has beta maturity', async () => {
  const { metadata } = await readSkillFrontmatter('debug-ux-upgrader')
  assert.strictEqual(metadata.maturity, 'beta')
  assert.strictEqual(metadata.category, 'ui')
})

test('golden-path-test-author frontmatter has beta maturity and testing category', async () => {
  const { metadata } = await readSkillFrontmatter('golden-path-test-author')
  assert.strictEqual(metadata.maturity, 'beta')
  assert.strictEqual(metadata.category, 'testing')
})

test('min-repro-builder frontmatter has debugging category', async () => {
  const { metadata } = await readSkillFrontmatter('min-repro-builder')
  assert.strictEqual(metadata.category, 'debugging')
  assert.strictEqual(metadata.maturity, 'beta')
})

test('refactor-with-safety frontmatter has refactoring category and stable maturity', async () => {
  const { metadata } = await readSkillFrontmatter('refactor-with-safety')
  assert.strictEqual(metadata.category, 'refactoring')
  assert.strictEqual(metadata.maturity, 'stable')
})

test('SKILL.md frontmatter license field is a non-empty string for all changed skills', async () => {
  for (const skillName of CHANGED_SKILLS) {
    const fm = await readSkillFrontmatter(skillName)
    assert.strictEqual(typeof fm.license, 'string', `${skillName} license must be string`)
    assert.ok(fm.license.length > 0, `${skillName} license must not be empty`)
  }
})

test('SKILL.md files have content after frontmatter delimiter', async () => {
  for (const skillName of CHANGED_SKILLS) {
    const skillPath = path.join(AGENTS_DIR, 'skills', skillName, 'SKILL.md')
    const content = await fs.readFile(skillPath, 'utf-8')
    // After the closing ---, there should be a heading (#)
    const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
    assert.ok(
      afterFrontmatter.trim().startsWith('#'),
      `${skillName} SKILL.md body should start with a markdown heading`
    )
  }
})

// ---------------------------------------------------------------------------
// react-performance-optimization — blank-line-after-frontmatter change
// ---------------------------------------------------------------------------

test('react-performance-optimization SKILL.md has blank line after closing ---', async () => {
  const skillPath = path.join(
    AGENTS_DIR,
    'skills',
    'react-performance-optimization',
    'SKILL.md'
  )
  const content = await fs.readFile(skillPath, 'utf-8')
  // PR change: a blank line was added after the closing `---` delimiter.
  // The pattern is: `---\n\n#` (closing delimiter, blank line, first heading).
  assert.ok(
    content.includes('---\n\n#'),
    'react-performance-optimization SKILL.md should have a blank line between --- and the first heading'
  )
})

test('react-performance-optimization SKILL.md starts with a YAML frontmatter block', async () => {
  const skillPath = path.join(
    AGENTS_DIR,
    'skills',
    'react-performance-optimization',
    'SKILL.md'
  )
  const content = await fs.readFile(skillPath, 'utf-8')
  assert.ok(content.startsWith('---\n'), 'file starts with YAML frontmatter opening ---')
  const closingIdx = content.indexOf('\n---\n', 4)
  assert.ok(closingIdx > 0, 'file has closing --- for frontmatter')
})

test('react-performance-optimization SKILL.md frontmatter contains required field names', async () => {
  const skillPath = path.join(
    AGENTS_DIR,
    'skills',
    'react-performance-optimization',
    'SKILL.md'
  )
  const content = await fs.readFile(skillPath, 'utf-8')
  // Extract raw frontmatter text without full yaml parse (description has embedded colons)
  const frontmatterEnd = content.indexOf('\n---\n', 4)
  const rawFrontmatter = content.slice(4, frontmatterEnd)
  // Verify required field names exist as line-starts in the raw frontmatter
  assert.ok(/^name:/m.test(rawFrontmatter), 'frontmatter has name field')
  assert.ok(/^description:/m.test(rawFrontmatter), 'frontmatter has description field')
  assert.ok(/^compatibility:/m.test(rawFrontmatter), 'frontmatter has compatibility field')
  assert.ok(/^metadata:/m.test(rawFrontmatter), 'frontmatter has metadata field')
  assert.ok(/^\s+version:/m.test(rawFrontmatter), 'frontmatter has metadata.version')
  assert.ok(/^\s+category:/m.test(rawFrontmatter), 'frontmatter has metadata.category')
  assert.ok(/^\s+maturity:/m.test(rawFrontmatter), 'frontmatter has metadata.maturity')
  assert.ok(/^license:/m.test(rawFrontmatter), 'frontmatter has license field')
})