import { useEffect } from 'react'
import { checkSoftlock } from '../../../utils/mapUtils'
import {
  getActiveAssetModifiers,
  getTotalDailyObligations
} from '../../../utils/assetSelectors'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { GAME_PHASES } from '../../../context/gameConstants'
import type {
  TravelRefsBundle,
  TravelStateBundle,
  TravelLogicParams
} from '../types'
import { getSellableAssets, getPostSaleScenarios } from '../travelSoftlockUtils'

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
      } as GameState),
      assetModifiers: getActiveAssetModifiers(assets ?? []),
      postSaleScenarios
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
    refs.timeoutRef
  ])
}
