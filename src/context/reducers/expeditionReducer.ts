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
import {
  getExpeditionCargoView,
  materializeExpeditionCargo
} from '../../domain/expedition/cargo'
import {
  applyTechnicalWear,
  clampCondition,
  createDefaultTechnicalCondition,
  getExpeditionTechnicalCondition
} from '../../domain/expedition/condition'
import {
  getExpeditionEventResultEffect,
  sanitizeExpeditionEventResultIds
} from '../../domain/expedition/eventDeltas'
import { applyExpeditionEventHeat } from '../../domain/expedition/runResources'
import { getEffectiveExpeditionRules } from '../../domain/expedition/effectiveRules'
import { applyResolvedCrewEventOutcome } from './crewReducer'
import { resolveExpeditionRepair } from '../../domain/expedition/repairs'
import { resolveExpeditionInspection } from '../../domain/expedition/inspections'
import {
  canClaimExpeditionInsurance,
  getExpeditionInsurancePremium
} from '../../domain/expedition/insurance'
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
  isCurrentExpeditionFailureId,
  syncExpeditionPendingFailure
} from '../../domain/expedition/failure'
import { calculateRefuelCost } from '../../utils/economy'
import {
  buildPreparedExpeditionSponsorOffers,
  getCanonicalBrandDealTermsHash,
  resolveBrandDealAcceptance
} from '../../domain/expedition/sponsors'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../data/expedition/contracts'
import { materializeContractConstraints } from '../../domain/expedition/contracts'
import { EXPENSE_CONSTANTS } from '../../utils/economy/constants'
import type { GameState } from '../../types'
import type {
  AcceptExpeditionFailurePayload,
  AcceptExpeditionTechnicalFailurePayload,
  AddExpeditionRewardPayload,
  AdvanceExpeditionRoutePayload,
  ApplyExpeditionEventDeltaPayload,
  ClaimExpeditionInsurancePayload,
  CompleteExpeditionPayload,
  ExecuteExpeditionInspectionPayload,
  ExtractExpeditionPayload,
  PrepareExpeditionRunPayload,
  PrepareNextExpeditionPayload,
  ResolveExpeditionCrisisPayload,
  ResolveExpeditionDefectPayload,
  RevealExpeditionDefectPayload,
  RevealExpeditionNodeIntelPayload,
  StartExpeditionPayload,
  RecordExpeditionObligationSignalPayload,
  DoubleDownExpeditionObligationPayload,
  OfferExpeditionDraftPayload,
  SelectExpeditionDraftPayload,
  TriggerExpeditionDefectPayload
} from '../../types/actions'
import type {
  ConditionGroup,
  ExpeditionFailureReason,
  ExpeditionRepairIntent,
  ExpeditionSettlement,
  ExpeditionTechnicalCondition,
  NodeIntelLevel
} from '../../types/expedition'
import { evaluateExpeditionConstraint } from '../../domain/expedition/contracts'
import { deriveExpeditionDraftCandidates } from '../../domain/expedition/runDrafts'
import { hashExpeditionRoute } from '../../domain/expedition/map'

/**
 * Executes a vehicle insurance claim, restoring van fuel and condition.
 */
