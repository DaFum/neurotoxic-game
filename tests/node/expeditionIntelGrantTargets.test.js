/**
 * @fileoverview Intel grants are only minted when the reveal resolver can
 * spend them: a grant's target must be exactly one level above the node's
 * effective intel (stored intel raised to the Region familiarity floor).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { revealExpeditionNodeIntel } from '../../src/context/expeditionActionCreators.ts'
import { getExpeditionIntelCapability } from '../../src/domain/expedition/nodeIntel.ts'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

/** A run standing on its start node holding one settled Social result. */
const withSocialResult = (resultId, intelByNodeId = {}) => {
  const base = startedState()
  return {
    ...base,
    expedition: {
      ...base.expedition,
      intelByNodeId: { ...base.expedition.intelByNodeId, ...intelByNodeId },
      lastSocialResult: {
        id: `proof:${resultId}`,
        postOptionId: 'post_x',
        resultId,
        resolvedAtRouteStep: base.expedition.routeStep,
        intelConsumed: false
      }
    }
  }
}

const onwardNode = state =>
  fixtureMap().connections.find(
    edge => edge.from === state.player.currentNodeId
  )?.to

const createSocialGrant = (state, resultId, nodeId) =>
  gameReducer(state, {
    type: ActionTypes.CREATE_SOCIAL_INTEL_GRANT,
    payload: {
      postOptionId: 'post_x',
      resultId,
      nodeId,
      expectedRouteStep: state.expedition.routeStep
    }
  })

describe('CREATE_SOCIAL_INTEL_GRANT targets a spendable level', () => {
  it('mints a level-1 grant on an unread node and lets it be spent', () => {
    const state = withSocialResult('push')
    const nodeId = onwardNode(state)
    assert.ok(nodeId)
    const granted = createSocialGrant(state, 'push', nodeId)
    assert.equal(granted.expedition.intelGrants.length, 1)
    assert.equal(granted.expedition.intelGrants[0].targetLevel, 1)
    assert.equal(granted.expedition.lastSocialResult.intelConsumed, true)

    const grant = granted.expedition.intelGrants[0]
    const revealed = gameReducer(
      granted,
      revealExpeditionNodeIntel(granted, {
        nodeId,
        source: 'social_grant',
        grantId: grant.id
      })
    )
    assert.equal(revealed.expedition.intelByNodeId[nodeId], 1)
    assert.equal(revealed.expedition.intelGrants[0].consumed, true)
  })

  it('refuses a level-2 grant on an unread node and keeps the proof', () => {
    const state = withSocialResult('suppress')
    const nodeId = onwardNode(state)
    const next = createSocialGrant(state, 'suppress', nodeId)
    assert.equal(next, state)
    assert.equal(next.expedition.lastSocialResult.intelConsumed, false)
  })

  it('refuses a level-1 grant on a node a Scout already read', () => {
    const base = withSocialResult('push')
    const nodeId = onwardNode(base)
    const state = withSocialResult('push', { [nodeId]: 1 })
    const next = createSocialGrant(state, 'push', nodeId)
    assert.equal(next, state)
    assert.equal(next.expedition.intelGrants.length, 0)
  })

  it('mints a level-2 grant on a node already at level 1', () => {
    const base = withSocialResult('suppress')
    const nodeId = onwardNode(base)
    const state = withSocialResult('suppress', { [nodeId]: 1 })
    const next = createSocialGrant(state, 'suppress', nodeId)
    assert.equal(next.expedition.intelGrants.length, 1)
    assert.equal(next.expedition.intelGrants[0].targetLevel, 2)
  })
})

describe('CREATE_CONTACT_INTEL_GRANT targets the effective level', () => {
  it('aims one level above a Region-familiar node, not above storage', () => {
    // Walk until the familiarity reveal lands on a direct onward node: that
    // node reads at level 1 while storing 0, which is the case the stored-level
    // target got wrong.
    const sourceId = 'expedition_crew_breakthrough:follow_lead'
    let found = false
    let state = startedState()
    for (let step = 0; step < 6 && !found; step += 1) {
      state = walkTo(state, step)
      const familiar = {
        ...state,
        reputationByRegion: {
          ...state.reputationByRegion,
          [state.expedition.loadout.regionId]: 60
        }
      }
      const [nodeId] = getExpeditionIntelCapability(familiar).familiarNodeIds
      const current = familiar.expedition.visitedNodeIds.at(-1)
      const isOnward = fixtureMap().connections.some(
        edge => edge.from === current && edge.to === nodeId
      )
      if (!nodeId || !isOnward) continue
      found = true
      const proven = {
        ...familiar,
        expedition: {
          ...familiar.expedition,
          resolvedCrewSourceIds: [
            ...(familiar.expedition.resolvedCrewSourceIds ?? []),
            `${sourceId}:resolved:${familiar.expedition.routeStep}`
          ]
        }
      }
      const next = gameReducer(proven, {
        type: ActionTypes.CREATE_CONTACT_INTEL_GRANT,
        payload: {
          eventId: 'expedition_crew_breakthrough',
          optionId: 'follow_lead',
          nodeId,
          expectedRouteStep: proven.expedition.routeStep
        }
      })
      assert.equal(next.expedition.intelGrants.length, 1)
      assert.equal(next.expedition.intelGrants[0].targetLevel, 2)
    }
    assert.ok(found, 'the fixture route must put a familiar node onward')
  })
})
