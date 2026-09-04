/**
 * Reducer handlers for the run-scoped Expedition lifecycle.
 *
 * @remarks
 * These handlers are the sole authority over Expedition run transitions.
 * Public actions carry intent plus genuinely nondeterministic tokens and stale
 * guards only; every derived value (run identity, committed build, settlement)
 * is recomputed or exact-validated here, so a forged or replayed dispatch can
 * never author a state the normal flow would not produce. Scene navigation and
 * persistence stay outside: a terminal handler settles state and the owning
 * continuation callback performs the save and scene change.
 */

import { isFiniteNumber } from '../../utils/finiteNumber'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { isForbiddenKey } from '../../utils/objectUtils'
import { clampPlayerFame, clampPlayerMoney } from '../../utils/gameState'
import {
  NEUTRAL_EXPEDITION_ROUTE_PROFILE,
  createDefaultExpeditionState
} from '../../domain/expedition/defaults'
import { buildExpeditionMap } from '../../domain/expedition/map'
import {
  canSpendExpeditionCash,
  getExpeditionFuelTopUpCost,
  validateExpeditionBuildCommitment
} from '../../domain/expedition/loadout'
import { materializeExpeditionCargo } from '../../domain/expedition/cargo'
import {
  clampCondition,
  createDefaultTechnicalCondition,
  getExpeditionTechnicalCondition
} from '../../domain/expedition/condition'
import { resolveExpeditionRepair } from '../../domain/expedition/repairs'
import {
  DEFECT_SEVERITY_DAMAGE,
  createDeterministicHiddenDefect
} from '../../domain/expedition/defects'
import { resolveExpeditionIntelReveal } from '../../domain/expedition/nodeIntel'
import {
  materializeExpeditionReward,
  resolveExpeditionReward,
  resolveExpeditionRewardDefinition
} from '../../domain/expedition/rewardLedger'
import {
  canExtractExpedition,
  settleExpedition,
  type ExpeditionTerminalKind
} from '../../domain/expedition/extraction'
import {
  EXPEDITION_TOW_COST,
  EXPEDITION_TOW_FUEL_RESTORED,
  deriveExpeditionPendingFailure,
  isCurrentExpeditionFailureId
} from '../../domain/expedition/failure'
import { calculateRefuelCost } from '../../utils/economy'
import { EXPENSE_CONSTANTS } from '../../utils/economy/constants'
import type { GameState } from '../../types'
import type {
  AcceptExpeditionFailurePayload,
  AddExpeditionRewardPayload,
  AdvanceExpeditionRoutePayload,
  CompleteExpeditionPayload,
  ExtractExpeditionPayload,
  PrepareExpeditionRunPayload,
  PrepareNextExpeditionPayload,
  ResolveExpeditionCrisisPayload,
  ResolveExpeditionDefectPayload,
  RevealExpeditionDefectPayload,
  RevealExpeditionNodeIntelPayload,
  StartExpeditionPayload,
  TriggerExpeditionDefectPayload
} from '../../types/actions'
import type {
  ExpeditionFailureReason,
  ExpeditionRepairIntent,
  ExpeditionSettlement,
  ExpeditionTechnicalCondition,
  NodeIntelLevel
} from '../../types/expedition'

/**
 * Narrows a payload seed to the unsigned 32-bit integer range the root
 * `runSeed` contract uses.
 *
 * @param value - Candidate seed from an untrusted dispatch.
 * @returns True when the value is already a valid persistable run seed.
 *
 * @remarks
 * This validates rather than coerces: a reducer that silently truncated a
 * malformed seed would commit a run whose map the Tour Prep preview never
 * showed.
 */
const isValidRunSeed = (value: unknown): value is number =>
  isFiniteNumber(value) &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 0xffffffff

