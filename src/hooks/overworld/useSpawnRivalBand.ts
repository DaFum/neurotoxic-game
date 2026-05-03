import { useEffect } from 'react'
import { createSpawnRivalBandAction } from '../../context/actionCreators'

import { EngineGameState } from '../../context/GameState'
import { MapData } from '../../types/game'
import { Dispatch } from 'react'

export const useSpawnRivalBand = (rivalBand: EngineGameState['rivalBand'], gameMap: MapData | null | undefined, dispatch: Dispatch<unknown> | undefined) => {
  useEffect(() => {
    if (!rivalBand && gameMap && dispatch) {
      dispatch(createSpawnRivalBandAction())
    }
  }, [rivalBand, gameMap, dispatch])
}
