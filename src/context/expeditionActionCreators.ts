/**
 * Typed action creators for the Expedition lifecycle.
 *
 * @remarks
 * Creators own the genuinely nondeterministic parts of a dispatch — ids and the
 * next persistable run seed — and normalize raw input. They never authorize a
 * transition: the reducer re-validates every field and stays the final
 * authority against malformed or replayed dispatches.
 */

import { getSafeUUID } from '../utils/crypto'
import { nextSeed } from '../utils/seededRng'
import { ActionTypes } from './actionTypes'
import { deriveExpeditionPendingFailure } from '../domain/expedition/failure'
import type { GameAction, GameState } from '../types'
import type {
  ExpeditionIntelSource,
  ExpeditionLoadout,
  ExpeditionRepairIntent,
  ExpeditionRewardSourceType,
  HiddenDefectTrigger
} from '../types/expedition'

/**
 * Builds the PREPARE action that claims a run identity and the next run seed.
 *
 * @param state - Current game state, read for the seed to advance from.
 * @returns Typed `PREPARE_EXPEDITION_RUN` action.
 *
 * @remarks
 * The seed is derived from the current root `GameState.runSeed` through the
 * shared `nextSeed` helper, so the value is deterministic from the save and
 * reproducible in a bug report — unlike a fresh crypto draw. The reducer
 * ignores the action unless the run is `idle`, so calling this while a run is
 * prepared or active cannot reroll the map.
 */
export const prepareExpeditionRun = (
  state: GameState
): Extract<
  GameAction,
  { type: typeof ActionTypes.PREPARE_EXPEDITION_RUN }
> => ({
  type: ActionTypes.PREPARE_EXPEDITION_RUN,
  payload: {
    prepId: getSafeUUID(),
    runSeed: nextSeed(state.runSeed)
  }
})

/**
 * Builds the START action for the prepared run.
 *
 * @param state - Current game state, read for the stale-guard seed.
 * @param loadout - Candidate loadout assembled by Tour Prep.
 * @returns Typed `START_EXPEDITION` action.
 *
 * @remarks
 * The loadout travels as a candidate on purpose: the reducer revalidates every
 * axis against canonical ownership and the route rebuilt from the root seed, so
 * nothing here authorizes the run.
 */
export const startExpedition = (
  state: GameState,
  loadout: ExpeditionLoadout
): Extract<GameAction, { type: typeof ActionTypes.START_EXPEDITION }> => ({
  type: ActionTypes.START_EXPEDITION,
  payload: {
    prepId: state.expedition.prep?.prepId ?? '',
    expectedRunSeed: state.runSeed,
    loadout
  }
})

/**
 * Builds the action advancing the run to a neighbouring route node.
 *
 * @param state - Current game state, read for the stale-guard route step.
 * @param nodeId - Target node.
 * @returns Typed `ADVANCE_EXPEDITION_ROUTE` action.
 */
export const advanceExpeditionRoute = (
  state: GameState,
  nodeId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.ADVANCE_EXPEDITION_ROUTE }
> => ({
  type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
  payload: { nodeId, expectedRouteStep: state.expedition.routeStep }
})

/**
 * Builds an intel-reveal action for one node.
 *
 * @param state - Current game state, read for the stale guards.
 * @param input - Node, source and optional grant id.
 * @returns Typed `REVEAL_EXPEDITION_NODE_INTEL` action.
 *
 * @remarks
 * `expectedLevel` is read from state rather than accepted from the caller, so a
 * UI cannot request a two-level jump; the reducer re-checks it anyway.
 */
export const revealExpeditionNodeIntel = (
  state: GameState,
  input: {
    nodeId: string
    source: ExpeditionIntelSource
    grantId?: string
  }
): Extract<
  GameAction,
  { type: typeof ActionTypes.REVEAL_EXPEDITION_NODE_INTEL }
