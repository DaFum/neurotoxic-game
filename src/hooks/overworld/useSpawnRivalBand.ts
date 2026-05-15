import { useEffect } from 'react'

import type { GameMap, RivalBandState } from '../../types'

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
