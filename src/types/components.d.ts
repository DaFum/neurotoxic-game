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
 * Message data and callbacks required to render and dismiss one chatter entry.
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
 * Post-gig social option plus selection metadata for one strategy button.
 */
export interface SocialOptionButtonProps {
  opt: SocialOption
  index: number
  onSelect: (option: SocialOption) => void
  /** When true the button is disabled (e.g. another action is in-flight). */
  disabled?: boolean
}

/**
 * Visibility and exit callbacks for the gig pause overlay.
 */
export interface PauseOverlayProps {
  isPaused: boolean
  onResume: () => void
  onQuit: () => void
}

/**
 * Shared imperative logic contract for Pixi-backed minigames.
 *
 * @typeParam TState - Mutable ref state read by the minigame stage controller.
 */
export interface MinigameLogicBase<TState = unknown> {
  gameStateRef: RefObject<TState>
  update: (deltaMS: number) => void
  finishMinigame?: () => void
  dispatch?: (action: import('../types/game').GameAction) => void
}

/**
 * Stage, logic, completion, and overlay content for the reusable Pixi minigame shell.
 *
 * @typeParam TState - Mutable ref state shared by logic and the Pixi controller.
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
 *
 * @typeParam TState - Mutable state exposed to the stage controller.
 */
export interface StageControllerOptions<TState = unknown> {
  containerRef: RefObject<HTMLElement | null>
  gameStateRef: RefObject<TState>
  updateRef: MutableRefObject<((dt: number) => void) | null>
}

/**
 * React host inputs for creating, updating, and disposing a Pixi stage controller.
 *
 * @typeParam TState - Mutable ref state consumed by the created controller.
 */
export interface PixiStageProps<TState = unknown> {
  gameStateRef: RefObject<TState>
  update: (deltaMS: number) => void
  controllerFactory: (options: StageControllerOptions<TState>) => PixiController
}

/**
 * Player resource slice displayed in the clinic header.
 */
export interface ClinicHeaderProps {
  player: Pick<PlayerState, 'money' | 'fame'>
}

/**
 * Band member, resources, costs, and action callbacks for one clinic treatment card.
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
 * Amp calibration input state and optional hazard action callbacks.
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
 * Amp calibration telemetry shown in the status HUD.
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
 * Callback invoked when the player unlocks browser audio.
 */
export interface AudioLockedOverlayProps {
  onInitializeAudio: () => void
}

/**
 * Image URLs and ref setter used to position DOM band members over the stage.
 */
export interface BandMembersLayerProps {
  matzeUrl: string
  mariusUrl: string
  larsUrl: string
  setBandMemberRef: (index: number) => (el: HTMLElement | null) => void
}

/**
 * Visibility state and movement callbacks for Roadie directional controls.
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
 * Roadie delivery, damage, and carried-item state displayed in the HUD.
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
 * Movement callbacks for the tourbus minigame's left/right touch targets.
 */
export interface TourbusControlsProps {
  onMoveLeft: () => void
  onMoveRight: () => void
}

/**
 * Tourbus distance and raw damage values shown during travel.
 */
export interface TourbusHUDProps {
  distance: number
  damage: number
}

/**
 * Travel endpoints, guard ref, and completion callback for the animated overworld van.
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
 * Post-gig outcome, optional PR action, and continuation state.
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
  hasSpun?: boolean
  pedalHarmonyPenalty?: number
}

/**
 * Brand deal offer data and action handlers for one card.
 */
export interface DealCardProps {
  deal: BrandDeal
  negotiationState?: DealNegotiationState
  brandReputation?: Record<string, number>
  handleAcceptDeal: (deal: BrandDeal) => void | Promise<void>
  handleNegotiationStart: (deal: BrandDeal) => void
  /** When true the accept button is disabled (e.g. another deal action is in-flight). */
  isProcessing?: boolean
}

/**
 * Brand alignment and alt text source for the deal thumbnail.
 */
export interface DealImageProps {
  alignment?: string
  name: string
}

/**
 * Localized brand deal details, revocation state, and reputation context.
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
 * Brand deal action state and callbacks for accept/negotiation controls.
 */
export interface DealActionsProps {
  deal: BrandDeal
  displayDeal: BrandDeal
  isRevoked?: boolean
  hasNegotiated?: boolean
  negotiationState?: DealCardProps['negotiationState']
  handleAcceptDeal: (deal: BrandDeal) => void | Promise<void>
  handleNegotiationStart: (deal: BrandDeal) => void
  /** When true the accept button is disabled (e.g. another deal action is in-flight). */
  isProcessing?: boolean
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
 * Offer list and flow callbacks for the post-gig brand-deals phase.
 */
export interface DealsPhaseProps {
  offers: BrandDeal[]
  onAccept: (deal: BrandDeal) => void | Promise<void>
  onSkip: () => void
  /** When true the accept buttons are disabled (e.g. a deal action is in-flight). */
  isProcessing?: boolean
}

/**
 * Financial breakdown rows and category type for signed amount formatting.
 */
export interface FinancialListProps {
  items: FinancialItem[]
  type: 'income' | 'expense'
}

/**
 * Modal state, current result, and tactic submission callback for deal negotiation.
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
 * Financial report data and continuation callback for the post-gig report step.
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
 * Catalog items, balances, and pre-bound purchase callbacks for one Band HQ tab.
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
