/**
 * @fileoverview Fame `accessTier` gates high-profile Expedition content.
 *
 * Two kinds are gated (see `EXPEDITION_ACCESS_TIER_REQUIREMENTS`): booking a
 * Festival node, and committing a showcase Contract. Both are offered at
 * their own boundary (the map and Tour Prep) and re-checked by the reducer
 * that books or commits them, so a raw dispatch cannot skip the gate.
 */

import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'
import { logger } from '../../src/utils/logger.ts'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import {
  EXPEDITION_ACCESS_TIER_REQUIREMENTS,
  getExpeditionAccessLock,
  getExpeditionContractAccessLock,
  getExpeditionFameProfile,
  getExpeditionNodeBookingLock
} from '../../src/domain/expedition/fame.ts'
import {
  getAvailableNativeContractTemplateIds,
  getExpeditionFameLockedContractTemplateIds,
  validateExpeditionBuildCommitment
} from '../../src/domain/expedition/loadout.ts'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../src/data/expedition/contracts.ts'
import { handleNodeArrival } from '../../src/utils/arrivalUtils.ts'
import { getExpeditionMobilityFailureSignal } from '../../src/domain/expedition/failure.ts'
import { fixtureLoadout } from '../expeditionLifecycleFixture.js'

const TOUR = 'standard_tour'
const REGION = 'home_turf'
const SHOWCASE = 'contract_all_in'

afterEach(() => mock.restoreAll())

/** A fresh Career at the prepared stage on `seed`, with the given Fame. */
const prepare = (seed, fame) => {
  const fresh = createInitialState()
  fresh.player.money = 5000
  fresh.player.fame = fame
  fresh.player.van.fuel = 100
  return gameReducer(fresh, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId: `access_${seed}`, runSeed: seed }
  })
}

const start = (prepared, loadout) =>
  gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: prepared.expedition.prep.prepId,
      expectedRunSeed: prepared.runSeed,
      loadout
    }
  })

/** Path of node ids from the start node to `targetId`, via BFS. */
const pathTo = (map, targetId) => {
  const previous = new Map([[map.startNodeId, null]])
  const queue = [map.startNodeId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === targetId) break
    for (const edge of map.connections) {
      if (edge.from !== current || previous.has(edge.to)) continue
      previous.set(edge.to, current)
      queue.push(edge.to)
    }
  }
  const path = []
  for (let id = targetId; id !== null; id = previous.get(id)) path.unshift(id)
  return path.slice(1)
}

/** Walks a started run along `path` through the real route action. */
const walk = (state, path) => {
  let current = state
  for (const nodeId of path) {
    const next = gameReducer(current, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: { nodeId, expectedRouteStep: current.expedition.routeStep }
    })
    assert.notEqual(next, current, `route advance to ${nodeId} was refused`)
    current = next
  }
  return current
}

/** First seed whose fresh route carries a node of `nodeClass`. */
const seedWith = nodeClass => {
  for (let seed = 1; seed < 500; seed++) {
    const map = buildExpeditionMap(seed, TOUR, REGION)
    const nodeId = map.nodeOrder.find(
      id => map.meta[id]?.nodeClass === nodeClass
    )
    if (nodeId) return { seed, map, nodeId }
  }
  throw new Error(`no seed offers a ${nodeClass} node`)
}

const startGig = (state, nodeId) =>
  gameReducer(state, {
    type: ActionTypes.START_GIG,
    payload: state.gameMap.nodes[nodeId].venue
  })

describe('Fame access tiers - configuration', () => {
  it('keeps every gate on the published ladder and above the baseline', () => {
    for (const [kind, tier] of Object.entries(
      EXPEDITION_ACCESS_TIER_REQUIREMENTS
    )) {
      assert.ok(tier >= 1 && tier <= 5, `${kind} must sit on tiers 1..5`)
    }
  })

  it('opens a lock exactly at the tier Fame floor', () => {
    const tier = EXPEDITION_ACCESS_TIER_REQUIREMENTS.showcaseContract
    const lock = getExpeditionAccessLock({ player: { fame: 0 } }, tier)
    assert.ok(lock)
    assert.equal(lock.requiredTier, tier)
    assert.equal(
      getExpeditionFameProfile({ player: { fame: lock.minimumFame } })
        .accessTier,
      tier
    )
    assert.equal(
      getExpeditionAccessLock({ player: { fame: lock.minimumFame - 1 } }, tier)
        ?.requiredTier,
      tier
    )
    assert.equal(
      getExpeditionAccessLock({ player: { fame: lock.minimumFame } }, tier),
      null
    )
  })
})

