import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { ActionButton } from '../ui/shared/ActionButton'
import { TourPrepLoadout } from '../ui/expedition/TourPrepLoadout'

/**
 * Hosts the pre-tour build: claims a run identity, then commits the build.
 *
 * @remarks
 * `PREPARE_EXPEDITION_RUN` is dispatched once on entry and is a no-op from any
 * status other than `idle`, so reopening this scene while a run is prepared is
 * edit-only and never rerolls the previewed route. Navigation stays here in the
 * scene: the reducer settles state, and this component moves to the Overworld
 * once the run is actually active.
 */
export const TourPrep = () => {
  const { t } = useTranslation(['ui'])
  const { prepareExpeditionRun, changeScene, saveGameAfterStateCommit } =
    useGameActions()
  const status = useGameSelector(state => state.expedition.status)

  useEffect(() => {
    if (status === 'idle') prepareExpeditionRun()
  }, [prepareExpeditionRun, status])

  useEffect(() => {
    if (status !== 'active') return
    // The run is committed: persist it before leaving, because this scene
    // unmounts before it could observe the committed state itself.
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.OVERWORLD)
  }, [changeScene, saveGameAfterStateCommit, status])

  const handleAbort = useCallback(() => {
    changeScene(GAME_PHASES.MENU)
  }, [changeScene])

  return (
    <div className='w-full h-full bg-void-black relative overflow-y-auto flex flex-col items-center p-3 sm:p-6 lg:p-8'>
      <div className='z-10 w-full max-w-4xl bg-void-black border-2 border-toxic-green p-4 sm:p-6 flex flex-col gap-4'>
        <header className='flex flex-wrap items-baseline justify-between gap-2 border-b border-toxic-green/30 pb-4'>
          <h2 className='text-2xl font-bold uppercase tracking-widest text-toxic-green'>
            {t('ui:expedition.prep.title')}
          </h2>
          <p className='text-xs text-ash-gray font-mono uppercase'>
            {t('ui:expedition.prep.subtitle')}
          </p>
        </header>

        <TourPrepLoadout />

        <ActionButton
          onClick={handleAbort}
          variant='secondary'
          className='px-8 py-4 border-2 border-steel-gray text-ash-gray self-start'
        >
          {t('ui:expedition.prep.abort')}
        </ActionButton>
      </div>
    </div>
  )
}
