import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  BALANCE_SOURCE_FILES,
  getBalanceSourceHash
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