/**
 * Prepares a run identity and atomically claims the root run seed.
 *
 * @param state - Current game state.
 * @param payload - Prep id and the next persistable run seed.
 * @returns Next state, or the identical reference when the action is illegal.
 *
 * @remarks
 * Accepted only from `idle`. Reopening Tour Prep while `prepared` is edit-only,
 * so a second PREPARE returns the same state reference and never rerolls the
 * seed — otherwise the previewed map and the started map could diverge.
 */
export const handlePrepareExpeditionRun = (
  state: GameState,
  payload: PrepareExpeditionRunPayload
): GameState => {
  if (state.expedition.status !== 'idle') return state
  if (payload === null || typeof payload !== 'object') return state

  const { prepId, runSeed } = payload
  if (typeof prepId !== 'string' || prepId.length === 0) return state
  if (!isValidRunSeed(runSeed)) return state

  return {
    ...state,
    runSeed,
    expedition: {
      ...createDefaultExpeditionState(),
      status: 'prepared',
      prep: { prepId }
    }
  }
}

/**
 * Starts the prepared run as one transaction.
 *
 * @param state - Current game state.
 * @param payload - Prep id, the expected root seed, and the candidate loadout.
 * @returns Next state, or the identical reference when any precondition fails.
 *
 * @remarks
 * Every precondition is re-derived here rather than trusted: the route is
 * rebuilt from the canonical root `runSeed` plus the committed Tour/Region and
 * the loadout is validated against *that* route, so a caller cannot start a run
 * on a route the Tour Prep preview never showed. Fuel and Cash are applied
 * exactly once, and the run's Cash/Fame baselines are stamped after the pre-run
 * fuel payment so the settlement measures only what the run itself earned.
 */
export const handleStartExpedition = (
  state: GameState,
  payload: StartExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'prepared') return state
  if (payload === null || typeof payload !== 'object') return state

  const { prepId, expectedRunSeed, loadout } = payload
  if (typeof prepId !== 'string' || prepId.length === 0) return state
  if (state.expedition.prep?.prepId !== prepId) return state
  // Stale guard, not an instruction: a preview built against a different seed
  // must not be able to start.
  if (!isValidRunSeed(expectedRunSeed)) return state
  if (expectedRunSeed !== state.runSeed) return state
  if (loadout === null || typeof loadout !== 'object') return state

  const tourTypeId = (loadout as { tourTypeId?: unknown }).tourTypeId
  const regionId = (loadout as { regionId?: unknown }).regionId
  if (typeof tourTypeId !== 'string' || typeof regionId !== 'string') {
    return state
  }

  const preparedMap = buildExpeditionMap(
    state.runSeed,
    tourTypeId,
    regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  const validation = validateExpeditionBuildCommitment(
    state,
    loadout,
    preparedMap
  )
  if (!validation.valid) return state
  const normalized = validation.normalized

  const currentFuel = isFiniteNumber(state.player.van?.fuel)
    ? state.player.van.fuel
    : 0
  const fuelCost = getExpeditionFuelTopUpCost(
    currentFuel,
    normalized.build.startingFuelTarget
  )
  const money = isFiniteNumber(state.player.money) ? state.player.money : 0
  // The protected slice is untouchable from the very first spend, including the
  // pre-run top-up: otherwise the build could protect cash it then spends.
  if (money - fuelCost < normalized.build.protectedCareerCash) return state

  const nextMoney = money - fuelCost
  const fame = isFiniteNumber(state.player.fame) ? state.player.fame : 0

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney,
      currentNodeId: preparedMap.startNodeId,
      van: { ...state.player.van, fuel: normalized.build.startingFuelTarget }
    },
    // The committed songs are installed into the root setlist in the same
    // commit. PreGig and the rhythm engine read `state.setlist`, not the
    // loadout, so leaving them out of sync would start the run with an empty
    // setlist — and the commitment freeze would then reject every edit that
    // tried to repair it.
    setlist: normalized.build.setlistSongIds.map(id => ({ id })),
    // The Expedition route becomes the played map, so the existing overworld,
    // travel and gig flow drive the run instead of a parallel route surface.
    // Cloned rather than aliased: `buildExpeditionMap` memoizes its result, and
    // handing the cached object graph to mutable game state would let a later
    // in-place node update corrupt every rebuild of the same route.
    gameMap: structuredClone({
      nodes: preparedMap.nodes,
      connections: preparedMap.connections
    }),
    expedition: {
      ...createDefaultExpeditionState(),
      status: 'active',
      prep: { prepId },
      runId: prepId,
      routeStep: 0,
      visitedNodeIds: [preparedMap.startNodeId],
      loadout: normalized,
      startingMoney: nextMoney,
      startingFame: fame,
      protectedCareerCash: normalized.build.protectedCareerCash,
      cargo: materializeExpeditionCargo(normalized, state),
      technicalCondition: createDefaultTechnicalCondition()
    }
  }
}

