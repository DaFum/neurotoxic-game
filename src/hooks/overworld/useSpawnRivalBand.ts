import { useEffect } from 'react'

import type { GameMap, RivalBandState } from '../../types'

/**
 * Spawns the rival band once the overworld map exists and no rival is active.
 *
 * @param rivalBand - Current rival state.
 * @param gameMap - Generated overworld map.
 * @param spawnRivalBand - Action callback that creates the rival.
 */
export const useSpawnRivalBand = (
  rivalBand: RivalBandState | null | undefined,
  gameMap: GameMap | null | undefined,
  spawnRivalBand: (() => void) | undefined
) => {
  useEffect(() => {
    if (!rivalBand && gameMap && spawnRivalBand) {
      spawnRivalBand()
    }
  }, [rivalBand, gameMap, spawnRivalBand])
}
