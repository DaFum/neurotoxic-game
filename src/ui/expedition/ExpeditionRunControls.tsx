/**
 * Run-level Expedition controls mounted on the Overworld.
 */

import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { ActionButton } from '../shared/ActionButton'
import { NEUTRAL_EXPEDITION_ROUTE_PROFILE } from '../../domain/expedition/defaults'
import { buildExpeditionMap } from '../../domain/expedition/map'
import { ExpeditionServicePanel } from './ExpeditionServicePanel'
import { ExtractionDialog } from './ExtractionDialog'
import { FailureCrisisDialog } from './FailureCrisisDialog'
import { deriveExpeditionDoubleDownOffer } from '../../domain/expedition/contracts'
import { BRAND_DEALS } from '../../data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'

/**
 * Reports whether the run is standing on a legal extraction window.
 *
 * @remarks
 * Derived from the route rebuilt from the canonical run seed, exactly as the
 * reducer does, so the button can never offer an extraction the reducer would
 * refuse.
 */
const useIsAtExtractionWindow = (): boolean =>
  useGameSelector(state => {
    const loadout = state.expedition?.loadout
    if (state.expedition?.status !== 'active' || !loadout) return false
    const map = buildExpeditionMap(
      state.runSeed,
      loadout.tourTypeId,
      loadout.regionId,
      NEUTRAL_EXPEDITION_ROUTE_PROFILE
    )
    const nodeId =
      state.expedition.visitedNodeIds[
        state.expedition.visitedNodeIds.length - 1
      ]
    if (typeof nodeId !== 'string' || !Object.hasOwn(map.meta, nodeId)) {
      return false
    }
    return map.meta[nodeId]?.isExtractionWindow === true
  })

/**
 * Offers voluntary extraction and routes a finalized run to its summary.
 *
 * @remarks
 * Terminal navigation lives here rather than in the reducer: the reducer
 * settles the run, and this component persists that committed state and then
 * moves to the run summary — which is also where the settlement is read before
 * `PREPARE_NEXT_EXPEDITION` clears the ledger it describes.
 */
export const ExpeditionRunControls = memo(function ExpeditionRunControls() {
  const { t } = useTranslation('ui')
  const { changeScene, saveGameAfterStateCommit } = useGameActions()
  const status = useGameSelector(state => state.expedition?.status ?? 'idle')
  const isAtExtractionWindow = useIsAtExtractionWindow()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isFinalized =
    status === 'extracted' || status === 'completed' || status === 'failed'

  useEffect(() => {
    if (!isFinalized) return
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.RUN_SUMMARY)
  }, [changeScene, isFinalized, saveGameAfterStateCommit])

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  if (status !== 'active') return null

  return (
    <div data-testid='expedition-run-controls'>
      {/* Active obligations & double down controls */}
      <ExpeditionObligationsPanel />

      {/* Repairs and inspections belong on the road, where the player still
          has the choice between paying for a fix and pushing on. */}
      <ExpeditionServicePanel />

      {isAtExtractionWindow ? (
        <ActionButton
          onClick={openDialog}
          data-testid='expedition-extract-open'
          className='px-6 py-3'
        >
          {t('ui:expedition.extraction.open')}
        </ActionButton>
      ) : null}

      {/* The crisis dialog lives here rather than in the scene so its
          extraction escape has an owner: it opens the same confirmation the
          extraction button does, instead of rendering a dead button. */}
      <FailureCrisisDialog onExtract={openDialog} />

      <ExtractionDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </div>
  )
})

const ExpeditionObligationsPanel = memo(function ExpeditionObligationsPanel() {
  const { t } = useTranslation('ui')
  const { doubleDownExpeditionObligation } = useGameActions()
  const activeObligations = useGameSelector(
    state => state.expedition?.activeObligations
  )
  const runSeed = useGameSelector(state => state.runSeed)
  const routeStep = useGameSelector(state => state.expedition?.routeStep ?? 0)

  if (!activeObligations || activeObligations.length === 0) return null

  return (
    <div
      className='mb-2 border border-steel-gray bg-charcoal-gray p-2 flex flex-wrap gap-2 items-center text-xs font-mono'
      data-testid='expedition-active-obligations'
    >
      <span className='text-[0.625rem] uppercase tracking-widest text-ash-gray font-mono w-full'>
        {t('ui:expedition.obligations.title', { defaultValue: 'Obligations' })}
      </span>
      {activeObligations.map(item => {
        if (item.status !== 'active') return null
        const offer =
          item.doubleDown === null &&
          runSeed !== undefined &&
          runSeed !== null
            ? deriveExpeditionDoubleDownOffer(runSeed, item.id, routeStep)
            : null
        return (
          <div
            key={item.id}
            className='flex items-center gap-2 border border-steel-gray px-2 py-1 bg-void-black text-star-white'
          >
            <span>
              {(() => {
                if (item.sourceType === 'brandDeal') {
                  const deal = BRAND_DEALS.find(d => d.id === item.sourceId)
                  return deal
                    ? getTranslatedBrandDealDisplay(deal, t)?.name ?? item.sourceId
                    : item.sourceId
                }
                return t(`ui:expedition.contract.${item.sourceId}`, {
                  defaultValue: item.sourceId
                })
              })()}
              : {t(`ui:expedition.obligations.status.${item.status}`, {
                defaultValue: item.status
              })}
              {item.doubleDown
                ? ` [${t('ui:expedition.obligations.doubled', { defaultValue: 'DOUBLED' })}]`
                : ''}
            </span>
            {offer ? (
              <button
                type='button'
                onClick={() =>
                  doubleDownExpeditionObligation(
                    item.id,
                    offer.acceptedOfferId
                  )
                }
                data-testid={`double-down-${item.id}`}
                className='text-[0.625rem] bg-toxic-green text-void-black font-bold px-2 py-0.5 rounded hover:brightness-110'
              >
                {t('ui:expedition.obligations.doubleDown', {
                  defaultValue: 'DOUBLE DOWN'
                })}
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
})