/**
 * Advances the run to the next node on the prepared route.
 *
 * @param state - Current game state.
 * @param payload - Target node and the route step the caller believes it is on.
 * @returns Next state, or the identical reference for an illegal move.
 *
 * @remarks
 * Route progression is reducer-authoritative: the target must be a real
 * neighbour of the current node on the route rebuilt from the canonical seed,
 * and must sit exactly one route step deeper. That makes a forged jump to the
 * Finale — and a replayed arrival — a no-op rather than free progress. The
 * extraction windows the run has seen are recorded here, because a window the
 * player passed up is what makes the extraction decision a real one.
 */
export const handleAdvanceExpeditionRoute = (
  state: GameState,
  payload: AdvanceExpeditionRoutePayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  const { expectedRouteStep } = payload
  if (
    !isFiniteNumber(expectedRouteStep) ||
    expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }
  return applyExpeditionRouteAdvance(state, payload.nodeId)
}

/**
 * Advances the run one node deeper, without the public stale guard.
 *
 * @param state - Current game state.
 * @param nodeId - Target node.
 * @returns Next state, or the identical reference for an illegal move.
 *
 * @remarks
 * A pure state-to-state helper rather than a dispatched action, so the travel
 * reducer can commit the player's move and the run's route step in one atomic
 * pass — two dispatches could leave `player.currentNodeId` a node deeper than
 * `expedition.routeStep`. Same authority as the public action: the target must
 * be a real neighbour exactly one step deeper, and a run that is not active
 * leaves the state untouched.
 */
export const applyExpeditionRouteAdvance = (
  state: GameState,
  nodeId: unknown
): GameState => {
  // Optional read: the travel reducer composes this on every arrival, so a
  // state without the slice must be a no-op rather than a crash in the
  // unrelated Career travel path.
  if (state.expedition?.status !== 'active') return state
  if (typeof nodeId !== 'string' || isForbiddenKey(nodeId)) return state

  const loadout = state.expedition.loadout
  if (!loadout) return state
  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  if (!Object.hasOwn(map.meta, nodeId)) return state
  const target = map.meta[nodeId]
  if (!target || target.routeStep !== state.expedition.routeStep + 1) {
    return state
  }

  const currentNodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (typeof currentNodeId !== 'string') return state
  const isNeighbour = map.connections.some(
    edge => edge.from === currentNodeId && edge.to === nodeId
  )
  if (!isNeighbour) return state

  const extractionWindowsSeen = [...state.expedition.extractionWindowsSeen]
  if (
    target.isExtractionWindow &&
    !extractionWindowsSeen.includes(target.routeStep)
  ) {
    extractionWindowsSeen.push(target.routeStep)
  }

  const advanced: GameState = {
    ...state,
    player: { ...state.player, currentNodeId: nodeId },
    expedition: {
      ...state.expedition,
      routeStep: target.routeStep,
      visitedNodeIds: [...state.expedition.visitedNodeIds, nodeId],
      extractionWindowsSeen
    }
  }

  // Arriving on a node that carries a route rare is the canonical evidence for
  // it, so the ledger entry is banked in the same pass. Composed rather than
  // dispatched: a separate action could be missed and would leave the reward
  // unearnable, and `resolveExpeditionReward` still proves the evidence, so a
  // replayed arrival collides with the existing entry instead of paying twice.
  const rareRewardId = target.hidden.rareRewardId
  if (rareRewardId === null) return advanced

  const definition = resolveExpeditionRewardDefinition(rareRewardId)
  if (!definition) return advanced
  const resolution = resolveExpeditionReward(
    advanced,
    {
      expectedRewardId: definition.id,
      sourceType: definition.sourceType,
      sourceId: nodeId,
      expectedRouteStep: advanced.expedition.routeStep
    },
    map
  )
  if (!resolution.ok) return advanced

  return {
    ...advanced,
    expedition: {
      ...advanced.expedition,
      rewardLedger: [...advanced.expedition.rewardLedger, resolution.entry]
    }
  }
}