describe('Fame access tiers - Festival bookings', () => {
  const active = fame => ({
    player: { fame },
    expedition: { status: 'active' }
  })

  it('gates only Festival nodes, and only inside an active run', () => {
    assert.ok(getExpeditionNodeBookingLock(active(0), 'FESTIVAL'))
    for (const type of ['START', 'GIG', 'FINALE', 'SUPPLY_STOP', 'SPECIAL']) {
      assert.equal(getExpeditionNodeBookingLock(active(0), type), null, type)
    }
    assert.equal(
      getExpeditionNodeBookingLock(
        { player: { fame: 0 }, expedition: { status: 'idle' } },
        'FESTIVAL'
      ),
      null,
      'the Career map is never gated'
    )
    const { minimumFame } = getExpeditionNodeBookingLock(active(0), 'FESTIVAL')
    assert.equal(
      getExpeditionNodeBookingLock(active(minimumFame), 'FESTIVAL'),
      null
    )
  })

  it('refuses a raw START_GIG on a locked Festival node and warns', () => {
    const { seed, map, nodeId } = seedWith('FESTIVAL')
    const started = start(prepare(seed, 0), fixtureLoadout())
    assert.equal(started.expedition.status, 'active')
    const atFestival = walk(started, pathTo(map, nodeId))
    assert.equal(atFestival.player.currentNodeId, nodeId)

    const warn = mock.method(logger, 'warn', () => {})
    const refused = startGig(atFestival, nodeId)
    assert.equal(refused, atFestival, 'state must be untouched')
    assert.ok(
      warn.mock.calls.some(call => String(call.arguments[1]).includes('Fame')),
      'the refusal is logged'
    )
  })

  it('books the same Festival once Fame reaches the tier', () => {
    const { seed, map, nodeId } = seedWith('FESTIVAL')
    const started = start(prepare(seed, 0), fixtureLoadout())
    const atFestival = walk(started, pathTo(map, nodeId))
    const { minimumFame } = getExpeditionNodeBookingLock(atFestival, 'FESTIVAL')
    const famous = {
      ...atFestival,
      player: { ...atFestival.player, fame: minimumFame }
    }
    const booked = startGig(famous, nodeId)
    assert.equal(booked.currentScene, GAME_PHASES.PRE_GIG)
  })

  it('turns the band away on arrival instead of starting the gig', () => {
    const toasts = []
    let started = false
    const result = handleNodeArrival({
      node: {
        id: 'n',
        type: 'FESTIVAL',
        venue: { id: 'v', name: 'V' }
      },
      band: { harmony: 80, members: [] },
      player: { fame: 0 },
      updateBand: () => {},
      updatePlayer: () => {
        throw new Error('a refused booking costs no Fame')
      },
      triggerEvent: () => false,
      startGig: () => {
        started = true
      },
      addToast: (message, level) => toasts.push({ message, level }),
      bookingLock: { requiredTier: 1, minimumFame: 250 },
      rng: () => 0.99
    })
    assert.equal(started, false)
    assert.equal(result.gigStarted, false)
    assert.equal(result.scene, GAME_PHASES.OVERWORLD)
    assert.equal(toasts.length, 1)
  })
})

