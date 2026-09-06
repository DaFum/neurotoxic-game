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
import { createDefaultExpeditionState } from '../../domain/expedition/defaults'
import { deriveExpeditionRouteProfile } from '../../domain/expedition/routeProfile'
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
import { isDeclaredExpeditionEventResult } from '../../domain/expedition/eventProof'
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
import { calculateFameLevel } from '../../utils/gameState/calculations'
import { clampControversyLevel } from '../../utils/gameState/clamps'
import { QuestEvents } from '../../utils/questProgress'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../quests/producers/economyQuestEvents'
import {
  buildPreparedExpeditionSponsorOffers,
  getCanonicalBrandDealTermsHash,
  resolveBrandDealAcceptance
} from '../../domain/expedition/sponsors'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../data/expedition/contracts'
import {
  deriveExpeditionDoubleDownOffer,
  materializeContractConstraints
} from '../../domain/expedition/contracts'
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
  ResolveExpeditionSocialResultPayload,
  CreateSocialIntelGrantPayload,
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
import type { CareerRivalRecord } from '../../types/career'
import { evaluateExpeditionConstraint } from '../../domain/expedition/contracts'
import { deriveExpeditionDraftCandidates } from '../../domain/expedition/runDrafts'
import { selectExpeditionRivalForRun } from '../../domain/expedition/rivals'
import {
  EXPEDITION_SOCIAL_RESULTS,
  deriveExpeditionSocialResultId
} from '../../domain/expedition/social'
import {
  applyExpeditionPressureDelta,
  applyExpeditionPressureEventResolution,
  resolveExpeditionPressureDirectorStep
} from '../../domain/expedition/pressure'
import { getExpeditionFinaleRewardId } from '../../domain/expedition/finales'
import { getEffectiveExpeditionRoute } from '../../domain/expedition/routeOverlay'
import { POST_OPTIONS } from '../../data/postOptions'
import {
  createExpeditionExtractionQuestEvent,
  createExpeditionFinaleQuestEvent,
  createExpeditionNodeResolvedQuestEvent,
  createExpeditionRivalOutcomeQuestEvent
} from '../../quests/producers/expeditionQuestEvents'

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

  // Sponsor offers are deliberately not staged here. PREPARE runs on Tour Prep
  // entry, before the player has chosen a Region or a Tour, so anything staged
  // now is staged against inputs that do not exist yet - which is how the
  // route-specific offer count ended up never applying to a real run. The set
  // is derived from the prepared route instead, by whoever needs it.
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

  const preparedMap = buildExpeditionMap(state.runSeed, tourTypeId, regionId)
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
  // Derived from the Region and Tour this run is actually committing to, so a
  // non-baseline route stages the offer count its profile calls for.
  const stagedSponsor =
    sponsorOfferId === null
      ? null
      : buildPreparedExpeditionSponsorOffers(state, regionId, tourTypeId).find(
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

  // Every rule that depends on the committed Region/Tour has to be resolved
  // against the *validated candidate*, not against `state`: the loadout is not
  // committed until this transaction builds the next state, so reading it off
  // `state` here resolves the baseline profile and silently drops the Tour and
  // Region identity the run was just started with.
  const committed: GameState = {
    ...state,
    expedition: { ...state.expedition, loadout: normalized }
  }
  const startRules = getEffectiveExpeditionRules(committed).numeric

  const rivalSelection = selectExpeditionRivalForRun(
    committed,
    preparedMap,
    deriveExpeditionRouteProfile(regionId, tourTypeId)
  )
  const nextCareer = rivalSelection
    ? {
        ...state.career,
        rivalsById: {
          ...state.career.rivalsById,
          [rivalSelection.record.snapshot.id]: {
            ...rivalSelection.record,
            history: {
              ...rivalSelection.record.history,
              encounterCount: rivalSelection.record.history.encounterCount + 1,
              lastSeenRunId: prepId
            }
          }
        }
      }
    : state.career

  let nextState: GameState = {
    ...state,
    career: nextCareer,
    rivalBand: rivalSelection?.rivalBand ?? null,
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
      // The Tour's own starting stock rides on top of what the build packed.
      cargo: (() => {
        const packed = materializeExpeditionCargo(normalized, state)
        const granted = Math.max(
          0,
          Math.floor(finiteNumberOr(startRules.startingSpareParts, 0))
        )
        return granted > 0
          ? { ...packed, spareParts: packed.spareParts + granted }
          : packed
      })(),
      // A Tour that starts hot starts hot: the run's opening Heat is a rule,
      // so it is written through the same default pressure state rather than
      // by a later mutation.
      pressure: {
        ...createDefaultExpeditionState().pressure,
        heat: Math.max(
          0,
          Math.min(100, Math.floor(finiteNumberOr(startRules.startingHeat, 0)))
        )
      },
      technicalCondition: createDefaultTechnicalCondition(),
      preparedSponsorOffers: [],
      activeObligations
    }
  }
  if (sponsorAcceptance) {
    for (const questEvent of sponsorAcceptance.questEvents)
      nextState = QuestEvents.emit(nextState, questEvent)
  }
  return nextState
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
/**
 * Emits the node-resolved quest event for a committed route advance.
 *
 * @param state - State that has already advanced.
 * @returns The same state with the event emitted.
 *
 * @remarks
 * Applied on every successful exit of {@link applyExpeditionRouteAdvance} and
 * on none of its refusals, so a stale or replayed advance progresses nothing.
 */