/**
 * Raises one node's intel by exactly one level.
 *
 * @param state - Current game state.
 * @param payload - Node, source, and the stale guards.
 * @returns Next state, or the identical reference when the reveal is refused.
 *
 * @remarks
 * The transition and the entitlement are both resolved by the shared pure
 * resolver, so a caller can neither pick its own target level nor claim a
 * source it has not earned. A grant is consumed in the same commit as the
 * reveal it paid for, which is what makes a replayed dispatch a refusal.
 */
export const handleRevealExpeditionNodeIntel = (
  state: GameState,
  payload: RevealExpeditionNodeIntelPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  const loadout = state.expedition.loadout
  if (!loadout) return state

  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  const resolution = resolveExpeditionIntelReveal(state, payload, map)
  if (!resolution.ok) return state

  const intelByNodeId = Object.assign(
    Object.create(null) as Record<string, NodeIntelLevel>,
    state.expedition.intelByNodeId
  )
  intelByNodeId[resolution.nodeId] = resolution.nextLevel

  const intelGrants =
    resolution.consumedGrantId === null
      ? state.expedition.intelGrants
      : state.expedition.intelGrants.map(grant =>
          grant.id === resolution.consumedGrantId
            ? { ...grant, consumed: true }
            : grant
        )

  const scoutReconUsedRouteSteps =
    resolution.reconRouteStep === null
      ? state.expedition.scoutReconUsedRouteSteps
      : [
          ...state.expedition.scoutReconUsedRouteSteps,
          resolution.reconRouteStep
        ]

  return {
    ...state,
    expedition: {
      ...state.expedition,
      intelByNodeId,
      intelGrants,
      scoutReconUsedRouteSteps
    }
  }
}

/**
 * Appends one source-proven rare reward to the run ledger.
 *
 * @param state - Current game state.
 * @param payload - Reward id, source family, source evidence and stale guard.
 * @returns Next state, or the identical reference when the reward is refused.
 *
 * @remarks
 * Nothing is materialized here. The design forbids granting a persistent reward
 * before the run that owns it resolves, so the entry is only banked in the
 * ledger; materialization happens once, after terminal settlement succeeds.
 */
export const handleAddExpeditionReward = (
  state: GameState,
  payload: AddExpeditionRewardPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  const loadout = state.expedition.loadout
  if (!loadout) return state

  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  const resolution = resolveExpeditionReward(state, payload, map)
  if (!resolution.ok) return state

  return {
    ...state,
    expedition: {
      ...state.expedition,
      rewardLedger: [...state.expedition.rewardLedger, resolution.entry]
    }
  }
}

/**
 * Applies a finalized settlement to the player's Cash and Fame.
 *
 * @remarks
 * Only the *forfeited* share is deducted: the retained share is already in the
 * player's balance, and the pre-run balance plus the protected Career slice sit
 * below the run's baselines, so neither can be confiscated by a settlement.
 */
