import { useEffect } from 'react'
import { checkSoftlock } from '../../utils/mapUtils'
import { logger } from '../../utils/logger'
import i18n from '../../i18n'
import { GAME_PHASES } from '../../context/gameConstants'
import type {
  TravelRefsBundle,
  TravelStateBundle,
  TravelLogicParams
} from './types'

export const useTravelEffects = ({
  refs,
  state,
  params
}: {
  refs: TravelRefsBundle
  state: TravelStateBundle
  params: TravelLogicParams
}) => {
  useEffect(() => {
    const { gameMap, player, band, addToast, saveGame, changeScene } = params

    if (!gameMap || state.isTraveling || !player.currentNodeId) {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      return
    }

    if (checkSoftlock(gameMap, player, band)) {
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
  }, [params, state.isTraveling])

  useEffect(() => {
    return () => {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      if (refs.failsafeTimeoutRef.current) {
        clearTimeout(refs.failsafeTimeoutRef.current)
        refs.failsafeTimeoutRef.current = null
      }
      if (refs.pendingTimeoutRef.current) {
        clearTimeout(refs.pendingTimeoutRef.current)
        refs.pendingTimeoutRef.current = null
      }
    }
  }, [])
}