const withNodeResolved = (state: GameState): GameState =>
  QuestEvents.emit(
    state,
    createExpeditionNodeResolvedQuestEvent(state.player.currentNodeId)
  )

export const applyExpeditionRouteAdvance = (
  state: GameState,
  nodeId: unknown
): GameState => {
  // Optional read: the travel reducer composes this on every arrival, so a
  // state without the slice must be a no-op rather than a crash in the
  // unrelated Career travel path.
  if (state.expedition?.status !== 'active') return state
  if (typeof nodeId !== 'string' || isForbiddenKey(nodeId)) return state
  // A pending Run Draft is this run's decision and the route waits for it.
  // Without this the offer strands: SELECT requires the offer's own route step,
  // so travelling first rejects every later SELECT, while the non-null offer
  // rejects every later OFFER - the Draft system dies for the rest of the run.
  if (state.expedition.pendingRunDraftOffer !== null) return state

  const loadout = state.expedition.loadout
  if (!loadout) return state
  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId
  )
  if (!Object.hasOwn(map.meta, nodeId)) return state
  const target = map.meta[nodeId]
  if (!target || target.routeStep !== state.expedition.routeStep + 1) {
    return state
  }

  const currentNodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (typeof currentNodeId !== 'string') return state
  // The effective route, not the base map: a high-Heat Underground invite or a
  // Nemesis shortcut is only a real opportunity if the run can actually travel
  // it. Overlays are additive, so this never removes a legal base move.
  const isNeighbour = getEffectiveExpeditionRoute(state, map).connections.some(
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

  // A temporary opportunity is spent by travelling it, and expires when the
  // run moves past the step it belonged to: either way it does not follow the
  // run down the route.
  //
  // The Director's pick expires the same way, and for a sharper reason: it
  // belongs to the step it was drawn for. Leaving it set would let the next
  // step's Director overwrite a live decision, or - worse - let a later event
  // resolution claim relief for an encounter that belonged two nodes back.
  // Expiring rather than refusing the move is deliberate: the pick is not
  // guaranteed to surface at all (the event budget is two per day, and
  // `processTravelEvents` only offers the `transport` and `band` pools), so
  // holding the route until it resolves could strand a run permanently.
  const pressureAfterMove =
    state.expedition.pressure.temporaryRouteOpportunity === null &&
    state.expedition.pressure.pendingDirectorEventId === null
      ? state.expedition.pressure
      : {
          ...state.expedition.pressure,
          temporaryRouteOpportunity: null,
          pendingDirectorEventId: null
        }

  const arrived: GameState = {
    ...state,
    player: { ...state.player, currentNodeId: nodeId },
    expedition: {
      ...state.expedition,
      routeStep: target.routeStep,
      visitedNodeIds: [...state.expedition.visitedNodeIds, nodeId],
      extractionWindowsSeen,
      pressure: pressureAfterMove
    }
  }

  // One Director step per route step, composed here rather than dispatched:
  // arriving a node deeper is the canonical occasion for it, and selection is
  // seeded from `runSeed` plus the new route step, so a replayed advance picks
  // the same event instead of rolling a second one. This *selects* only - the
  // consequences belong to the event the player actually resolves.
  const directorPressure = resolveExpeditionPressureDirectorStep(arrived)
  const advanced: GameState =
    directorPressure === arrived.expedition.pressure
      ? arrived
      : {
          ...arrived,
          expedition: { ...arrived.expedition, pressure: directorPressure }
        }

  // Arriving on a node that carries a route rare is the canonical evidence for
  // it, so the ledger entry is banked in the same pass. Composed rather than
  // dispatched: a separate action could be missed and would leave the reward
  // unearnable, and `resolveExpeditionReward` still proves the evidence, so a
  // replayed arrival collides with the existing entry instead of paying twice.
  const rareRewardId = target.hidden.rareRewardId
  if (rareRewardId === null) return withNodeResolved(advanced)

  const definition = resolveExpeditionRewardDefinition(rareRewardId)
  if (!definition) return withNodeResolved(advanced)
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
  if (!resolution.ok) return withNodeResolved(advanced)

  return withNodeResolved({
    ...advanced,
    expedition: {
      ...advanced.expedition,
      rewardLedger: [...advanced.expedition.rewardLedger, resolution.entry]
    }
  })
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
    loadout.regionId
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
    loadout.regionId
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
    loadout.regionId
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

  const extracted = finalizeExpedition(state, 'extracted', {
    reason: null,
    finaleResultId: null,
    explicitRareRewardIds
  })
  // Only a settlement that actually happened progresses a quest: an extraction
  // the guards above refused returns before this point.
  return extracted === state
    ? extracted
    : QuestEvents.emit(
        extracted,
        createExpeditionExtractionQuestEvent(state.expedition.runId ?? '')
      )
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
    loadout.regionId
  )
  const currentNodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (currentNodeId !== map.finaleNodeId) return state
  if (map.meta[map.finaleNodeId]?.routeStep !== state.expedition.routeStep) {
    return state
  }
  // Standing on the Finale node is not evidence that the Finale was played:
  // `handleStartGig` commits `finaleType` on the way into PRE_GIG, and
  // `completeExpedition` is publicly dispatchable. Without this the run could
  // be completed - full retention, `expedition.finaleCompleted` emitted, the
  // Nemesis tier taken - before the show, or after failing it. The reward
  // resolver already demands exactly this proof; the terminal transition has
  // to demand it too, and before anything is mutated.
  if (
    !state.lastGigStats ||
    state.lastGigStats.failed === true ||
    state.expedition.lastGigResolvedAtRouteStep !== state.expedition.routeStep
  ) {
    return state
  }

  let completionState = state
  if (state.expedition.finaleType === 'rival_battle' && state.rivalBand) {
    const rivalId = state.rivalBand.id
    const record = state.career.rivalsById[rivalId]
    // One Nemesis step per Rival per run, whichever canonical outcome gets
    // there first: a run that already advanced through a settled Rival Social
    // result does not advance again on the Finale. The guard is
    // `lastNemesisAdvanceRunId`, not `lastSeenRunId` - START stamps the latter
    // with this run's id when it selects the Rival, so it can never gate an
    // advance inside the run it belongs to.
    if (
      record &&
      record.history.lastNemesisAdvanceRunId !== state.expedition.runId
    ) {
      const nemesisLevel = Math.min(4, record.history.nemesisLevel + 1) as
        0 | 1 | 2 | 3 | 4
      completionState = {
        ...state,
        career: {
          ...state.career,
          rivalsById: {
            ...state.career.rivalsById,
            [rivalId]: {
              ...record,
              history: {
                ...record.history,
                relationship: nemesisLevel >= 4 ? 'nemesis' : 'rival',
                nemesisLevel,
                lastOutcome: 'hostile_win',
                lastSeenRunId: state.expedition.runId,
                lastNemesisAdvanceRunId: state.expedition.runId
              }
            }
          }
        }
      }
    }
  }
  // The Finale's own reward enters the G1 ledger before settlement, so it is
  // retained and materialized exactly once by the terminal owner rather than
  // being granted directly here. Which reward it is comes from the run's
  // committed Finale profile, never from the caller.
  const finaleReward = resolveExpeditionReward(
    completionState,
    {
      expectedRewardId: getExpeditionFinaleRewardId(
        completionState.expedition.finaleType
      ),
      sourceType: 'finale_nonlegendary',
      sourceId: map.finaleNodeId,
      expectedRouteStep: completionState.expedition.routeStep
    },
    map
  )
  if (finaleReward.ok) {
    completionState = {
      ...completionState,
      expedition: {
        ...completionState.expedition,
        rewardLedger: [
          ...completionState.expedition.rewardLedger,
          finaleReward.entry
        ]
      }
    }
  }

  const completed = finalizeExpedition(completionState, 'completed', {
    reason: null,
    finaleResultId,
    explicitRareRewardIds: []
  })
  return completed === completionState
    ? completed
    : QuestEvents.emit(
        completed,
        createExpeditionFinaleQuestEvent(
          completionState.expedition.finaleType ?? 'regional_headliner',
          true
        )
      )
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

  // Source proof first, before a single delta or Director consequence is
  // applied. A known result id is not authority: the run must actually be
  // resolving this event - `createSetActiveEventAction(null)` is dispatched
  // after this action, so it is still on state here - and the content registry
  // must declare that this option of that event produces every result named.
  // Otherwise a direct dispatch mints Condition wear, cargo and Heat, and
  // clears the pending Director event to open severe relief, for an encounter
  // the player never saw.
  if (state.activeEvent?.id !== payload.sourceEventId) return state
  if (
    !resultIds.every(resultId =>
      isDeclaredExpeditionEventResult(
        payload.sourceEventId,
        payload.sourceOptionId,
        resultId
      )
    )
  ) {
    return state
  }

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
  const resolved = syncExpeditionPendingFailure(
    applyExpeditionEventHeat(withCrewOutcome, heatDelta)
  )

  // Both consequences of this resolution read the run's route, so build it once.
  const eventRewardLoadout = resolved.expedition.loadout
  const eventRewardMap = eventRewardLoadout
    ? buildExpeditionMap(
        resolved.runSeed,
        eventRewardLoadout.tourTypeId,
        eventRewardLoadout.regionId
      )
    : null

  // The other half of the Director's single draw: a relief window or an
  // Underground detour is a consequence of the event the player just resolved,
  // never of the selection alone. Resolving consumes the pending id, so it
  // applies exactly once.
  const resolvedPressure = applyExpeditionPressureEventResolution(
    resolved,
    payload.sourceEventId,
    eventRewardMap
  )
  const withDirector: GameState =
    resolvedPressure === resolved.expedition.pressure
      ? resolved
      : {
          ...resolved,
          expedition: { ...resolved.expedition, pressure: resolvedPressure }
        }

  // The event's own rare enters the G1 ledger here, once the deltas above have
  // actually been applied. The proof is banked first so the shared resolver can
  // prove the source the same way every other family is proven, and a replayed
  // dispatch collides with the derived entry id instead of paying twice.
  // The source proof at the top of this handler has already established that
  // the run is resolving this event and that the registry declares every
  // result named, so the triple below is content evidence rather than three
  // caller-chosen strings. Only the route map is still optional here.
  if (
    typeof payload.sourceEventId !== 'string' ||
    typeof payload.sourceOptionId !== 'string' ||
    !eventRewardMap
  ) {
    return withDirector
  }
  let withRewards = withDirector
  for (const resultId of resultIds) {
    const rareRewardId = getExpeditionEventResultEffect(resultId).rareRewardId
    if (rareRewardId === undefined) continue
    const sourceId = `${payload.sourceEventId}:${payload.sourceOptionId}:${resultId}`
    const proofId = `${sourceId}:${withRewards.expedition.routeStep}`
    if (withRewards.expedition.resolvedEventSourceIds?.includes(proofId))
      continue
    const proven: GameState = {
      ...withRewards,
      expedition: {
        ...withRewards.expedition,
        resolvedEventSourceIds: [
          ...(withRewards.expedition.resolvedEventSourceIds ?? []),
          proofId
        ]
      }
    }
    const resolution = resolveExpeditionReward(
      proven,
      {
        expectedRewardId: rareRewardId,
        sourceType: 'event_rare',
        sourceId,
        expectedRouteStep: proven.expedition.routeStep
      },
      eventRewardMap
    )
    if (!resolution.ok) continue
    withRewards = {
      ...proven,
      expedition: {
        ...proven.expedition,
        rewardLedger: [...proven.expedition.rewardLedger, resolution.entry]
      }
    }
  }
  return withRewards
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
  if (typeof payload.sourceId !== 'string' || payload.sourceId.length === 0)
    return state
  const canonicalSourceId = (() => {
    switch (payload.signalType) {
      case 'gig':
      case 'finale':
        // Bound to the step the gig resolved at, not the step the caller is
        // standing on: `applyExpeditionRouteAdvance` carries `lastGigStats`
        // and `currentGig` forward, so an unbound source would let a single
        // gig produce a fresh signal id at every later route step.
        return state.lastGigStats &&
          state.currentGig?.id &&
          state.expedition.lastGigResolvedAtRouteStep ===
            payload.expectedRouteStep
          ? state.currentGig.id
          : null
      case 'arrival':
      case 'rest':
        return state.player.currentNodeId
      case 'heat':
        return state.expedition.pressure.lastSevereEventId
      case 'social_post':
        // Same replay window as a gig: the settled result proof persists
        // across advances, so it only counts at the step it resolved at.
        return state.expedition.lastSocialResult?.resolvedAtRouteStep ===
          payload.expectedRouteStep
          ? (state.expedition.lastSocialResult?.id ?? null)
          : null
    }
  })()
  if (canonicalSourceId !== payload.sourceId) return state
  const signalId =
    payload.signalType === 'gig' && state.lastGigStats
      ? `gig:${canonicalSourceId}:${payload.expectedRouteStep}:${Math.round(
          finiteNumberOr(state.lastGigStats.accuracy, 0)
        )}`
      : `${payload.signalType}:${canonicalSourceId}:${payload.expectedRouteStep}`
  const stepSignalPrefix = `${payload.signalType}:${canonicalSourceId}:${payload.expectedRouteStep}`
  if (
    state.expedition.resolvedObligationSignalIds.some(
      id => id === signalId || id.startsWith(`${stepSignalPrefix}:`)
    )
  )
    return state
  let changed = false
  let moneyDelta = 0
  let fameDelta = 0
  let heatDelta = 0
  let controversyDelta = 0
  const effectiveRules = getEffectiveExpeditionRules(state).numeric
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
        const satisfied =
          prior.satisfied ||
          (constraint.kind === 'gig_accuracy_count'
            ? value >= constraint.requiredCount
            : result.satisfied)
        progressByConstraintId[constraint.id] = {
          constraintId: constraint.id,
          value,
          satisfied,
          failed: prior.failed || result.failed
        }
        changed = true
      }
      const progress = Object.values(progressByConstraintId)
      if (progress.some(item => item.failed)) status = 'failed'
      else if (progress.length > 0 && progress.every(item => item.satisfied))
        status = 'completed'
      const doubleDown = obligation.doubleDown
      if (doubleDown) {
        changed = true
        const violated =
          (doubleDown.addedConstraint.kind === 'no_more_rest' &&
            payload.signalType === 'rest') ||
          (doubleDown.addedConstraint.kind === 'heat_cap' &&
            state.expedition.pressure.heat >
              doubleDown.addedConstraint.maxHeat) ||
          (doubleDown.addedConstraint.kind === 'social_silence' &&
            payload.signalType === 'social_post')
        if (violated) status = 'failed'
        else if (
          doubleDown.addedConstraint.kind === 'finale_required' &&
          payload.signalType !== 'finale' &&
          status === 'completed'
        )
          status = 'active'
        else if (
          doubleDown.addedConstraint.kind === 'finale_required' &&
          payload.signalType === 'finale' &&
          progress.every(item => item.satisfied)
        )
          status = 'completed'
      }
      let settled = obligation.settled
      if (
        status !== 'active' &&
        !settled &&
        obligation.sourceType === 'native'
      ) {
        const template = EXPEDITION_CONTRACTS_BY_ID.get(obligation.sourceId)
        if (template) {
          if (status === 'completed') {
            const activeConstraintCount =
              obligation.constraints.length + (doubleDown ? 1 : 0)
            const stackMultiplier = Math.min(
              1.4,
              1 + Math.max(0, activeConstraintCount - 1) * 0.1
            )
            const multiplier =
              template.reward.rewardMultiplier *
              stackMultiplier *
              (doubleDown?.rewardMultiplier ?? 1) *
              effectiveRules.contractRewardMultiplier
            moneyDelta += Math.round(template.reward.money * multiplier)
            fameDelta += Math.round(template.reward.fame * multiplier)
          } else {
            heatDelta += Math.round(
              (template.failure.heat + (doubleDown?.failureHeatBonus ?? 0)) *
                effectiveRules.contractPenaltyMultiplier
            )
            controversyDelta += Math.round(
              template.failure.controversy *
                effectiveRules.contractPenaltyMultiplier
            )
          }
          settled = true
        }
      }
      return { ...obligation, progressByConstraintId, status, settled }
    }
  )
  const accuracy =
    payload.signalType === 'gig' && state.lastGigStats
      ? Math.round(finiteNumberOr(state.lastGigStats.accuracy, 0))
      : null
  const gigOutcomeByStep =
    payload.signalType === 'gig'
      ? {
          ...(state.expedition.gigOutcomeByStep ?? {}),
          [payload.expectedRouteStep]: {
            venueId: canonicalSourceId,
            accuracy: accuracy ?? 0
          }
        }
      : state.expedition.gigOutcomeByStep

  let nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) + moneyDelta
      ),
      fame: clampPlayerFame(finiteNumberOr(state.player.fame, 0) + fameDelta),
      fameLevel: calculateFameLevel(
        clampPlayerFame(finiteNumberOr(state.player.fame, 0) + fameDelta)
      )
    },
    social: {
      ...state.social,
      controversyLevel: clampControversyLevel(
        finiteNumberOr(state.social.controversyLevel, 0) + controversyDelta
      )
    },
    expedition: {
      ...state.expedition,
      activeObligations: changed
        ? activeObligations
        : state.expedition.activeObligations,
      pressure: {
        ...state.expedition.pressure,
        heat: Math.max(
          0,
          Math.min(100, state.expedition.pressure.heat + heatDelta)
        )
      },
      resolvedObligationSignalIds: [
        ...state.expedition.resolvedObligationSignalIds,
        signalId
      ],
      gigOutcomeByStep
    }
  }
  // A completed native Contract's item reward goes through the G1 ledger, so
  // it is materialized once by the terminal owner. The Money/Fame the template
  // pays is separate and already settled above.
  const completedNativeObligationIds = activeObligations
    .filter(
      obligation =>
        obligation.sourceType === 'native' && obligation.status === 'completed'
    )
    .map(obligation => obligation.id)
  const contractRewardLoadout = state.expedition.loadout
  if (
    changed &&
    completedNativeObligationIds.length > 0 &&
    contractRewardLoadout
  ) {
    const map = buildExpeditionMap(
      state.runSeed,
      contractRewardLoadout.tourTypeId,
      contractRewardLoadout.regionId
    )
    for (const obligationId of completedNativeObligationIds) {
      // A Contract completed at an earlier step already owns its entry, so the
      // derived entry id refuses the duplicate rather than paying twice.
      const resolution = resolveExpeditionReward(
        nextState,
        {
          expectedRewardId: 'reward_contract_patch_run',
          sourceType: 'contract',
          sourceId: obligationId,
          expectedRouteStep: nextState.expedition.routeStep
        },
        map
      )
      if (!resolution.ok) continue
      nextState = {
        ...nextState,
        expedition: {
          ...nextState.expedition,
          rewardLedger: [...nextState.expedition.rewardLedger, resolution.entry]
        }
      }
    }
  }
  if (moneyDelta > 0)
    nextState = QuestEvents.emit(
      nextState,
      createMoneyEarnedQuestEvent({ amount: moneyDelta, reason: 'contract' })
    )
  if (fameDelta > 0)
    nextState = QuestEvents.emit(
      nextState,
      createFameGainedQuestEvent({ amount: fameDelta, reason: 'contract' })
    )
  return nextState
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
  const derived = deriveExpeditionDoubleDownOffer(
    state.runSeed,
    payload.obligationId,
    state.expedition.routeStep
  )
  if (payload.offerId !== derived.acceptedOfferId) return state
  const activeObligations = [...state.expedition.activeObligations]
  const obligation = activeObligations[index]
  if (!obligation) return state
  activeObligations[index] = {
    ...obligation,
    doubleDown: {
      acceptedOfferId: derived.acceptedOfferId,
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

  const occurrenceProof = `${payload.sourceType}:${payload.sourceKey}:${state.expedition.routeStep}`
  if (state.expedition.consumedRunDraftSourceKeys?.includes(occurrenceProof))
    return state

  const sourceProven = (() => {
    switch (payload.sourceType) {
      case 'major_gig': {
        const currentNode = state.player.currentNodeId
          ? state.gameMap?.nodes?.[state.player.currentNodeId]
          : undefined
        const isMajorClass =
          currentNode &&
          (currentNode.nodeClass === 'MAJOR_GIG' ||
            currentNode.type === 'MAJOR_GIG' ||
            currentNode.type === 'FESTIVAL')
        return (
          state.lastGigStats !== null &&
          state.lastGigStats.failed !== true &&
          state.currentGig?.id === payload.sourceKey &&
          Boolean(isMajorClass)
        )
      }
      case 'rare_event': {
        return state.expedition.rewardLedger.some(
          reward =>
            reward.sourceId === payload.sourceKey &&
            reward.earnedAtRouteStep === state.expedition.routeStep
        )
      }
      case 'rival': {
        const loadout = state.expedition.loadout
        if (!loadout || !state.player.currentNodeId) return false
        const map = buildExpeditionMap(
          state.runSeed,
          loadout.tourTypeId,
          loadout.regionId
        )
        // The effective route, so a Nemesis shortcut counts: that overlay is
        // the tier-2 rule change, and a Rival encounter it opens is exactly
        // the qualifying moment a Run Draft is meant to fire on.
        const effective = getEffectiveExpeditionRoute(state, map)
        const subtype =
          effective.subtypeByNodeId[state.player.currentNodeId] ??
          map.meta[state.player.currentNodeId]?.specialSubtype
        return (
          state.rivalBand?.id === payload.sourceKey &&
          subtype === 'RIVAL_ENCOUNTER'
        )
      }
      case 'supply':
        return (
          state.player.currentNodeId === payload.sourceKey &&
          state.gameMap?.nodes?.[payload.sourceKey]?.type === 'SUPPLY_STOP'
        )
      case 'crew':
        return (
          state.expedition.resolvedCrewSourceIds?.includes(
            `${payload.sourceKey}:resolved:${state.expedition.routeStep}`
          ) === true
        )
    }
  })()
  if (!sourceProven) return state
  const candidateTraitIds = deriveExpeditionDraftCandidates(
    state.runSeed,
    occurrenceProof,
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
    offer.offeredAtRouteStep !== state.expedition.routeStep ||
    state.expedition.runDraftTraitIds.length >= 2 ||
    !offer.candidateTraitIds.includes(payload.traitId)
  )
    return state
  const occurrenceProof = `${offer.sourceType}:${offer.sourceKey}:${offer.offeredAtRouteStep}`
  const consumed = state.expedition.consumedRunDraftSourceKeys ?? []
  return {
    ...state,
    expedition: {
      ...state.expedition,
      runDraftTraitIds: [...state.expedition.runDraftTraitIds, payload.traitId],
      consumedRunDraftSourceKeys: consumed.includes(occurrenceProof)
        ? consumed
        : [...consumed, occurrenceProof],
      pendingRunDraftOffer: null
    }
  }
}

export const handleResolveExpeditionSocialResult = (
  state: GameState,
  payload: ResolveExpeditionSocialResultPayload
): GameState => {
  if (
    state.expedition.status !== 'active' ||
    payload.expectedRouteStep !== state.expedition.routeStep ||
    state.expedition.lastSocialResult?.resolvedAtRouteStep ===
      state.expedition.routeStep ||
    typeof payload.postOptionId !== 'string' ||
    payload.postOptionId.length === 0
  )
    return state
  if (
    !state.expedition.pendingSocialSettlement ||
    state.expedition.pendingSocialSettlement.routeStep !==
      state.expedition.routeStep
  )
    return state
  // The canonical Social-post owner (`applySocialPostResult`) stamps the option
  // it actually resolved onto `social.pendingSocialOptionId`. Without this the
  // payload would be its own provenance: any registry option could be settled
  // once per route step and its freshly minted proof reused for Social Intel.
  if (state.social.pendingSocialOptionId !== payload.postOptionId) return state
  const postOption = POST_OPTIONS.find(opt => opt.id === payload.postOptionId)
  if (!postOption) return state
  const expectedResultId = deriveExpeditionSocialResultId(postOption)
  if (payload.resultId !== expectedResultId) return state
  if (!state.lastGigStats || state.lastGigStats.failed === true) return state
  const result = EXPEDITION_SOCIAL_RESULTS[payload.resultId]
  if (!result || (result.requiresRival && !state.rivalBand)) return state
  const proofId = `${payload.postOptionId}:${payload.resultId}:${state.expedition.routeStep}`

  // A settled Rival-flavoured result is the canonical Rival encounter, and the
  // first production path that advances the persistent record.
  // `lastNemesisAdvanceRunId` is the per-run guard: one Nemesis step per Rival
  // per run keeps the ladder a cross-run relationship instead of something a
  // single tour can farm by posting repeatedly. It is deliberately not
  // `lastSeenRunId`, which START already set to this run's id.
  const rivalProgression = (() => {
    if (!result.requiresRival || !state.rivalBand) return null
    const rivalId = state.rivalBand.id
    const record = state.career.rivalsById[rivalId]
    if (!record) return null
    const runId = state.expedition.runId
    if (
      typeof runId !== 'string' ||
      record.history.lastNemesisAdvanceRunId === runId
    )
      return null
    const nemesisLevel = Math.min(4, record.history.nemesisLevel + 1) as
      0 | 1 | 2 | 3 | 4
    return {
      rivalId,
      career: {
        ...state.career,
        rivalsById: {
          ...state.career.rivalsById,
          [rivalId]: {
            ...record,
            history: {
              ...record.history,
              relationship: (nemesisLevel >= 4
                ? 'nemesis'
                : 'rival') as CareerRivalRecord['history']['relationship'],
              nemesisLevel,
              encounterCount: record.history.encounterCount + 1,
              lastOutcome:
                'hostile_win' as CareerRivalRecord['history']['lastOutcome'],
              lastSeenRunId: runId,
              lastNemesisAdvanceRunId: runId
            }
          }
        }
      }
    }
  })()
  const pressure = applyExpeditionPressureDelta(state, {
    heat: result.heat,
    exposure: result.exposure,
    crowdHype: result.crowdHype
  })
  let nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) + result.money
      ),
      fame: clampPlayerFame(finiteNumberOr(state.player.fame, 0) + result.fame),
      fameLevel: calculateFameLevel(
        clampPlayerFame(finiteNumberOr(state.player.fame, 0) + result.fame)
      )
    },
    social: {
      ...state.social,
      pendingSocialOptionId: null,
      brandReputation: {
        ...state.social.brandReputation,
        NEUTRAL: Math.max(
          0,
          Math.min(
            100,
            finiteNumberOr(state.social.brandReputation?.NEUTRAL, 0) +
              result.sponsorInterest
          )
        )
      }
    },
    career: rivalProgression?.career ?? state.career,
    rivalBand:
      state.rivalBand && result.rivalPressure !== 0
        ? {
            ...state.rivalBand,
            powerLevel: Math.max(
              1,
              state.rivalBand.powerLevel + Math.round(result.rivalPressure / 10)
            )
          }
        : state.rivalBand,
    expedition: {
      ...state.expedition,
      pressure,
      pendingSocialSettlement: null,
      lastSocialResult: {
        id: proofId,
        postOptionId: payload.postOptionId,
        resultId: payload.resultId,
        resolvedAtRouteStep: state.expedition.routeStep,
        intelConsumed: false
      }
    }
  }
  if (result.money > 0)
    nextState = QuestEvents.emit(
      nextState,
      createMoneyEarnedQuestEvent({
        amount: result.money,
        reason: 'expedition_social'
      })
    )
  if (result.fame > 0)
    nextState = QuestEvents.emit(
      nextState,
      createFameGainedQuestEvent({
        amount: result.fame,
        reason: 'expedition_social'
      })
    )
  // The settled Rival encounter is this event's canonical owner: emitted only
  // after the settlement actually succeeds, so a replayed or refused dispatch
  // (both return early above) emits nothing.
  if (rivalProgression) {
    nextState = QuestEvents.emit(
      nextState,
      createExpeditionRivalOutcomeQuestEvent(rivalProgression.rivalId, true)
    )
  }
  return handleRecordExpeditionObligationSignal(nextState, {
    signalType: 'social_post',
    sourceId: proofId,
    expectedRouteStep: state.expedition.routeStep
  })
}