> => {
  const stored = Object.hasOwn(state.expedition.intelByNodeId, input.nodeId)
    ? state.expedition.intelByNodeId[input.nodeId]
    : 0
  return {
    type: ActionTypes.REVEAL_EXPEDITION_NODE_INTEL,
    payload: {
      nodeId: input.nodeId,
      source: input.source,
      expectedLevel: stored === 1 ? 1 : 0,
      expectedRouteStep: state.expedition.routeStep,
      ...(input.grantId === undefined ? {} : { grantId: input.grantId })
    }
  }
}

/**
 * Builds the action banking one source-proven rare reward.
 *
 * @param state - Current game state, read for the stale-guard route step.
 * @param input - Reward id plus the source family and its evidence id.
 * @returns Typed `ADD_EXPEDITION_REWARD` action.
 */
export const addExpeditionReward = (
  state: GameState,
  input: {
    expectedRewardId: string
    sourceType: ExpeditionRewardSourceType
    sourceId: string
  }
): Extract<GameAction, { type: typeof ActionTypes.ADD_EXPEDITION_REWARD }> => ({
  type: ActionTypes.ADD_EXPEDITION_REWARD,
  payload: { ...input, expectedRouteStep: state.expedition.routeStep }
})

/**
 * Builds the voluntary-extraction action.
 *
 * @param state - Current game state, read for the stale-guard route step.
 * @param explicitRareRewardIds - Ledger entry ids the player carries out.
 * @returns Typed `EXTRACT_EXPEDITION` action.
 */
export const extractExpedition = (
  state: GameState,
  explicitRareRewardIds: string[] = []
): Extract<GameAction, { type: typeof ActionTypes.EXTRACT_EXPEDITION }> => ({
  type: ActionTypes.EXTRACT_EXPEDITION,
  payload: {
    expectedRouteStep: state.expedition.routeStep,
    explicitRareRewardIds: [...explicitRareRewardIds]
  }
})

/**
 * Builds the run-completion action.
 *
 * @param state - Current game state, read for the stale-guard route step.
 * @param finaleResultId - Canonical id of the resolved Finale result.
 * @returns Typed `COMPLETE_EXPEDITION` action.
 */
export const completeExpedition = (
  state: GameState,
  finaleResultId: string
): Extract<GameAction, { type: typeof ActionTypes.COMPLETE_EXPEDITION }> => ({
  type: ActionTypes.COMPLETE_EXPEDITION,
  payload: { finaleResultId, expectedRouteStep: state.expedition.routeStep }
})

/**
 * Builds the action accepting the run's current failure.
 *
 * @param state - Current game state, read for the crisis id and route step.
 * @returns Typed `ACCEPT_EXPEDITION_FAILURE` action, or `null` when no crisis
 * is currently raised.
 *
 * @remarks
 * Returns `null` rather than a forged id so a UI cannot offer "accept failure"
 * on a healthy run; the reducer refuses a stale id regardless.
 */
export const acceptExpeditionFailure = (
  state: GameState
): Extract<
  GameAction,
  { type: typeof ActionTypes.ACCEPT_EXPEDITION_FAILURE }
> | null => {
  const pending = deriveExpeditionPendingFailure(state)
  if (!pending) return null
  return {
    type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
    payload: {
      pendingFailureId: pending.id,
      expectedRouteStep: state.expedition.routeStep
    }
  }
}

/**
 * Builds the action returning a finalized run to `idle`.
 *
 * @param state - Current game state, read for the finalized run id.
 * @returns Typed `PREPARE_NEXT_EXPEDITION` action, or `null` when no run has
 * finalized.
 */
export const prepareNextExpedition = (
  state: GameState
): Extract<
  GameAction,
  { type: typeof ActionTypes.PREPARE_NEXT_EXPEDITION }
> | null => {
  const runId = state.expedition.runId
  if (typeof runId !== 'string' || state.expedition.outcome === null)
    return null
  return {
    type: ActionTypes.PREPARE_NEXT_EXPEDITION,
    payload: { runId }
  }
}

/**
 * Builds the action paying for a recovery option on the current crisis.
 *
 * @param state - Current game state, read for the crisis id and route step.
 * @param choice - The recovery the player picked.
 * @returns Typed `RESOLVE_EXPEDITION_CRISIS` action, or `null` when the crisis
 * is not live or does not offer that recovery.
 *
 * @remarks
 * Returns `null` rather than a forged payload so a UI cannot offer a recovery
 * the run is not actually presenting; the reducer re-derives both the crisis
 * and the choice's legality regardless.
 */
