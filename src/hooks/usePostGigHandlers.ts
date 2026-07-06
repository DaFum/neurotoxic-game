import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type { GameState, PostGigSummary, Venue } from '../types'
import type { BrandDeal, SocialPostOption } from '../types/social'
import type { PostGigFinancials } from '../types/economy'
import { useMemo, useRef, useState } from 'react'
import i18n from '../i18n'
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
export interface UsePostGigHandlersReturn {
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
export interface UsePostGigHandlersProps extends HandlerDispatchers {
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  lastGigStats: PostGigSummary | null
  currentGig: Venue | null
  postOptionsDerivationError: unknown
  perfScore: number
  financials: PostGigFinancials | null
  activeStoryFlags: string[]
  setlist: RhythmSetlistEntry[]
  /** True when the completed gig sits on the FINALE map node. */
  isFinaleGig?: boolean
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
  lastGigStats,
  currentGig,
  postOptionsDerivationError,
  perfScore,
  financials,
  activeStoryFlags,
  setlist,
  isFinaleGig,
  totalDailyObligations,
  updatePlayer,
  updateBand,
  updateSocial,
  unlockTrait,
  addToast,
  changeScene,
  addQuest,
  applyQuestEvent,
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
  const dispatchers = useMemo(
    () => ({
      updatePlayer,
      updateBand,
      updateSocial,
      setPhase,
      addQuest,
      applyQuestEvent,
      changeScene,
      setBrandOffers,
      setPostResult,
      unlockTrait,
      addToast
    }),
    [
      updatePlayer,
      updateBand,
      updateSocial,
      setPhase,
      addQuest,
      applyQuestEvent,
      changeScene,
      setBrandOffers,
      setPostResult,
      unlockTrait,
      addToast
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
    activeStoryFlags,
    isFinaleGig,
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
    currentGig,
    perfScore,
    lastGigStats,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })
  const { handleAcceptDeal, handleRejectDeals } = useDealHandlers({
    player,
    social,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })
  const { handleNextPhase, handleSpinStory } = useMinorHandlers({
    player,
    postOptionsDerivationError,
    hasSpunRef,
    setHasSpun,
    t,
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
