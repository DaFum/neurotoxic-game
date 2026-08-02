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
import { logger } from '../utils/logger'
import { MapGenerator } from '../utils/mapGenerator'
import { validateGeneratedMap } from '../utils/mapValidation'
import { loadFallbackMap } from '../utils/fallbackMap'
import { getDevSeedOverride } from '../utils/devSeedOverride'
import { GAME_PHASES } from './gameConstants'
import {
  createAddToastAction,
  createChangeSceneAction,
  createSetMapAction
} from './actionCreators'
import type { GameAction, GameMap } from '../types'

const MAP_GENERATION_MAX_RETRIES = 2
const MAP_GENERATION_RETRY_DELAY_MS = 250

type MapRetryAction = 'increment' | 'reset'

const mapRetryReducer = (count: number, action: MapRetryAction) => {
  if (action === 'reset') return 0
  return count + 1
}

type UseMapGenerationParams = {
  gameMap: GameMap | null
  runSeed: number
  dispatch: Dispatch<GameAction>
  tRef: MutableRefObject<TFunction>
}

/**
 * Generates the overworld map when missing and retries transient generation failures.
 *
 * @param params - Current map, persisted run seed, reducer dispatch, and translator ref for fallback toasts.
 * @returns Callback for resetting map-generation retry state.
 */
export function useMapGeneration({
  gameMap,
  runSeed,
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
      // The run seed is stable for the whole run, so a plain retry reproduces
      // the same map and therefore the same failure. Each attempt offsets the
      // seed instead, so a seed-specific generation bug can be escaped while
      // the first attempt of a run stays reproducible from the save.
      const baseSeed = getDevSeedOverride() ?? runSeed
      const attemptSeed = baseSeed + mapGenerationAttemptsRef.current
      const generator = new MapGenerator(attemptSeed)
      let failure: { originalError: string; signature?: string } | null = null
      try {
        const newMap = generator.generateMap()
        const validation = validateGeneratedMap(newMap)
        if (validation.success) {
          mapGenerationAttemptsRef.current = 0
          dispatch(createSetMapAction(newMap))
        } else {
          failure = {
            originalError: validation.issues
              .map(issue => `${issue.path || 'map'}: ${issue.message}`)
              .join('; '),
            signature: validation.signature
          }
        }
      } catch (error) {
        failure = {
          originalError: error instanceof Error ? error.message : String(error)
        }
      }

      if (failure) {
        mapGenerationAttemptsRef.current += 1
        handleError(
          new StateError('Failed to generate a valid map', {
            ...failure,
            seed: attemptSeed,
            attempt: mapGenerationAttemptsRef.current
          }),
          { source: 'GameState.generateMap' }
        )

        if (mapGenerationAttemptsRef.current <= MAP_GENERATION_MAX_RETRIES) {
          // Tier 1: retry with the next sub-seed offset.
          scheduleMapRetry()
        } else {
          // Tier 2: the committed template map, so a transient generation bug
          // costs the player a less varied map rather than the whole run.
          const fallbackMap = loadFallbackMap()
          mapGenerationAttemptsRef.current = 0

          if (fallbackMap) {
            logger.warn(
              'MapGeneration',
              'Generation exhausted retries — loading the fallback template map',
              { seed: baseSeed, signature: failure.signature }
            )
            dispatch(createSetMapAction(fallbackMap))
            dispatch(
              createAddToastAction({
                id: getSafeUUID(),
                message: tRef.current('ui:error.mapGenerationUsedFallback', {
                  defaultValue:
                    'Map generation failed. Loaded a backup tour map.'
                }),
                type: 'warning'
              })
            )
            return clearMapRetryTimeout
          }

          // Tier 3: the template itself failed validation — nothing left but
          // the menu.
          handleError(
            new StateError('Fallback map failed validation', {
              seed: baseSeed
            }),
            { source: 'GameState.generateMap' }
          )
          dispatch(createSetMapAction(null))
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
    runSeed,
    scheduleMapRetry,
    tRef
  ])

  return { resetMapGenerationRetries }
}
