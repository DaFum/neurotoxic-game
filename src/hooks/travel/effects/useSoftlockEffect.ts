import { useEffect } from 'react'
import { checkSoftlock } from '../../../utils/mapUtils'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../../utils/assetSelectors'
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

  useEffect(() => {
    if (!gameMap || state.isTraveling || !player.currentNodeId) {
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
        addToast(
          i18n.t('ui:travel.errors.gameOverStranded', {
            defaultValue:
              'GAME OVER: Stranded! Cannot travel and cannot afford fuel.'
          }),
          'error'
        )
        refs.timeoutRef.current = setTimeout(() => {
          saveGame(false)
          changeScene(GAME_PHASES.GAMEOVER)
        }, 3000)
      }
    } else {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
    }

    return () => {
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
    saveGame,
    changeScene,
    state.isTraveling,
    refs.timeoutRef,
    params.venueBlacklist,
    params.reputationByRegion
  ])
}
