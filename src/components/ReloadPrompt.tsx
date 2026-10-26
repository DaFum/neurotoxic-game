import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { logger } from '../utils/logger'
import { useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import type { GamePhase } from '../types/game'
import './ReloadPrompt.css'

/** Scenes holding live progress that a reload would drop. */
const SCENES_WITH_LIVE_RUN: ReadonlySet<GamePhase> = new Set([
  GAME_PHASES.GIG,
  GAME_PHASES.PRACTICE,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME
])

/**
 * Displays the service-worker update prompt and triggers a reload on confirmation.
 *
 * @returns The rendered service-worker toast prompt, or null if neither offline readiness nor a refresh is pending.
 */
export default function ReloadPrompt() {
  const { t } = useTranslation()
  const reloadBlocked = useGameSelector(state =>
    SCENES_WITH_LIVE_RUN.has(state.currentScene)
  )
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      logger.warn('ReloadPrompt', 'SW registration error', error)
    }
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className='ReloadPrompt-container'>
      <div
        role='status'
        className='ReloadPrompt-toast bg-void-black border-2 border-toxic-green text-toxic-green p-4 font-mono shadow-[4px_4px_0px_var(--color-toxic-green)]'
      >
        <div className='ReloadPrompt-message mb-2'>
          {offlineReady ? (
            <span>{t('ui:offline.offlineReady')}</span>
          ) : (
            <span>{t('ui:offline.needRefresh')}</span>
          )}
        </div>
        <div className='flex gap-4'>
          {needRefresh && !reloadBlocked && (
            <button
              type='button'
              className='ReloadPrompt-toast-button min-h-11 border-2 border-toxic-green px-4 py-2 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
              onClick={() => updateServiceWorker(true)}
            >
              {t('ui:offline.reload')}
            </button>
          )}
          <button
            type='button'
            className='ReloadPrompt-toast-button min-h-11 border-2 border-toxic-green px-4 py-2 hover:bg-toxic-green hover:text-void-black transition-colors focus-visible:ring-toxic-green focus-visible:ring-offset-void-black'
            onClick={close}
          >
            {t('ui:offline.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
