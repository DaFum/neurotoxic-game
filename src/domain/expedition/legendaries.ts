/**
 * Legendary eligibility and the five rules each one changes.
 *
 * @remarks
 * A Legendary is earned by a Finale and owned forever, but it acts exactly
 * once per run. Ownership therefore lives on the Career and consumption lives
 * on the run, and every predicate here reads both: a Legendary the run already
 * spent is indistinguishable from one the Career never earned, which is what
 * keeps "once per run" true across a reload.
 *
 * Each capability has its own trigger. Nothing here is a shared numeric
 * multiplier - if a Legendary only made a number bigger it would belong in
 * `getEffectiveExpeditionRules` instead.
 */

import type { GameState } from '../../types'
import type { CareerState, ExpeditionLegendaryId } from '../../types/career'
import type {
  ExpeditionMap,
  ExpeditionTechnicalCondition
} from '../../types/expedition'
import {
  EXPEDITION_LEGENDARY_BY_FINALE,
  EXPEDITION_LEGENDARY_IDS,
  isExpeditionLegendaryId
} from '../../data/expedition/legendaries'
import { hasExpeditionCareerRank } from './meta'
import { getAvailableAuthoritySafeExits } from './authority'
import { hashExpeditionRoute } from './map'

/** The Legendaries a Career owns, narrowed to the registry. */
const ownedLegendaries = (
  career: CareerState | undefined
): ReadonlySet<ExpeditionLegendaryId> =>
  new Set(
    Array.isArray(career?.legendaryIds)
      ? career.legendaryIds.filter(isExpeditionLegendaryId)
      : []
  )

/**
 * Whether the Career owns one Legendary.
 *
 * @param career - Career slice.
 * @param legendaryId - Legendary to check.
 * @returns True when it is owned.
 */
const isExpeditionLegendaryOwned = (
  career: CareerState | undefined,
  legendaryId: ExpeditionLegendaryId
): boolean => ownedLegendaries(career).has(legendaryId)

/**
 * Whether one Legendary may act right now.
 *
 * @param state - Current game state.
 * @param legendaryId - Legendary to check.
 * @returns True when it is owned, the run is active, and it is unspent.
 *
 * @remarks
 * The shared half of every transform below. The transform-specific trigger is
 * always checked on top of this, never instead of it.
 */
export const isExpeditionLegendaryAvailable = (
  state: GameState,
  legendaryId: ExpeditionLegendaryId
): boolean =>
  state.expedition?.status === 'active' &&
  isExpeditionLegendaryOwned(state.career, legendaryId) &&
  !(state.expedition.consumedLegendaryIds ?? []).includes(legendaryId)

/**
 * Marks one Legendary spent for this run.
 *
 * @param state - Current game state.
 * @param legendaryId - Legendary that just acted.
 * @returns Next state, or the identical reference when it was already spent.
 */
