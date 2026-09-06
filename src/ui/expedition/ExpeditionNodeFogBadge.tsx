/**
 * Always-visible route facts for one Expedition node.
 */

import { memo } from 'react'
import i18n from '../../i18n'
import { formatCurrency } from '../../utils/numberUtils'
import type { TranslationCallback } from '../../types/callbacks'
import type { ExpeditionNodeFog, ExpeditionTier } from '../../types/expedition'

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
          {formatCurrency(fog.exactPayout, i18n.language)}
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
      {fog.rareRewardId ? (
        <div
          className='text-toxic-green-bright'
          data-testid='expedition-node-fog-rare'
        >
          {t('ui:expedition.node.rare', {
            name: t(`ui:expedition.reward.${fog.rareRewardId}`, {
              defaultValue: t('ui:expedition.reward.unknown')
            })
          })}
        </div>
      ) : null}
      {fog.revealedIdentity ? (
        <div
          className='text-void-purple'
          data-testid='expedition-node-fog-identity'
        >
          {t(`ui:expedition.node.identity.${fog.revealedIdentity}`, {
            defaultValue: t('ui:expedition.node.identity.unknown')
          })}
        </div>
      ) : null}
    </div>
  )
})
