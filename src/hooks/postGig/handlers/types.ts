import type {
  GamePhase,
  GameState,
  UpdatePlayerPayload,
  UpdateBandPayload,
  PostResult
} from '../../../types'
import type { BrandDeal } from '../../../types/social'
import type { QuestProgressEvent } from '../../../utils/questProgress'
import type { createAddQuestAction } from '../../../context/actionCreators'
import type { PostGigPhase } from '../usePostGigState'
import type { ToastCallback } from '../../../types/callbacks'

/**
 * State-mutation and UI callbacks injected into the post-gig handler hooks,
 * decoupling them from the dispatch/action-creator layer.
 */
export interface HandlerDispatchers {
  addToast: ToastCallback
  updatePlayer: (updates: UpdatePlayerPayload) => void
  updateBand: (updates: UpdateBandPayload) => void
  updateSocial: (
    updates:
      | Partial<GameState['social']>
      | ((prev: GameState['social']) => Partial<GameState['social']>)
  ) => void
  setPhase: (phase: PostGigPhase) => void
  addQuest: (quest: Parameters<typeof createAddQuestAction>[0]) => void
  applyQuestEvent: (event: QuestProgressEvent) => void
  changeScene: (scene: GamePhase) => void
  setBrandOffers: (offers: BrandDeal[]) => void
  /**
   * Asks the owning hook to generate brand offers and route to DEALS or
   * COMPLETE once the post's dispatches (and any quest rewards) have committed.
   */
  requestBrandOffers: () => void
  setPostResult: (result: PostResult) => void
  unlockTrait: (memberId: string, traitId: string) => void
  recordExpeditionCrewStressSource: (
    crewId: string,
    sourceType: 'poor_gig' | 'successful_gig',
    sourceId: string
  ) => void
  completeExpedition: (finaleResultId: string) => void
  saveGameAfterStateCommit: (onSaved?: (saved: boolean) => void) => void
  recordExpeditionObligationSignal?: (
    signalType: 'gig' | 'finale' | 'arrival' | 'rest' | 'heat' | 'social_post',
    sourceId: string
  ) => void
  resolveExpeditionSocialResult?: (
    resultId: import('../../../types/expedition').ExpeditionSocialResultId,
    postOptionId: string
  ) => void
  settleSoldMerch?: (soldMerch: Record<string, number>) => void
  offerExpeditionDraft?: (
    sourceType: import('../../../types/expedition').ExpeditionRunDraftOffer['sourceType'],
    sourceKey: string
  ) => void
}