const applyExpeditionSettlement = (
  state: GameState,
  settlement: ExpeditionSettlement
): GameState => ({
  ...state,
  player: {
    ...state.player,
    money: clampPlayerMoney(
      finiteNumberOr(state.player.money, 0) - settlement.moneyForfeited
    ),
    fame: clampPlayerFame(
      finiteNumberOr(state.player.fame, 0) - settlement.fameForfeited
    )
  }
})

/**
 * Materializes every retained reward exactly once.
 *
 * @remarks
 * The ledger's `materialized` flag is the idempotency key, so a duplicate
 * terminal dispatch cannot pay a reward twice even if it somehow reached here.
 */
const materializeRetainedRewards = (
  state: GameState,
  retainedRewardEntryIds: readonly string[]
): GameState => {
  const retained = new Set(retainedRewardEntryIds)
  let next = state
  const ledger = state.expedition.rewardLedger.map(entry => {
    if (!retained.has(entry.id) || entry.materialized) return entry
    const definition = resolveExpeditionRewardDefinition(
      entry.rewardDefinitionId
    )
    // A definition that no longer resolves (a reward retired between builds)
    // has nothing to apply, but the entry is still marked settled: leaving it
    // unmaterialized would make `PREPARE_NEXT_EXPEDITION` refuse forever and
    // strand the player on the run summary.
    if (!definition) return { ...entry, materialized: true }
    next = materializeExpeditionReward(next, definition)
    return { ...entry, materialized: true }
  })

  return {
    ...next,
    expedition: { ...next.expedition, rewardLedger: ledger }
  }
}

/**
 * Commits one terminal transition and its settlement.
 *
 * @remarks
 * Scene navigation stays outside the reducer: this settles state only, and the
 * owning committed-state continuation callback performs the save and the move
 * to the run summary.
 */
const finalizeExpedition = (
  state: GameState,
  kind: ExpeditionTerminalKind,
  options: {
    reason: ExpeditionFailureReason | null
    finaleResultId: string | null
    explicitRareRewardIds: readonly string[]
  }
): GameState => {
  const runId = state.expedition.runId
  if (typeof runId !== 'string') return state

  const settlement = settleExpedition(
    state,
    kind,
    options.explicitRareRewardIds
  )
  const settled = applyExpeditionSettlement(state, settlement)
  const materialized = materializeRetainedRewards(
    settled,
    settlement.retainedRewardEntryIds
  )

  return {
    ...materialized,
    expedition: {
      ...materialized.expedition,
      status: kind,
      pendingFailure: null,
      outcome: {
        runId,
        kind,
        reason: options.reason,
        finalizedAtRouteStep: state.expedition.routeStep,
        settlement,
        finaleResultId: options.finaleResultId
      }
    }
  }
}

/**
 * Extracts voluntarily at a legal extraction window.
 *
 * @param state - Current game state.
 * @param payload - Stale guard plus the rare rewards to carry out.
 * @returns Next state, or the identical reference when extraction is illegal.
 *
 * @remarks
 * The window is re-derived from the route rather than trusted, so a caller
 * cannot extract from a step the route does not offer one at. A replayed
 * extraction finds the run already terminal and is a no-op.
 */
export const handleExtractExpedition = (
  state: GameState,
  payload: ExtractExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  const loadout = state.expedition.loadout
  if (!loadout) return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  const currentNodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  const atWindow =
    typeof currentNodeId === 'string' &&
    Object.hasOwn(map.meta, currentNodeId) &&
    map.meta[currentNodeId]?.isExtractionWindow === true
  if (!canExtractExpedition(state, atWindow)) return state

  const explicitRareRewardIds = Array.isArray(payload.explicitRareRewardIds)
    ? payload.explicitRareRewardIds.filter(id => typeof id === 'string')
    : []

  return finalizeExpedition(state, 'extracted', {
    reason: null,
    finaleResultId: null,
    explicitRareRewardIds
  })
}

