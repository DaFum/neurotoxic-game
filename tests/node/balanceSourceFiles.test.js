import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { execFileSync } from 'node:child_process'

import {
  ARTIFACT_SCHEMA_VERSION,
  BALANCE_SOURCE_FILES,
  buildArtifactMetadata,
  getBalanceSourceHash,
  getSourceWorkingTreeDirty,
  validateArtifactMetadata
} from '../../scripts/utils/balance-report-metadata.mjs'

const ROOT = process.cwd()

test('every balance source file exists', () => {
  for (const relativePath of BALANCE_SOURCE_FILES) {
    assert.ok(
      fs.existsSync(path.join(ROOT, relativePath)),
      `${relativePath} is listed as a balance source but does not exist`
    )
  }
})

test('balance source list has no duplicates', () => {
  assert.equal(
    new Set(BALANCE_SOURCE_FILES).size,
    BALANCE_SOURCE_FILES.length,
    'A duplicated entry would be hashed twice and mask a real change'
  )
})

// The hash is published as evidence that a report is reproducible from a given
// source state. Any file that can move a balance number while leaving the hash
// untouched silently breaks that claim, so the modules carrying the economy
// scalars, fame rewards, catalogue prices and RNG batching are pinned here.
const REQUIRED_SOURCES = [
  'src/data/brandDeals.ts',
  'src/data/postOptions.ts',
  'src/data/events/index.ts',
  'src/data/events/financial.ts',
  'src/data/events/special.ts',
  'src/data/events/transport.ts',
  'src/data/events/gig.ts',
  'src/utils/crypto.ts',
  'src/utils/economy/constants.ts',
  'src/utils/gameState/constants.ts',
  'src/utils/gameState/regionalGigHistory.ts',
  'src/utils/balanceTuning.ts',
  'src/data/upgradeCatalog.ts',
  'src/data/hqItems/gear.ts',
  'src/data/hqItems/hq.ts',
  'src/data/hqItems/instruments.ts',
  'src/data/hqItems/van.ts',
  'scripts/game-balance-simulation.mjs',
  'scripts/game-balance-experiments.mjs',
  'scripts/game-balance-experiment-config.mjs',
  'scripts/utils/balance-report-metadata.mjs',
  // Simulated tours walk a generated map, so route topology and arrival
  // semantics decide which venues are reached and which arrivals pay at all.
  'src/utils/mapGenerator.ts',
  'src/utils/arrivalUtils.ts',
  'src/data/venues.ts'
]

REQUIRED_SOURCES.forEach(relativePath => {
  test(`balance source hash covers ${relativePath}`, () => {
    assert.ok(
      BALANCE_SOURCE_FILES.includes(relativePath),
      `${relativePath} changes balance output and must be hashed`
    )
  })
})

test('balance source hash is stable', async () => {
  const first = await getBalanceSourceHash(ROOT)
  const second = await getBalanceSourceHash(ROOT)

  assert.match(first, /^[a-f0-9]{64}$/)
  assert.equal(first, second, 'Hashing twice must be stable')
})

test('artifact metadata uses the shared six-field fingerprint contract', async () => {
  const metadata = await buildArtifactMetadata({
    root: ROOT,
    generatorPaths: [
      'scripts/game-balance-simulation.mjs',
      'scripts/utils/balance-report-metadata.mjs'
    ],
    seedNamespace: '#test',
    runsPerScenario: 2_000
  })

  assert.deepEqual(Object.keys(metadata).sort(), [
    'artifactSchemaVersion',
    'generatorFingerprint',
    'runsPerScenario',
    'seedNamespace',
    'sourceFingerprint',
    'workingTreeDirty'
  ])
  assert.match(metadata.sourceFingerprint, /^[a-f0-9]{64}$/)
  assert.match(metadata.generatorFingerprint, /^[a-f0-9]{64}$/)
  assert.equal(metadata.artifactSchemaVersion, ARTIFACT_SCHEMA_VERSION)
  assert.deepEqual(
    await validateArtifactMetadata(metadata, {
      root: ROOT,
      generatorPaths: [
        'scripts/game-balance-simulation.mjs',
        'scripts/utils/balance-report-metadata.mjs'
      ],
      seedNamespace: '#test',
      runsPerScenario: 2_000
    }),
    { valid: true }
  )
})

