/**
 * @fileoverview The Fog's scouted payout comes from the real gig economy.
 *
 * Audit M9: the route used to roll a random `exactPayout` for every node class,
 * rest and supply stops included, and the Fog revealed it as "Payout:" although
 * no arrival ever paid it. The reveal is now an estimate from the authoritative
 * gig calculation, shown only on nodes that book a real venue gig.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getExpeditionNodeFogByNodeId } from '../../src/domain/expedition/nodeFog'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import { calculateGigFinancials } from '../../src/utils/economy'
import { fnv1a32 } from '../../src/utils/stringUtils'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** The started fixture run with intel level 1 on every route node. */
const scoutedState = (overrides = {}) => {
  const state = startedState()
  return {
    ...state,
    ...overrides,
    expedition: {
      ...state.expedition,
      intelByNodeId: Object.assign(
        Object.create(null),
        Object.fromEntries(map.nodeOrder.map(id => [id, 1]))
      )
    }
  }
}

const isGigType = type =>
  type === 'GIG' || type === 'FESTIVAL' || type === 'FINALE'

describe('the scouted payout', () => {
  it('equals the real gig calculation for the node venue with neutral inputs', () => {
    const state = scoutedState()
    const fog = getExpeditionNodeFogByNodeId(state)
    assert.ok(fog)

    const gigNodeIds = map.nodeOrder.filter(id => {
      const node = map.nodes[id]
      return isGigType(node?.type) && node?.venue
    })
    assert.ok(gigNodeIds.length >= 2, 'the fixture route needs gig nodes')

    for (const id of gigNodeIds) {
      const expected = calculateGigFinancials({
        gigData: map.nodes[id].venue,
        performanceScore: 50,
        modifiers: {},
        bandInventory: {},
        playerState: state.player,
        gigStats: {}
      }).net
      assert.equal(fog[id]?.estimatedPayout, expected, id)
    }
  })

  it('follows the band fame, because ticket demand does', () => {
    const id = map.nodeOrder.find(nodeId => isGigType(map.nodes[nodeId]?.type))
    assert.ok(id)
    const base = scoutedState()
    const famous = scoutedState({ player: { ...base.player, fame: 5000 } })
    const low = getExpeditionNodeFogByNodeId(base)?.[id]?.estimatedPayout
    const high = getExpeditionNodeFogByNodeId(famous)?.[id]?.estimatedPayout
    assert.ok(typeof low === 'number' && typeof high === 'number')
    assert.notEqual(low, high)
  })

  it('shows no payout on nodes that do not book a gig', () => {
    const fog = getExpeditionNodeFogByNodeId(scoutedState())
    assert.ok(fog)
    const nonGigIds = map.nodeOrder.filter(
      id => !isGigType(map.nodes[id]?.type)
    )
    assert.ok(nonGigIds.length > 0, 'the fixture route needs non-gig nodes')
    for (const id of nonGigIds) {
      assert.equal(fog[id]?.estimatedPayout, null, id)
      // Still scouted: the wear reveal keeps its level-1 gate.
      assert.equal(typeof fog[id]?.exactWearCost, 'number', id)
    }
  })

  it('stays hidden at intel level 0', () => {
    const fog = getExpeditionNodeFogByNodeId(startedState())
    assert.ok(fog)
    for (const id of map.nodeOrder) {
      if ((fog[id]?.intelLevel ?? 0) >= 1) continue
      assert.equal(fog[id]?.estimatedPayout, null, id)
    }
  })
})

describe('retiring the random payout roll', () => {
  // Captured before the roll was removed. The builder still consumes that
  // draw, so every later seeded value - wear, events, Authority risk,
  // opportunities, rares - is unchanged and an in-progress run reloads onto
  // the same route its reward ledger was proven against.
  const PRE_CHANGE_FINGERPRINTS = [
    [4242, 'standard_tour', 'home_turf', 'e001d302', 2644794448],
    [8001, 'blitz_tour', 'industrial_belt', 'b1cce147', 937635269],
    [17, 'underground_tour', 'home_turf', 'aa08ef4c', 2578522279]
  ]

  it('leaves every other seeded hidden detail on the same stream', () => {
    for (const [
      seed,
      tour,
      region,
      mapHash,
      hiddenHash
    ] of PRE_CHANGE_FINGERPRINTS) {
      const built = buildExpeditionMap(seed, tour, region)
      const rows = built.nodeOrder.map(id => ({
        id,
        ...built.meta[id]?.hidden
      }))
      assert.equal(built.mapHash, mapHash, `${seed} mapHash`)
      assert.equal(fnv1a32(JSON.stringify(rows)), hiddenHash, `${seed} hidden`)
    }
  })
})
