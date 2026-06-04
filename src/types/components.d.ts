import type { GameAction } from './game'
import type {
  GameEvent,
  EventOption,
  GameState,
  MapNode,
  PlayerState,
  BandMember
} from './game'
import type { RemoveByIdCallback, TranslationCallback } from './callbacks'
import type { RefObject, MutableRefObject } from 'react'
import type * as React from 'react'
import type { BrandDeal, Platform, SocialPostOption } from './social'
export type { AudioState, AudioControls } from './audio'

/**
 * Minimal lifecycle contract for Pixi stage controllers.
 */
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

/**
 * Resolved chatter message shown by the chatter overlay.
 */
export interface ChatterMessageData {
  id: string
  text: string
  speaker: string
  type: ChatterMessageType
  scene: string
}

/**
 * Game-state slice required to select and render chatter.
 */
export type ChatterGameState = Pick<
  GameState,
  | 'currentScene'
  | 'band'
  | 'player'
  | 'gameMap'
  | 'social'
  | 'lastGigStats'
  | 'gigModifiers'
>

/**
 * Props for the chatter overlay container.
 */
export interface ChatterOverlayProps {
  gameState: ChatterGameState
}

/**
 * Props for one dismissible chatter message.
 */
export interface ChatterMessageProps {
  msg: ChatterMessageData
  onRemove: RemoveByIdCallback
  t: TranslationCallback
}

/**
 * Event option enriched with social-post metadata for post-gig choices.
 */
export interface SocialOption extends EventOption, SocialPostOption {
  id: string
  name?: string
  platform?: Platform
  category?: string
  badges?: string[]
}

/**
 * I18n-ready active effect descriptor for effect lists.
 */
export interface ActiveEffect {
  key: string
  fallback?: string
  options?: Record<string, unknown>
}

/**
 * String entries are retained for defensive parsing of legacy/untrusted payloads.
 * New producers should emit `ActiveEffect` objects.
 */
export type ActiveEffectEntry = string | ActiveEffect

/**
 * Props for a selectable social option button.
 */
export interface SocialOptionButtonProps {
  opt: SocialOption
  index: number
  onSelect: (option: SocialOption) => void
}

/**
 * Props for the minigame pause overlay.
 */
export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}

/**
 * Shared imperative logic contract for Pixi-backed minigames.
 */
export interface MinigameLogicBase<TState = unknown> {
  gameStateRef: RefObject<TState>
  update: (deltaMS: number) => void
  finishMinigame?: () => void
  dispatch?: (action: import('../types/game').GameAction) => void
}

/**
 * Props for the reusable minigame scene frame.
 */
export interface MinigameSceneFrameProps<TState = unknown> {
  controllerFactory: (options: StageControllerOptions<TState>) => PixiController
  logic: MinigameLogicBase<TState>
  uiState?: { isGameOver?: boolean; [key: string]: unknown }
  onComplete: () => void
  completionTitle?: string
  renderCompletionStats?: (stats: unknown) => React.ReactNode
  completionButtonText?: string
  children?: React.ReactNode
}

/**
 * Mutable amp-calibration values consumed by the Pixi stage.
 */
export interface AmpStageOptions {
  targetValue: number
  dialValue: number
  isOverdriveActive?: boolean
  isOverheat?: boolean
  heat?: number
  isAnomalyActive?: boolean
  voidResonance?: number
  interference?: number
  isHijackActive?: boolean
  hijacksOverridden?: number
}

/**
 * Shared constructor options for Pixi stage controllers.
 */
export interface StageControllerOptions<TState = unknown> {
  containerRef: RefObject<HTMLElement | null>
  gameStateRef: RefObject<TState>
  updateRef: MutableRefObject<((dt: number) => void) | null>
}

/**
 * Props for a React wrapper that hosts a Pixi stage controller.
 */
export interface PixiStageProps<TState = unknown> {
  gameStateRef: RefObject<TState>
  update: (deltaMS: number) => void
  controllerFactory: (options: StageControllerOptions<TState>) => PixiController
}

/**
 * Props for the clinic resource header.
 */
export interface ClinicHeaderProps {
  player: Pick<PlayerState, 'money' | 'fame'>
}

/**
 * Props for one clinic band-member treatment card.
 */
export interface ClinicMemberCardProps {
  member: BandMember
  player: Pick<PlayerState, 'money' | 'fame'>
  healCostMoney: number
  enhanceCostFame: number
  healMember: (memberId: string) => void
  enhanceMember: (memberId: string, traitId: string) => void
}

