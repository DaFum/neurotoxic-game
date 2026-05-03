import { useEffect } from 'react'

import { EngineGameState } from '../../context/GameState'
import { MapData } from '../../types/game'

export const useSpawnRivalBand = (rivalBand: EngineGameState['rivalBand'], gameMap: MapData | null | undefined, spawnRivalBand: (() => void) | undefined) => {
  useEffect(() => {
    if (!rivalBand && gameMap && spawnRivalBand) {
      spawnRivalBand()
    }
  }, [rivalBand, gameMap, spawnRivalBand])
}
