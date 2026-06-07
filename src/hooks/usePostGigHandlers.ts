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

export interface UsePostGigHandlersReturn {
  isProcessingAction: boolean
  handlePostSelection: (option: SocialPostOption) => void
  handleAcceptDeal: (deal: BrandDeal) => void
  handleRejectDeals: () => void
  handleSpinStory: () => void
  handleContinue: () => void
  handleNextPhase: () => void
}

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
  addQuest: (
    quest: ReturnType<
      typeof import('../context/actionCreators').createAddQuestAction
    >['payload']
  ) => void
  applyQuestEvent: (
    event: import('../utils/questProgress').QuestProgressEvent
  ) => void
  setPhase: (phase: 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE') => void
  setBrandOffers: (offers: BrandDeal[]) => void
  setPostResult: (result: PostResult) => void
  t?: import('i18next').TFunction
}

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
