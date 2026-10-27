import { useEffect, useLayoutEffect, useRef } from 'react'
import { checkSoftlock } from '../../../utils/mapUtils'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../../utils/assets/assetSelectors'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { GAME_PHASES } from '../../../context/gameConstants'
import type {
  TravelRefsBundle,
  TravelStateBundle,
  TravelLogicParams
} from '../types'
import {
  getSellableAssets,
  getPostSaleScenarios
} from '../../../utils/travelSoftlockUtils'
import { getNodeAccessStatus } from '../../../utils/travelUtils'
import { VENUES_BY_ID } from '../../../data/venues'

/**
 * Monitors the travel state to detect and handle softlock scenarios when the player becomes stranded.
 *
 * @remarks
 * Continuously evaluates sellable assets, post-sale scenarios, and accessible neighbor nodes
 * based on the active booking gate rules. If no valid exit path exists, it triggers a game
 * over state.
 *
 * @param params - The dependencies, references, and state required to evaluate softlocks.
 */
export const useSoftlockEffect = ({
  refs,
  state,
  params
}: {
  refs: TravelRefsBundle
  state: TravelStateBundle
  params: TravelLogicParams
}) => {
  const {
    gameMap,
    player,
    band,
    social,
    assets,
    liabilities,
    addToast,
    saveGame,
    changeScene
  } = params
  // One toast per softlock episode. The early-return branch clears the timer
  // without ending the episode, so the timer alone cannot tell a resumed
  // episode from a fresh one.
  const toastedRef = useRef(false)
  // The countdown outlives effect re-runs, so its callback reads the latest
  // callbacks instead of the ones captured when it started.
  const latestCallbacksRef = useRef({ saveGame, changeScene })
  useLayoutEffect(() => {
    latestCallbacksRef.current = { saveGame, changeScene }
  }, [saveGame, changeScene])

  // The countdown is anchored to the episode start, so the main effect has no
  // cleanup; it clears the timer only on recovery or its early return. This
  // cleanup covers unmount.
  useEffect(
    () => () => {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
    },
    [refs.timeoutRef]
  )

  useEffect(() => {
    // An active run owns its own stranding: it raises a `fuel_stranded` crisis
    // with the escapes this check cannot see (insurance claim, tow), the same
    // way the daily bankruptcy check defers to it.
    if (
      !gameMap ||
      state.isTraveling ||
      !player.currentNodeId ||
      params.expeditionStatus === 'active'
    ) {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      return
    }

    const sellableAssets = getSellableAssets(assets, liabilities, player.day)
    const postSaleScenarios = getPostSaleScenarios(
      sellableAssets,
      assets,
      liabilities,
      player,
      band,
      social
    )

    const softlockContext = {
      dailyObligations: getTotalDailyObligations({
        player,
        band,
        social,
        assets,
        liabilities
      }),
      assetModifiers: getActiveAssetModifiers(assets ?? []),
      // The litres the travel gate and settlement burn, not the base figure.
      fuelMultiplier: params.expeditionFuelMultiplier,
      postSaleScenarios,
      // Reuse the real booking gate rather than re-deriving it here, so a
      // neighbor the player would be refused at cannot count as an escape.
      isNodeAccessible: (node: unknown) =>
        getNodeAccessStatus({
          node: node as Parameters<typeof getNodeAccessStatus>[0]['node'],
          player,
          reputationByRegion: params.reputationByRegion,
          venueBlacklist: params.venueBlacklist,
          venuesMap: VENUES_BY_ID,
          getLocationName: name => name ?? ''
        }).allowed
    }

    if (checkSoftlock(gameMap, player, band, softlockContext)) {
      if (!refs.timeoutRef.current) {
        logger.error('TravelLogic', 'GAME OVER: Stranded')
        if (!toastedRef.current) {
          toastedRef.current = true
          addToast(
            i18n.t('ui:travel.errors.gameOverStranded', {
              defaultValue:
                'GAME OVER: Stranded! Cannot travel and cannot afford fuel.'
            }),
            'error'
          )
        }
        refs.timeoutRef.current = setTimeout(() => {
          latestCallbacksRef.current.saveGame(false)
          latestCallbacksRef.current.changeScene(GAME_PHASES.GAMEOVER)
        }, 3000)
      }
    } else {
      toastedRef.current = false
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
    }
  }, [
    gameMap,
    player,
    band,
    social,
    assets,
    liabilities,
    addToast,
    state.isTraveling,
    refs.timeoutRef,
    params.venueBlacklist,
    params.reputationByRegion,
    params.expeditionFuelMultiplier,
    params.expeditionStatus
  ])
}
