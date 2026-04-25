import type {
  EventOption,
  GameState,
  MapNode,
  PlayerState,
  BandMember
} from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'
import type { RefObject, MutableRefObject } from 'react'
import type { RhythmGameRefState } from './rhythmGame'

export interface PixiController {
  init(): Promise<void>
  dispose(): void
}

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
  gameStateRef: { current: GameState }
  update: (state: unknown) => void
  finishMinigame?: () => void
  dispatch?: (action: import('../types/game').GameAction) => void
}

export interface TourbusMinigameLogic extends MinigameLogicBase {
  rngValue?: number
  contrabandId?: string
  instanceId?: string
}

export interface MinigameSceneFrameProps {
  controllerFactory?: (options: any) => PixiController
  logic: MinigameLogicBase
  uiState?: { isGameOver?: boolean }
  onComplete: () => void
  completionTitle?: string
  renderCompletionStats?: (stats: unknown) => React.ReactNode
  completionButtonText?: string
  children?: React.ReactNode
}

export interface AmpStageOptions {
  targetValue: number
  dialValue: number
}

export interface StageControllerOptions<TState = unknown> {
  containerRef: RefObject<HTMLElement | null>
  gameStateRef: RefObject<TState>
  updateRef: MutableRefObject<((dt: number) => void) | null>
}

export interface PixiStageProps {
  gameStateRef: RefObject<RhythmGameRefState>
  update: (state: unknown) => void
  controllerFactory?: (options: any) => PixiController
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

export interface ClinicMemberCardProps {
  member: BandMember
  player: Pick<PlayerState, 'money' | 'fame'>
  healCostMoney: number
  enhanceCostFame: number
  healMember: (memberId: string) => void
  enhanceMember: (memberId: string, traitId: string) => void
}

export interface ClinicMemberCardActionProps {
  member: BandMember
  player: Pick<PlayerState, 'money' | 'fame'>
  healCostMoney: number
  enhanceCostFame: number
  healMember: (memberId: string) => void
  enhanceMember: (memberId: string, traitId: string) => void
}

export interface ActionButtonWrapperProps {
  disabledReason?: string | null
  children: React.ReactElement
}

export interface AmpControlsProps {
  dialValue: number
  setDialValue: React.Dispatch<React.SetStateAction<number>>
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
  setBandMemberRef: (index: number) => (el: HTMLElement | null) => void
}

export interface RoadieControlsProps {
  showControls: boolean
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>
  handleMoveUp: () => void
  handleMoveLeft: () => void
  handleMoveDown: () => void
  handleMoveRight: () => void
}

export interface RoadieHUDProps {
  uiState: {
    itemsRemaining: number
    itemsDelivered: number
    currentDamage: number
    carrying?: {
      type: string
      [key: string]: unknown
    } | null
  }
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
  onTravelComplete: (node?: MapNode) => void
}

export interface CompletePhaseProps {
  result: {
    success: boolean
    message: string
    totalFollowers: number
    platform: string
    moneyChange?: number
    harmonyChange?: number
    controversyChange?: number
    loyaltyChange?: number
    staminaChange?: number
    moodChange?: number
    targetMember?: string
  }
  onContinue: () => void
  onSpinStory?: () => void
  player?: Pick<PlayerState, 'hqUpgrades'>
  social?: {
    controversyLevel?: number
    [key: string]: unknown
  }
  isProcessingAction?: boolean
}

export interface DealCardProps {
  deal: {
    id: string
    name: string
    description: string
    alignment?: string
    offer: {
      upfront: number
      duration: number
      perGig?: number
      item?: string
    }
    penalty?: Record<string, unknown>
    [key: string]: unknown
  }
  negotiationState?: {
    deal?: unknown
    status?: string
    feedback?: string
    success?: boolean
    [key: string]: unknown
  }
  brandReputation?: Record<string, number>
  handleAcceptDeal: (deal: unknown) => void
  handleNegotiationStart: (deal: unknown) => void
}

export interface DealImageProps {
  alignment?: string
  name: string
}

export interface DealInfoProps {
  displayDeal: {
    name: string
    description: string
    alignment?: string
    offer: {
      upfront: number
      duration: number
      perGig?: number
      item?: string
    }
    penalty?: Record<string, unknown>
    [key: string]: unknown
  }
  isRevoked?: boolean
  brandReputation?: Record<string, number>
}

export interface DealActionsProps {
  deal: unknown
  displayDeal: unknown
  isRevoked?: boolean
  hasNegotiated?: boolean
  negotiationState?: unknown
  handleAcceptDeal: (deal: unknown) => void
  handleNegotiationStart: (deal: unknown) => void
}

export interface DealsPhaseProps {
  offers: Array<{
    id: string
    name: string
    description: string
    alignment?: string
    offer: {
      upfront: number
      duration: number
      perGig?: number
      item?: string
    }
    penalty?: Record<string, unknown>
    [key: string]: unknown
  }>
  onAccept: (dealId: string) => void
  onSkip: () => void
}

export interface FinancialListProps {
  items: FinancialItem[]
  type: 'income' | 'expense'
}

export interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  negotiationResult: unknown
  handleNegotiationSubmit: (submission: unknown) => void
}

export interface FinancialItem {
  label?: string
  labelKey: string
  value: number
  detail?: string
  detailKey?: string
  detailParams?: Record<string, unknown>
}

export interface FinancialCategory {
  total: number
  breakdown: FinancialItem[]
}

export interface ReportPhaseProps {
  financials?: {
    income: FinancialCategory
    expenses: FinancialCategory
    net: number
  }
  onNext: () => void
}
