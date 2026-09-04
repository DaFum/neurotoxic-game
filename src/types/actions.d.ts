import type { EventDelta } from './events'
import type { ExpeditionRepairIntent, HiddenDefectTrigger } from './expedition'

/**
 * Payload produced when the tourbus travel minigame finishes.
 */
export interface CompleteTravelMinigamePayload {
  damageTaken: number
  itemsCollected: unknown[]
  rngValue?: number
  contrabandId?: string
  instanceId?: string
}

/**
 * Payload for clinic member treatment actions.
 */
export interface ClinicActionPayload {
  memberId: string
  type: 'heal' | 'enhance'
  staminaGain?: number
  moodGain?: number
  trait?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
  getSuccessToast?: (...args: number[]) => unknown
  [key: string]: unknown
}

/**
 * Costs and gains shared by every once-per-day zealotry social action.
 */
export interface ZealotryActionConfig {
  COST: number
  FAME_GAIN: number
  ZEALOTRY_GAIN: number
  CONTROVERSY_GAIN: number
  HARMONY_COST: number
  REQUIRED_CONTROVERSY?: number
  REQUIRED_ZEALOTRY?: number
}

/**
 * Tuning values for the dark-web leak action.
 */
export interface DarkWebLeakConfig extends ZealotryActionConfig {
  REQUIRED_CONTROVERSY: number
}

/**
 * Tuning values for the cult indoctrination action.
 */
export interface CultIndoctrinationConfig extends ZealotryActionConfig {
  REQUIRED_ZEALOTRY: number
}

/**
 * Reducer payload shared by the zealotry social actions.
 *
 * @remarks
 * `applyZealotryAction` consumes this shape for the pirate broadcast, dark-web
 * leak, and cult indoctrination alike.
 */