describe('Fame access tiers - showcase Contracts', () => {
  const showcaseMap = buildExpeditionMap(4242, TOUR, REGION)

  it('classifies only the Finale-forcing template as a showcase', () => {
    for (const [id, template] of EXPEDITION_CONTRACTS_BY_ID) {
      const gated = getExpeditionContractAccessLock(
        { player: { fame: 0 } },
        template
      )
      assert.equal(gated !== null, id === SHOWCASE, id)
    }
  })

  it('shows the showcase as Fame-locked below the tier and offers it above', () => {
    const unknown = prepare(4242, 0)
    assert.ok(
      !getAvailableNativeContractTemplateIds(unknown, showcaseMap).includes(
        SHOWCASE
      )
    )
    assert.deepEqual(
      getExpeditionFameLockedContractTemplateIds(unknown, showcaseMap),
      [SHOWCASE]
    )

    const known = prepare(4242, 1000)
    assert.ok(
      getAvailableNativeContractTemplateIds(known, showcaseMap).includes(
        SHOWCASE
      )
    )
    assert.deepEqual(
      getExpeditionFameLockedContractTemplateIds(known, showcaseMap),
      []
    )
  })

  it('rejects the showcase in the commitment validator with its own reason', () => {
    const result = validateExpeditionBuildCommitment(
      prepare(4242, 0),
      fixtureLoadout({
        nativeContracts: [{ templateId: SHOWCASE, targetNodeId: null }]
      }),
      showcaseMap
    )
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'FAME_ACCESS_LOCKED')
  })

  it('refuses a raw START_EXPEDITION below the tier and warns', () => {
    const prepared = prepare(4242, 0)
    const warn = mock.method(logger, 'warn', () => {})
    const refused = start(
      prepared,
      fixtureLoadout({
        nativeContracts: [{ templateId: SHOWCASE, targetNodeId: null }]
      })
    )
    assert.equal(refused, prepared)
    assert.ok(warn.mock.calls.length > 0)
  })

  it('commits the showcase once Fame reaches the tier', () => {
    const started = start(
      prepare(4242, 1000),
      fixtureLoadout({
        nativeContracts: [{ templateId: SHOWCASE, targetNodeId: null }]
      })
    )
    assert.equal(started.expedition.status, 'active')
  })
})

describe('Fame access tiers - a new run is never soft-locked', () => {
  it('starts a fresh Career at Fame 0 and books its first club gig', () => {
    const { seed, map, nodeId } = seedWith('CLUB_GIG')
    const fresh = prepare(seed, 0)
    assert.equal(fresh.player.fame, 0)
    const started = start(fresh, fixtureLoadout())
    assert.equal(started.expedition.status, 'active')
    const atGig = walk(started, pathTo(map, nodeId))
    assert.equal(startGig(atGig, nodeId).currentScene, GAME_PHASES.PRE_GIG)
  })

  it('strands a band at a locked Festival with no fuel and no spendable cash', () => {
    const { seed, map, nodeId } = seedWith('FESTIVAL')
    const started = start(prepare(seed, 0), fixtureLoadout())
    const atFestival = walk(started, pathTo(map, nodeId))
    // Empty tank, spendable slice exhausted, and a band too frayed to donate
    // blood: the unplayed Festival gig is the only remaining escape.
    const broke = {
      ...atFestival,
      player: {
        ...atFestival.player,
        money: atFestival.expedition.protectedCareerCash,
        van: { ...atFestival.player.van, fuel: 0 }
      },
      band: { ...atFestival.band, harmony: 0 }
    }
    assert.notEqual(broke.player.lastGigNodeId, nodeId)

    const locked = getExpeditionMobilityFailureSignal(broke)
    assert.equal(
      locked?.reason,
      'fuel_stranded',
      'a Festival the band cannot book is not an escape'
    )
    assert.ok(locked.choices.includes('accept_failure'))

    const { minimumFame } = getExpeditionNodeBookingLock(broke, 'FESTIVAL')
    const famous = {
      ...broke,
      player: { ...broke.player, fame: minimumFame }
    }
    assert.equal(
      getExpeditionMobilityFailureSignal(famous),
      null,
      'a bookable Festival still earns the way out'
    )
  })

  it('leaves the fresh build and every Finale ungated at Fame 0', () => {
    const fresh = prepare(4242, 0)
    const map = buildExpeditionMap(4242, TOUR, REGION)
    assert.equal(
      validateExpeditionBuildCommitment(fresh, fixtureLoadout(), map).valid,
      true
    )
    assert.equal(
      getExpeditionNodeBookingLock(
        { player: { fame: 0 }, expedition: { status: 'active' } },
        'FINALE'
      ),
      null
    )
  })
})
