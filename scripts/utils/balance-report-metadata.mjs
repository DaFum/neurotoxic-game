import crypto from 'node:crypto'
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
  // Catalogue prices drive the fame audit and the shop-affordability target.
  'src/data/upgradeCatalog.ts',
  'src/data/hqItems/gear.ts',
  'src/data/hqItems/hq.ts',
  'src/data/hqItems/instruments.ts',
  'src/data/hqItems/van.ts'
])

export const getBalanceSourceHash = async root => {
  const hash = crypto.createHash('sha256')
  for (const relativePath of BALANCE_SOURCE_FILES) {
    hash.update(`${relativePath}\0`)
    hash.update(await fs.readFile(path.join(root, relativePath)))
    hash.update('\0')
  }
  return hash.digest('hex')
}