/**
 * Completes the run after a successful Finale.
 *
 * @param state - Current game state.
 * @param payload - The Finale result id and the stale guard.
 * @returns Next state, or the identical reference without Finale evidence.
 *
 * @remarks
 * Completion requires the run to actually be standing on the Finale node of the
 * route rebuilt from the canonical seed. Without that, "completed" — the only
 * terminal kind that keeps every rare reward and the full share — would be
 * caller-authorized.
 */
export const handleCompleteExpedition = (
  state: GameState,
  payload: CompleteExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  const loadout = state.expedition.loadout
  if (!loadout) return state
  const { finaleResultId, expectedRouteStep } = payload
  if (typeof finaleResultId !== 'string' || finaleResultId.length === 0) {
    return state
  }
  if (
    !isFiniteNumber(expectedRouteStep) ||
    expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
  const currentNodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (currentNodeId !== map.finaleNodeId) return state
  if (map.meta[map.finaleNodeId]?.routeStep !== state.expedition.routeStep) {
    return state
  }

  return finalizeExpedition(state, 'completed', {
    reason: null,
    finaleResultId,
    explicitRareRewardIds: []
  })
}

/**
 * Accepts the run's current, source-derived failure.
 *
 * @param state - Current game state.
 * @param payload - The crisis id and the stale guard.
 * @returns Next state, or the identical reference for a forged or stale id.
 *
 * @remarks
 * The id is matched against the *freshly derived* crisis rather than the stored
 * copy, so a run that has since recovered cannot be ended by a replayed accept,
 * and a forged reason cannot end a healthy run.
 */
export const handleAcceptExpeditionFailure = (
  state: GameState,
  payload: AcceptExpeditionFailurePayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }
  const derived = deriveExpeditionPendingFailure(state)
  if (!derived) return state
  if (!isCurrentExpeditionFailureId(state, payload.pendingFailureId)) {
    return state
  }

  return finalizeExpedition(state, 'failed', {
    reason: derived.reason,
    finaleResultId: null,
    explicitRareRewardIds: []
  })
}

/**
 * Returns a finalized run to `idle` so the next tour can be prepared.
 *
 * @param state - Current game state.
 * @param payload - The finalized run id.
 * @returns Next state, or the identical reference for a mismatched run.
 *
 * @remarks
 * Accepted only once, and only for the run that actually finalized, so the
 * outcome cannot be cleared before its settlement was read. G5 later adds its
 * Between-Tour gate to the selector that enables this action; the reducer
 * contract here is deliberately independent of it, so G1B passes without a
 * post-run decision layer installed.
 */
export const handlePrepareNextExpedition = (
  state: GameState,
  payload: PrepareNextExpeditionPayload
): GameState => {
  const { status, runId, outcome } = state.expedition
  if (status !== 'extracted' && status !== 'completed' && status !== 'failed') {
    return state
  }
  if (payload === null || typeof payload !== 'object') return state
  if (typeof payload.runId !== 'string' || payload.runId !== runId) return state
  if (!outcome || outcome.runId !== runId) return state
  // Every retained reward must already be applied: returning to idle drops the
  // ledger, so an unmaterialized retained entry would be silently lost.
  const unsettled = state.expedition.rewardLedger.some(
    entry =>
      outcome.settlement.retainedRewardEntryIds.includes(entry.id) &&
      !entry.materialized
  )
  if (unsettled) return state

  return { ...state, expedition: createDefaultExpeditionState() }
}