/**
 * Render-prop wrapper contract for disabled action buttons.
 */
export interface ActionButtonWrapperProps {
  disabledReason?: string | null
  children: (disabled: boolean) => React.ReactElement
}

/**
 * Props for amp-calibration controls and optional hazard actions.
 */
export interface AmpControlsProps {
  dialValue: number
  targetValue: number
  setDialValue: React.Dispatch<React.SetStateAction<number>>
  isOverdriveActive: boolean
  setIsOverdriveActive: React.Dispatch<React.SetStateAction<boolean>>
  purgeInterference?: () => void
  interference?: number
  isHijackActive?: boolean
  overrideHijack?: () => void
}

/**
 * Props for the amp-calibration status HUD.
 */
export interface AmpHUDProps {
  timeLeft: number
  score: number
  heat: number
  isOverheat: boolean
  voidResonance?: number
  isAnomalyActive?: boolean
  interference?: number
  isHijackActive?: boolean
  hijacksOverridden?: number
}

/**
 * Props for the audio-unlock overlay action.
 */
export interface AudioLockedOverlayProps {
  onInitializeAudio: () => void
}

/**
 * Props for positioning rendered band-member elements.
 */
export interface BandMembersLayerProps {
  matzeUrl: string
  mariusUrl: string
  larsUrl: string
  setBandMemberRef: (index: number) => (el: HTMLElement | null) => void
}

/**
 * Props for roadie minigame directional controls.
 */
export interface RoadieControlsProps {
  showControls: boolean
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>
  handleMoveUp: () => void
  handleMoveLeft: () => void
  handleMoveDown: () => void
  handleMoveRight: () => void
}

/**
 * Props for roadie minigame delivery and damage status.
 */
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

/**
 * Props for tourbus lane-change controls.
 */
export interface TourbusControlsProps {
  onMoveLeft: () => void
  onMoveRight: () => void
}

/**
 * Props for tourbus progress and damage display.
 */
export interface TourbusHUDProps {
  distance: number
  damage: number
}

/**
 * Props for the animated overworld travel van.
 */
export interface TravelingVanProps {
  t: TranslationCallback
  isTraveling: boolean
  currentNode: MapNode | null
  travelTarget: MapNode | null
  vanUrl: string
  travelCompletedRef: { current: unknown }
  onTravelComplete: (node?: MapNode) => void
}

/**
 * Props for the post-gig completion phase.
 */
export interface CompletePhaseProps {
  result: import('./game').PostResult
  onContinue: () => void
  onSpinStory?: () => void
  player?: Pick<PlayerState, 'hqUpgrades'>
  social?: {
    controversyLevel?: number
    [key: string]: unknown
  }
  isProcessingAction?: boolean
}

/**
 * Props for one brand-deal offer card.
 */
export interface DealCardProps {
  deal: BrandDeal
  negotiationState?: DealNegotiationState
  brandReputation?: Record<string, number>
  handleAcceptDeal: (deal: BrandDeal) => void | Promise<void>
  handleNegotiationStart: (deal: BrandDeal) => void
}

/**
 * Props for brand-deal image rendering.
 */
export interface DealImageProps {
  alignment?: string
  name: string
}

/**
 * Props for displayed brand-deal details.
 */
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
    flavor?: import('./social').BrandOfferFlavor
    [key: string]: unknown
  }
  isRevoked?: boolean
  brandReputation?: Record<string, number>
}

/**
 * Props for brand-deal accept and negotiation controls.
 */
export interface DealActionsProps {
  deal: BrandDeal
  displayDeal: BrandDeal
  isRevoked?: boolean
  hasNegotiated?: boolean
  negotiationState?: DealCardProps['negotiationState']
  handleAcceptDeal: (deal: BrandDeal) => void | Promise<void>
  handleNegotiationStart: (deal: BrandDeal) => void
}

/**
 * Client-side state for one negotiated brand deal.
 */
export interface DealNegotiationState {
  deal?: BrandDeal | null
  status?: 'REVOKED' | 'FAILED' | 'SUCCESS' | 'WORSENED'
  feedback?: string
  success?: boolean
  [key: string]: unknown
}

/**
 * Resolved outcome of a brand-deal negotiation.
 */
export interface NegotiationResult {
  success: boolean
  deal: BrandDeal | null
  feedback: string
  status: 'ACCEPTED' | 'REVOKED' | 'FAILED'
}

/**
 * State and handlers returned by the deal-negotiation hook.
 */
