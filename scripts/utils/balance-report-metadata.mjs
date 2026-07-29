import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Every source whose contents can move a balance number in the generated
 * reports. The hash exists to prove a report is reproducible from a given
 * source state, so a file that changes results while leaving the hash untouched
 * defeats its purpose — the payout multiplier, the fame rewards, the catalogue
 * prices and the RNG batching all belong here, not just the harness.
 *
 * `tests/node/balanceSourceFiles.test.js` guards the list against drift.
 */
export const BALANCE_SOURCE_FILES = Object.freeze([
  'scripts/game-balance-simulation.mjs',
  'scripts/game-balance-experiments.mjs',
  'scripts/game-balance-experiment-config.mjs',
  'scripts/utils/paired-statistics.mjs',
  'src/utils/balanceTuning.ts',
  'src/utils/dailyTickLogic.ts',
  'src/utils/postGig/derivations.ts',
  'src/utils/postGig/socialResolution.ts',
  'src/types/social.d.ts',
  'src/hooks/postGig/usePostGigDerivations.ts',
  'src/context/initialState.ts',
  'src/context/reducers/sanitizers/stateSanitizers.ts',
  'src/utils/saveValidator.ts',
  'src/context/usePersistence.ts',
  // Determinism: secureRandom's batching decides whether same-seed runs
  // reproduce at all.
  'src/utils/crypto.ts',
  // Economy scalars: GLOBAL_PAYOUT_NERF, MAX_GIG_NET, ticket sales, management
  // cut, logistics.
  'src/utils/economy/constants.ts',
  // Fame rewards: GIG_BASE_REWARD / GIG_SCORE_MULTIPLIER and the shared clamps.
  'src/utils/gameState/constants.ts',
  // Regional gig history bounds feed the repeat-demand adjustment.
  'src/utils/gameState/regionalGigHistory.ts',
  // Route topology: which venues a tour can reach, in what order, and which node
  // types it meets. Since simulated tours walk a generated map, a change here
  // moves every economy and progression number in the reports.
  'src/utils/mapGenerator.ts',
  'src/utils/mapGenerator/layout.ts',
  'src/utils/mapGenerator/mathUtils.ts',
  'src/utils/mapGenerator/cityTraits.ts',
  'src/utils/mapGenerator/types.ts',
  // Arrival semantics: which node types start a gig and what a rest stop
  // recovers. The simulation mirrors both.
  'src/utils/arrivalUtils.ts',
  'src/data/venues.ts',
  // Catalogue prices drive the fame audit and the shop-affordability target.
  'src/data/upgradeCatalog.ts',
  'src/data/hqItems/gear.ts',
  'src/data/hqItems/hq.ts',
  'src/data/hqItems/instruments.ts',
  'src/data/hqItems/van.ts'
])

export const ARTIFACT_SCHEMA_VERSION = 1

/**
 * Whether the SOURCE that produced a report was dirty.
 *
 * Generated reports are outputs, not inputs: a sibling artifact still waiting to be
 * committed cannot change a number. Counting them made the flag depend on the order
 * the reports happened to be generated in — regenerate all four in one pass and
 * every artifact after the first claims a dirty tree, which reads as unreproducible
 * when the source state was in fact pinned. Scoping the check to non-report paths
 * makes the claim mean what it says.
 */
export const getSourceWorkingTreeDirty = root => {
  try {
    const status = execSync('git status --porcelain', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
    return status
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      // Porcelain lines are `XY <path>`, and renames carry `old -> new`; the trailing
      // path is the one that matters for "is this a report".
      .some(line => {
        const target = line.slice(2).trim().split(' -> ').pop() ?? ''
        return !target.replace(/^"|"$/g, '').startsWith('reports/')
      })
  } catch {
    return null
  }
}

export const getBalanceSourceHash = async root => {
  const hash = crypto.createHash('sha256')
  for (const relativePath of BALANCE_SOURCE_FILES) {
    hash.update(`${relativePath}\0`)
    hash.update(await fs.readFile(path.join(root, relativePath)))
    hash.update('\0')
  }
  return hash.digest('hex')
}

const getFileHash = async filePath => {
  const hash = crypto.createHash('sha256')
  hash.update(await fs.readFile(filePath))
  return hash.digest('hex')
}

export const buildArtifactMetadata = async ({
  root,
  generatorPath,
  seedNamespace,
  runsPerScenario
}) => ({
  sourceFingerprint: await getBalanceSourceHash(root),
  generatorFingerprint: await getFileHash(path.join(root, generatorPath)),
  seedNamespace,
  runsPerScenario,
  workingTreeDirty: getSourceWorkingTreeDirty(root) === true,
  artifactSchemaVersion: ARTIFACT_SCHEMA_VERSION
})

export const validateArtifactMetadata = async (
  metadata,
  { root, generatorPath, seedNamespace, runsPerScenario }
) => {
  if (
    !metadata ||
    !/^[a-f0-9]{64}$/.test(metadata.sourceFingerprint) ||
    !/^[a-f0-9]{64}$/.test(metadata.generatorFingerprint) ||
    typeof metadata.seedNamespace !== 'string' ||
    !Number.isInteger(metadata.runsPerScenario) ||
    typeof metadata.workingTreeDirty !== 'boolean' ||
    metadata.artifactSchemaVersion !== ARTIFACT_SCHEMA_VERSION
  ) {
    return { valid: false, reason: 'invalid_artifact_metadata' }
  }
  if (metadata.seedNamespace !== seedNamespace) {
    return { valid: false, reason: 'seed_namespace_mismatch' }
  }
  if (metadata.runsPerScenario !== runsPerScenario) {
    return { valid: false, reason: 'runs_per_scenario_mismatch' }
  }
  if (metadata.sourceFingerprint !== (await getBalanceSourceHash(root))) {
    return { valid: false, reason: 'source_fingerprint_mismatch' }
  }
  if (
    metadata.generatorFingerprint !==
    (await getFileHash(path.join(root, generatorPath)))
  ) {
    return { valid: false, reason: 'generator_fingerprint_mismatch' }
  }
  return { valid: true }
}
