import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { GameState, PostGigSummary, Venue } from '../types'
import type { BrandDeal, SocialPostOption } from '../types/social'
import type { PostGigFinancials } from '../types/economy'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import i18n from '../i18n'
import { generateBrandOffers } from '../utils/brandDealLogic'
import { secureRandom } from '../utils/crypto'
import { logger } from '../utils/logger'
import {
  useContinueHandler,
  useSocialPostHandler,
  useDealHandlers,
  useMinorHandlers,
  useProcessingGuard
} from './postGig/handlers'
import type { HandlerDispatchers } from './postGig/handlers/types'
import type { PostGigPhase } from './postGig/usePostGigState'
/** The post-gig handler surface returned by {@link usePostGigHandlers}. */
interface UsePostGigHandlersReturn {
  isProcessingAction: boolean
  hasSpun: boolean
  handlePostSelection: (option: SocialPostOption) => void
  handleAcceptDeal: (deal: BrandDeal) => void
  handleRejectDeals: () => void
  handleSpinStory: () => void
  handleContinue: () => void
  handleNextPhase: () => void
}
/** Props for {@link usePostGigHandlers}: post-gig state slices and the flat dispatcher/UI callbacks it threads into the sub-handlers. */
interface UsePostGigHandlersProps extends Omit<
  HandlerDispatchers,
  'requestBrandOffers'
> {
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  rivalBand: GameState['rivalBand']
  lastGigStats: PostGigSummary | null
  currentGig: Venue | null
  postOptionsDerivationError: unknown
  perfScore: number
  financials: PostGigFinancials | null
  activeStoryFlags: string[]
  setlist: RhythmSetlistEntry[]
  expedition: GameState['expedition']
  activeEvent?: GameState['activeEvent']
  activeQuests?: GameState['activeQuests']
  /** True when the completed gig sits on the FINALE map node. */
  isFinaleGig?: boolean
  /** Id of the persisted settlement Continue settles. */
  pendingSettlementId?: string | null
  totalDailyObligations: number
  phase: PostGigPhase
  t?: import('i18next').TFunction
}
/**
 * Composition root for the post-gig phase: wires the processing guard and the
 * dispatcher bundle into the continue, social-post, brand-deal, and minor
 * sub-handlers, and returns the combined handler surface.
 */
export function usePostGigHandlers({
  player,
  band,
  social,
  rivalBand,
  lastGigStats,
  currentGig,
  postOptionsDerivationError,
  perfScore,
  financials,
  activeStoryFlags,
  setlist,
  expedition,
  activeEvent,
  activeQuests,
  isFinaleGig,
  pendingSettlementId,
  totalDailyObligations,
  updatePlayer,
  updateBand,
  updateSocial,
  applyGigSocialReconciliation,
  unlockTrait,
  addToast,
  changeScene,
  addQuest,
  applyQuestEvent,
  recordExpeditionCrewStressSource,
  completeExpedition,
  saveGameAfterStateCommit,
  recordExpeditionObligationSignal,
  resolveExpeditionSocialResult,
  settleSoldMerch,
  clearPendingGigSettlement,
  offerExpeditionDraft,
  commitSocialPost,
  phase,
  setPhase,
  setBrandOffers,
  setPostResult,
  t = i18n.t
}: UsePostGigHandlersProps): UsePostGigHandlersReturn {
  const { isProcessingAction, isProcessingActionRef, setIsProcessingAction } =
    useProcessingGuard()
  // Spin-story one-shot guard: decoupled from the shared continue guard so a
  // completed spin cannot permanently block the "Back to Tour" button.
  const hasSpunRef = useRef(false)
  const [hasSpun, setHasSpun] = useState(false)
  // Release the shared guard and spin guard on every phase change so each new
  // phase starts unblocked (e.g. fresh post-gig after returning to overworld).
  // Uses the render-phase "store previous prop" pattern to avoid setState-in-effect.
  const [prevPhase, setPrevPhase] = useState(phase)
  if (phase !== prevPhase) {
    setPrevPhase(phase)
    isProcessingActionRef.current = false
    setIsProcessingAction(false)
    hasSpunRef.current = false
    setHasSpun(false)
  }
  // Brand offers after a social post are generated post-commit: the post's
  // dispatches can complete a quest whose rewards change social, money or
  // harmony, and offers must see those committed values, not the projection.
  // Same ref + nonce idiom as useArrivalLogic: the ref is consumed exactly
  // once, so re-runs from later state changes are no-ops and cannot loop.
  const brandOffersPendingRef = useRef(false)
  const [brandOffersNonce, setBrandOffersNonce] = useState(0)
  const requestBrandOffers = useCallback(() => {
    brandOffersPendingRef.current = true
    setBrandOffersNonce(n => n + 1)
  }, [])
  useEffect(() => {
    if (!brandOffersPendingRef.current) return
    brandOffersPendingRef.current = false
    let offers: BrandDeal[] = []
    try {
      offers = generateBrandOffers(
        { player, band, social, rivalBand },
        secureRandom
      )
    } catch (e) {
      // The post has already committed, so do not re-open it: finish without
      // offers instead of letting the error escape the effect.
      logger.error('PostGig', 'Failed to generate brand offers', e)
    }
    setBrandOffers(offers)
    setPhase(offers.length > 0 ? 'DEALS' : 'COMPLETE')
  }, [
    brandOffersNonce,
    player,
    band,
    social,
    rivalBand,
    setBrandOffers,
    setPhase
  ])
  const dispatchers = useMemo(
    () => ({
      updatePlayer,
      updateBand,
      updateSocial,
      applyGigSocialReconciliation,
      setPhase,
      addQuest,
      applyQuestEvent,
      changeScene,
      setBrandOffers,
      requestBrandOffers,
      setPostResult,
      unlockTrait,
      addToast,
      recordExpeditionCrewStressSource,
      completeExpedition,
      saveGameAfterStateCommit,
      recordExpeditionObligationSignal,
      resolveExpeditionSocialResult,
      settleSoldMerch,
      clearPendingGigSettlement,
      offerExpeditionDraft,
      commitSocialPost
    }),
    [
      updatePlayer,
      updateBand,
      updateSocial,
      applyGigSocialReconciliation,
      setPhase,
      addQuest,
      applyQuestEvent,
      changeScene,
      setBrandOffers,
      requestBrandOffers,
      setPostResult,
      unlockTrait,
      addToast,
      recordExpeditionCrewStressSource,
      completeExpedition,
      saveGameAfterStateCommit,
      recordExpeditionObligationSignal,
      resolveExpeditionSocialResult,
      settleSoldMerch,
      clearPendingGigSettlement,
      offerExpeditionDraft,
      commitSocialPost
    ]
  )
  const handleContinue = useContinueHandler({
    financials,
    perfScore,
    player,
    band,
    currentGig,
    lastGigStats,
    setlist,
    expedition,
    activeStoryFlags,
    isFinaleGig,
    pendingSettlementId,
    totalDailyObligations,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })
  const handlePostSelection = useSocialPostHandler({
    player,
    band,
    social,
    rivalBand,
    currentGig,
    perfScore,
    lastGigStats,
    pendingSettlementId,
    expedition,
    activeEvent,
    activeQuests,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })
  const { handleAcceptDeal, handleRejectDeals } = useDealHandlers({
    player,
    band,
    social,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })
  const { handleNextPhase, handleSpinStory } = useMinorHandlers({
    player,
    social,
    currentGig,
    postOptionsDerivationError,
    hasSpunRef,
    setHasSpun,
    t,
    pendingSettlementId,
    dispatchers
  })
  return {
    isProcessingAction,
    hasSpun,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
