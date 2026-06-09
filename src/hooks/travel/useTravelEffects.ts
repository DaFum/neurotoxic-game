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

/**
 * Runs the travel hook's side effects: stranded-player detection and timer
 * cleanup.
 *
 * @remarks
 * While not traveling, watches for a softlock (player cannot reach any node and
 * cannot afford fuel). On detection it shows a game-over toast and schedules a
 * 3s timeout that saves and switches to the game-over scene; the timeout is
 * cleared if the softlock resolves or travel begins. A second effect clears all
 * outstanding travel timers on unmount.
 *
 * The softlock effect depends on the individual state slices it reads (not the
 * whole `params` object) so it does not re-run — and reset the game-over
 * countdown — on every unrelated render.
 */
export const useTravelEffects = ({
  refs,
  state,
  params
}: {
  refs: TravelRefsBundle
  state: TravelStateBundle
  params: TravelLogicParams
}) => {
  // Destructure params into granular values so the softlock effect depends on
  // the specific state slices it reads instead of the whole `params` object
  // (which changes reference every render). Depending on `params` would re-run
  // this effect — and its cleanup — on every render, repeatedly clearing and
  // rescheduling the game-over timeout so it would never fire.
  const { gameMap, player, band, addToast, saveGame, changeScene } = params

  useEffect(() => {
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
  }, [
    gameMap,
    player,
    band,
    addToast,
    saveGame,
    changeScene,
    state.isTraveling,
    refs.timeoutRef
  ])

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
  }, [refs.timeoutRef, refs.failsafeTimeoutRef, refs.pendingTimeoutRef])
}
