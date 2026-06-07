import type {
  GamePhase,
  GameState,
  Venue,
  UpdatePlayerPayload,
  PostResult
} from '../../../types'
import type { BrandDeal } from '../../../types/social'
import type { QuestProgressEvent } from '../../../utils/questProgress'
import type { createAddQuestAction } from '../../../context/actionCreators'

export interface BaseHandlerDependencies {
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  venue: Venue | null
  t: import('i18next').TFunction
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export interface HandlerDispatchers {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
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
  setPhase: (phase: 'REPORT' | 'SOCIAL' | 'DEALS' | 'COMPLETE') => void
  addQuest: (quest: Parameters<typeof createAddQuestAction>[0]) => void
  applyQuestEvent: (event: QuestProgressEvent) => void
  changeScene: (scene: GamePhase) => void
  setBrandOffers: (offers: BrandDeal[]) => void
  setPostResult: (result: PostResult) => void
  unlockTrait: (memberId: string, traitId: string) => void
}