/**
 * Resolves a fuel-stranded crisis by paying for a recovery option.
 *
 * @param state - Current game state.
 * @param payload - The crisis id, the chosen recovery, and the stale guard.
 * @returns Next state, or the identical reference when the choice is illegal.
 *
 * @remarks
 * The design requires most crises to keep at least one expensive but safe
 * escape, so these are real spends with real effects rather than dialog
 * decoration. Both the crisis and the legality of the choice are re-derived
 * here: a caller cannot pay for a recovery the run is not actually offering,
 * and the cost is read from the canonical owners (`calculateRefuelCost`, the
 * Expedition tow price) rather than from the payload.
 *
 * `refuel` fills the tank; `tow` restores enough fuel to leave the node without
 * filling it, which is what makes it the pricier, less efficient escape. Both
 * spend through the Expedition boundary, so neither can dip into the protected
 * Career slice.
 */
export const handleResolveExpeditionCrisis = (
  state: GameState,
  payload: ResolveExpeditionCrisisPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const pending = deriveExpeditionPendingFailure(state)
  if (!pending) return state
  if (!isCurrentExpeditionFailureId(state, payload.pendingFailureId)) {
    return state
  }

  const { choice } = payload
  if (choice !== 'refuel' && choice !== 'tow') return state
  // Only a choice the derived crisis actually offers may be paid for.
  if (!pending.choices.includes(choice)) return state

  const currentFuel = isFiniteNumber(state.player.van?.fuel)
    ? state.player.van.fuel
    : 0
  const cost =
    choice === 'refuel' ? calculateRefuelCost(currentFuel) : EXPEDITION_TOW_COST
  if (cost <= 0) return state
  if (!canSpendExpeditionCash(state, cost)) return state

  const nextFuel =
    choice === 'refuel'
      ? EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
      : Math.min(
          EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL,
          currentFuel + EXPEDITION_TOW_FUEL_RESTORED
        )

  return {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player.money, 0) - cost),
      van: { ...state.player.van, fuel: nextFuel }
    }
  }
}

/**
 * Authoritatively executes a repair on equipment during an active Expedition run.
 *
 * @param state - Current game state.
 * @param payload - Player repair intent.
 * @returns Updated game state or original reference when precondition fails.
 */
export const handleExecuteExpeditionRepair = (
  state: GameState,
  payload: ExpeditionRepairIntent
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state

  const resolution = resolveExpeditionRepair(state, payload)
  if (!resolution.ok) return state

  const { result } = resolution
  const tc = getExpeditionTechnicalCondition(state)
  const targetGroup = payload.targetGroup
  const sourceGroup = payload.sourceGroup

  const nextTargetCondition = clampCondition(
    tc[targetGroup] + result.targetRestore
  )
  const nextSourceCondition = sourceGroup
    ? clampCondition(tc[sourceGroup] - result.sourceDamage)
    : undefined

  const updatedTc: ExpeditionTechnicalCondition = {
    ...tc,
    [targetGroup]: nextTargetCondition,
    ...(sourceGroup && nextSourceCondition !== undefined
      ? { [sourceGroup]: nextSourceCondition }
      : {})
  }

  if (result.resolvesTargetDefects && updatedTc.defects.length > 0) {
    if (payload.mode === 'professional') {
      updatedTc.defects = updatedTc.defects.map(d =>
        d.group === targetGroup &&
        (d.status === 'revealed' || d.status === 'triggered')
          ? { ...d, status: 'resolved' as const }
          : d
      )
    } else if (payload.mode === 'cannibalize') {
      let resolvedOne = false
      updatedTc.defects = updatedTc.defects.map(d => {
        if (
          !resolvedOne &&
          d.group === targetGroup &&
          (d.status === 'revealed' || d.status === 'triggered')
        ) {
          resolvedOne = true
          return { ...d, status: 'resolved' as const }
        }
        return d
      })
    }
  }

  if (result.createsHiddenDefect) {
    const defect = createDeterministicHiddenDefect(
      state.runSeed,
      targetGroup,
      payload.mode === 'improvise' ? 'improvise' : 'field_repair',
      state.expedition.routeStep,
      payload.mode === 'improvise' ? 1 : 2
    )
    const alreadyExists = updatedTc.defects.some(d => d.id === defect.id)
    if (!alreadyExists) {
      updatedTc.defects = [...updatedTc.defects, defect]
    }
  }

  const currentCargo = state.expedition.cargo
  const nextCargo = currentCargo
    ? {
        ...currentCargo,
        spareParts: Math.max(0, currentCargo.spareParts - result.sparePartsCost)
      }
    : null

  const nextMoney = clampPlayerMoney(
    finiteNumberOr(state.player.money, 0) - result.moneyCost
  )

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    expedition: {
      ...state.expedition,
      cargo: nextCargo,
      technicalCondition: updatedTc
    }
  }
}

