import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type {
  GamePhase,
  GameState,
  PostGigSummary,
  Venue,
  UpdatePlayerPayload,
  PostResult
} from '../types'
import type { BrandDeal, SocialPostOption } from '../types/social'
import type { QuestProgressEvent } from '../utils/questProgress'
import type { createAddQuestAction } from '../context/actionCreators'
import type { PostGigFinancials } from '../types/economy'
import { useMemo } from 'react'
import i18n from '../i18n'
import {
  useContinueHandler,
  useSocialPostHandler,
  useDealHandlers,
  useMinorHandlers,
  useProcessingGuard
} from './postGig/handlers'

/** The post-gig handler surface returned by {@link usePostGigHandlers}. */
export interface UsePostGigHandlersReturn {
  isProcessingAction: boolean
  handlePostSelection: (option: SocialPostOption) => void
  handleAcceptDeal: (deal: BrandDeal) => void
  handleRejectDeals: () => void
  handleSpinStory: () => void
  handleContinue: () => void
  handleNextPhase: () => void
}

/** Props for {@link usePostGigHandlers}: post-gig state slices and the flat dispatcher/UI callbacks it threads into the sub-handlers. */
export interface UsePostGigHandlersProps {
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
  updatePlayer: (updates: UpdatePlayerPayload) => void
  updateBand: (
    updates:
      | Partial<GameState['band']>
      | ((prev: GameState['band']) => GameState['band'])
  ) => void
  updateSocial: (
    updates:
      | Partial<GameState['social']>
      | ((prev: GameState['social']) => Partial<GameState['social']>)
  ) => void
  unlockTrait: (memberId: string, traitId: string) => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  changeScene: (scene: GamePhase) => void
  addQuest: (quest: Parameters<typeof createAddQuestAction>[0]) => void
  applyQuestEvent: (event: QuestProgressEvent) => void
  setPhase: (phase: 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE') => void
  setBrandOffers: (offers: BrandDeal[]) => void
  setPostResult: (result: PostResult) => void
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
  setPhase,
  setBrandOffers,
  setPostResult,
  t = i18n.t
}: UsePostGigHandlersProps): UsePostGigHandlersReturn {
  const { isProcessingAction, isProcessingActionRef, setIsProcessingAction } =
    useProcessingGuard()

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
    t,
    dispatchers
  })
  const { handleNextPhase, handleSpinStory } = useMinorHandlers({
    player,
    postOptionsDerivationError,
    isProcessingActionRef,
    setIsProcessingAction,
    t,
    dispatchers
  })

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