export const handleCreateSocialIntelGrant = (
  state: GameState,
  payload: CreateSocialIntelGrantPayload
): GameState => {
  if (
    state.expedition.status !== 'active' ||
    payload.expectedRouteStep !== state.expedition.routeStep
  )
    return state
  const proof = state.expedition.lastSocialResult
  const result = EXPEDITION_SOCIAL_RESULTS[payload.resultId]
  if (
    !proof ||
    proof.intelConsumed ||
    proof.postOptionId !== payload.postOptionId ||
    proof.resultId !== payload.resultId ||
    proof.resolvedAtRouteStep !== state.expedition.routeStep ||
    !result?.intelTargetLevel
  )
    return state
  const loadout = state.expedition.loadout
  if (!loadout) return state
  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId
  )
  const currentNodeId = state.player.currentNodeId
  if (
    !currentNodeId ||
    !map.connections.some(
      edge => edge.from === currentNodeId && edge.to === payload.nodeId
    )
  )
    return state
  const grantId = `${proof.id}:social:${payload.nodeId}`
  if (state.expedition.intelGrants.some(grant => grant.id === grantId))
    return state
  return {
    ...state,
    expedition: {
      ...state.expedition,
      intelGrants: [
        ...state.expedition.intelGrants,
        {
          id: grantId,
          source: 'social',
          sourceProofId: proof.id,
          nodeId: payload.nodeId,
          targetLevel: result.intelTargetLevel,
          consumed: false
        }
      ],
      lastSocialResult: { ...proof, intelConsumed: true }
    }
  }
}
