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

/**
 * Inputs to {@link useTravelLogic}: the live game-state slices it reads and the
 * action creators / scene callbacks it dispatches through.
 *
 * @remarks
 * Callback members (`updatePlayer`, `advanceDay`, `addToast`, `changeScene`,
 * etc.) must keep stable identities — the hook destructures and depends on them
 * individually to stay referentially stable, so recreating them every render
 * would defeat that. State slices (`player`, `band`, `assets`, …) may change
 * each render and are mirrored into refs internally.
 *
 * `onStartTravelMinigame` is required: the tourbus minigame is the only
 * supported travel mode, and its completion reducer owns arrival settlement.
 * Optional members gate features: omit `onShowHQ`/`onShowSupplyStop` to disable
 * those arrival overlays.
 *
 * Rival reaction and quest progression are deliberately absent. `useArrivalLogic`
 * moves the rival and checks encounters after a trip, and the tourbus completion
 * reducer emits the travel quest event — neither is this hook's business.
 */
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
  onStartTravelMinigame: (nodeId: string) => void
}

/**
 * Mutable refs shared between the travel sub-hooks.
 *
 * @remarks
 * `playerRef`/`bandRef`/`assetsRef`/etc. mirror the latest {@link TravelLogicParams}
 * state so callbacks can read current values without listing those slices as
 * dependencies. The timeout refs hold the single in-flight timer for each
 * concern: `pendingTimeoutRef` (confirmation window) and `timeoutRef`
 * (softlock game-over countdown). The bundle object keeps a stable identity
 * across renders.
 */
export interface TravelRefsBundle {
  isTravelingRef: React.MutableRefObject<boolean>
  pendingTravelNodeRef: React.MutableRefObject<MapNode | null>
  pendingTimeoutRef: React.MutableRefObject<ReturnType<
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
}

/**
 * React state holding current travel execution and confirmation dialog status.
 */
export interface TravelStateBundle {
  isTraveling: boolean
  pendingTravelNode: MapNode | null
}

/**
 * State dispatch functions for travel execution and confirmation dialog status.
 */
export interface TravelSettersBundle {
  setIsTraveling: React.Dispatch<React.SetStateAction<boolean>>
  setPendingTravelNode: React.Dispatch<React.SetStateAction<MapNode | null>>
}

/**
 * Encapsulated bundle of context needed by travel action hooks to execute trips.
 *
 * @remarks
 * Groups the mutable state, setters, parameters, and refs to avoid massive parameter lists
 * in sub-hook extractions.
 */
export interface TravelActionsParams {
  refs: TravelRefsBundle
  state: TravelStateBundle
  setters: TravelSettersBundle
  params: TravelLogicParams
}

/**
 * Inputs to {@link useVanMaintenance}.
 *
 * @remarks
 * `player` is read live for money/van condition; `isTravelingRef` gates the
 * handlers so refuel/repair are rejected while a trip is in progress.
 */
export interface VanMaintenanceParams {
  isTravelingRef: React.MutableRefObject<boolean>
  player: PlayerState
  band: BandState
  updatePlayer: (updates: Partial<PlayerState>) => void
  updateBand: (updates: Partial<BandState>) => void
  advanceDay: () => void
  dailyObligations: number
  addToast: (message: string, type?: string) => void
}
