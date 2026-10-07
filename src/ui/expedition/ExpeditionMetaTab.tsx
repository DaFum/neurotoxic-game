/**
 * Band HQ's touring meta hub: Tour Tokens, HQ facilities and unlock sets.
 *
 * @remarks
 * Every price, ceiling and requirement shown here is read from the same
 * registries the Career reducer derives from, so a control is only enabled when
 * the reducer would accept it - and the reducer re-validates the dispatch
 * regardless. Both purchase commands ask the reducer before dispatching, toast
 * a refusal's reason, and persist only a purchase that was accepted.
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { ActionButton } from '../shared/ActionButton'
import {
  HQ_FACILITY_IDS,
  getExpeditionHqFacilityLevelCost,
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL
} from '../../data/expedition/hqFacilities'
import {
  EXPEDITION_UNLOCK_SET_IDS,
  EXPEDITION_UNLOCK_SETS
} from '../../data/expedition/unlockSets'
import {
  deriveExpeditionCareerRank,
  getExpeditionHqFacilityLevel,
  getExpeditionUnlockSetPurchaseBlocker
} from '../../domain/expedition/meta'
import { finiteNumberOr } from '../../utils/finiteNumber'
import type { ExpeditionUnlockSetId } from '../../types/career'

/**
 * Renders the Career's touring economy and its two purchase surfaces.
 */
export const ExpeditionMetaTab = memo(function ExpeditionMetaTab() {
  const { t } = useTranslation('ui')
  const career = useGameSelector(state => state.career)
  const { purchaseExpeditionHqFacility, purchaseExpeditionUnlockSet } =
    useGameActions()

  const tokens = Math.max(0, finiteNumberOr(career.tourTokens, 0))
  const rank = deriveExpeditionCareerRank(career)

  const buildFacility = useCallback(
    (facilityId: string, currentLevel: number) => {
      // The command toasts its own refusal and saves only an accepted build.
      purchaseExpeditionHqFacility(facilityId, currentLevel)
    },
    [purchaseExpeditionHqFacility]
  )

  const buySet = useCallback(
    (setId: ExpeditionUnlockSetId) => {
      // The command persists its own journal and toasts the outcome once the
      // marker write settles - success, refusal or rollback alike.
      purchaseExpeditionUnlockSet(setId)
    },
    [purchaseExpeditionUnlockSet]
  )

  return (
    <div
      className='flex flex-col gap-6 font-mono'
      data-testid='expedition-meta-tab'
    >
      <div className='flex flex-wrap gap-4 border-2 border-toxic-green bg-void-black p-3 text-sm uppercase'>
        <span className='text-toxic-green' data-testid='expedition-meta-tokens'>
          {t('ui:expedition.meta.tokens', { count: tokens })}
        </span>
        <span className='text-star-white' data-testid='expedition-meta-rank'>
          {t('ui:expedition.meta.rankLabel', {
            rank: t(`ui:expedition.meta.rank.${rank}`)
          })}
        </span>
      </div>

      <section className='flex flex-col gap-2'>
        <h3 className='text-xs uppercase tracking-widest text-toxic-green'>
          {t('ui:expedition.meta.facilitiesTitle')}
        </h3>
        <ul className='flex flex-col gap-2'>
          {HQ_FACILITY_IDS.map(facilityId => {
            const level = getExpeditionHqFacilityLevel(career, facilityId)
            const maxLevel = HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[facilityId]
            const cost = getExpeditionHqFacilityLevelCost(facilityId, level + 1)
            const canBuild = cost !== null && tokens >= cost
            return (
              <li
                key={facilityId}
                className='flex flex-wrap items-center justify-between gap-2 border border-steel-gray bg-charcoal-gray px-3 py-2 text-xs'
                data-testid={`expedition-meta-facility-${facilityId}`}
              >
                <span className='text-star-white uppercase'>
                  {t(`ui:expedition.meta.facility.${facilityId}`)}
                </span>
                <span className='text-ash-gray'>
                  {t('ui:expedition.meta.facilityLevel', {
                    level,
                    max: maxLevel
                  })}
                </span>
                {cost === null ? (
                  <span className='text-ash-gray uppercase'>
                    {t('ui:expedition.meta.facilityMaxed')}
                  </span>
                ) : (
                  <ActionButton
                    variant='custom'
                    className='px-3 py-1 text-xs border border-toxic-green text-toxic-green focus-visible:ring-4 focus-visible:ring-toxic-green-20'
                    disabled={!canBuild}
                    data-testid={`expedition-meta-build-${facilityId}`}
                    onClick={() => buildFacility(facilityId, level)}
                  >
                    {t('ui:expedition.meta.build', { cost })}
                  </ActionButton>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className='flex flex-col gap-2'>
        <h3 className='text-xs uppercase tracking-widest text-toxic-green'>
          {t('ui:expedition.meta.setsTitle')}
        </h3>
        <ul className='flex flex-col gap-2'>
          {EXPEDITION_UNLOCK_SET_IDS.map(setId => {
            const set = EXPEDITION_UNLOCK_SETS[setId]
            const blocker = getExpeditionUnlockSetPurchaseBlocker(career, setId)
            return (
              <li
                key={setId}
                className='flex flex-wrap items-center justify-between gap-2 border border-steel-gray bg-charcoal-gray px-3 py-2 text-xs'
                data-testid={`expedition-meta-set-${setId}`}
              >
                <span className='text-star-white uppercase'>
                  {t(`ui:expedition.meta.set.${setId}`)}
                </span>
                <span className='text-ash-gray'>
                  {t('ui:expedition.meta.setRequires', {
                    rank: t(`ui:expedition.meta.rank.${set.requiredRank}`),
                    facility: t(
                      `ui:expedition.meta.facility.${set.requiredFacility.id}`
                    ),
                    level: set.requiredFacility.level
                  })}
                </span>
                {blocker === 'owned' ? (
                  <span className='text-toxic-green uppercase'>
                    {t('ui:expedition.meta.setOwned')}
                  </span>
                ) : (
                  <span className='flex flex-wrap items-center gap-2'>
                    {blocker !== null ? (
                      <span
                        className='text-warning-yellow uppercase'
                        data-testid={`expedition-meta-unlock-blocker-${setId}`}
                      >
                        {t(`ui:expedition.meta.blocked.${blocker}`)}
                      </span>
                    ) : null}
                    <ActionButton
                      variant='custom'
                      className='px-3 py-1 text-xs border border-toxic-green text-toxic-green focus-visible:ring-4 focus-visible:ring-toxic-green-20'
                      disabled={blocker !== null}
                      data-testid={`expedition-meta-unlock-${setId}`}
                      onClick={() => buySet(setId)}
                    >
                      {t('ui:expedition.meta.unlock', { cost: set.cost })}
                    </ActionButton>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
})
