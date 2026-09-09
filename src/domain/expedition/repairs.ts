/**
 * Pure registry and resolver for Expedition repair modes.
 *
 * @remarks
 * Every UI-exposed repair option executes through this single authoritative
 * contract: Field, Professional, Improvise, and Cannibalize.
 */

import type {
  ConditionGroup,
  ExpeditionRepairIntent,
  ExpeditionRepairResult
} from '../../types/expedition'
import type { GameState } from '../../types'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { getEffectiveExpeditionRules } from './effectiveRules'
import { getExpeditionTechnicalCondition } from './condition'
import { canSpendExpeditionCash } from './loadout'

/**
 * Pure resolution outcome of a repair intent.
 */
export type ExpeditionRepairResolution =
  { ok: true; result: ExpeditionRepairResult } | { ok: false; reason: string }

/**
 * Checks whether the current game location exposes professional service.
 *
 * @param state - Current game state.
 * @param options - Optional explicit service override (e.g. for testing).
 * @returns True if professional service is accessible.
 */
export const isExpeditionServiceLocation = (
  state: GameState,
  options?: { serviceAvailable?: boolean }
): boolean => {
  if (options && typeof options.serviceAvailable === 'boolean') {
    return options.serviceAvailable
  }

  const visited = state.expedition?.visitedNodeIds
  const lastVisitedId =
    Array.isArray(visited) && visited.length > 0
      ? visited[visited.length - 1]
      : null

  const candidateIds = [lastVisitedId, state.player?.currentNodeId].filter(
    (id): id is string => typeof id === 'string' && id.length > 0
  )

  for (const nodeId of candidateIds) {
    if (state.gameMap?.nodes?.[nodeId]) {
      const node = state.gameMap.nodes[nodeId]
      const meta = state.gameMap.meta?.[nodeId]
      const type = node.type
      const metaClass = meta?.nodeClass

      if (
        type === 'SUPPLY_STOP' ||
        type === 'START' ||
        type === 'FESTIVAL' ||
        metaClass === 'SUPPLY_STOP' ||
        metaClass === 'START' ||
        metaClass === 'FESTIVAL'
      ) {
        return true
      }
    }
  }

  return false
}

const VALID_GROUPS: ReadonlySet<string> = new Set<ConditionGroup>([
  'pa',
  'instruments',
  'stageGear'
])

/**
 * Resolves a repair intent against current state, producing canonical costs and condition delta.
 *
 * @param state - Current game state.
 * @param intent - Player repair intent.
 * @param options - Contextual options such as service availability.
 * @returns Ok with resolution result or rejected with a reason.
 */
export const resolveExpeditionRepair = (
  state: GameState,
  intent: ExpeditionRepairIntent,
  options?: { serviceAvailable?: boolean }
): ExpeditionRepairResolution => {
  if (!intent || typeof intent !== 'object') {
    return { ok: false, reason: 'MALFORMED_INTENT' }
  }

  const { mode, targetGroup, sourceGroup, expectedRouteStep } = intent

  if (!VALID_GROUPS.has(targetGroup)) {
    return { ok: false, reason: 'INVALID_TARGET_GROUP' }
  }

  const currentRouteStep = state.expedition?.routeStep ?? 0
  if (expectedRouteStep !== currentRouteStep) {
    return { ok: false, reason: 'STALE_ROUTE_STEP' }
  }

  const tc = getExpeditionTechnicalCondition(state)
  const rules = getEffectiveExpeditionRules(state)

  switch (mode) {
    case 'field': {
      const spareParts = state.expedition?.cargo?.spareParts ?? 0
      if (spareParts < 1) {
        return { ok: false, reason: 'INSUFFICIENT_SPARE_PARTS' }
      }

      const boundedQuality = Math.max(
        0,
        Math.min(1, finiteNumberOr(intent.quality, 0))
      )
      const rawRestore =
        20 + boundedQuality * 35 + rules.numeric.fieldRepairEfficiency * 20
      const restore = Math.max(
        rules.flags.fieldRepairMinimumCondition,
        Math.min(60, Math.round(rawRestore))
      )
      const createDefect =
        !rules.flags.fieldRepairNoHiddenDefect && boundedQuality < 0.45

      return {
        ok: true,
        result: {
          targetRestore: restore,
          sourceDamage: 0,
          moneyCost: 0,
          sparePartsCost: 1,
          createsHiddenDefect: createDefect,
          resolvesTargetDefects: false
        }
      }
    }

    case 'professional': {
      if (!isExpeditionServiceLocation(state, options)) {
        return { ok: false, reason: 'SERVICE_UNAVAILABLE_AT_LOCATION' }
      }

      const targetCondition = tc[targetGroup]
      const missing = Math.max(0, 100 - targetCondition)
      const basePrice = Math.ceil(missing * 10)
      const moneyCost = Math.round(
        basePrice * rules.numeric.repairCostMultiplier
      )

      if (!canSpendExpeditionCash(state, moneyCost)) {
        return { ok: false, reason: 'INSUFFICIENT_SPENDABLE_CASH' }
      }

      return {
        ok: true,
        result: {
          targetRestore: missing,
          sourceDamage: 0,
          moneyCost,
          sparePartsCost: 0,
          createsHiddenDefect: false,
          resolvesTargetDefects: true
        }
      }
    }

    case 'improvise': {
      const targetCondition = tc[targetGroup]
      if (targetCondition >= 50) {
        return { ok: false, reason: 'CONDITION_NOT_CRITICAL' }
      }

      const newCondition = Math.min(45, targetCondition + 20)
      const targetRestore = Math.max(0, newCondition - targetCondition)

      return {
        ok: true,
        result: {
          targetRestore,
          sourceDamage: 0,
          moneyCost: 0,
          sparePartsCost: 0,
          createsHiddenDefect: true,
          resolvesTargetDefects: false
        }
      }
    }

    case 'cannibalize': {
      if (
        !sourceGroup ||
        sourceGroup === targetGroup ||
        !VALID_GROUPS.has(sourceGroup)
      ) {
        return { ok: false, reason: 'INVALID_SOURCE_GROUP' }
      }

      const sourceCondition = tc[sourceGroup]
      if (sourceCondition < 55) {
        return { ok: false, reason: 'SOURCE_CONDITION_TOO_LOW' }
      }

      const targetCondition = tc[targetGroup]
      const newTarget = Math.min(60, targetCondition + 25)
      const targetRestore = Math.max(0, newTarget - targetCondition)

      return {
        ok: true,
        result: {
          targetRestore,
          sourceDamage: 15,
          moneyCost: 0,
          sparePartsCost: 0,
          createsHiddenDefect: false,
          resolvesTargetDefects: true
        }
      }
    }

    default:
      return { ok: false, reason: 'UNKNOWN_REPAIR_MODE' }
  }
}
