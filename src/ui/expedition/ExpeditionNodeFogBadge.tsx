/**
 * Always-visible route facts for one Expedition node.
 */

import { memo } from 'react'
import type { TranslationCallback } from '../../types/callbacks'
import type {
  ExpeditionNodeClass,
  ExpeditionSpecialNodeSubtype,
  ExpeditionTier,
  NodeIntelLevel
} from '../../types/expedition'

/**
 * The projection a node's current intel level entitles the player to see.
 */
export interface ExpeditionNodeFog {
  nodeClass: ExpeditionNodeClass
  specialSubtype: ExpeditionSpecialNodeSubtype | null
  dangerTier: ExpeditionTier
  rewardTier: ExpeditionTier
  isExtractionWindow: boolean
  intelLevel: NodeIntelLevel
  /** Exact payout, only present once intel reaches level 1. */
  exactPayout: number | null
  /** Exact wear cost, only present once intel reaches level 1. */
  exactWearCost: number | null
  /** Event/rival identity, only present at level 2. */
  revealedIdentity: string | null
}

const TIER_COLORS: Record<ExpeditionTier, string> = {
  low: 'text-ash-gray',
  moderate: 'text-warning-yellow',
  high: 'text-blood-red'
}

/**
 * Renders the route facts a node's intel level actually entitles.
 *
 * @param props - The fog projection and the translation callback.
 *
 * @remarks
 * The always-visible half — class, danger tier, reward tier — is unconditional,
 * because the design requires enough information to plan a route. Everything
 * numeric is gated: at intel `0` the player sees bands, not amounts. That
 * gating is what makes a Scout or a Social grant worth a build slot.
 */
export const ExpeditionNodeFogBadge = memo(function ExpeditionNodeFogBadge({
  fog,
  t
}: {
  fog: ExpeditionNodeFog
  t: TranslationCallback
}) {
  const classLabel = fog.specialSubtype
    ? t(`ui:expedition.node.subtype.${fog.specialSubtype}`)
    : t(`ui:expedition.node.class.${fog.nodeClass}`)

  return (
    <div
      className='mt-1 pt-1 border-t border-toxic-green/30 text-xs font-mono flex flex-col gap-0.5'
      data-testid='expedition-node-fog'
    >
      <div className='text-toxic-green font-bold uppercase tracking-wider'>
        {classLabel}
      </div>
      <div>
        <span className='text-star-white'>
          {t('ui:expedition.node.danger')}
        </span>{' '}
        <span className={TIER_COLORS[fog.dangerTier]}>
          {t(`ui:expedition.tier.${fog.dangerTier}`)}
        </span>
      </div>
      <div>
        <span className='text-star-white'>
          {t('ui:expedition.node.reward')}
        </span>{' '}
        <span className={TIER_COLORS[fog.rewardTier]}>
          {t(`ui:expedition.tier.${fog.rewardTier}`)}
        </span>
      </div>
      {fog.isExtractionWindow ? (
        <div className='text-toxic-green'>
          {t('ui:expedition.node.extractionWindow')}
        </div>
      ) : null}
      {fog.exactPayout === null ? (
        <div className='text-ash-gray' data-testid='expedition-node-fog-hidden'>
          {t('ui:expedition.node.unknownDetail')}
        </div>
      ) : (
        <div data-testid='expedition-node-fog-exact'>
          <span className='text-star-white'>
            {t('ui:expedition.node.payout')}
          </span>{' '}
          {fog.exactPayout}
          {'€'}
          {fog.exactWearCost === null ? null : (
            <>
              {' | '}
              <span className='text-star-white'>
                {t('ui:expedition.node.wear')}
              </span>{' '}
              {fog.exactWearCost}
            </>
          )}
        </div>
      )}
      {fog.revealedIdentity ? (
        <div
          className='text-void-purple'
          data-testid='expedition-node-fog-identity'
        >
          {fog.revealedIdentity}
        </div>
      ) : null}
    </div>
  )
})