export const consumeExpeditionLegendary = (
  state: GameState,
  legendaryId: ExpeditionLegendaryId
): GameState => {
  const consumed = state.expedition.consumedLegendaryIds ?? []
  if (consumed.includes(legendaryId)) return state
  return {
    ...state,
    expedition: {
      ...state.expedition,
      consumedLegendaryIds: [...consumed, legendaryId]
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Earning                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The Legendary a finalized run has earned, if any.
 *
 * @param state - Current game state, carrying the finalized outcome.
 * @param runId - Run the claim names.
 * @returns The capability the Finale earns, or `null` when nothing is owed.
 *
 * @remarks
 * Recomputed from the outcome rather than taken from the claim: the run has to
 * have *completed* on a Finale it actually resolved, the Career has to be at
 * `headliner`, the run must not have claimed already, and the mapped Legendary
 * must not be owned. `contract_special` is the one Finale with no signature of
 * its own - a Contract forced it rather than the run's pressure producing it -
 * so it awards the first Legendary the Career does not own instead.
 */
export const resolveExpeditionLegendaryCandidate = (
  state: GameState,
  runId: unknown
): ExpeditionLegendaryId | null => {
  const outcome = state.expedition?.outcome
  if (
    typeof runId !== 'string' ||
    !outcome ||
    outcome.runId !== runId ||
    outcome.kind !== 'completed' ||
    typeof outcome.finaleResultId !== 'string' ||
    outcome.finaleResultId === ''
  ) {
    return null
  }
  if (!hasExpeditionCareerRank(state, 'headliner')) return null
  if (state.career.legendaryClaimedRunIds.includes(runId)) return null

  const owned = ownedLegendaries(state.career)
  const finaleType = state.expedition.finaleType
  if (finaleType === 'contract_special') {
    return EXPEDITION_LEGENDARY_IDS.find(id => !owned.has(id)) ?? null
  }
  const mapped = finaleType
    ? EXPEDITION_LEGENDARY_BY_FINALE[finaleType]
    : undefined
  if (!mapped || owned.has(mapped)) return null
  return mapped
}

/* -------------------------------------------------------------------------- */
/* Safe Harbor — one extra extraction opportunity                             */
/* -------------------------------------------------------------------------- */

/** Normal extraction windows the run must have passed before Safe Harbor acts. */
const SAFE_HARBOR_REQUIRED_WINDOWS = 2

/**
 * The one route step Safe Harbor can turn into an extraction opportunity.
 *
 * @param map - The run's canonical route.
 * @param afterStep - The second normal window the run has already passed.
 * @returns That step, or `null` when the route offers none.
 *
 * @remarks
 * A Tour's windows are one contiguous corridor, so the step right after the
 * second of them is normally still inside it - and an opportunity the base
 * route already offers is not an extra one. The entitlement therefore stays
 * pending past the corridor and lands on the first step beyond it that is not
 * the Finale, which is the "next non-Finale node" the plan names.
 *
 * Derived from the route rather than counted from the window, because that is
 * what makes the grant exist at all: pinning it to `afterStep + 1` left every
 * canonical Tour with no eligible node, since each one's corridor runs
 * unbroken to the step before the Finale.
 */
const resolveExpeditionSafeHarborStep = (
  map: ExpeditionMap,
  afterStep: number
): number | null => {
  let earliest: number | null = null
  for (const nodeId of map.nodeOrder) {
    if (nodeId === map.finaleNodeId) continue
    const entry = map.meta[nodeId]
    if (!entry || entry.isExtractionWindow || entry.routeStep <= afterStep) {
      continue
    }
    if (earliest === null || entry.routeStep < earliest) {
      earliest = entry.routeStep
    }
  }
  return earliest
}

/**
 * Whether Safe Harbor makes the current node an extraction opportunity.
 *
 * @param state - Current game state.
 * @param map - The run's canonical route.
 * @returns True when the run may extract here on Safe Harbor alone.
 *
 * @remarks
 * The first node past the second normal window that the base route does not
 * already open, and only that one: the grant is a single extra opportunity
 * rather than a standing permit, so it expires by the run walking past it. No
 * consumption record is needed because the only way to spend it ends the run.
 *
 * The Finale is excluded - completing there is already the better outcome, and
 * an extraction on the Finale node would trade a completion for a retention
 * cut.
 */
export const isExpeditionSafeHarborWindow = (
  state: GameState,
  map: ExpeditionMap
): boolean => {
  if (!isExpeditionLegendaryAvailable(state, 'safe_harbor')) return false
  const seen = [...state.expedition.extractionWindowsSeen].sort((a, b) => a - b)
  if (seen.length < SAFE_HARBOR_REQUIRED_WINDOWS) return false
  const secondWindow = seen[SAFE_HARBOR_REQUIRED_WINDOWS - 1]
  if (secondWindow === undefined) return false
  const grantStep = resolveExpeditionSafeHarborStep(map, secondWindow)
  if (grantStep === null || state.expedition.routeStep !== grantStep) {
    return false
  }
  const nodeId =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (typeof nodeId !== 'string' || nodeId === map.finaleNodeId) return false
  // An opportunity the base route already offers is not an extra one.
  return map.meta[nodeId]?.isExtractionWindow !== true
}

/* -------------------------------------------------------------------------- */
/* Nemesis Key — one two-step jump                                            */
/* -------------------------------------------------------------------------- */

/**
 * The node Nemesis Key opens, two route steps ahead.
 *
 * @param state - Current game state.
 * @param map - The run's canonical route.
 * @returns The node id the jump reaches, or `null` when it cannot act.
 *
 * @remarks
 * Deliberately *not* the G4 Nemesis shortcut, which opens one unreached
 * neighbour at the next step for any Rival at tier 2. This skips a layer: it
 * is the only thing in the run that moves two steps at once, which is what
 * makes the Legendary a rule change rather than a stronger version of a tier.
 *
 * A Rival encounter two steps out is the prize; otherwise the jump lands on a
 * node one short of the Finale, so it always saves a step and never skips the
 * Finale itself. Seeded from `runSeed` and the node the run stands on, so the
 * same run always resolves the same target - and none of it touches
 * `buildExpeditionMap`, so `mapHash` is unchanged.
 */
export const deriveExpeditionNemesisKeyTarget = (
  state: GameState,
  map: ExpeditionMap
): string | null => {
  if (!isExpeditionLegendaryAvailable(state, 'nemesis_key')) return null
  const from =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (typeof from !== 'string' || !Number.isFinite(state.runSeed)) return null
  const targetStep = state.expedition.routeStep + 2
  const atStep = map.nodeOrder.filter(
    nodeId =>
      map.meta[nodeId]?.routeStep === targetStep && nodeId !== map.finaleNodeId
  )
  if (atStep.length === 0) return null
  // The plan makes this "one effective shortcut edge to Rival Encounter/Finale
  // branch", so a step with no Rival Encounter has nothing to shortcut *to*
  // and the Legendary simply has no target this run. Falling back to any node
  // at the step advertised a Rival Encounter through the overlay while the
  // node stayed a Gig or Rest Stop, and arrival - which routes on the node's
  // own type - then ran the original flow.
  const candidates = atStep.filter(
    nodeId => map.meta[nodeId]?.specialSubtype === 'RIVAL_ENCOUNTER'
  )
  if (candidates.length === 0) return null
  const index =
    Number.parseInt(
      hashExpeditionRoute(`${state.runSeed}:legendary-nemesis-key:${from}`),
      16
    ) % candidates.length
  return candidates[index] ?? null
}

/* -------------------------------------------------------------------------- */
/* Ghost Route — the Underground way out of an Authority crisis               */
/* -------------------------------------------------------------------------- */

/**
 * Whether Ghost Route may convert the Authority pressure the run is under.
 *
 * @param state - Current game state.
 * @returns True when the crisis is live and the Legendary is unspent.
 *
 * @remarks
 * The trigger is the *severe* Authority situation the crisis gate names -
 * Heat at 90 or above with every ordinary way out closed. Below that the run
 * still has choices and the Legendary is not owed one.
 */
export const canExpeditionGhostRouteConvert = (state: GameState): boolean =>
  isExpeditionLegendaryAvailable(state, 'ghost_route') &&
  state.expedition.pressure.heat >= 90 &&
  getAvailableAuthoritySafeExits(state).length === 0

/**
 * The Underground node Ghost Route opens as the alternative.
 *
 * @param state - Current game state.
 * @param map - The run's canonical route.
 * @returns The node id the detour reaches, or `null`.
 *
 * @remarks
 * Deterministic rather than drawn: an escape the player cannot count on is not
 * an escape. The next step's Underground node is the alternative when the
 * route has one - the Underground market or the black market, whichever the
 * generator placed - and otherwise the seeded next-step node, so the
 * conversion always produces a way out once the trigger holds.
 */
export const deriveExpeditionGhostRouteTarget = (
  state: GameState,
  map: ExpeditionMap
): string | null =>
  canExpeditionGhostRouteConvert(state)
    ? deriveExpeditionGhostRouteTargetFrom(
        state.expedition.visitedNodeIds[
          state.expedition.visitedNodeIds.length - 1
        ],
        state.expedition.routeStep,
        state.runSeed,
        map
      )
    : null

/**
 * The seeded derivation itself, independent of `GameState`.
 *
 * @param from - Node the run is leaving.
 * @param routeStep - Route step it is leaving from.
 * @param runSeed - The run's seed.
 * @param map - The run's canonical route.
 * @returns The node the detour would reach, or `null`.
 *
 * @remarks
 * Split out so the load sanitizer can re-derive a travelled conversion from
 * the node the run came from: a save claiming the Legendary converted some
 * other node is then rejected rather than handed an Underground arrival it
 * never earned.
 */
export const deriveExpeditionGhostRouteTargetFrom = (
  from: unknown,
  routeStep: number,
  runSeed: number | undefined,
  map: ExpeditionMap
): string | null => {
  if (typeof from !== 'string' || !Number.isFinite(runSeed)) return null
  const atStep = map.nodeOrder.filter(
    nodeId => map.meta[nodeId]?.routeStep === routeStep + 1
  )
  if (atStep.length === 0) return null
  const underground = atStep.filter(nodeId => {
    const subtype = map.meta[nodeId]?.specialSubtype
    return subtype === 'UNDERGROUND_MARKET' || subtype === 'BLACK_MARKET'
  })
  // Unlike the Nemesis Key shortcut, the plan's verb here is *convert*: the
  // Legendary turns the Authority opportunity into an Underground alternative
  // rather than routing to one that already exists, so a step without an
  // Underground node still has a target. The conversion is recorded on the
  // move as `expedition.arrivedOverlay`, which is what carries it into
  // arrival - the node's own class would otherwise resolve the flow.
  const candidates = underground.length > 0 ? underground : atStep
  const index =
    Number.parseInt(
      hashExpeditionRoute(`${runSeed}:legendary-ghost-route:${from}`),
      16
    ) % candidates.length
  return candidates[index] ?? null
}

/* -------------------------------------------------------------------------- */
/* Salvage Rights — a group is never lost outright                            */
/* -------------------------------------------------------------------------- */

/** The condition a salvaged group is left at. */
export const EXPEDITION_SALVAGE_RIGHTS_FLOOR = 20

/** Spare parts Salvage Rights takes when there is no rare left to give up. */
const EXPEDITION_SALVAGE_RIGHTS_SPARE_PARTS_COST = 2

/**
 * What Salvage Rights would cost this run, or `null` when it cannot act.
 *
 * @param state - Current game state.
 * @returns The price the Legendary charges, or `null` when it is unavailable.
 *
 * @remarks
 * An unsecured rare reward first: that is the greed the run was carrying, and
 * giving it up is what makes the rescue a trade rather than a free save. With
 * nothing unsecured left it takes two spare parts, and with neither it is
 * simply unavailable - the plan is explicit that it does not act for free.
 *
 * Secured rewards are never touched. They are already banked, so spending one
 * would reach past this run into what the Career has kept.
 */
const resolveExpeditionSalvageRightsCost = (
  state: GameState
):
  | { kind: 'rare'; rewardEntryId: string }
  | { kind: 'spare_parts'; spareParts: number }
  | null => {
  if (!isExpeditionLegendaryAvailable(state, 'salvage_rights')) return null
  const surrendered = state.expedition.rewardLedger.find(
    entry => !entry.secured && !entry.materialized
  )
  if (surrendered) return { kind: 'rare', rewardEntryId: surrendered.id }
  if (
    (state.expedition.cargo?.spareParts ?? 0) >=
    EXPEDITION_SALVAGE_RIGHTS_SPARE_PARTS_COST
  ) {
    return {
      kind: 'spare_parts',
      spareParts: EXPEDITION_SALVAGE_RIGHTS_SPARE_PARTS_COST
    }
  }
  return null
}

/**
 * Spends Salvage Rights to keep a wiped technical group in the run.
 *
 * @param state - State whose technical condition has already taken the wear.
 * @param before - The condition as it stood before that wear.
 * @returns Next state, or the identical reference when nothing was rescued.
 *
 * @remarks
 * The trigger is a group the wear just took to zero from above it: a group
 * that was already at zero is not a loss this wear caused, and rescuing it
 * would let one Legendary undo damage from an earlier night.
 *
 * Exactly one group per run, which is what the single consumption record
 * enforces - a Gig that wipes two groups at once salvages the first in
 * `EXPEDITION_CONDITION_GROUPS` order and loses the other.
 */
export const applyExpeditionSalvageRights = (
  state: GameState,
  before: ExpeditionTechnicalCondition
): GameState => {
  const after = state.expedition.technicalCondition
  if (!after) return state
  const wiped = (['pa', 'instruments', 'stageGear'] as const).find(
    group => after[group] === 0 && before[group] > 0
  )
  if (!wiped) return state
  const cost = resolveExpeditionSalvageRightsCost(state)
  if (!cost) return state

  const rescued = consumeExpeditionLegendary(state, 'salvage_rights')
  const cargo = rescued.expedition.cargo
  return {
    ...rescued,
    expedition: {
      ...rescued.expedition,
      technicalCondition: {
        ...after,
        [wiped]: EXPEDITION_SALVAGE_RIGHTS_FLOOR
      },
      rewardLedger:
        cost.kind === 'rare'
          ? rescued.expedition.rewardLedger.filter(
              entry => entry.id !== cost.rewardEntryId
            )
          : rescued.expedition.rewardLedger,
      cargo:
        cost.kind === 'spare_parts' && cargo
          ? {
              ...cargo,
              spareParts: Math.max(0, cargo.spareParts - cost.spareParts)
            }
          : cargo
    }
  }
}