test('artifact validation detects source and generator mismatches', async () => {
  const metadata = await buildArtifactMetadata({
    root: ROOT,
    generatorPaths: [
      'scripts/game-balance-simulation.mjs',
      'scripts/utils/balance-report-metadata.mjs'
    ],
    seedNamespace: '#test',
    runsPerScenario: 2_000
  })

  assert.deepEqual(
    await validateArtifactMetadata(
      { ...metadata, sourceFingerprint: '0'.repeat(64) },
      {
        root: ROOT,
        generatorPaths: [
          'scripts/game-balance-simulation.mjs',
          'scripts/utils/balance-report-metadata.mjs'
        ],
        seedNamespace: '#test',
        runsPerScenario: 2_000
      }
    ),
    { valid: false, reason: 'source_fingerprint_mismatch' }
  )

  assert.deepEqual(
    await validateArtifactMetadata(
      { ...metadata, generatorFingerprint: '0'.repeat(64) },
      {
        root: ROOT,
        generatorPaths: [
          'scripts/game-balance-simulation.mjs',
          'scripts/utils/balance-report-metadata.mjs'
        ],
        seedNamespace: '#test',
        runsPerScenario: 2_000
      }
    ),
    { valid: false, reason: 'generator_fingerprint_mismatch' }
  )
})

test('generator fingerprint covers transitive generator dependencies', async t => {
  const sandbox = fs.mkdtempSync(
    path.join(os.tmpdir(), 'balance-generator-hash-')
  )
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }))

  for (const relativePath of BALANCE_SOURCE_FILES) {
    const destination = path.join(sandbox, relativePath)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(path.join(ROOT, relativePath), destination)
  }

  const generatorPaths = [
    'scripts/game-balance-experiments.mjs',
    'scripts/game-balance-experiment-config.mjs',
    'scripts/game-balance-simulation.mjs',
    'scripts/utils/paired-statistics.mjs',
    'scripts/utils/balance-report-metadata.mjs'
  ]
  const metadata = await buildArtifactMetadata({
    root: sandbox,
    generatorPaths,
    seedNamespace: '#test',
    runsPerScenario: 2_000
  })

  fs.appendFileSync(
    path.join(sandbox, 'scripts/utils/paired-statistics.mjs'),
    '\n// generator hash probe\n'
  )
  const metadataWithCurrentSources = {
    ...metadata,
    sourceFingerprint: await getBalanceSourceHash(sandbox)
  }

  assert.deepEqual(
    await validateArtifactMetadata(metadataWithCurrentSources, {
      root: sandbox,
      generatorPaths,
      seedNamespace: '#test',
      runsPerScenario: 2_000
    }),
    { valid: false, reason: 'generator_fingerprint_mismatch' }
  )
})

// The probe runs against a throwaway copy of the listed sources. Mutating the
// tracked file in place and restoring it in a hook leaves the working tree
// modified whenever the process dies mid-test.
test('balance source hash depends on the listed contents', async t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'balance-source-hash-'))
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }))

  for (const relativePath of BALANCE_SOURCE_FILES) {
    const destination = path.join(sandbox, relativePath)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(path.join(ROOT, relativePath), destination)
  }

  const before = await getBalanceSourceHash(sandbox)

  const probeTarget = path.join(sandbox, 'src/utils/economy/constants.ts')
  fs.appendFileSync(probeTarget, '\n// hash probe\n')
  const after = await getBalanceSourceHash(sandbox)

  assert.notEqual(
    before,
    after,
    'Editing an economy constant must change the published hash'
  )
  assert.equal(
    fs
      .readFileSync(path.join(ROOT, 'src/utils/economy/constants.ts'), 'utf8')
      .includes('hash probe'),
    false,
    'The probe must never touch the tracked source'
  )
})

// Generated reports are outputs, not inputs. Counting them made `workingTreeDirty`
// depend on the order the artifacts happened to be generated in: regenerate all four
// in one pass and every report after the first claims a dirty tree, which reads as
// unreproducible when the source state was in fact pinned.
test('the working-tree flag ignores pending report artifacts', t => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'balance-dirty-flag-'))
  t.after(() => fs.rmSync(sandbox, { recursive: true, force: true }))

  const git = args =>
    execFileSync('git', args, { cwd: sandbox, encoding: 'utf8', stdio: 'pipe' })
  git(['init', '--quiet'])
  git(['config', 'user.email', 'probe@example.com'])
  git(['config', 'user.name', 'Probe'])
  fs.mkdirSync(path.join(sandbox, 'reports'), { recursive: true })
  fs.writeFileSync(path.join(sandbox, 'reports/report.json'), '{"a":1}\n')
  fs.writeFileSync(path.join(sandbox, 'source.ts'), 'export const a = 1\n')
  git(['add', '-A'])
  git(['commit', '--quiet', '-m', 'baseline'])

  assert.equal(getSourceWorkingTreeDirty(sandbox), false, 'clean tree')

  fs.writeFileSync(path.join(sandbox, 'reports/report.json'), '{"a":2}\n')
  assert.equal(
    getSourceWorkingTreeDirty(sandbox),
    false,
    'A regenerated report is an output and must not mark the source dirty'
  )

  fs.writeFileSync(path.join(sandbox, 'source.ts'), 'export const a = 2\n')
  assert.equal(
    getSourceWorkingTreeDirty(sandbox),
    true,
    'An uncommitted source edit must mark the tree dirty'
  )
})
