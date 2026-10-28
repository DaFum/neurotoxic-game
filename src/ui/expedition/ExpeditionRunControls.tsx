/**
 * Run-level Expedition controls mounted on the Overworld.
 */

import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { ActionButton } from '../shared/ActionButton'
import { getActiveExpeditionMap } from '../../domain/expedition/map'
import { ExpeditionServicePanel } from './ExpeditionServicePanel'
import { ExpeditionIntelPanel } from './ExpeditionIntelPanel'
import { ExpeditionDecisionHost } from './ExpeditionDecisionHost'
import { AuthorityEncounterDialog } from './AuthorityEncounterDialog'
import {
  deriveExpeditionDoubleDownOffer,
  isExpeditionDoubleDownAcceptable
} from '../../domain/expedition/contracts'
import { isAtExpeditionExtractionWindow } from '../../domain/expedition/extraction'
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
    const map = getActiveExpeditionMap(state)
    if (!map) return false
    // The same predicate `handleExtractExpedition` applies: a Safe Harbor
    // window the reducer would accept but the control never offers is an
    // opportunity the player cannot take.
    return isAtExpeditionExtractionWindow(state, map)
  })

/**
 * Offers voluntary extraction on the Overworld.
 *
 * @remarks
 * The crisis dialog, the extraction confirmation and the run-summary
 * navigation belong to `ExpeditionDecisionHost`, which is mounted even when no
 * run is active so a finalized run still reaches its summary.
 */
export const ExpeditionRunControls = memo(function ExpeditionRunControls() {
  const { t } = useTranslation('ui')
  const status = useGameSelector(state => state.expedition?.status ?? 'idle')
  const isAtExtractionWindow = useIsAtExtractionWindow()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  const decisionHost = (
    <ExpeditionDecisionHost
      isExtractionOpen={isDialogOpen}
      onOpenExtraction={openDialog}
      onCloseExtraction={closeDialog}
    />
  )

  if (status !== 'active') return decisionHost

  return (
    <div data-testid='expedition-run-controls'>
      {/* A pending Run Draft is the run's live decision, so it sits above the
          standing obligations rather than in a scene of its own. */}
      <ExpeditionRunDraftPicker />

      {/* Active obligations & double down controls */}
      <ExpeditionObligationsPanel />

      {/* Route intel is spent before choosing the next leg, so it sits with
          the other on-the-road decisions. */}
      <ExpeditionIntelPanel />

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

      {/* Cornered by the Authority with a way out: the decision the crisis
          would otherwise be. Hidden while a crisis is pending. */}
      <AuthorityEncounterDialog suppressed={isDialogOpen} />

      {decisionHost}
    </div>
  )
})

const ExpeditionRunDraftPicker = memo(function ExpeditionRunDraftPicker() {
  const { t } = useTranslation('ui')
  const { selectExpeditionDraft } = useGameActions()
  const offer = useGameSelector(
    state => state.expedition?.pendingRunDraftOffer ?? null
  )

  if (!offer) return null

  return (
    <div
      className='mb-2 border border-toxic-green bg-charcoal-gray p-2 flex flex-wrap gap-2 items-center text-xs font-mono'
      data-testid='expedition-run-draft-offer'
    >
      <span className='text-[0.625rem] uppercase tracking-widest text-toxic-green font-mono w-full'>
        {t('ui:expedition.runDraft.title')}
      </span>
      <span className='text-[0.625rem] text-ash-gray w-full'>
        {t('ui:expedition.runDraft.hint')}
      </span>
      {offer.candidateTraitIds.map(traitId => (
        <button
          key={traitId}
          type='button'
          // Only the stored id is dispatched: the reducer generated these
          // candidates, so the UI must not be able to name a different trait.
          onClick={() => selectExpeditionDraft(traitId)}
          data-testid={`expedition-run-draft-${traitId}`}
          className='min-h-11 px-3 py-2 text-xs font-mono uppercase border border-steel-gray text-ash-gray hover:border-toxic-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
        >
          {t(`ui:expedition.runDraft.trait.${traitId}`, {
            defaultValue: t('ui:expedition.runDraft.traitUnknown', {
              defaultValue: 'Unknown trait'
            })
          })}
        </button>
      ))}
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
  const resolvedSignalIds = useGameSelector(
    state => state.expedition?.resolvedObligationSignalIds
  )
  const heat = useGameSelector(state => state.expedition?.pressure?.heat ?? 0)
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
        const derivedOffer =
          item.doubleDown === null && runSeed !== undefined && runSeed !== null
            ? deriveExpeditionDoubleDownOffer(runSeed, item.id, routeStep)
            : null
        // The reducer refuses a restriction already broken at this step, so the
        // control does not offer it.
        const offer =
          derivedOffer &&
          isExpeditionDoubleDownAcceptable(
            derivedOffer,
            resolvedSignalIds ?? [],
            routeStep,
            heat
          )
            ? derivedOffer
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
                  const unknownContract = t('ui:expedition.contract.unknown', {
                    defaultValue: 'Unknown Contract'
                  })
                  return deal
                    ? (getTranslatedBrandDealDisplay(deal, t)?.name ??
                        unknownContract)
                    : unknownContract
                }
                return t(`ui:expedition.contract.${item.sourceId}`, {
                  defaultValue: t('ui:expedition.contract.unknown', {
                    defaultValue: 'Unknown Contract'
                  })
                })
              })()}
              :{' '}
              {t(`ui:expedition.obligations.status.${item.status}`, {
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
                  doubleDownExpeditionObligation(item.id, offer.acceptedOfferId)
                }
                data-testid={`double-down-${item.id}`}
                className='text-[0.625rem] bg-toxic-green text-void-black font-bold px-2 py-0.5 rounded hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-1 focus-visible:ring-offset-void-black'
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
