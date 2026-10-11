/**
 * Band HQ's touring meta hub: Tour Tokens, HQ facilities, unlock sets, Crew
 * relationships and the Tour Archive.
 *
 * @remarks
 * Every price, ceiling and requirement shown here is read from the same
 * registries the Career reducer derives from, so a control is only enabled when
 * the reducer would accept it - and the reducer re-validates the dispatch
 * regardless. Both purchase commands ask the reducer before dispatching, toast
 * a refusal's reason, and persist only a purchase that was accepted.
 *
 * The Crew relationship and Tour Archive sections are read-only: they show
 * what the Career has recorded and offer no control.
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
  getExpeditionTourTokenBalance,
  getExpeditionUnlockSetPurchaseBlocker
} from '../../domain/expedition/meta'
import { EXPEDITION_ARCHIVE_CATEGORIES } from '../../data/expedition/archive'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getExpeditionRegion } from '../../data/expedition/regions'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import { EXPEDITION_RELATIONSHIP_PAIRS } from '../../domain/expedition/crewEventOutcomes'
import { getExpeditionRelationshipTier } from '../../domain/expedition/relationships'
import { getTranslatedBrandDealDisplay } from '../../utils/brandDealI18n'
import type { GameState } from '../../types'
import type {
  CareerState,
  ExpeditionArchiveCategory,
  ExpeditionUnlockSetId
} from '../../types/career'
import type {
  ExpeditionRelationshipActorRef,
  ExpeditionRelationshipTier
} from '../../types/expedition'

type Translate = (key: string, options?: Record<string, unknown>) => string

/** Label key suffix for each relationship tier. */
const RELATIONSHIP_TIER_LABELS: Readonly<
  Record<ExpeditionRelationshipTier, string>
> = {
  [-2]: 'hostile',
  [-1]: 'tense',
  0: 'neutral',
  1: 'friendly',
  2: 'close'
}

/** Tailwind token class per tier sign, so a soured pair reads at a glance. */
const relationshipToneClass = (tier: ExpeditionRelationshipTier): string =>
  tier < 0 ? 'text-blood-red' : tier > 0 ? 'text-toxic-green' : 'text-ash-gray'

/**
 * Display name of one relationship actor.
 *
 * @remarks
 * Crew names come from the Crew registry, Band names from the live roster; an
 * actor neither knows falls back to an explicit unknown label, never its id.
 */
const actorName = (
  t: Translate,
  actor: ExpeditionRelationshipActorRef,
  members: GameState['band']['members']
): string => {
  if (actor.kind === 'crew') {
    const crew = Object.hasOwn(EXPEDITION_CREW_BY_ID, actor.id)
      ? EXPEDITION_CREW_BY_ID[actor.id]
      : undefined
    if (crew) return t(crew.displayNameKey)
  } else {
    const member = members.find(candidate => candidate.id === actor.id)
    if (typeof member?.name === 'string') return member.name
  }
  return t('ui:expedition.relationship.unknownActor')
}

/**
 * Localized label of one Archive entry.
 *
 * @param t - Translator.
 * @param category - Archive category the entry belongs to.
 * @param id - Canonical entry id.
 * @param career - Career state, for the generated Rival names.
 * @returns A display label; an id no registry can name reads as unknown.
 */
