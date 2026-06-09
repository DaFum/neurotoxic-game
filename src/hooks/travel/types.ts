import type {
  BandState,
  GameMap,
  GamePhase,
  GameState,
  MapNode,
  PlayerState,
  SocialState,
  Venue
} from '../../types'

export type TravelLogicParams = {
  player: PlayerState
  band: BandState
  assets: GameState['assets']
  liabilities: GameState['liabilities']
  social: SocialState
  gameMap: GameMap | null
  updatePlayer: (updates: Partial<PlayerState>) => void
  updateBand: (updates: Partial<BandState>) => void
  saveGame: (showToast?: boolean, stateSnapshot?: GameState) => void
  advanceDay: () => void
  triggerEvent: (category: string, triggerPoint?: string | null) => boolean
  startGig: (venue: Venue) => void
  addToast: (message: string, type?: string) => void
  changeScene: (scene: GamePhase) => void
  reputationByRegion?: Record<string, number>
  venueBlacklist?: string[]
  onShowHQ?: () => void
  onShowSupplyStop?: (
    inventory: import('../../types/components').PurchaseItem[]
  ) => void
  onStartTravelMinigame?: (nodeId: string) => void
  moveRivalBand?: () => void
  checkRivalEncounter?: () => void
  applyQuestEvent?: (
    event: import('../../utils/questProgress').QuestProgressEvent
  ) => void
}

export interface TravelRefsBundle {
  isTravelingRef: React.MutableRefObject<boolean>
  travelCompletedRef: React.MutableRefObject<boolean>
  pendingTravelNodeRef: React.MutableRefObject<MapNode | null>
  pendingTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>
  failsafeTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>
  timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  playerRef: React.MutableRefObject<PlayerState>
  bandRef: React.MutableRefObject<BandState>
  assetsRef: React.MutableRefObject<GameState['assets']>
  liabilitiesRef: React.MutableRefObject<GameState['liabilities']>
  socialRef: React.MutableRefObject<SocialState>
  gameMapRef: React.MutableRefObject<GameMap | null>
  reputationByRegionRef: React.MutableRefObject<
    Record<string, number> | undefined
  >
  venueBlacklistRef: React.MutableRefObject<string[]>
  moveRivalBandRef: React.MutableRefObject<(() => void) | undefined>
  checkRivalEncounterRef: React.MutableRefObject<(() => void) | undefined>
}

export interface TravelStateBundle {
  isTraveling: boolean
  travelTarget: MapNode | null
  pendingTravelNode: MapNode | null
}

export interface TravelSettersBundle {
  setIsTraveling: React.Dispatch<React.SetStateAction<boolean>>
  setTravelTarget: React.Dispatch<React.SetStateAction<MapNode | null>>
  setPendingTravelNode: React.Dispatch<React.SetStateAction<MapNode | null>>
}

export interface TravelActionsParams {
  refs: TravelRefsBundle
  state: TravelStateBundle
  setters: TravelSettersBundle
  params: TravelLogicParams
}

export interface VanMaintenanceParams {
  isTravelingRef: React.MutableRefObject<boolean>
  player: PlayerState
  assetsRef: React.MutableRefObject<GameState['assets']>
  updatePlayer: (updates: Partial<PlayerState>) => void
  addToast: (message: string, type?: string) => void
}