export interface ZealotryActionPayload {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/** Reducer payload for resolving a cult indoctrination. */
export type CultIndoctrinationPayload = ZealotryActionPayload

/** Reducer payload for resolving a dark-web leak. */
export type DarkWebLeakPayload = ZealotryActionPayload

/** Reducer payload for resolving a pirate broadcast. */
export type PirateBroadcastPayload = ZealotryActionPayload

/**
 * Reducer payload for blood-bank donation outcomes.
 */
export interface BloodBankDonatePayload {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for void trader purchases.
 */
export interface TradeVoidItemPayload {
  contrabandId: string
  fameCost: number
  instanceId?: string
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Reducer payload for merch press outcomes.
 */
export interface MerchPressPayload {
  cost: number
  loyaltyGain: number
  controversyGain: number
  fameGain: number
  harmonyCost: number
  successToast?: Omit<ToastPayload, 'id'> & Partial<Pick<ToastPayload, 'id'>>
}

/**
 * Player update payload or reducer-time updater.
 */
export type UpdatePlayerPayload =
  Partial<PlayerState> | ((player: PlayerState) => Partial<PlayerState>)

/**
 * Band update payload or reducer-time updater.
 */
export type UpdateBandPayload =
  Partial<BandState> | ((band: BandState) => Partial<BandState>)

/**
 * Payload used when resetting state while preserving selected settings.
 */
export interface ResetStatePayload extends UnknownRecord {
  settings?: RawGameSettings
  unlocks?: string[]
}

/**
 * Event delta payload plus active story flags and queued events.
 */
export interface EventDeltaPayload extends EventDelta {
  activeStoryFlags?: string[]
  pendingEvents?: string[]
}

/**
 * Payload for removing one queued event id.
 *
 * @remarks
 * Omitting `eventId` pops the queue head, which is what draining an
 * unplayable head needs. Passing the id of the event that was actually played
 * removes that entry wherever it sits, so a head the engine skipped over does
 * not leave the played entry queued for a replay.
 */
export interface PopPendingEventPayload {
  eventId?: string
}

/**
 * Payload for spawning a rival band.
 */
export interface SpawnRivalBandPayload {
  rivalBand: RivalBandState
}

/**
 * Payload for moving a rival band to a map node.
 */
export interface MoveRivalBandPayload {
  rivalBand: RivalBandState
}

/**
 * Payload claiming a fresh Expedition run identity and root run seed.
 *
 * @remarks
 * `runSeed` is the next value of the canonical root `GameState.runSeed`; the
 * Expedition slice never stores a seed of its own.
 */
export interface PrepareExpeditionRunPayload {
  prepId: string
  runSeed: number
}

/**
 * Payload starting the prepared Expedition run as one transaction.
 *
 * @remarks
 * `expectedRunSeed` is a stale guard against the canonical root
 * `GameState.runSeed`, and `loadout` is a *candidate*: the reducer revalidates
 * it against the route rebuilt from that seed and stores only the normalized
 * result.
 */
export interface StartExpeditionPayload {
  prepId: string
  expectedRunSeed: number
  loadout: unknown
}

/**
 * Payload advancing the run one node deeper along the prepared route.
 */
export interface AdvanceExpeditionRoutePayload {
  nodeId: string
  expectedRouteStep: number
}

/**
 * Payload raising one node's Fog-of-War intel by exactly one level.
 */
export interface RevealExpeditionNodeIntelPayload {
  nodeId: string
  source: import('./expedition').ExpeditionIntelSource
  expectedLevel: 0 | 1
  expectedRouteStep: number
  grantId?: string
}

/**
 * Payload banking one source-proven rare reward in the run ledger.
 */
export interface AddExpeditionRewardPayload {
  expectedRewardId: string
  sourceType: import('./expedition').ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}

/**
 * Payload extracting voluntarily at a legal extraction window.
 */
export interface ExtractExpeditionPayload {
  expectedRouteStep: number
  explicitRareRewardIds: string[]
}

/**
 * Payload completing the run after a successful Finale.
 */
export interface CompleteExpeditionPayload {
  finaleResultId: string
  expectedRouteStep: number
}

/**
 * Payload accepting the run's current source-derived failure.
 */
export interface AcceptExpeditionFailurePayload {
  pendingFailureId: string
  expectedRouteStep: number
}

/**
 * Payload returning a finalized run to `idle`.
 */
export interface PrepareNextExpeditionPayload {
  runId: string
}

/**
 * Payload paying for a recovery option on the run's current crisis.
 */
export interface ResolveExpeditionCrisisPayload {
  pendingFailureId: string
  choice: 'refuel' | 'tow' | 'insurance_claim'
  expectedRouteStep: number
}

/**
 * Payload executing a repair on equipment during an active Expedition run.
 */
export type ExecuteExpeditionRepairPayload = ExpeditionRepairIntent

/**
 * Payload revealing a hidden equipment defect during an active Expedition run.
 */
export interface RevealExpeditionDefectPayload {
  defectId: string
  source: string
  expectedRouteStep: number
}

/**
 * Payload triggering an equipment defect during an active Expedition run.
 */
export interface TriggerExpeditionDefectPayload {
  defectId: string
  trigger: HiddenDefectTrigger
  expectedRouteStep: number
}

/**
 * Payload resolving an equipment defect during an active Expedition run.
 */
export interface ResolveExpeditionDefectPayload {
  defectId: string
  repairResolutionId: string
  expectedRouteStep: number
}

/**
 * Payload executing an inspection on equipment during an active Expedition run.
 */
export type ExecuteExpeditionInspectionPayload =
  import('./expedition').ExpeditionInspectionIntent

/**
 * Payload executing an insurance claim during an active Expedition run.
 */
export type ClaimExpeditionInsurancePayload =
  import('./expedition').ExpeditionInsuranceClaimIntent

/**
 * Payload accepting an explicit technical failure on equipment.
 */
export interface AcceptExpeditionTechnicalFailurePayload {
  expectedRouteStep: number
}
