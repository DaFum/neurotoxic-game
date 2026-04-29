import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useEffect,
  useReducer,
  useRef
} from 'react'
import type { TFunction } from 'i18next'
import { getSafeUUID } from '../utils/crypto'
import { handleError, StateError } from '../utils/errorHandler'
import { MapGenerator } from '../utils/mapGenerator'
import { GAME_PHASES } from './gameConstants'
import {
  createAddToastAction,
  createChangeSceneAction,
  createSetMapAction
} from './actionCreators'
import type { GameAction, GameMap } from '../types/game'

const MAP_GENERATION_MAX_RETRIES = 2
const MAP_GENERATION_RETRY_DELAY_MS = 250

type MapRetryAction = 'increment' | 'reset'

const mapRetryReducer = (count: number, action: MapRetryAction) => {
  if (action === 'reset') return 0
  return count + 1
}

type UseMapGenerationParams = {
  gameMap: GameMap | null
  dispatch: Dispatch<GameAction>
  tRef: MutableRefObject<TFunction>
}

export function useMapGeneration({
  gameMap,
  dispatch,
  tRef
}: UseMapGenerationParams) {
  const mapGenerationAttemptsRef = useRef(0)
  const mapRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mapRetryCount, updateMapRetryCount] = useReducer(mapRetryReducer, 0)

  const clearMapRetryTimeout = useCallback(() => {
    if (mapRetryTimeoutRef.current) {
      clearTimeout(mapRetryTimeoutRef.current)
      mapRetryTimeoutRef.current = null
    }
  }, [])

  const resetMapGenerationRetries = useCallback(() => {
    clearMapRetryTimeout()
    mapGenerationAttemptsRef.current = 0
    updateMapRetryCount('reset')
  }, [clearMapRetryTimeout])

  const scheduleMapRetry = useCallback(() => {
    clearMapRetryTimeout()
    mapRetryTimeoutRef.current = setTimeout(() => {
      mapRetryTimeoutRef.current = null
      updateMapRetryCount('increment')
    }, MAP_GENERATION_RETRY_DELAY_MS)
  }, [clearMapRetryTimeout])

  useEffect(() => {
    if (!gameMap) {
      const generator = new MapGenerator(Date.now())
      try {
        const newMap = generator.generateMap()
        mapGenerationAttemptsRef.current = 0
        dispatch(createSetMapAction(newMap))
      } catch (error) {
        mapGenerationAttemptsRef.current += 1
        handleError(
          new StateError('Failed to generate map', {
            originalError:
              error instanceof Error ? error.message : String(error),
            attempt: mapGenerationAttemptsRef.current
          }),
          { source: 'GameState.generateMap' }
        )

        if (mapGenerationAttemptsRef.current <= MAP_GENERATION_MAX_RETRIES) {
          scheduleMapRetry()
        } else {
          dispatch(createSetMapAction(null))
          mapGenerationAttemptsRef.current = 0
          dispatch(
            createAddToastAction({
              id: getSafeUUID(),
              message: tRef.current(
                'ui:error.mapGenerationFailedReturnToMenu',
                {
                  defaultValue:
                    'Map generation failed. Returning to menu for recovery.'
                }
              ),
              type: 'error'
            })
          )
          dispatch(createChangeSceneAction(GAME_PHASES.MENU))
        }
      }
    }

    return clearMapRetryTimeout
  }, [
    clearMapRetryTimeout,
    dispatch,
    gameMap,
    mapRetryCount,
    scheduleMapRetry,
    tRef
  ])

  return { resetMapGenerationRetries }
}
