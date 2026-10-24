import type { GameState } from '../../../types'
import type { SocialPostOption } from '../../../types/social'
import i18n from '../../../i18n'
import { logger } from '../../../utils/logger'
import { formatCurrency } from '../../../utils/numberUtils'
import { calculatePostGigStateUpdates } from '../../../utils/postGig'
import { createHarmonyChangedQuestEvent } from '../../../quests/producers/gigQuestEvents'
import {
  createSocialPostQuestEvents,
  createSocialTrendMatchedQuestEvent
} from '../../../quests/producers/socialQuestEvents'
import { isPostMatchingTrend } from '../../../utils/socialEngine'
import { clampBandHarmony, finiteNumberOr } from '../../../utils/gameState'
import type { HandlerDispatchers } from './types'

type SocialPostDispatchers = Pick<
  HandlerDispatchers,
  | 'commitSocialPost'
  | 'unlockTrait'
  | 'applyQuestEvent'
  | 'addToast'
  | 'setPostResult'
  | 'requestBrandOffers'
  | 'saveGameAfterStateCommit'
>

/**
 * Applies an already-computed social-post resolution: commits the composite result
 * atomically via `commitSocialPost`. If accepted, displays toasts, unlocks traits,
 * emits quest events, and requests brand offers.
 *
 * Pure orchestration over injected dispatchers (no React state); the heavy math
 * is owned by `calculatePostGigStateUpdates`.
 */
export function applySocialPostResult(params: {
  option: SocialPostOption
  updates: ReturnType<typeof calculatePostGigStateUpdates>
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  t: import('i18next').TFunction
  dispatchers: SocialPostDispatchers
  pendingSettlementId?: string | null
}): boolean {
  const { option, updates, band, social, t, dispatchers, pendingSettlementId } =
    params
  const {
    commitSocialPost,
    unlockTrait,
    applyQuestEvent,
    addToast,
    setPostResult,
    requestBrandOffers,
    saveGameAfterStateCommit
  } = dispatchers

  const {
    finalResult,
    newBand,
    hasBandUpdates,
    appliedHarmonyDelta,
    appliedMoneyDelta,
    updatedSocial
  } = updates

  const pendingSocialOptionId = option.id ?? 'unknown'
  const socialPatch = {
    ...updatedSocial,
    pendingSocialOptionId
  }

  const commitPayload = {
    ...(hasBandUpdates ? { band: newBand } : {}),
    ...(appliedMoneyDelta !== 0 ? { moneyDelta: appliedMoneyDelta } : {}),
    ...(finalResult.failedStageDive ? { failedStageDive: true } : {}),
    ...(pendingSettlementId ? { settlementId: pendingSettlementId } : {}),
    social: socialPatch
  }

  if (!commitSocialPost(commitPayload)) {
    // Only a debit can be refused for Cash; anything else is a rejected payload
    // or a reducer no-op and must not tell the player they are broke.
    const refusedForCash = appliedMoneyDelta < 0
    logger.warn('PostGig', 'Social post commit rejected', {
      optionId: pendingSocialOptionId,
      refusedForCash
    })
    addToast(
      t(
        refusedForCash
          ? 'ui:postGig.insufficientSpendableCash'
          : 'ui:postGig.postResolutionFailed'
      ),
      'error'
    )
    return false
  }

  setPostResult(finalResult)

  if (appliedHarmonyDelta !== 0) {
    const sign = appliedHarmonyDelta > 0 ? '+' : ''
    addToast(
      `${t('ui:stats.harmony', { defaultValue: 'Harmony' })} ${sign}${appliedHarmonyDelta}`,
      appliedHarmonyDelta > 0 ? 'success' : 'error'
    )
  }

  if (appliedMoneyDelta !== 0) {
    addToast(
      `${t('ui:stats.money', { defaultValue: 'Money' })} ${formatCurrency(appliedMoneyDelta, i18n.language, 'always')}`,
      appliedMoneyDelta > 0 ? 'success' : 'error'
    )
  }

  if (appliedHarmonyDelta > 0) {
    applyQuestEvent(
      createHarmonyChangedQuestEvent({
        amount: appliedHarmonyDelta,
        newHarmony: clampBandHarmony(
          finiteNumberOr(band?.harmony, 1) + appliedHarmonyDelta
        )
      })
    )
  }

  if (finalResult.unlockTrait) {
    unlockTrait(
      finalResult.unlockTrait.memberId,
      finalResult.unlockTrait.traitId
    )
    const traitName = finalResult.unlockTrait.traitId
      .replace(/_/g, ' ')
      .toUpperCase()
    addToast(
      t('ui:postGig.traitUnlocked', {
        traitName,
        defaultValue: 'Trait Unlocked: {{traitName}}'
      }),
      'success'
    )
  }

  const followersGained = finiteNumberOr(finalResult.totalFollowers, 0)
  // Pass platform + category as context so per-quest filters can narrow
  // matches (e.g. TikTok-only viral_dance, Lifestyle-only outreach).
  for (const questEvent of createSocialPostQuestEvents(option, {
    ...finalResult,
    followers: followersGained
  })) {
    applyQuestEvent(questEvent)
  }
  // A post that rides the current trend is the trend match; the daily trend
  // rotation itself is not.
  if (social?.trend && isPostMatchingTrend(social.trend, option)) {
    applyQuestEvent(
      createSocialTrendMatchedQuestEvent({
        trendId: social.trend,
        platform: option.platform,
        postCategory: option.category
      })
    )
  }

  // Offers must see the committed state: the dispatches above can complete a
  // quest whose rewards change social, money or harmony in the reducer.
  requestBrandOffers()

  // Persist the state (including pendingGigSettlement.socialReconciled: true)
  // so a reload or crash on the result/deals screen retains reconciliation status.
  saveGameAfterStateCommit?.()

  return true
}