/**
 * Reveals a hidden equipment defect.
 *
 * @param state - Current game state.
 * @param payload - Defect id, revelation source, and expected route step.
 * @returns Next state, or identical reference when preconditions fail.
 */
export const handleRevealExpeditionDefect = (
  state: GameState,
  payload: RevealExpeditionDefectPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const tc = state.expedition.technicalCondition
  if (!tc || !Array.isArray(tc.defects)) return state

  const targetIndex = tc.defects.findIndex(d => d.id === payload.defectId)
  if (targetIndex === -1) return state

  const targetDefect = tc.defects[targetIndex]
  if (!targetDefect || targetDefect.status !== 'hidden') return state

  const updatedDefects = [...tc.defects]
  updatedDefects[targetIndex] = {
    ...targetDefect,
    status: 'revealed'
  }

  return {
    ...state,
    expedition: {
      ...state.expedition,
      technicalCondition: {
        ...tc,
        defects: updatedDefects
      }
    }
  }
}

/**
 * Triggers an equipment defect, inflicting condition wear.
 *
 * @param state - Current game state.
 * @param payload - Defect id, trigger boundary, and expected route step.
 * @returns Next state, or identical reference when preconditions fail.
 */
export const handleTriggerExpeditionDefect = (
  state: GameState,
  payload: TriggerExpeditionDefectPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const tc = state.expedition.technicalCondition
  if (!tc || !Array.isArray(tc.defects)) return state

  const targetIndex = tc.defects.findIndex(d => d.id === payload.defectId)
  if (targetIndex === -1) return state

  const targetDefect = tc.defects[targetIndex]
  if (
    !targetDefect ||
    targetDefect.status === 'triggered' ||
    targetDefect.status === 'resolved'
  ) {
    return state
  }

  const damage = DEFECT_SEVERITY_DAMAGE[targetDefect.severity] || 8
  const nextCondition = clampCondition(tc[targetDefect.group] - damage)

  const updatedDefects = [...tc.defects]
  updatedDefects[targetIndex] = {
    ...targetDefect,
    status: 'triggered'
  }

  return {
    ...state,
    expedition: {
      ...state.expedition,
      technicalCondition: {
        ...tc,
        [targetDefect.group]: nextCondition,
        defects: updatedDefects
      }
    }
  }
}

/**
 * Resolves an equipment defect following repair.
 *
 * @param state - Current game state.
 * @param payload - Defect id, repair resolution id, and expected route step.
 * @returns Next state, or identical reference when preconditions fail.
 */
export const handleResolveExpeditionDefect = (
  state: GameState,
  payload: ResolveExpeditionDefectPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const tc = state.expedition.technicalCondition
  if (!tc || !Array.isArray(tc.defects)) return state

  const targetIndex = tc.defects.findIndex(d => d.id === payload.defectId)
  if (targetIndex === -1) return state

  const targetDefect = tc.defects[targetIndex]
  if (!targetDefect || targetDefect.status === 'resolved') return state

  const updatedDefects = [...tc.defects]
  updatedDefects[targetIndex] = {
    ...targetDefect,
    status: 'resolved'
  }

  return {
    ...state,
    expedition: {
      ...state.expedition,
      technicalCondition: {
        ...tc,
        defects: updatedDefects
      }
    }
  }
}
