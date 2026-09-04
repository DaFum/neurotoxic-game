/**
 * @fileoverview Monotonic, source-entitled Hybrid Fog of War.
 *
 * Information is a build resource, so intel must not be mintable: every reveal
 * names a source, raises a node by exactly one level, and consumes whatever
 * paid for it in the same commit. The entitlements themselves belong to G3/G5,
 * so the capability is injected where the mechanics are exercised directly and
 * read from the production resolver where the reducer is exercised.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { revealExpeditionNodeIntel } from '../../src/context/expeditionActionCreators'
import {
  BASE_EXPEDITION_INTEL_CAPABILITY,
  MAX_NODE_INTEL_LEVEL,
  getExpeditionIntelCapability,
  getExpeditionNodeIntelLevel,
  resolveExpeditionIntelReveal
} from '../../src/domain/expedition/nodeIntel'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()
const NODE = map.nodeOrder[2]

const withGrant = (state, grant) => ({
  ...state,
  expedition: {
    ...state.expedition,
    intelGrants: [...state.expedition.intelGrants, grant]
  }
})

const socialGrant = (overrides = {}) => ({
  id: 'grant_1',
  source: 'social',
  sourceProofId: 'social_post_7',
  nodeId: NODE,
  targetLevel: 1,
  consumed: false,
  ...overrides
})

const reveal = (state, payload) =>
  gameReducer(state, {
    type: ActionTypes.REVEAL_EXPEDITION_NODE_INTEL,
    payload
  })

const scoutCapability = (overrides = {}) => ({
  passiveLevelFloor: 0,
  hasScout: true,
  reconCharges: 2,
  ...overrides
})

describe('G1 baseline entitlement', () => {
  it('entitles nothing until G3 and G5 supply capabilities', () => {
    assert.deepEqual(getExpeditionIntelCapability(startedState()), {
      passiveLevelFloor: 0,
      hasScout: false,
      reconCharges: 0
    })
    assert.deepEqual(BASE_EXPEDITION_INTEL_CAPABILITY, {
      passiveLevelFloor: 0,
      hasScout: false,
      reconCharges: 0
    })
  })

  it('refuses every self-entitled source on the baseline', () => {
    const state = startedState()
    for (const source of ['scout_passive', 'scout_recon', 'perk_floor']) {
      const next = reveal(state, {
        nodeId: NODE,
        source,
        expectedLevel: 0,
        expectedRouteStep: 0
      })
      assert.equal(next, state, `${source} must not be entitled in G1A`)
    }
  })

  it('reports level 0 for every node on a fresh run', () => {
    const state = startedState()
    for (const nodeId of map.nodeOrder) {
      assert.equal(getExpeditionNodeIntelLevel(state, nodeId), 0)
    }
  })
})

describe('grant-backed reveals through the reducer', () => {
  it('consumes the grant in the same commit as the reveal', () => {
    const state = withGrant(startedState(), socialGrant())
    const next = reveal(state, {
      nodeId: NODE,
      source: 'social_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'grant_1'
    })
    assert.equal(next.expedition.intelByNodeId[NODE], 1)
    assert.equal(next.expedition.intelGrants[0]?.consumed, true)
  })

  it('refuses a replayed reveal because the grant is spent', () => {
    const state = withGrant(startedState(), socialGrant())
    const payload = {
      nodeId: NODE,
      source: 'social_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'grant_1'
    }
    const once = reveal(state, payload)
    const twice = reveal(once, payload)
    assert.equal(twice, once)
    assert.equal(twice.expedition.intelByNodeId[NODE], 1)
  })

  it('refuses an unknown grant id', () => {
    const state = withGrant(startedState(), socialGrant())
    const next = reveal(state, {
      nodeId: NODE,
      source: 'social_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'grant_forged'
    })
    assert.equal(next, state)
  })

  it('refuses a grant whose family does not match the claimed source', () => {
    const state = withGrant(startedState(), socialGrant())
    const next = reveal(state, {
      nodeId: NODE,
      source: 'contact_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'grant_1'
    })
    assert.equal(next, state)
  })

  it('refuses a grant issued for a different node or level', () => {
    const otherNode = map.nodeOrder[3]
    const state = withGrant(startedState(), socialGrant())
    assert.equal(
      reveal(state, {
        nodeId: otherNode,
        source: 'social_grant',
        expectedLevel: 0,
        expectedRouteStep: 0,
        grantId: 'grant_1'
      }),
      state
    )

    const levelTwoGrant = withGrant(
      startedState(),
      socialGrant({ targetLevel: 2 })
    )
    assert.equal(
      reveal(levelTwoGrant, {
        nodeId: NODE,
        source: 'social_grant',
        expectedLevel: 0,
        expectedRouteStep: 0,
        grantId: 'grant_1'
      }),
      levelTwoGrant,
      'a level-2 grant cannot be spent on the 0 -> 1 step'
    )
  })

  it('walks a node from 0 to 1 to 2 with two grants and stops there', () => {
    let state = withGrant(
      startedState(),
      socialGrant({ id: 'g1', targetLevel: 1 })
    )
    state = withGrant(state, {
      id: 'g2',
      source: 'contact',
      sourceProofId: 'contact_meet_3',
      nodeId: NODE,
      targetLevel: 2,
      consumed: false
    })
    state = reveal(state, {
      nodeId: NODE,
      source: 'social_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'g1'
    })
    assert.equal(state.expedition.intelByNodeId[NODE], 1)

    state = reveal(state, {
      nodeId: NODE,
      source: 'contact_grant',
      expectedLevel: 1,
      expectedRouteStep: 0,
      grantId: 'g2'
    })
    assert.equal(state.expedition.intelByNodeId[NODE], MAX_NODE_INTEL_LEVEL)

    // A third grant cannot push past the maximum.
    const capped = withGrant(state, {
      id: 'g3',
      source: 'social',
      sourceProofId: 'social_post_9',
      nodeId: NODE,
      targetLevel: 2,
      consumed: false
    })
    assert.equal(
      reveal(capped, {
        nodeId: NODE,
        source: 'social_grant',
        expectedLevel: 1,
        expectedRouteStep: 0,
        grantId: 'g3'
      }),
      capped
    )
  })

  it('refuses a node that is not on the prepared route', () => {
    const state = withGrant(startedState(), socialGrant({ nodeId: 'nope' }))
    for (const nodeId of ['nope', '__proto__', '']) {
      assert.equal(
        reveal(state, {
          nodeId,
          source: 'social_grant',
          expectedLevel: 0,
          expectedRouteStep: 0,
          grantId: 'grant_1'
        }),
        state
      )
    }
    assert.equal(
      Object.hasOwn(state.expedition.intelByNodeId, '__proto__'),
      false
    )
  })

  it('refuses a stale route-step or level guard', () => {
    const state = withGrant(startedState(), socialGrant())
    for (const payload of [
      { expectedLevel: 0, expectedRouteStep: 1 },
      { expectedLevel: 1, expectedRouteStep: 0 },
      { expectedLevel: 2, expectedRouteStep: 0 },
      { expectedLevel: 0, expectedRouteStep: Number.NaN }
    ]) {
      assert.equal(
        reveal(state, {
          nodeId: NODE,
          source: 'social_grant',
          grantId: 'grant_1',
          ...payload
        }),
        state,
        JSON.stringify(payload)
      )
    }
  })

  it('refuses every reveal outside an active run', () => {
    const state = withGrant(startedState(), socialGrant())
    for (const status of [
      'idle',
      'prepared',
      'extracted',
      'completed',
      'failed'
    ]) {
      const source = { ...state, expedition: { ...state.expedition, status } }
      assert.equal(
        reveal(source, {
          nodeId: NODE,
          source: 'social_grant',
          expectedLevel: 0,
          expectedRouteStep: 0,
          grantId: 'grant_1'
        }),
        source
      )
    }
  })

  it('keeps the intel map null-prototype after a reveal', () => {
    const state = withGrant(startedState(), socialGrant())
    const next = reveal(state, {
      nodeId: NODE,
      source: 'social_grant',
      expectedLevel: 0,
      expectedRouteStep: 0,
      grantId: 'grant_1'
    })
    assert.equal(Object.getPrototypeOf(next.expedition.intelByNodeId), null)
  })

  it('is built by the creator from the stored level', () => {
    const state = withGrant(startedState(), socialGrant())
    const action = revealExpeditionNodeIntel(state, {
      nodeId: NODE,
      source: 'social_grant',
      grantId: 'grant_1'
    })
    assert.equal(action.payload.expectedLevel, 0)
    assert.equal(action.payload.expectedRouteStep, 0)
    const next = gameReducer(state, action)
    assert.equal(next.expedition.intelByNodeId[NODE], 1)
    // The creator now reads level 1 and targets the second step.
    assert.equal(
      revealExpeditionNodeIntel(next, {
        nodeId: NODE,
        source: 'contact_grant',
        grantId: 'g2'
      }).payload.expectedLevel,
      1
    )
  })
})

describe('scout entitlements and passive floor', () => {
  it('lets a Scout reveal level 1 but not level 2', () => {
    const state = startedState()
    const first = resolveExpeditionIntelReveal(
      state,
      {
        nodeId: NODE,
        source: 'scout_passive',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability()
    )
    assert.equal(first.ok, true)
    assert.equal(first.nextLevel, 1)

    // With the node actually at level 1, a Scout is no longer entitled: exact
    // event/rival identity needs a deliberate recon or a grant.
    const atLevelOne = {
      ...state,
      expedition: {
        ...state.expedition,
        intelByNodeId: Object.assign(Object.create(null), { [NODE]: 1 })
      }
    }
    const second = resolveExpeditionIntelReveal(
      atLevelOne,
      {
        nodeId: NODE,
        source: 'scout_passive',
        expectedLevel: 1,
        expectedRouteStep: 0
      },
      map,
      scoutCapability()
    )
    assert.equal(second.ok, false)
    assert.equal(second.reason, 'SOURCE_NOT_ENTITLED')

    // A recon charge does reach level 2 from there.
    const recon = resolveExpeditionIntelReveal(
      atLevelOne,
      {
        nodeId: NODE,
        source: 'scout_recon',
        expectedLevel: 1,
        expectedRouteStep: 0
      },
      map,
      scoutCapability()
    )
    assert.equal(recon.ok, true)
    assert.equal(recon.nextLevel, 2)
  })

  it('bounds scout recon by charges and by route step', () => {
    const base = startedState()
    const first = resolveExpeditionIntelReveal(
      base,
      {
        nodeId: NODE,
        source: 'scout_recon',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability({ reconCharges: 1 })
    )
    assert.equal(first.ok, true)
    assert.equal(first.reconRouteStep, 0)

    const spent = {
      ...base,
      expedition: { ...base.expedition, scoutReconUsedRouteSteps: [0] }
    }
    const exhausted = resolveExpeditionIntelReveal(
      spent,
      {
        nodeId: NODE,
        source: 'scout_recon',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability({ reconCharges: 1 })
    )
    assert.equal(exhausted.ok, false)
    assert.equal(exhausted.reason, 'RECON_EXHAUSTED')

    // With a spare charge, the same step is still refused: one recon per step is
    // what makes a replayed dispatch a rejection rather than a free reveal.
    const sameStep = resolveExpeditionIntelReveal(
      spent,
      {
        nodeId: NODE,
        source: 'scout_recon',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability({ reconCharges: 3 })
    )
    assert.equal(sameStep.ok, false)
    assert.equal(sameStep.reason, 'RECON_ALREADY_USED_THIS_STEP')
  })

  it('refuses recon without a committed Scout', () => {
    const result = resolveExpeditionIntelReveal(
      startedState(),
      {
        nodeId: NODE,
        source: 'scout_recon',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability({ hasScout: false })
    )
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'SOURCE_NOT_ENTITLED')
  })

  it('raises every node to the passive floor without making Scout redundant', () => {
    const state = startedState()
    const capability = scoutCapability({
      passiveLevelFloor: 1,
      hasScout: false
    })
    for (const nodeId of map.nodeOrder) {
      assert.equal(getExpeditionNodeIntelLevel(state, nodeId, capability), 1)
    }
    // The floor never reaches the maximum, so exact event/rival identity still
    // has to be earned.
    const result = resolveExpeditionIntelReveal(
      state,
      {
        nodeId: NODE,
        source: 'perk_floor',
        expectedLevel: 1,
        expectedRouteStep: 0
      },
      map,
      capability
    )
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'SOURCE_NOT_ENTITLED')
  })

  it('refuses a perk-floor claim above the entitled floor', () => {
    const result = resolveExpeditionIntelReveal(
      startedState(),
      {
        nodeId: NODE,
        source: 'perk_floor',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability({ passiveLevelFloor: 0 })
    )
    assert.equal(result.ok, false)
  })

  it('tracks the route step as the run advances', () => {
    const walked = walkTo(startedState(), 2)
    const stale = resolveExpeditionIntelReveal(
      walked,
      {
        nodeId: NODE,
        source: 'scout_passive',
        expectedLevel: 0,
        expectedRouteStep: 0
      },
      map,
      scoutCapability()
    )
    assert.equal(stale.ok, false)
    assert.equal(stale.reason, 'STALE_ROUTE_STEP')

    const current = resolveExpeditionIntelReveal(
      walked,
      {
        nodeId: NODE,
        source: 'scout_passive',
        expectedLevel: 0,
        expectedRouteStep: 2
      },
      map,
      scoutCapability()
    )
    assert.equal(current.ok, true)
  })
})