export const resolveExpeditionCrisis = (
  state: GameState,
  choice: 'refuel' | 'tow'
): Extract<
  GameAction,
  { type: typeof ActionTypes.RESOLVE_EXPEDITION_CRISIS }
> | null => {
  const pending = deriveExpeditionPendingFailure(state)
  if (!pending || !pending.choices.includes(choice)) return null
  return {
    type: ActionTypes.RESOLVE_EXPEDITION_CRISIS,
    payload: {
      pendingFailureId: pending.id,
      choice,
      expectedRouteStep: state.expedition.routeStep
    }
  }
}

/**
 * Builds the action executing an equipment repair during an active Expedition run.
 *
 * @param state - Current game state.
 * @param intent - Candidate repair intent.
 * @returns Typed `EXECUTE_EXPEDITION_REPAIR` action, or `null` when the run is not active.
 */
export const executeExpeditionRepair = (
  state: GameState,
  intent: ExpeditionRepairIntent
): Extract<
  GameAction,
  { type: typeof ActionTypes.EXECUTE_EXPEDITION_REPAIR }
> | null => {
  if (state.expedition?.status !== 'active') return null
  return {
    type: ActionTypes.EXECUTE_EXPEDITION_REPAIR,
    payload: {
      mode: intent.mode,
      targetGroup: intent.targetGroup,
      ...(intent.sourceGroup ? { sourceGroup: intent.sourceGroup } : {}),
      ...(intent.quality !== undefined ? { quality: intent.quality } : {}),
      expectedRouteStep: state.expedition.routeStep
    }
  }
}

/**
 * Builds the action revealing a hidden equipment defect.
 *
 * @param state - Current game state.
 * @param defectId - Target defect id.
 * @param source - Revelation source description.
 * @returns Typed `REVEAL_EXPEDITION_DEFECT` action, or `null` when run is not active.
 */
export const revealExpeditionDefect = (
  state: GameState,
  defectId: string,
  source: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.REVEAL_EXPEDITION_DEFECT }
> | null => {
  if (state.expedition?.status !== 'active') return null
  return {
    type: ActionTypes.REVEAL_EXPEDITION_DEFECT,
    payload: {
      defectId,
      source,
      expectedRouteStep: state.expedition.routeStep
    }
  }
}

/**
 * Builds the action triggering an equipment defect.
 *
 * @param state - Current game state.
 * @param defectId - Target defect id.
 * @param trigger - Trigger phase.
 * @returns Typed `TRIGGER_EXPEDITION_DEFECT` action, or `null` when run is not active.
 */
export const triggerExpeditionDefect = (
  state: GameState,
  defectId: string,
  trigger: HiddenDefectTrigger
): Extract<
  GameAction,
  { type: typeof ActionTypes.TRIGGER_EXPEDITION_DEFECT }
> | null => {
  if (state.expedition?.status !== 'active') return null
  return {
    type: ActionTypes.TRIGGER_EXPEDITION_DEFECT,
    payload: {
      defectId,
      trigger,
      expectedRouteStep: state.expedition.routeStep
    }
  }
}

/**
 * Builds the action resolving an equipment defect.
 *
 * @param state - Current game state.
 * @param defectId - Target defect id.
 * @param repairResolutionId - Associated repair resolution id.
 * @returns Typed `RESOLVE_EXPEDITION_DEFECT` action, or `null` when run is not active.
 */
export const resolveExpeditionDefect = (
  state: GameState,
  defectId: string,
  repairResolutionId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.RESOLVE_EXPEDITION_DEFECT }
> | null => {
  if (state.expedition?.status !== 'active') return null
  return {
    type: ActionTypes.RESOLVE_EXPEDITION_DEFECT,
    payload: {
      defectId,
      repairResolutionId,
      expectedRouteStep: state.expedition.routeStep
    }
  }
}
