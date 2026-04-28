import type {
  EventOption,
  GameState,
  MapNode,
  PlayerState,
  BandMember
} from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'
import type { RefObject, MutableRefObject } from 'react'
import type * as React from 'react'
import type { RhythmGameRefState } from './rhythmGame'
export type { AudioState, AudioControls } from './audio'

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

export interface SocialOption extends EventOption {
  id: string | number
  name?: string
  platform?: string
  category?: string
  badges?: string[]
}

export interface SocialOptionButtonProps {
  opt: SocialOption
  index: number
  onSelect: (option: SocialOption) => void
}

export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}

export interface MinigameLogicBase<TState = unknown> {
  gameStateRef: RefObject<TState>
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

export interface PixiStageProps<TState = unknown> {
  gameStateRef: RefObject<TState>
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

export interface DealContract {
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

export interface DealCardProps {
  deal: DealContract
  negotiationState?: DealNegotiationState
  brandReputation?: Record<string, number>
  handleAcceptDeal: (deal: DealContract) => void | Promise<void>
  handleNegotiationStart: (deal: DealContract) => void
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
  deal: DealContract
  displayDeal: DealContract
  isRevoked?: boolean
  hasNegotiated?: boolean
  negotiationState?: DealCardProps['negotiationState']
  handleAcceptDeal: (deal: DealContract) => void | Promise<void>
  handleNegotiationStart: (deal: DealContract) => void
}

export interface DealNegotiationState {
  deal?: DealContract | null
  status?: 'REVOKED' | 'FAILED' | 'SUCCESS' | 'WORSENED'
  feedback?: string
  success?: boolean
  [key: string]: unknown
}

export interface NegotiationResult {
  success: boolean
  deal: DealContract | null
  feedback: string
  status: 'ACCEPTED' | 'REVOKED' | 'FAILED'
}

export interface DealNegotiationHook {
  negotiatedDeals: Record<string, DealNegotiationState>
  negotiationModalOpen: boolean
  setNegotiationModalOpen: (open: boolean) => void
  selectedDeal: DealContract | null
  negotiationResult: NegotiationResult | null
  handleNegotiationStart: (deal: DealContract) => void
  handleAcceptDeal: (deal: DealContract) => Promise<void>
  handleNegotiationSubmit: (
    submission: 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE'
  ) => void
}

export interface DealsPhaseProps {
  offers: DealContract[]
  onAccept: (deal: DealContract) => void | Promise<void>
  onSkip: () => void
}

export interface FinancialListProps {
  items: FinancialItem[]
  type: 'income' | 'expense'
}

export interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  negotiationResult: NegotiationResult | null
  handleNegotiationSubmit: (
    submission: 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE'
  ) => void
}

export interface EventModalOption extends EventOption {
  label: string
  flags?: string[]
  disabled?: boolean
  nextEventId?: string
  skillCheck?: {
    stat: string
    threshold: number
    success: Record<string, unknown>
    failure: Record<string, unknown>
  }
  outcomeText?: string
}

export interface EventModalEvent extends GameEvent {
  options?: EventModalOption[]
}

export interface EventModalPrecomputedResult {
  result?: unknown
  delta?: unknown
  appliedDelta?: unknown
  outcomeText?: string
  description?: string
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

type EffectBase = {
  item?: string
  value?: unknown
  target?: 'player' | 'band' | 'van'
  stat?: string
  id?: string
  key?: string
}

export type Effect =
  | (EffectBase & { type: 'inventory_add'; item: string; value: number })
  | (EffectBase & { type: 'inventory_set'; item: string; value: unknown })
  | (EffectBase & {
      type: 'stat_modifier'
      target: 'player' | 'band' | 'van'
      stat: string
      value: number
    })
  | (EffectBase & { type: 'unlock_upgrade'; id: string })
  | (EffectBase & { type: 'passive'; key: string; value?: unknown })
  | (EffectBase & { type: 'unlock_hq'; id: string })

export interface PurchaseItem {
  id?: string | number
  name?: string
  cost?: number
  currency?: string
  category?: string
  description?: string
  img?: string
  effect?: Effect
  effects?: Effect[]
  oneTime?: boolean
  imgPrompt?: string
  requiresReputation?: boolean
  rarity?: string
  stackable?: boolean
  maxStacks?: number
}

export interface CatalogItem extends PurchaseItem {
  id: string | number
  cost: number
}

export interface VoidTraderItem extends PurchaseItem {
  id: string
  rarity?: 'rare' | 'epic'
}

export type Balances = Record<string, number>

export interface CatalogConsumerProps {
  items: CatalogItem[]
  processingItemId?: string | number
  handleBuy: (item: CatalogItem) => void
  isItemOwned: (item: CatalogItem) => boolean
  isItemDisabled: (item: CatalogItem) => boolean
  getAdjustedCost?: (item: CatalogItem) => number | undefined
}

export interface CatalogTabProps {
  items: CatalogItem[]
  balances: Balances
  /**
   * These must be one-argument callbacks already bound by usePurchaseLogic.
   * Do not pass raw utility functions that require player/band arguments.
   */
  handleBuyCallback: (item: CatalogItem) => void
  isItemOwnedCallback: (item: CatalogItem) => boolean
  isItemDisabledCallback: (item: CatalogItem) => boolean
  getAdjustedCostCallback?: (item: CatalogItem) => number | undefined
  processingItemId?: string | number
}

export type UnlockMessageKind = 'success' | 'error' | 'info'

export type UnlockMessage = {
  messageKey: string
  fallback?: string
  type: UnlockMessageKind
}
