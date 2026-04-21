import { useCallback, useRef, useState } from 'react'
import { GAME_PHASES } from '../context/gameConstants'
import { secureRandom } from '../utils/crypto'
import {
  QUEST_APOLOGY_TOUR,
  QUEST_EGO_MANAGEMENT
} from '../data/questsConstants'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel,
  calculateFameGain,
  BALANCE_CONSTANTS
} from '../utils/gameStateUtils'
import { logger } from '../utils/logger'
import {
  calculatePostGigStateUpdates,
  getAcceptDealMoneyUpdate,
  getAcceptDealBandUpdateFactory,
  getAcceptDealSocialUpdateFactory,
  getSpinStoryMoneyUpdate,
  getSpinStorySocialUpdateFactory,
  calculateContinueStats
} from '../utils/postGigUtils'
import { shouldTriggerBankruptcy } from '../utils/economyEngine'
import { generateBrandOffers } from '../utils/socialEngine'
import { submitLeaderboardScores } from '../utils/leaderboardUtils'

export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'

export const usePostGigHandlers = ({
  player,
  band,
  social,
  lastGigStats,
  currentGig,
  perfScore,
  financials,
  activeStoryFlags,
  setlist,
  updatePlayer,
  updateBand,
  updateSocial,
  unlockTrait,
  addToast,
  saveGame,
  changeScene,
  addQuest,
  setPhase,
  setPostResult,
  setBrandOffers,
  t
}: any) => {
  const isProcessingActionRef = useRef(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const handlePostSelection = useCallback(
    (option: any) => {
      let updates
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
        addToast(
          t('ui:postGig.postResolutionFailed', {
            defaultValue: DEFAULT_POST_FAILED_MSG
          }),
          'error'
        )
        return
      }

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

      if (appliedMoneyDelta !== 0) {
        updatePlayer({ money: nextMoney })
        const sign = appliedMoneyDelta > 0 ? '+' : ''
        addToast(
          `${t('ui:postGig.money', { defaultValue: 'Money' })} ${sign}${appliedMoneyDelta}€`,
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

      updateSocial(updatedSocial)

      // Generate brand offers with UPDATED state (Post-Social-Update)
      const updatedGameState = {
        player, // Money update handled separately but not critical for offer generation
        band: hasBandUpdates ? newBand : band,
        social: { ...social, ...updatedSocial }
      }

      const offers = generateBrandOffers(updatedGameState, secureRandom)
      setBrandOffers(offers)

      // If there are brand offers, go to DEALS phase, else COMPLETE
      if (offers.length > 0) {
        setPhase('DEALS')
      } else {
        setPhase('COMPLETE')
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
      addToast,
      currentGig,
      t,
      setPostResult,
      setBrandOffers,
      setPhase
    ]
  )

  const handleAcceptDeal = useCallback(
    (deal: any) => {
      try {
        const { nextMoney, appliedMoneyDelta } = getAcceptDealMoneyUpdate({
          deal,
          player
        })

        if (appliedMoneyDelta !== 0) {
          updatePlayer({ money: nextMoney })
        }

        if (deal.offer.item) {
          const bandUpdateFactory = getAcceptDealBandUpdateFactory(deal)
          updateBand(bandUpdateFactory)
        }

        const socialUpdateFactory = getAcceptDealSocialUpdateFactory(deal)
        updateSocial(socialUpdateFactory)

        const moneyText =
          appliedMoneyDelta !== 0 ? ` (+${appliedMoneyDelta}€)` : ''
        addToast(
          t('ui:postGig.acceptedDeal', {
            dealName: deal.name,
            moneyText,
            defaultValue: 'Accepted deal: {{dealName}}{{moneyText}}'
          }),
          'success'
        )

        // Exclusivity: clear all offers and go to complete
        setBrandOffers([])
        setPhase('COMPLETE')
      } catch (e) {
        logger.error('PostGig', 'Failed to accept deal', e)
        addToast(
          t('ui:postGig.dealFailed', {
            defaultValue: 'Deal failed'
          }),
          'error'
        )
      }
    },
    [
      player,
      updatePlayer,
      updateBand,
      updateSocial,
      addToast,
      t,
      setBrandOffers,
      setPhase
    ]
  )

  const handleRejectDeals = useCallback(() => {
    // Clears all remaining offers (Reject All / Skip Phase)
    setBrandOffers([])
    setPhase('COMPLETE')
    addToast(
      t('ui:postGig.skippedBrandDeals', {
        defaultValue: 'Skipped brand deals.'
      }),
      'info'
    )
  }, [addToast, t, setBrandOffers, setPhase])

  const handleSpinStory = useCallback(() => {
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)

    const updates = getSpinStoryMoneyUpdate({ player })

    if (!updates.success) {
      addToast(
        t('ui:postGig.notEnoughCashForPr', {
          defaultValue: 'Not enough cash for PR!'
        }),
        'error'
      )
      isProcessingActionRef.current = false
      setIsProcessingAction(false)
      return
    }

    updatePlayer({ money: updates.nextMoney })

    const socialUpdateFactory = getSpinStorySocialUpdateFactory()
    updateSocial(socialUpdateFactory)

    const moneyText =
      updates.appliedDelta !== 0 ? ` (${updates.appliedDelta}€)` : ''
    addToast(
      t('ui:postGig.storySpunControversyReduced', {
        moneyText,
        defaultValue: `Story Spun. Controversy reduced.${moneyText}`
      }),
      'success'
    )
    isProcessingActionRef.current = false
    setIsProcessingAction(false)
  }, [player, updatePlayer, updateSocial, addToast, t])

  const handleContinue = useCallback(() => {
    if (!financials) return
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)

    const stats = calculateContinueStats({
      player,
      perfScore,
      financials,
      misses: lastGigStats?.misses ?? 0,
      calculateFameGain,
      calculateFameLevel,
      clampPlayerFame,
      clampPlayerMoney,
      BALANCE_CONSTANTS
    })

    updatePlayer({
      money: stats.newMoney,
      fame: stats.newFame,
      fameLevel: stats.fameLevel,
      lastGigNodeId: player.currentNodeId
    })

    if (activeStoryFlags?.includes('cancel_quest_active')) {
      addQuest({
        id: QUEST_APOLOGY_TOUR,
        label: 'ui:quests.postgig.apologyTour.title',
        description: 'ui:quests.postgig.apologyTour.description',
        deadline: player.day + 14,
        progress: 0,
        required: 3,
        rewardFlag: 'apology_tour_complete',
        failurePenalty: {
          social: { controversyLevel: 25 },
          band: { harmony: -20 }
        }
      })
    }

    if (activeStoryFlags?.includes('breakup_quest_active')) {
      addQuest({
        id: QUEST_EGO_MANAGEMENT,
        label: 'ui:quests.postgig.saveTheBand.title',
        description: 'ui:quests.postgig.saveTheBand.description',
        deadline: player.day + 5,
        progress: 0,
        required: 1,
        rewardFlag: 'ego_crisis_resolved',
        failurePenalty: { type: 'game_over' }
      })
    }

    submitLeaderboardScores({ player, lastGigStats, currentGig, setlist })

    if (shouldTriggerBankruptcy(stats.newMoney, financials.net)) {
      addToast(
        t('ui:postGig.gameOverBankrupt', {
          defaultValue: 'GAME OVER: BANKRUPT! The tour is over.'
        }),
        'error'
      )
      isProcessingActionRef.current = false
      setIsProcessingAction(false)
      changeScene(GAME_PHASES.GAMEOVER)
    } else {
      window.setTimeout(() => {
        isProcessingActionRef.current = false
        setIsProcessingAction(false)
        saveGame(false)
        changeScene(GAME_PHASES.OVERWORLD)
      }, 0)
    }
  }, [
    financials,
    perfScore,
    player,
    currentGig,
    lastGigStats,
    updatePlayer,
    addToast,
    saveGame,
    changeScene,
    activeStoryFlags,
    addQuest,
    setlist,
    t
  ])

  const handleNextPhase = useCallback(() => {
    setPhase('SOCIAL')
  }, [setPhase])

  return {
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
