import { useCallback, useEffect, useMemo } from 'react'
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
    claimExpeditionLegendaryReward,
    unlockExpeditionAscension,
    generateExpeditionBetweenTourDecisions,
    resolveExpeditionBetweenTourDecision,
    changeScene,
    saveGameAfterStateCommit
  } = useGameActions()
  const outcome = useGameSelector(state => state.expedition.outcome)
  const betweenTour = useGameSelector(state =>
    outcome && Object.hasOwn(state.career.betweenTourByRunId, outcome.runId)
      ? state.career.betweenTourByRunId[outcome.runId]
      : undefined
  )

  // Settle, then ask. The decisions read the Career both settlements advanced,
  // so generating before them would ask about an injury the settlement was
  // about to record - and generating is refused until both have run, which is
  // why this effect can safely re-run until it takes.
  useEffect(() => {
    if (!outcome) return
    claimExpeditionLegendaryReward(outcome.runId)
    settleExpeditionCrewCareer(outcome.runId)
    settleExpeditionCareerResult(outcome.runId)
    unlockExpeditionAscension(outcome.runId)
    generateExpeditionBetweenTourDecisions(outcome.runId)
  }, [
    claimExpeditionLegendaryReward,
    generateExpeditionBetweenTourDecisions,
    outcome,
    settleExpeditionCareerResult,
    settleExpeditionCrewCareer,
    unlockExpeditionAscension
  ])

  const openDecisions = useMemo(
    () =>
      (betweenTour?.decisions ?? []).filter(
        decision =>
          !Object.hasOwn(
            betweenTour?.resolvedOptionByDecisionId ?? {},
            decision.id
          )
      ),
    [betweenTour]
  )

  const handleContinue = useCallback(() => {
    // Everything the run owes has already been settled by the effect above,
    // and `PREPARE_NEXT_EXPEDITION` refuses while a Between-Tour decision is
    // still open, so this only ever runs on a Tour that is genuinely finished.
    prepareNextExpedition()
    // Autosave covers only the gig transitions, so acknowledging a finalized
    // run has to persist itself: otherwise quitting from the menu restores the
    // terminal Expedition and routes the player back through this summary.
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.MENU)
  }, [changeScene, prepareNextExpedition, saveGameAfterStateCommit])

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

        {openDecisions.length > 0 ? (
          <div
            className='flex flex-col gap-3 border-t border-steel-gray pt-3'
            data-testid='expedition-between-tour'
          >
            <h3 className='text-xs uppercase tracking-widest text-toxic-green'>
              {t('ui:expedition.betweenTour.title')}
            </h3>
            {openDecisions.map(decision => (
              <div key={decision.id} className='flex flex-col gap-2'>
                <p className='text-xs font-mono text-ash-gray'>
                  {t(`ui:expedition.betweenTour.${decision.type}`, {
                    target: decision.target.id
                  })}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {decision.optionIds.map(optionId => (
                    <button
                      key={optionId}
                      type='button'
                      data-testid={`expedition-between-tour-${decision.type}-${optionId}`}
                      onClick={() =>
                        resolveExpeditionBetweenTourDecision(
                          outcome.runId,
                          decision.id,
                          optionId
                        )
                      }
                      className='min-h-11 px-3 py-2 text-xs font-mono uppercase border border-steel-gray text-ash-gray hover:border-toxic-green transition-colors'
                    >
                      {t(`ui:expedition.betweenTour.option.${optionId}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ActionButton
            onClick={handleContinue}
            data-testid='expedition-run-summary-continue'
          >
            {t('ui:expedition.summary.continue')}
          </ActionButton>
        )}
      </div>
    </div>
  )
}
