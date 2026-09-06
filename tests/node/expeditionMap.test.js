/**
 * @fileoverview The single deterministic Expedition route builder.
 *
 * Preview/active parity is the invariant that makes route choice a commitment:
 * if the Tour Prep preview and the played route could diverge, every extraction
 * decision the player made was based on a route they never actually walked.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP,
  buildExpeditionMap,
  getExpeditionNodePublicFacts,
  hashExpeditionRoute,
  isExpeditionFinaleReachable
} from '../../src/domain/expedition/map'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  MAX_EXPEDITION_MEANINGFUL_NODES,
  MIN_EXPEDITION_MEANINGFUL_NODES,
  NEUTRAL_EXPEDITION_ROUTE_PROFILE
} from '../../src/domain/expedition/defaults'

const build = (seed, profile = NEUTRAL_EXPEDITION_ROUTE_PROFILE) =>
  buildExpeditionMap(
    seed,
    BASE_EXPEDITION_TOUR_TYPE_ID,
    BASE_EXPEDITION_REGION_ID,
    profile
  )

const SEEDS = [0, 1, 7, 42, 1234, 99999, 0xffffffff]

const routeDepth = map =>
  Math.max(...Object.values(map.meta).map(entry => entry.routeStep))

describe('route determinism and preview/active parity', () => {
  it('produces an identical route for the same seed', () => {
    for (const seed of SEEDS) {
      const preview = build(seed)
      const active = build(seed)
      assert.equal(active.mapHash, preview.mapHash, `seed ${seed}`)
      assert.deepEqual(active.nodeOrder, preview.nodeOrder)
      assert.deepEqual(active.connections, preview.connections)
      assert.deepEqual(active.meta, preview.meta)
    }
  })

  it('produces different routes for different seeds', () => {
    const hashes = new Set(SEEDS.map(seed => build(seed).mapHash))
    assert.ok(hashes.size > 1, 'the seed must actually shape the route')
  })

  it('changes the structural identity when Tour or Region changes', () => {
    const base = build(4242)
    const otherTour = buildExpeditionMap(
      4242,
      'blitz_tour',
      BASE_EXPEDITION_REGION_ID,
      NEUTRAL_EXPEDITION_ROUTE_PROFILE
    )
    const otherRegion = buildExpeditionMap(
      4242,
      BASE_EXPEDITION_TOUR_TYPE_ID,
      'underground_network',
      NEUTRAL_EXPEDITION_ROUTE_PROFILE
    )
    assert.notEqual(otherTour.mapHash, base.mapHash)
    assert.notEqual(otherRegion.mapHash, base.mapHash)
  })

  it('echoes the root run seed without storing a second one', () => {
    const map = build(4242)
    assert.equal(map.runSeed, 4242)
  })

  it('normalizes a malformed seed rather than throwing', () => {
    for (const seed of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
      const map = build(seed)
      assert.ok(Number.isInteger(map.runSeed))
      assert.ok(map.runSeed >= 0)
    }
  })

  it('hashes deterministically and distinguishes inputs', () => {
    assert.equal(hashExpeditionRoute('a|b'), hashExpeditionRoute('a|b'))
    assert.notEqual(hashExpeditionRoute('a|b'), hashExpeditionRoute('a|c'))
    assert.match(hashExpeditionRoute('x'), /^[0-9a-f]{8}$/)
  })
})

describe('standard route shape', () => {
  it('walks 7-9 meaningful nodes on one playthrough', () => {
    for (const seed of SEEDS) {
      const depth = routeDepth(build(seed))
      assert.ok(
        depth >= MIN_EXPEDITION_MEANINGFUL_NODES &&
          depth <= MAX_EXPEDITION_MEANINGFUL_NODES,
        `seed ${seed} route depth ${depth} is outside the approved 7-9 corridor`
      )
    }
  })

  it('clamps a profile that asks for a route outside the corridor', () => {
    for (const requested of [0, 1, 6, 10, 40, Number.NaN]) {
      const depth = routeDepth(
        build(11, {
          ...NEUTRAL_EXPEDITION_ROUTE_PROFILE,
          meaningfulNodeCount: requested
        })
      )
      assert.ok(depth >= MIN_EXPEDITION_MEANINGFUL_NODES)
      assert.ok(depth <= MAX_EXPEDITION_MEANINGFUL_NODES)
    }
  })

  it('keeps the Finale reachable and unique', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      assert.ok(isExpeditionFinaleReachable(map), `seed ${seed}`)
      const finales = Object.values(map.meta).filter(
        entry => entry.nodeClass === 'FINALE'
      )
      assert.equal(finales.length, 1)
      assert.equal(finales[0]?.nodeId, map.finaleNodeId)
    }
  })

  it('starts from exactly one unlocked START node', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      const starts = Object.values(map.meta).filter(
        entry => entry.nodeClass === 'START'
      )
      assert.equal(starts.length, 1)
      assert.equal(map.nodes[map.startNodeId]?.status, 'unlocked')
      assert.equal(map.meta[map.startNodeId]?.isMeaningful, false)
    }
  })

  it('leaves no node unreachable from START', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      const inbound = new Set(map.connections.map(edge => edge.to))
      for (const id of map.nodeOrder) {
        if (id === map.startNodeId) continue
        assert.ok(inbound.has(id), `seed ${seed}: ${id} has no inbound edge`)
      }
    }
  })

  it('offers a real route decision at most steps', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      const branchPoints = map.nodeOrder.filter(
        id => map.connections.filter(edge => edge.from === id).length >= 2
      )
      assert.ok(
        branchPoints.length >= 3,
        `seed ${seed} only has ${branchPoints.length} branch points`
      )
    }
  })

  it('places Rival and Underground special classes', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      const subtypes = new Set(
        Object.values(map.meta)
          .map(entry => entry.specialSubtype)
          .filter(Boolean)
      )
      assert.ok(subtypes.has('RIVAL_ENCOUNTER'), `seed ${seed}: no rival node`)
      assert.ok(
        subtypes.has('UNDERGROUND_MARKET') || subtypes.has('BLACK_MARKET'),
        `seed ${seed}: no underground node`
      )
    }
  })

  it('places an Underground node even when every retry hits the Rival layer', () => {
    // Regression: on a short route the Underground candidate collapses to a
    // single value, so all eight retries can land on the Rival layer. Seed
    // 505375 is such a route and used to ship with no Underground node.
    const subtypes = new Set(
      Object.values(build(505375).meta)
        .map(entry => entry.specialSubtype)
        .filter(Boolean)
    )
    assert.ok(subtypes.has('RIVAL_ENCOUNTER'))
    assert.ok(
      subtypes.has('UNDERGROUND_MARKET') || subtypes.has('BLACK_MARKET'),
      'seed 505375: no underground node'
    )
  })

  it('omits the Rival and Underground classes when the profile forbids them', () => {
    const map = build(7, {
      ...NEUTRAL_EXPEDITION_ROUTE_PROFILE,
      rivalAllowed: false,
      undergroundAllowed: false
    })
    for (const entry of Object.values(map.meta)) {
      assert.equal(entry.specialSubtype, null)
    }
  })

  it('maps every node onto an existing overworld node type', () => {
    const allowed = new Set([
      'START',
      'GIG',
      'FESTIVAL',
      'SUPPLY_STOP',
      'REST_STOP',
      'SPECIAL',
      'FINALE'
    ])
    for (const seed of SEEDS) {
      const map = build(seed)
      for (const node of Object.values(map.nodes)) {
        assert.ok(allowed.has(node.type), `unexpected node type ${node.type}`)
        assert.ok(Number.isFinite(node.x))
        assert.ok(Number.isFinite(node.y))
      }
    }
  })

  it('attaches a real venue to every gig-hosting node', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      for (const entry of Object.values(map.meta)) {
        const node = map.nodes[entry.nodeId]
        const needsVenue = ['START', 'CLUB_GIG', 'FESTIVAL', 'FINALE'].includes(
          entry.nodeClass
        )
        assert.equal(
          Boolean(node?.venue),
          needsVenue,
          `${entry.nodeId} (${entry.nodeClass}) venue presence mismatch`
        )
      }
    }
  })
})

describe('extraction windows', () => {
  it('offers no extraction before the recoverable opening steps', () => {
    for (const seed of SEEDS) {
      for (const entry of Object.values(build(seed).meta)) {
        if (entry.routeStep < FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP) {
          assert.equal(entry.isExtractionWindow, false)
        }
      }
    }
  })

  it('never marks the Finale as an extraction window', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      assert.equal(map.meta[map.finaleNodeId]?.isExtractionWindow, false)
    }
  })

  it('exposes at least one extraction window per route', () => {
    for (const seed of SEEDS) {
      const windows = Object.values(build(seed).meta).filter(
        entry => entry.isExtractionWindow
      )
      assert.ok(windows.length > 0, `seed ${seed} has no extraction window`)
    }
  })
})

describe('hybrid fog projection', () => {
  it('exposes only the always-visible facts', () => {
    const map = build(4242)
    const facts = getExpeditionNodePublicFacts(map, map.startNodeId)
    assert.ok(facts)
    assert.deepEqual(
      Object.keys(facts).sort(),
      [
        'dangerTier',
        'edges',
        'isExtractionWindow',
        'nodeClass',
        'nodeId',
        'rewardTier',
        'routeStep',
        'specialSubtype'
      ].sort()
    )
    // The intel-gated block must not leak through the level-0 projection.
    assert.equal(Object.hasOwn(facts, 'hidden'), false)
  })

  it('returns null for an unknown node', () => {
    const map = build(1)
    assert.equal(getExpeditionNodePublicFacts(map, 'nope'), null)
    assert.equal(getExpeditionNodePublicFacts(map, '__proto__'), null)
  })

  it('keeps every hidden detail deterministic and finite', () => {
    for (const seed of SEEDS) {
      for (const entry of Object.values(build(seed).meta)) {
        assert.ok(Number.isFinite(entry.hidden.exactPayout))
        assert.ok(entry.hidden.exactPayout >= 0)
        assert.ok(Number.isFinite(entry.hidden.exactWearCost))
        assert.ok(entry.hidden.authorityRisk >= 0)
        assert.ok(entry.hidden.authorityRisk <= 1)
      }
    }
  })

  it('gives the Finale the largest reward band on its route', () => {
    for (const seed of SEEDS) {
      const map = build(seed)
      const finale = map.meta[map.finaleNodeId]
      assert.equal(finale?.rewardTier, 'high')
    }
  })
})
