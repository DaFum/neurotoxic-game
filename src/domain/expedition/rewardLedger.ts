/**
 * Source-proven rare Expedition rewards and their one materialization owner.
 *
 * @remarks
 * The design forbids granting a persistent reward before the event that owns it
 * resolves, and forbids duplicate payouts. Both are enforced here: an entry
 * only enters the ledger when canonical just-resolved source evidence exists,
 * security is derived from the source family rather than accepted from the
 * caller, and each definition names exactly one real materialization owner so a
 * reward cannot be applied twice through two paths.
 */

import { MERCH_PROFILES } from '../../data/merch'
import { isFiniteNumber } from '../../utils/finiteNumber'
import type { GameState } from '../../types'
import type {
  ExpeditionMap,
  ExpeditionRewardDefinition,
  ExpeditionRewardLedgerEntry,
  ExpeditionRewardSourceType
} from '../../types/expedition'

/**
 * The real v1 rare-reward registry.
 *
 * @remarks
 * Every entry names one materialization owner:
 * - `inventory` writes a real `band.inventory` key that existing gameplay reads
 *   (merch income, or the setup minigames' consumables).
 * - `unlock` appends to the persistent `state.unlocks` pool, which is the
 *   design's broadening meta progression and what G5's unlock sets consume.
 *
 * The `career` owner exists in the type union for G5's Career economy; it
 * deliberately has no entry until that owner exists, because a reward with no
 * real materialization path would be a promise the game cannot keep.
 */
export const EXPEDITION_REWARD_REGISTRY = {
  reward_route_merch_crate: {
    id: 'reward_route_merch_crate',
    sourceType: 'route_rare',
    owner: 'inventory',
    target: 'shirts',
    amount: 15,
    securedOnEarn: false
  },
  reward_route_vinyl_stash: {
    id: 'reward_route_vinyl_stash',
    sourceType: 'route_rare',
    owner: 'inventory',
    target: 'vinyl',
    amount: 8,
    securedOnEarn: false
  },
  reward_event_spare_cables: {
    id: 'reward_event_spare_cables',
    sourceType: 'event_rare',
    owner: 'inventory',
    target: 'cables',
    amount: 1,
    securedOnEarn: false
  },
  reward_contract_patch_run: {
    id: 'reward_contract_patch_run',
    sourceType: 'contract',
    owner: 'inventory',
    target: 'patches',
    amount: 40,
    securedOnEarn: true
  },
  reward_contact_backline_deal: {
    id: 'reward_contact_backline_deal',
    sourceType: 'crew_contact',
    owner: 'unlock',
    target: 'expedition_unlock_backline_network',
    amount: 1,
    securedOnEarn: true
  },
  reward_finale_underground_ledger: {
    id: 'reward_finale_underground_ledger',
    sourceType: 'finale_nonlegendary',
    owner: 'unlock',
    target: 'expedition_unlock_underground_ledger',
    amount: 1,
    // Definition-owned security: the Finale reward is banked the moment the
    // Finale resolves, so a post-Finale failure cannot take it back.
    securedOnEarn: true
  },
  reward_finale_road_crew_respect: {
    id: 'reward_finale_road_crew_respect',
    sourceType: 'finale_nonlegendary',
    owner: 'unlock',
    target: 'expedition_unlock_road_crew_respect',
    amount: 1,
    // Deliberately unsecured: this one is only kept by actually completing the
    // run, which is what gives the Finale its push-your-luck weight.
    securedOnEarn: false
  }
} as const satisfies Record<string, ExpeditionRewardDefinition>

/**
 * Reward id accepted by the ledger.
 */
type ExpeditionRewardId = keyof typeof EXPEDITION_REWARD_REGISTRY

/**
 * Resolves a reward id to its definition.
 *
 * @param rewardId - Candidate reward id from an untrusted dispatch.
 * @returns The definition, or `null` for an unknown id.
 */
export const resolveExpeditionRewardDefinition = (
  rewardId: unknown
): ExpeditionRewardDefinition | null => {
  if (typeof rewardId !== 'string') return null
  if (!Object.hasOwn(EXPEDITION_REWARD_REGISTRY, rewardId)) return null
  return EXPEDITION_REWARD_REGISTRY[rewardId as ExpeditionRewardId]
}