const applyVehicleInsuranceClaim = (state: GameState): GameState => {
  if (!canClaimExpeditionInsurance(state, 'vehicle')) return state
  const currentCondition = state.player.van?.condition ?? 100
  return {
    ...state,
    player: {
      ...state.player,
      van: {
        ...state.player.van,
        fuel: Math.max(
          state.player.van?.fuel ?? 0,
          EXPEDITION_TOW_FUEL_RESTORED
        ),
        condition: currentCondition <= 0 ? 25 : currentCondition
      }
    },
    expedition: {
      ...state.expedition,
      insuranceClaimConsumed: true,
      claimConsumed: true
    }
  }
}

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

  const preparedState: GameState = {
    ...state,
    runSeed,
    expedition: {
      ...createDefaultExpeditionState(),
      status: 'prepared',
      prep: { prepId }
    }
  }
  return {
    ...preparedState,
    expedition: {
      ...preparedState.expedition,
      preparedSponsorOffers: buildPreparedExpeditionSponsorOffers(preparedState)
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
  const insurancePremium = getExpeditionInsurancePremium(
    normalized.insurancePolicyId
  )
  const upfrontCost = fuelCost + insurancePremium
  const money = isFiniteNumber(state.player.money) ? state.player.money : 0
  // The protected slice is untouchable from the very first spend, including the
  // pre-run top-up and insurance premium: otherwise the build could protect cash it then spends.
  if (money - upfrontCost < normalized.build.protectedCareerCash) return state

  const nextMoney = money - upfrontCost
  const fame = isFiniteNumber(state.player.fame) ? state.player.fame : 0
  const sponsorOfferId = normalized.build.sponsorOfferId
  const stagedSponsor =
    sponsorOfferId === null
      ? null
      : state.expedition.preparedSponsorOffers.find(
          offer => offer.offerId === sponsorOfferId
        )
  if (
    sponsorOfferId !== null &&
    (!stagedSponsor ||
      stagedSponsor.runSeed !== state.runSeed ||
      getCanonicalBrandDealTermsHash(stagedSponsor.dealId) !==
        stagedSponsor.canonicalTermsHash)
  )
    return state
  const sponsorAcceptance = stagedSponsor
    ? resolveBrandDealAcceptance(
        { ...state, player: { ...state.player, money: nextMoney } },
        stagedSponsor.dealId
      )
    : null
  if (stagedSponsor && !sponsorAcceptance) return state
  const activeObligations: import('../../types/expedition').ActiveObligationState[] =
    []
  for (const commitment of normalized.nativeContracts) {
    const template = EXPEDITION_CONTRACTS_BY_ID.get(commitment.templateId)
    const constraints = materializeContractConstraints(
      template,
      preparedMap,
      commitment.targetNodeId
    )
    if (!template || !constraints) return state
    const progressByConstraintId: import('../../types/expedition').ActiveObligationState['progressByConstraintId'] =
      Object.create(null)
    for (const constraint of constraints)
      progressByConstraintId[constraint.id] = {
        constraintId: constraint.id,
        value: 0,
        satisfied: false,
        failed: false
      }
    activeObligations.push({
      id: `${prepId}:${template.id}`,
      sourceType: 'native',
      sourceId: template.id,
      constraints,
      progressByConstraintId,
      status: 'active',
      settled: false,
      doubleDown: null
    })
  }
  if (stagedSponsor)
    activeObligations.push({
      id: `${prepId}:${stagedSponsor.dealId}`,
      sourceType: 'brandDeal',
      sourceId: stagedSponsor.dealId,
      constraints: [],
      progressByConstraintId: Object.create(null),
      status: 'active',
      settled: false,
      doubleDown: null
    })

  return {
    ...state,
    player: {
      ...(sponsorAcceptance?.nextPlayer ?? state.player),
      money: sponsorAcceptance?.nextPlayer.money ?? nextMoney,
      currentNodeId: preparedMap.startNodeId,
      van: { ...state.player.van, fuel: normalized.build.startingFuelTarget }
    },
    band: sponsorAcceptance?.nextBand ?? state.band,
    social: sponsorAcceptance?.nextSocial ?? state.social,
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
      insurancePolicyId: normalized.insurancePolicyId ?? null,
      insuranceClaimConsumed: false,
      claimConsumed: false,
      startingMoney: nextMoney,
      startingFame: fame,
      protectedCareerCash: normalized.build.protectedCareerCash,
      cargo: materializeExpeditionCargo(normalized, state),
      technicalCondition: createDefaultTechnicalCondition(),
      preparedSponsorOffers: [],
      activeObligations
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
  if (choice !== 'refuel' && choice !== 'tow' && choice !== 'insurance_claim') {
    return state
  }
  // Only a choice the derived crisis actually offers may be paid for.
  if (!pending.choices.includes(choice)) return state

  if (choice === 'insurance_claim') {
    if (pending.reason === 'technical_shutdown') {
      const targetGroup = pending.sourceId as ConditionGroup
      if (!canClaimExpeditionInsurance(state, 'technical', targetGroup)) {
        return state
      }
      const tc = getExpeditionTechnicalCondition(state)
      return {
        ...state,
        expedition: {
          ...state.expedition,
          insuranceClaimConsumed: true,
          claimConsumed: true,
          technicalFailureAccepted: false,
          technicalCondition: {
            ...tc,
            [targetGroup]: 25
          }
        }
      }
    }

    return applyVehicleInsuranceClaim(state)
  }

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
 * Authoritatively executes an insurance claim during an active Expedition run.
 *
 * @param state - Current game state.
 * @param payload - Insurance claim intent.
 * @returns Updated game state or original reference when precondition fails.
 */
export const handleClaimExpeditionInsurance = (
  state: GameState,
  payload: ClaimExpeditionInsurancePayload
): GameState => {
  if (state.expedition?.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const { claimType, targetGroup } = payload
  if (claimType !== 'vehicle' && claimType !== 'technical') return state

  if (!canClaimExpeditionInsurance(state, claimType, targetGroup)) return state

  if (claimType === 'vehicle') {
    return applyVehicleInsuranceClaim(state)
  }

  if (claimType === 'technical') {
    if (!targetGroup) return state
    const tc = getExpeditionTechnicalCondition(state)
    const nextTc: ExpeditionTechnicalCondition = {
      ...tc,
      [targetGroup]: 25
    }
    return {
      ...state,
      expedition: {
        ...state.expedition,
        technicalCondition: nextTc,
        insuranceClaimConsumed: true,
        claimConsumed: true,
        technicalFailureAccepted: false
      }
    }
  }

  return state
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

/**
 * Executes an equipment inspection during an active Expedition run.
 *
 * @param state - Current game state.
 * @param payload - Inspection intent.
 * @returns Updated game state or original reference when precondition fails.
 */
export const handleExecuteExpeditionInspection = (
  state: GameState,
  payload: ExecuteExpeditionInspectionPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  if (!payload || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const resolution = resolveExpeditionInspection(state, payload)
  if (!resolution.ok) return state

  const { result } = resolution
  let nextMoney = clampPlayerMoney(
    finiteNumberOr(state.player.money, 0) - result.diagnosticFee
  )

  const tc = getExpeditionTechnicalCondition(state)
  let updatedDefects = [...tc.defects]
  const revealedSet = new Set(result.revealedDefectIds)

  if (revealedSet.size > 0) {
    updatedDefects = updatedDefects.map(d =>
      revealedSet.has(d.id) && d.status === 'hidden'
        ? { ...d, status: 'revealed' as const }
        : d
    )
  }

  let updatedTc: ExpeditionTechnicalCondition = {
    ...tc,
    defects: updatedDefects
  }

  if (result.professionalRepair && payload.repairTargetGroup) {
    const targetGroup = payload.repairTargetGroup
    nextMoney = clampPlayerMoney(
      nextMoney - result.professionalRepair.moneyCost
    )
    const nextTargetCondition = clampCondition(
      updatedTc[targetGroup] + result.professionalRepair.targetRestore
    )
    updatedTc = {
      ...updatedTc,
      [targetGroup]: nextTargetCondition
    }
    if (result.professionalRepair.resolvesTargetDefects) {
      updatedTc.defects = updatedTc.defects.map(d =>
        d.group === targetGroup &&
        (d.status === 'revealed' || d.status === 'triggered')
          ? { ...d, status: 'resolved' as const }
          : d
      )
    }
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    expedition: {
      ...state.expedition,
      technicalCondition: updatedTc
    }
  }
}

/**
 * Handles explicit acceptance of technical failure when equipment is disabled.
 *
 * @param state - Current game state.
 * @param payload - Expected route step stale guard.
 * @returns State with technicalFailureAccepted set and pendingFailure synced.
 */
export const handleAcceptExpeditionTechnicalFailure = (
  state: GameState,
  payload: AcceptExpeditionTechnicalFailurePayload
): GameState => {
  if (state.expedition?.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }
  const tc = state.expedition?.technicalCondition
  if (!tc) return state
  const hasDisabled = tc.pa === 0 || tc.instruments === 0 || tc.stageGear === 0
  if (!hasDisabled) return state

  return syncExpeditionPendingFailure({
    ...state,
    expedition: {
      ...state.expedition,
      technicalFailureAccepted: true
    }
  })
}

/**
 * Applies the Expedition results a resolved event requested.
 *
 * @param state - Current game state.
 * @param payload - Known result ids plus the route-step stale guard.
 * @returns Next state, or the identical reference when nothing applies.
 *
 * @remarks
 * The event engine is the only caller, and it may only name results. Every
 * number comes from the Expedition's own registry here, so an effect authored
 * with a hand-picked value, an unknown result id, or a forged payload carrying
 * Condition or cargo figures cannot move run state: unknown ids are filtered
 * out, and a payload whose ids are all unknown leaves state untouched.
 */
export const handleApplyExpeditionEventDelta = (
  state: GameState,
  payload: ApplyExpeditionEventDeltaPayload
): GameState => {
  if (state.expedition?.status !== 'active') return state
  if (payload === null || typeof payload !== 'object') return state
  if (
    !isFiniteNumber(payload.expectedRouteStep) ||
    payload.expectedRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  const resultIds = sanitizeExpeditionEventResultIds(payload.resultIds)
  if (resultIds.length === 0) return state

  const wear = { pa: 0, instruments: 0, stageGear: 0 }
  let sparePartsDelta = 0
  let suppliesDelta = 0
  let heatDelta = 0
  for (const resultId of resultIds) {
    const effect = getExpeditionEventResultEffect(resultId)
    if (effect.conditionWear) {
      wear.pa += effect.conditionWear.pa
      wear.instruments += effect.conditionWear.instruments
      wear.stageGear += effect.conditionWear.stageGear
    }
    if (effect.cargoDelta) {
      sparePartsDelta += effect.cargoDelta.spareParts ?? 0
      suppliesDelta += effect.cargoDelta.supplies ?? 0
    }
    heatDelta += effect.heat ?? 0
  }

  let nextExpedition = state.expedition

  const hasWear = wear.pa > 0 || wear.instruments > 0 || wear.stageGear > 0
  if (hasWear) {
    // Scaled by the same chassis/module rule the post-gig wear uses, so an
    // event cannot bypass a tourbus built to survive wear.
    const multiplier = Math.max(
      0,
      finiteNumberOr(
        getEffectiveExpeditionRules(state).numeric.technicalWearMultiplier,
        1.0
      )
    )
    nextExpedition = {
      ...nextExpedition,
      technicalCondition: applyTechnicalWear(
        getExpeditionTechnicalCondition(state),
        {
          pa: Math.round(wear.pa * multiplier),
          instruments: Math.round(wear.instruments * multiplier),
          stageGear: Math.round(wear.stageGear * multiplier)
        }
      )
    }
  }

  if (sparePartsDelta !== 0 || suppliesDelta !== 0) {
    // Gains are authorized by the cargo authority's own free-slot count: an
    // event may hand the player a spare part, but not one the bus cannot hold.
    const view = getExpeditionCargoView(state)
    let freeSlots = view.availableVisibleSlots
    const grant = (current: number, delta: number): number => {
      if (delta <= 0) return Math.max(0, current + delta)
      const granted = Math.min(delta, freeSlots)
      freeSlots -= granted
      return current + granted
    }
    // Listed field by field rather than spread from the view: the view also
    // carries the derived capacity numbers, and folding those into the
    // persisted cargo would turn a computed readout into stored state.
    nextExpedition = {
      ...nextExpedition,
      cargo: {
        spareParts: grant(view.spareParts, sparePartsDelta),
        supplies: grant(view.supplies, suppliesDelta),
        technicalGearItemIds: view.technicalGearItemIds,
        merch: view.merch,
        contraband: view.contraband
      }
    }
  }

  const nextState =
    nextExpedition === state.expedition
      ? state
      : { ...state, expedition: nextExpedition }

  const withCrewOutcome = applyResolvedCrewEventOutcome(
    nextState,
    payload.sourceEventId,
    payload.sourceOptionId,
    resultIds
  )
  return syncExpeditionPendingFailure(
    applyExpeditionEventHeat(withCrewOutcome, heatDelta)
  )
}

export const handleRecordExpeditionObligationSignal = (
  state: GameState,
  payload: RecordExpeditionObligationSignalPayload
): GameState => {
  if (
    state.expedition.status !== 'active' ||
    payload.expectedRouteStep !== state.expedition.routeStep
  )
    return state
  let changed = false
  const activeObligations = state.expedition.activeObligations.map(
    obligation => {
      if (obligation.status !== 'active') return obligation
      let status: import('../../types/expedition').ActiveObligationState['status'] =
        obligation.status
      const progressByConstraintId = { ...obligation.progressByConstraintId }
      for (const constraint of obligation.constraints) {
        const prior = progressByConstraintId[constraint.id]
        if (!prior) continue
        const evidence = {
          accuracy:
            payload.signalType === 'gig'
              ? state.lastGigStats?.accuracy
              : undefined,
          heat: state.expedition.pressure.heat,
          visitedNodeId:
            payload.signalType === 'arrival'
              ? (state.player.currentNodeId ?? undefined)
              : undefined,
          rested: payload.signalType === 'rest',
          finaleCompleted: payload.signalType === 'finale',
          socialPosts:
            payload.signalType === 'social_post'
              ? prior.value + 1
              : prior.value,
          finaleProfileId:
            state.expedition.finaleType === 'contract_special'
              ? 'all_in_showcase'
              : undefined
        }
        const result = evaluateExpeditionConstraint(constraint, evidence)
        const value =
          constraint.kind === 'gig_accuracy_count'
            ? prior.value + result.value
            : result.value
        progressByConstraintId[constraint.id] = {
          constraintId: constraint.id,
          value,
          satisfied:
            constraint.kind === 'gig_accuracy_count'
              ? value >= constraint.requiredCount
              : result.satisfied,
          failed: prior.failed || result.failed
        }
        changed = true
      }
      const progress = Object.values(progressByConstraintId)
      if (progress.some(item => item.failed)) status = 'failed'
      else if (progress.length > 0 && progress.every(item => item.satisfied))
        status = 'completed'
      return { ...obligation, progressByConstraintId, status }
    }
  )
  return changed
    ? { ...state, expedition: { ...state.expedition, activeObligations } }
    : state
}

const deriveDoubleDown = (state: GameState, obligationId: string) => {
  const derivationKey = `${state.runSeed}:${obligationId}:${state.expedition.routeStep}`
  const options = [
    {
      addedConstraint: { kind: 'no_more_rest' } as const,
      rewardMultiplier: 1.25 as const,
      failureHeatBonus: 8
    },
    {
      addedConstraint: { kind: 'heat_cap', maxHeat: 60 } as const,
      rewardMultiplier: 1.35 as const,
      failureHeatBonus: 12
    },
    {
      addedConstraint: { kind: 'finale_required' } as const,
      rewardMultiplier: 1.35 as const,
      failureHeatBonus: 15
    },
    {
      addedConstraint: { kind: 'social_silence', maxPosts: 0 } as const,
      rewardMultiplier: 1.25 as const,
      failureHeatBonus: 10
    }
  ]
  const fallback = options[0]
  if (!fallback) return null
  const picked =
    options[
      Number.parseInt(hashExpeditionRoute(derivationKey), 16) % options.length
    ] ?? fallback
  return {
    ...picked,
    derivationKey,
    offerId: hashExpeditionRoute(
      `${derivationKey}:${picked.addedConstraint.kind}`
    )
  }
}
export const handleDoubleDownExpeditionObligation = (
  state: GameState,
  payload: DoubleDownExpeditionObligationPayload
): GameState => {
  if (
    state.expedition.status !== 'active' ||
    payload.expectedRouteStep !== state.expedition.routeStep
  )
    return state
  const index = state.expedition.activeObligations.findIndex(
    item =>
      item.id === payload.obligationId &&
      item.status === 'active' &&
      item.doubleDown === null
  )
  if (index < 0) return state
  const derived = deriveDoubleDown(state, payload.obligationId)
  if (!derived || payload.offerId !== derived.offerId) return state
  const activeObligations = [...state.expedition.activeObligations]
  const obligation = activeObligations[index]
  if (!obligation) return state
  activeObligations[index] = {
    ...obligation,
    doubleDown: {
      acceptedOfferId: derived.offerId,
      derivationKey: derived.derivationKey,
      addedConstraint: derived.addedConstraint,
      rewardMultiplier: derived.rewardMultiplier,
      failureHeatBonus: derived.failureHeatBonus,
      acceptedAtRouteStep: state.expedition.routeStep
    }
  }
  return { ...state, expedition: { ...state.expedition, activeObligations } }
}
export const handleOfferExpeditionDraft = (
  state: GameState,
  payload: OfferExpeditionDraftPayload
): GameState => {
  if (
    state.expedition.status !== 'active' ||
    payload.expectedRouteStep !== state.expedition.routeStep ||
    state.expedition.pendingRunDraftOffer
  )
    return state
  if (typeof payload.sourceKey !== 'string' || payload.sourceKey.length === 0)
    return state
  const candidateTraitIds = deriveExpeditionDraftCandidates(
    state.runSeed,
    payload.sourceKey,
    state.expedition.runDraftTraitIds
  )
  if (candidateTraitIds.length < 3) return state
  return {
    ...state,
    expedition: {
      ...state.expedition,
      pendingRunDraftOffer: {
        sourceType: payload.sourceType,
        sourceKey: payload.sourceKey,
        offeredAtRouteStep: state.expedition.routeStep,
        candidateTraitIds
      }
    }
  }
}
export const handleSelectExpeditionDraft = (
  state: GameState,
  payload: SelectExpeditionDraftPayload
): GameState => {
  const offer = state.expedition.pendingRunDraftOffer
  if (
    !offer ||
    payload.expectedRouteStep !== state.expedition.routeStep ||
    state.expedition.runDraftTraitIds.length >= 2 ||
    !offer.candidateTraitIds.includes(payload.traitId)
  )
    return state
  return {
    ...state,
    expedition: {
      ...state.expedition,
      runDraftTraitIds: [...state.expedition.runDraftTraitIds, payload.traitId],
      pendingRunDraftOffer: null
    }
  }
}
