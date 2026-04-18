import type { EventOption, GameState, MapNode, PlayerState, BandMember } from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'

/**
 * Known chatter variants:
 * - `normal`: default emitted by `getRandomChatter`
 * - `hate`: explicit style override (chromatic hostile text)
 *
 * Keep `(string & {})` to allow future/remote variants without breaking.
 */
export type ChatterMessageType = 'normal' | 'hate' | (string & {})

export interface ChatterMessageData {
  id: string
  text: string
  speaker: string
  type: ChatterMessageType
  scene: string
}

export type ChatterGameState = Pick<
  GameState,
  'currentScene' | 'band' | 'player' | 'gameMap' | 'social' | 'lastGigStats'
>

export interface ChatterOverlayProps {
  gameState: ChatterGameState
}

export interface GigHUDProps {
  stats: {
    score: number
    combo: number
    health: number
    overload: number
    isToxicMode: boolean
    isGameOver: boolean
    isAudioReady: boolean
    accuracy: number
  }
  gameStateRef: { current: GameState }
  onLaneInput: (laneIndex: number, isDown: boolean, now: number) => void
}

export interface MapNodeProps {
  node: MapNode
  isCurrentNode?: boolean
  isTargetNode?: boolean
  onSelect?: (nodeId: string) => void
}

export interface MapConnectionProps {
  from: MapNode
  to: MapNode
  isUnlocked?: boolean
}

export interface HecklerOverlayProps {
  gameStateRef: { current: GameState }
}

export interface GenericListProps<TItem = unknown> {
  items: TItem[]
}

export interface ChatterMessageProps {
  msg: ChatterMessageData
  onRemove: RemoveByIdCallback
  t: TranslationCallback
}

export interface SocialOptionButtonProps {
  opt: EventOption
  index: number
  onSelect: (index: number) => void
}

export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}

export interface MinigameLogicBase {
  gameStateRef: { current: GameState } | (() => GameState)
  update: (state: unknown) => void
  finishMinigame?: () => void
  dispatch?: (action: unknown) => void
}

export interface MinigameSceneFrameProps {
  controllerFactory: (options: unknown) => unknown
  logic: MinigameLogicBase
  uiState?: { isGameOver?: boolean }
  onComplete: () => void
  completionTitle?: string
  renderCompletionStats?: (stats: unknown) => React.ReactNode
  completionButtonText?: string
  children?: React.ReactNode
}

export interface PixiStageProps {
  gameStateRef: { current: GameState }
  update: (state: unknown) => void
  controllerFactory: (options: unknown) => unknown
}

export interface ToggleRadioProps {
  state: unknown
}

export interface TutorialManagerProps {
  onStepComplete?: (stepId: string) => void
}

export interface ClinicHeaderProps {
  player: Pick<PlayerState, 'money' | 'fame'>
}

export interface ClinicMemberCardHeaderProps {
  disabledReason?: string
  children?: React.ReactNode
}

export interface ClinicMemberCardActionProps {
  member: unknown
  player: unknown
  healCostMoney: number
  enhanceCostFame: number
  healMember: (memberId: string) => void
  enhanceMember: (memberId: string) => void
}

export interface AmpControlsProps {
  dialValue: number
  setDialValue: (value: number) => void
}

export interface AmpHUDProps {
  timeLeft: number
  score: number
}

export interface AudioLockedOverlayProps {
  onInitializeAudio: () => void
}

export interface BandMembersLayerProps {
  matzeUrl: string
  mariusUrl: string
  larsUrl: string
  setBandMemberRef: (id: string, ref: unknown) => void
}

export interface RoadieControlsProps {
  showControls: boolean
  setShowControls: (show: boolean) => void
  handleMoveUp: () => void
  handleMoveLeft: () => void
  handleMoveDown: () => void
  handleMoveRight: () => void
}

export interface RoadieHUDProps {
  uiState: unknown
}

export interface TourbusControlsProps {
  onMoveLeft: () => void
  onMoveRight: () => void
}

export interface TourbusHUDProps {
  distance: number
  damage: number
}

export interface TravelingVanProps {
  t: TranslationCallback
  isTraveling: boolean
  currentNode: MapNode | null
  travelTarget: MapNode | null
  vanUrl: string
  travelCompletedRef: { current: unknown }
  onTravelComplete: () => void
}

export interface CompletePhasePops {
  result: unknown
  onContinue: () => void
  onSpinStory: () => void
  player: unknown
  social: unknown
}

export interface DealCardProps {
  displayDeal: unknown
  isRevoked: boolean
  brandReputation: number
}

export interface DealCardDetailProps {
  deal: unknown
  displayDeal: unknown
  isRevoked: boolean
  hasNegotiated: boolean
  negotiationState: unknown
  handleAcceptDeal: (dealId: string) => void
  handleNegotiationStart: (dealId: string) => void
}

export interface DealCardNegotiationProps {
  deal: unknown
  negotiationState: unknown
  brandReputation: number
  handleAcceptDeal: (dealId: string) => void
  handleNegotiationStart: (dealId: string) => void
}

export interface DealsPhaseProps {
  offers: unknown[]
  onAccept: (dealId: string) => void
  onSkip: () => void
}

export interface FinancialListProps {
  items: unknown[]
  type: string
}

export interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  negotiationResult: unknown
  handleNegotiationSubmit: (submission: unknown) => void
}

export interface ReportPhaseProps {
  financials: unknown
}