/**
 * Derives whether an earned reward is already secured.
 *
 * @param definition - Reward definition.
 * @returns True when the reward survives a failed run.
 *
 * @remarks
 * Route and event rares are always unsecured — they are the greed the
 * extraction decision is about. Contract and Crew-contact rewards are secured,
 * because the obligation that produced them already resolved. Finale rewards
 * follow their own definition.
 */
export const isExpeditionRewardSecuredOnEarn = (
  definition: ExpeditionRewardDefinition
): boolean => {
  switch (definition.sourceType) {
    case 'route_rare':
    case 'event_rare':
      return false
    case 'contract':
    case 'crew_contact':
      return true
    case 'finale_nonlegendary':
      return definition.securedOnEarn
  }
}

/**
 * Reason a reward could not enter the ledger.
 */
type ExpeditionRewardRejectionReason =
  | 'RUN_NOT_ACTIVE'
  | 'UNKNOWN_REWARD'
  | 'SOURCE_TYPE_MISMATCH'
  | 'STALE_ROUTE_STEP'
  | 'SOURCE_EVIDENCE_MISSING'
  | 'DUPLICATE_SOURCE'

/**
 * Payload shape a reward request carries.
 */
export interface ExpeditionRewardRequest {
  expectedRewardId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}

/**
 * Outcome of evaluating a reward request.
 */
export type ExpeditionRewardResolution =
  | { ok: true; entry: ExpeditionRewardLedgerEntry }
  | { ok: false; reason: ExpeditionRewardRejectionReason }

/**
 * Checks the canonical just-resolved evidence a reward source must produce.
 *
 * @param state - Current game state.
 * @param request - Reward request naming the source.
 * @param map - The route built from the canonical root run seed.
 * @returns True when the named source really did just resolve.
 *
 * @remarks
 * `route_rare` requires the node to be on the prepared route and to be the one
 * the run is currently standing on. `finale_nonlegendary` requires the run to
 * be standing on the Finale. The `event_rare`, `contract` and `crew_contact`
 * families have no producer before G3/G4, so their evidence check is the one
 * function those gates extend — until then no evidence can exist and the
 * reward is refused rather than minted.
 */
const hasCanonicalSourceEvidence = (
  state: GameState,
  request: ExpeditionRewardRequest,
  map: ExpeditionMap
): boolean => {
  const { sourceType, sourceId } = request
  const routeStep = state.expedition.routeStep

  switch (sourceType) {
    case 'route_rare': {
      if (!Object.hasOwn(map.meta, sourceId)) return false
      return map.meta[sourceId]?.routeStep === routeStep
    }
    case 'finale_nonlegendary': {
      if (sourceId !== map.finaleNodeId) return false
      return map.meta[map.finaleNodeId]?.routeStep === routeStep
    }
    // Producers owned by G3/G4. Extended in place by the owning gate.
    case 'event_rare':
    case 'contract':
    case 'crew_contact':
      return false
  }
}

/**
 * Evaluates one reward request against canonical source evidence.
 *
 * @param state - Current game state.
 * @param request - Untrusted reward request.
 * @param map - The route built from the canonical root run seed.
 * @returns Either the ledger entry to append, or the refusal.
 *
 * @remarks
 * The returned entry's `secured` flag and `earnedAtRouteStep` are derived here,
 * never read from the request: a caller must not be able to declare its own
 * reward secured. The entry id is derived from the reward and its source so a
 * replayed dispatch collides with the existing entry instead of paying twice.
 */