export interface DealNegotiationHook {
  negotiatedDeals: Record<string, DealNegotiationState>
  negotiationModalOpen: boolean
  setNegotiationModalOpen: (open: boolean) => void
  selectedDeal: BrandDeal | null
  negotiationResult: NegotiationResult | null
  handleNegotiationStart: (deal: BrandDeal) => void
  handleAcceptDeal: (deal: BrandDeal) => Promise<void>
  handleNegotiationSubmit: (
    submission: 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE'
  ) => void
}

/**
 * Props for the post-gig brand-deals phase.
 */
export interface DealsPhaseProps {
  offers: BrandDeal[]
  onAccept: (deal: BrandDeal) => void | Promise<void>
  onSkip: () => void
}

/**
 * Props for rendering an income or expense list.
 */
export interface FinancialListProps {
  items: FinancialItem[]
  type: 'income' | 'expense'
}

/**
 * Props for the brand-deal negotiation modal.
 */
export interface NegotiationModalProps {
  isOpen: boolean
  onClose: () => void
  negotiationResult: NegotiationResult | null
  handleNegotiationSubmit: (
    submission: 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE'
  ) => void
}

/**
 * Event option shape consumed by the event modal UI.
 */
export interface EventModalOption extends EventOption {
  label?: string
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

/**
 * Game event shape after event-modal option normalization.
 */
export interface EventModalEvent extends GameEvent {
  options?: EventModalOption[]
}

/**
 * Precomputed event-resolution result passed to the modal.
 */
export interface EventModalPrecomputedResult {
  result?: unknown
  delta?: unknown
  appliedDelta?: unknown
  outcomeText?: string
  description?: string
}

/**
 * One localized financial breakdown row.
 */
export interface FinancialItem {
  label?: string
  labelKey: string
  value: number
  detail?: string
  detailKey?: string
  detailParams?: Record<string, unknown>
}

/**
 * Financial breakdown category with total and rows.
 */
export interface FinancialCategory {
  total: number
  breakdown: FinancialItem[]
}

/**
 * Props for the post-gig financial report phase.
 */
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
  target?: 'player' | 'band' | 'van' | 'performance'
  stat?: string
  id?: string
  key?: string
}

/**
 * Catalog effect definitions applied when purchases resolve.
 */
export type Effect =
  | (EffectBase & { type: 'inventory_add'; item: string; value: number })
  | (EffectBase & { type: 'inventory_set'; item: string; value: unknown })
  | (EffectBase & {
      type: 'stat_modifier'
      target: 'player' | 'band' | 'van' | 'performance'
      stat: string
      value: number
    })
  | (EffectBase & { type: 'unlock_upgrade'; id: string })
  | (EffectBase & { type: 'passive'; key: string; value?: unknown })
  | (EffectBase & { type: 'unlock_hq'; id: string })

/**
 * Raw catalog effect input before normalization.
 */
export type CatalogInputEffect = Effect | Record<string, unknown>

/**
 * Purchase catalogue item shape accepted by shop UI.
 */
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

/**
 * Normalized purchasable catalog item with required id and cost.
 */
export interface CatalogItem extends PurchaseItem {
  id: string | number
  cost: number
}

/**
 * Raw catalog item shape accepted before effect normalization.
 */
export interface CatalogInputItem extends Omit<
  PurchaseItem,
  'effect' | 'effects'
> {
  id: string | number
  cost: number
  effect?: CatalogInputEffect | null
  effects?: CatalogInputEffect[] | CatalogInputEffect | null
  [key: string]: unknown
}

/**
 * Void trader catalog item with required string id.
 */
export interface VoidTraderItem extends PurchaseItem {
  id: string
  rarity?: 'rare' | 'epic'
}

/**
 * Currency balance map keyed by currency identifier.
 */
export type Balances = Record<string, number>

/**
 * Props shared by catalog consumers that render buy actions.
 */
export interface CatalogConsumerProps {
  items: CatalogItem[]
  processingItemId?: string | number
  handleBuy: (item: CatalogItem) => void
  isItemOwned: (item: CatalogItem) => boolean
  isItemDisabled: (item: CatalogItem) => boolean
  getAdjustedCost?: (item: CatalogItem) => number | undefined
}

/**
 * Props for one purchase catalog tab.
 */
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

/**
 * Visual category for unlock feedback messages.
 */
export type UnlockMessageKind = 'success' | 'error' | 'info'

/**
 * Localized unlock feedback message payload.
 */
export type UnlockMessage = {
  options?: Record<string, unknown>
  messageKey: string
  fallback?: string
  type: UnlockMessageKind
}
