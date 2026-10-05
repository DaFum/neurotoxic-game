/**
 * Band HQ's touring meta hub: Tour Tokens, HQ facilities and unlock sets.
 *
 * @remarks
 * Every price, ceiling and requirement shown here is read from the same
 * registries the Career reducer derives from, so a control is only enabled when
 * the reducer would accept it - and the reducer re-validates the dispatch
 * regardless. Nothing here decides legality on its own.
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
  careerHasExpeditionRank,
  deriveExpeditionCareerRank
} from '../../domain/expedition/meta'
import { finiteNumberOr } from '../../utils/finiteNumber'
import type { CareerState, ExpeditionUnlockSetId } from '../../types/career'

/** The stored level of one facility, read the way the reducer reads it. */
const readFacilityLevel = (career: CareerState, facilityId: string): number =>
  Math.max(
    0,
    Math.floor(
      finiteNumberOr(
        Object.hasOwn(career.hqFacilityLevels, facilityId)
          ? career.hqFacilityLevels[facilityId]
          : 0,
        0
      )
    )
  )

/** Why an unlock set cannot be bought right now, or `null` when it can. */
const getUnlockSetBlocker = (
  career: CareerState,
  tokens: number,
  setId: ExpeditionUnlockSetId
): 'owned' | 'pending' | 'rank' | 'facility' | 'tokens' | null => {
  const set = EXPEDITION_UNLOCK_SETS[setId]
  if (career.unlockedSetIds.includes(setId)) return 'owned'
  if (career.pendingUnlockPurchase !== null) return 'pending'
  if (!careerHasExpeditionRank(career, set.requiredRank)) return 'rank'
  if (
    readFacilityLevel(career, set.requiredFacility.id) <
    set.requiredFacility.level
  ) {
    return 'facility'
  }
  if (tokens < set.cost) return 'tokens'
  return null
}

/**
 * Renders the Career's touring economy and its two purchase surfaces.
 */
export const ExpeditionMetaTab = memo(function ExpeditionMetaTab() {
  const { t } = useTranslation('ui')
  const career = useGameSelector(state => state.career)
  const {
    purchaseExpeditionHqFacility,
    purchaseExpeditionUnlockSet,
    saveGameAfterStateCommit,
    addToast
  } = useGameActions()

  const tokens = Math.max(0, finiteNumberOr(career.tourTokens, 0))
  const rank = deriveExpeditionCareerRank(career)

  const buildFacility = useCallback(
    (facilityId: string, currentLevel: number) => {
      purchaseExpeditionHqFacility(facilityId, currentLevel)
      // A facility changes nothing about the scene, so no transition autosave
      // will carry it; the purchase persists itself like every other Career
      // command answered outside a scene change.
      saveGameAfterStateCommit()
    },
    [purchaseExpeditionHqFacility, saveGameAfterStateCommit]
  )

  const buySet = useCallback(
    (setId: ExpeditionUnlockSetId) => {
      // The command persists its own journal; `false` means the reducer
      // refused it and nothing was taken.
      if (purchaseExpeditionUnlockSet(setId)) {
        addToast(
          t('ui:expedition.meta.setPurchased', {
            name: t(`ui:expedition.meta.set.${setId}`)
          }),
          'success'
        )
      } else {
        addToast(t('ui:expedition.meta.setPurchaseFailed'), 'error')
      }
    },
    [addToast, purchaseExpeditionUnlockSet, t]
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
            const level = readFacilityLevel(career, facilityId)
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
                    variant='secondary'
                    className='px-3 py-1 text-xs border border-toxic-green text-toxic-green'
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
            const blocker = getUnlockSetBlocker(career, tokens, setId)
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
                  <ActionButton
                    variant='secondary'
                    className='px-3 py-1 text-xs border border-toxic-green text-toxic-green'
                    disabled={blocker !== null}
                    data-testid={`expedition-meta-unlock-${setId}`}
                    onClick={() => buySet(setId)}
                  >
                    {t('ui:expedition.meta.unlock', { cost: set.cost })}
                  </ActionButton>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
})