export const resolveExpeditionReward = (
  state: GameState,
  request: ExpeditionRewardRequest,
  map: ExpeditionMap
): ExpeditionRewardResolution => {
  if (state.expedition.status !== 'active') {
    return { ok: false, reason: 'RUN_NOT_ACTIVE' }
  }
  const definition = resolveExpeditionRewardDefinition(request.expectedRewardId)
  if (!definition) return { ok: false, reason: 'UNKNOWN_REWARD' }
  if (definition.sourceType !== request.sourceType) {
    return { ok: false, reason: 'SOURCE_TYPE_MISMATCH' }
  }
  if (
    !isFiniteNumber(request.expectedRouteStep) ||
    request.expectedRouteStep !== state.expedition.routeStep
  ) {
    return { ok: false, reason: 'STALE_ROUTE_STEP' }
  }
  if (typeof request.sourceId !== 'string' || request.sourceId.length === 0) {
    return { ok: false, reason: 'SOURCE_EVIDENCE_MISSING' }
  }
  if (!hasCanonicalSourceEvidence(state, request, map)) {
    return { ok: false, reason: 'SOURCE_EVIDENCE_MISSING' }
  }

  const entryId = `${definition.id}::${request.sourceId}`
  if (state.expedition.rewardLedger.some(entry => entry.id === entryId)) {
    return { ok: false, reason: 'DUPLICATE_SOURCE' }
  }

  return {
    ok: true,
    entry: {
      id: entryId,
      rewardDefinitionId: definition.id,
      sourceType: definition.sourceType,
      sourceId: request.sourceId,
      secured: isExpeditionRewardSecuredOnEarn(definition),
      earnedAtRouteStep: state.expedition.routeStep,
      materialized: false
    }
  }
}

/**
 * Applies one reward definition to its single materialization owner.
 *
 * @param state - State after terminal settlement committed.
 * @param definition - Reward to materialize.
 * @returns Next state, or the identical reference when nothing changed.
 *
 * @remarks
 * Called only from the terminal handler, once per retained entry, after the
 * settlement itself succeeded. Idempotency is the caller's: the ledger entry's
 * `materialized` flag is what stops a second application.
 */
export const materializeExpeditionReward = (
  state: GameState,
  definition: ExpeditionRewardDefinition
): GameState => {
  if (definition.owner === 'unlock') {
    const unlocks = Array.isArray(state.unlocks) ? state.unlocks : []
    if (unlocks.includes(definition.target)) return state
    return { ...state, unlocks: [...unlocks, definition.target] }
  }

  if (definition.owner === 'inventory') {
    const inventory = state.band.inventory ?? {}
    const currentRaw = Object.hasOwn(inventory, definition.target)
      ? inventory[definition.target]
      : 0
    // A boolean consumable flag (`cables`, `strings`, `drum_parts`) is set
    // rather than counted, matching the existing `inventory_set` semantics.
    if (typeof currentRaw === 'boolean') {
      if (currentRaw) return state
      return {
        ...state,
        band: {
          ...state.band,
          inventory: { ...inventory, [definition.target]: true }
        }
      }
    }
    const current = isFiniteNumber(currentRaw) ? currentRaw : 0
    return {
      ...state,
      band: {
        ...state.band,
        inventory: {
          ...inventory,
          [definition.target]: current + definition.amount
        }
      }
    }
  }

  // `career` has no owner before G5; returning state unchanged keeps the
  // ledger entry unmaterialized rather than silently dropping it.
  return state
}

/**
 * Checks that every registered reward names a target its owner can reach.
 *
 * @returns Ids whose target does not resolve to a real materialization target.
 *
 * @remarks
 * Exported so the registry invariants are asserted against the live data rather
 * than a copy: a reward pointing at a merch key that no longer exists would
 * otherwise materialize into a dead inventory slot.
 */
export const findExpeditionRewardsWithUnreachableTarget = (): string[] => {
  const offenders: string[] = []
  const inventoryKeys = new Set<string>([
    ...Object.keys(MERCH_PROFILES),
    'strings',
    'cables',
    'drum_parts',
    'cheap_mics',
    'canned_food',
    'beer_bulk',
    'golden_pick'
  ])
  for (const definition of Object.values(EXPEDITION_REWARD_REGISTRY)) {
    if (
      definition.owner === 'inventory' &&
      !inventoryKeys.has(definition.target)
    ) {
      offenders.push(definition.id)
    }
    if (
      definition.owner === 'unlock' &&
      !definition.target.startsWith('expedition_unlock_')
    ) {
      offenders.push(definition.id)
    }
  }
  return offenders
}
