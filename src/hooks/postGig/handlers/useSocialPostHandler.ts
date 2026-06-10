import { useCallback } from 'react'
import type { GameState, PostGigSummary, Venue } from '../../../types'
import type { SocialPostOption } from '../../../types/social'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
import { calculatePostGigStateUpdates } from '../../../utils/postGigUtils'
import { generateBrandOffers } from '../../../utils/brandDealLogic'
import { createHarmonyChangedQuestEvent } from '../../../quests/producers/gigQuestEvents'
import { createSocialPostQuestEvents } from '../../../quests/producers/socialQuestEvents'
import { secureRandom } from '../../../utils/crypto'
import { clampBandHarmony, finiteNumberOr } from '../../../utils/gameState'
import type { HandlerDispatchers } from './types'

type SocialPostDispatchers = Pick<
  HandlerDispatchers,
  | 'updateBand'
  | 'updatePlayer'
  | 'updateSocial'
  | 'unlockTrait'
  | 'applyQuestEvent'
  | 'addToast'
  | 'setPostResult'
  | 'setBrandOffers'
  | 'setPhase'
>

/**
 * Applies an already-computed social-post resolution: posts the result, applies
 * band/player/social updates and toasts, unlocks traits, emits quest events,
 * then regenerates brand offers and routes to the DEALS or COMPLETE phase.
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
}): void {
  const { option, updates, player, band, social, t, dispatchers } = params
  const {
    updateBand,
    updatePlayer,
    updateSocial,
    unlockTrait,
    applyQuestEvent,
    addToast,
    setPostResult,
    setBrandOffers,
    setPhase
  } = dispatchers

  const {
    finalResult,
    newBand,
    hasBandUpdates,
    appliedHarmonyDelta,
    nextMoney,
    appliedMoneyDelta,
    updatedSocial
  } = updates

  setPostResult(finalResult)

  if (hasBandUpdates) {
    updateBand(newBand)
  }

  if (appliedHarmonyDelta !== 0) {
    const sign = appliedHarmonyDelta > 0 ? '+' : ''
    addToast(
      `${t('ui:postGig.harmony', { defaultValue: 'Harmony' })} ${sign}${appliedHarmonyDelta}`,
      appliedHarmonyDelta > 0 ? 'success' : 'error'
    )
  }
  if (appliedHarmonyDelta > 0) {
    applyQuestEvent(
      createHarmonyChangedQuestEvent({
        amount: appliedHarmonyDelta,
        newHarmony: clampBandHarmony(
          finiteNumberOr(band.harmony, 0) + appliedHarmonyDelta
        )
      })
    )
  }

  if (appliedMoneyDelta !== 0) {
    updatePlayer({ money: nextMoney })
    addToast(
      `${t('ui:postGig.money', { defaultValue: 'Money' })} ${formatCurrency(appliedMoneyDelta, i18n.language, 'always')}`,
      appliedMoneyDelta > 0 ? 'success' : 'error'
    )
  } else if (finalResult.moneyChange) {
    updatePlayer({ money: nextMoney })
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

  // Track failed stage dives / crowdsurfs; 2 unlock the `clumsy` trait via
  // the daily SOCIAL_UPDATE pass in checkTraitUnlocks.
  if (finalResult.failedStageDive) {
    updatePlayer({
      stats: {
        ...player.stats,
        failedStageDives: finiteNumberOr(player.stats?.failedStageDives, 0) + 1
      }
    })
  }

  updateSocial(updatedSocial)

  const followersGained = finiteNumberOr(finalResult.followers, 0)
  // Pass platform + category as context so per-quest filters can narrow
  // matches (e.g. TikTok-only viral_dance, Lifestyle-only outreach).
  for (const questEvent of createSocialPostQuestEvents(option, {
    ...finalResult,
    followers: followersGained
  })) {
    applyQuestEvent(questEvent)
  }

  const playerUpdated = { ...player, money: nextMoney }
  // Generate brand offers with UPDATED state (Post-Social-Update)
  const updatedGameState = {
    player: playerUpdated,
    band: hasBandUpdates ? newBand : band,
    social: { ...social, ...updatedSocial }
  } as Partial<GameState> as GameState

  const offers = generateBrandOffers(updatedGameState, secureRandom)
  setBrandOffers(offers)

  // If there are brand offers, go to DEALS phase, else COMPLETE
  if (offers.length > 0) {
    setPhase('DEALS')
  } else {
    setPhase('COMPLETE')
  }
}

/** Props for {@link useSocialPostHandler}: state slices, gig context, the processing guard, translator, and dispatchers. */
export interface UseSocialPostHandlerProps {
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  currentGig: Venue | null
  perfScore: number
  lastGigStats: PostGigSummary | null
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the social-post selection handler: computes the post outcome via
 * `calculatePostGigStateUpdates`, applies it through {@link applySocialPostResult},
 * and routes to the DEALS or COMPLETE phase. Guarded against re-entrancy.
 */
export function useSocialPostHandler({
  player,
  band,
  social,
  currentGig,
  perfScore,
  lastGigStats,
  isProcessingActionRef,
  setIsProcessingAction,
  t,
  dispatchers: {
    updateSocial,
    updateBand,
    updatePlayer,
    unlockTrait,
    applyQuestEvent,
    addToast,
    setPostResult,
    setBrandOffers,
    setPhase
  }
}: UseSocialPostHandlerProps) {
  const handlePostSelection = useCallback(
    (option: SocialPostOption) => {
      if (isProcessingActionRef.current) return
      isProcessingActionRef.current = true
      setIsProcessingAction(true)
      try {
        let updates: ReturnType<typeof calculatePostGigStateUpdates>
        try {
          updates = calculatePostGigStateUpdates({
            option,
            player,
            band,
            social,
            lastGigStats,
            currentGig,
            perfScore,
            secureRandomValue: secureRandom()
          })
        } catch (e) {
          logger.error('PostGig', 'Failed to resolve selected post', e)
          addToast(t('ui:postGig.postResolutionFailed'), 'error')
          return
        }

        applySocialPostResult({
          option,
          updates,
          player,
          band,
          social,
          t,
          dispatchers: {
            updateBand,
            updatePlayer,
            updateSocial,
            unlockTrait,
            applyQuestEvent,
            addToast,
            setPostResult,
            setBrandOffers,
            setPhase
          }
        })
      } finally {
        isProcessingActionRef.current = false
        setIsProcessingAction(false)
      }
    },
    [
      lastGigStats,
      perfScore,
      social,
      player,
      band,
      updateSocial,
      updateBand,
      updatePlayer,
      unlockTrait,
      applyQuestEvent,
      addToast,
      currentGig,
      t,
      setPostResult,
      setBrandOffers,
      setPhase,
      isProcessingActionRef,
      setIsProcessingAction
    ]
  )

  return handlePostSelection
}
