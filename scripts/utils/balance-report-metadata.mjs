import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

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
  'src/context/usePersistence.ts',
  'src/context/reducers/sanitizers/stateSanitizers.ts',
  'src/utils/saveValidator.ts'
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