const archiveEntryLabel = (
  t: Translate,
  category: ExpeditionArchiveCategory,
  id: string,
  career: CareerState
): string => {
  const unknown = t('ui:expedition.archive.unknownEntry')
  switch (category) {
    case 'crew': {
      const crew = Object.hasOwn(EXPEDITION_CREW_BY_ID, id)
        ? EXPEDITION_CREW_BY_ID[id]
        : undefined
      return crew ? t(crew.displayNameKey) : unknown
    }
    case 'module':
      return t(`assets:module.${id}.name`, { defaultValue: unknown })
    case 'chassis': {
      const [kind, flavor, tier] = id.split(':')
      if (!kind || !flavor || !tier) return unknown
      return t('ui:expedition.archive.chassisEntry', {
        kind: t(`assets:kind.${kind}`, { defaultValue: unknown }),
        flavor: t(`assets:flavor.${flavor}`, { defaultValue: unknown }),
        tier
      })
    }
    case 'rival': {
      const rival = Object.hasOwn(career.rivalsById, id)
        ? career.rivalsById[id]
        : undefined
      const name = rival?.snapshot?.name
      return typeof name === 'string' && name.length > 0 ? name : unknown
    }
    case 'sponsor':
      return getTranslatedBrandDealDisplay({ id }, t)?.name ?? unknown
    case 'region': {
      const region = getExpeditionRegion(id)
      return region ? t(region.labelKey) : unknown
    }
    case 'finale':
      return t(`ui:expedition.archive.finale.${id}`, { defaultValue: unknown })
    case 'special_event':
      return t(`events:${id}.title`, { defaultValue: unknown })
    case 'contraband': {
      const item = CONTRABAND_BY_ID.get(id)
      return item ? t(item.name) : unknown
    }
    default:
      return unknown
  }
}

/**
 * Renders the Career's touring economy and its two purchase surfaces.
 */
export const ExpeditionMetaTab = memo(function ExpeditionMetaTab() {
  const { t } = useTranslation('ui')
  const career = useGameSelector(state => state.career)
  const members = useGameSelector(state => state.band.members)
  const { purchaseExpeditionHqFacility, purchaseExpeditionUnlockSet } =
    useGameActions()

  const tokens = getExpeditionTourTokenBalance(career)
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

      <section
        className='flex flex-col gap-2'
        data-testid='expedition-meta-relationships'
      >
        <h3 className='text-xs uppercase tracking-widest text-toxic-green'>
          {t('ui:expedition.relationship.title')}
        </h3>
        <ul className='flex flex-col gap-2'>
          {EXPEDITION_RELATIONSHIP_PAIRS.map(([first, second]) => {
            const tier = getExpeditionRelationshipTier(
              career.expeditionRelationshipByPair,
              first,
              second
            )
            const pairId = `${first.kind}-${first.id}-${second.kind}-${second.id}`
            return (
              <li
                key={pairId}
                className='flex flex-wrap items-center justify-between gap-2 border border-steel-gray bg-charcoal-gray px-3 py-2 text-xs'
                data-testid={`expedition-meta-relationship-${pairId}`}
              >
                <span className='text-star-white uppercase'>
                  {t('ui:expedition.relationship.pair', {
                    first: actorName(t, first, members),
                    second: actorName(t, second, members)
                  })}
                </span>
                <span className={`uppercase ${relationshipToneClass(tier)}`}>
                  {t(
                    `ui:expedition.relationship.tier.${RELATIONSHIP_TIER_LABELS[tier]}`
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section
        className='flex flex-col gap-2'
        data-testid='expedition-meta-archive'
      >
        <h3 className='text-xs uppercase tracking-widest text-toxic-green'>
          {t('ui:expedition.archive.title')}
        </h3>
        <ul className='flex flex-col gap-2'>
          {EXPEDITION_ARCHIVE_CATEGORIES.map(category => {
            const entries = Object.hasOwn(career.archiveByCategory, category)
              ? career.archiveByCategory[category]
              : []
            return (
              <li
                key={category}
                className='flex flex-col gap-1 border border-steel-gray bg-charcoal-gray px-3 py-2 text-xs'
                data-testid={`expedition-meta-archive-${category}`}
              >
                <span className='text-star-white uppercase'>
                  {t('ui:expedition.archive.categoryCount', {
                    category: t(`ui:expedition.archive.category.${category}`),
                    count: entries.length
                  })}
                </span>
                {entries.length === 0 ? (
                  <span className='text-ash-gray'>
                    {t('ui:expedition.archive.empty')}
                  </span>
                ) : (
                  <span className='text-ash-gray'>
                    {entries
                      .map(id => archiveEntryLabel(t, category, id, career))
                      .join(' · ')}
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
