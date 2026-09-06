import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { ActionButton } from '../ui/shared/ActionButton'
import { formatCurrency } from '../utils/numberUtils'

/**
 * Reports a finalized run's settlement and returns the player to the hub.
 *
 * @remarks
 * The reducer settles the run; this scene only reads the finalized outcome and
 * owns the navigation away from it. `PREPARE_NEXT_EXPEDITION` is dispatched
 * from here rather than by the terminal reducer, so the settlement is always
 * read before the ledger it describes is cleared.
 */
export const RunSummary = () => {
  const { t, i18n } = useTranslation(['ui'])
  const {
    prepareNextExpedition,
    settleExpeditionCrewCareer,
    settleExpeditionCareerResult,
    changeScene,
    saveGameAfterStateCommit
  } = useGameActions()
  const outcome = useGameSelector(state => state.expedition.outcome)

  const handleContinue = useCallback(() => {
    // Settled before the ledger it is derived from is cleared, and never after:
    // `PREPARE_NEXT_EXPEDITION` drops the finalized outcome, and the settlement
    // guard proves the award against exactly that outcome, so the reverse order
    // would silently pay nothing for every run the Career ever finishes. The
    // reducer is still the authority - it names no amount, only the run - and
    // refuses a run it has already settled, so acknowledging twice pays once.
    if (outcome) {
      // Crew first, then Career: the two settlements own different slices and
      // carry their own replay guards (`settledCrewRunIds` versus
      // `settledExpeditionRunIds`), so neither can pay for the other's run and
      // a second acknowledgement is an identity no-op for both.
      settleExpeditionCrewCareer(outcome.runId)
      settleExpeditionCareerResult(outcome.runId)
    }
    prepareNextExpedition()
    // Autosave covers only the gig transitions, so acknowledging a finalized
    // run has to persist itself: otherwise quitting from the menu restores the
    // terminal Expedition and routes the player back through this summary.
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.MENU)
  }, [
    changeScene,
    outcome,
    prepareNextExpedition,
    saveGameAfterStateCommit,
    settleExpeditionCareerResult,
    settleExpeditionCrewCareer
  ])

  if (!outcome) {
    return (
      <div className='w-full h-full bg-void-black flex flex-col items-center justify-center gap-4 p-6'>
        <p className='text-sm text-ash-gray font-mono uppercase'>
          {t('ui:expedition.summary.none')}
        </p>
        <ActionButton onClick={() => changeScene(GAME_PHASES.MENU)}>
          {t('ui:expedition.summary.continue')}
        </ActionButton>
      </div>
    )
  }

  const { settlement } = outcome

  return (
    <div className='w-full h-full bg-void-black relative overflow-y-auto flex flex-col items-center p-3 sm:p-6 lg:p-8'>
      <div
        className='z-10 w-full max-w-2xl bg-void-black border-2 border-toxic-green p-4 sm:p-6 flex flex-col gap-4'
        data-testid='expedition-run-summary'
      >
        <h2 className='text-2xl font-bold uppercase tracking-widest text-toxic-green'>
          {t(`ui:expedition.summary.title.${outcome.kind}`)}
        </h2>
        {outcome.reason ? (
          <p className='text-sm text-blood-red font-mono uppercase'>
            {t(`ui:expedition.crisis.title.${outcome.reason}`)}
          </p>
        ) : null}

        <dl className='grid grid-cols-2 gap-2 text-xs font-mono'>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.summary.retention')}
          </dt>
          <dd className='text-star-white'>
            {Math.round(settlement.retentionRate * 100)}%
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.cashRetained')}
          </dt>
          <dd className='text-toxic-green'>
            {formatCurrency(settlement.moneyRetained, i18n.language)}
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.extraction.cashForfeited')}
          </dt>
          <dd className='text-blood-red'>
            {formatCurrency(settlement.moneyForfeited, i18n.language)}
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.summary.rewardsKept')}
          </dt>
          <dd className='text-star-white'>
            {settlement.retainedRewardEntryIds.length}
          </dd>
          <dt className='text-ash-gray uppercase'>
            {t('ui:expedition.summary.rewardsLost')}
          </dt>
          <dd className='text-star-white'>
            {settlement.abandonedRewardEntryIds.length}
          </dd>
        </dl>

        <ActionButton
          onClick={handleContinue}
          data-testid='expedition-run-summary-continue'
        >
          {t('ui:expedition.summary.continue')}
        </ActionButton>
      </div>
    </div>
  )
}
