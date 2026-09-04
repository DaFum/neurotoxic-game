/**
 * @fileoverview Source-proven rare rewards and their single materialization owner.
 *
 * The design forbids granting a persistent reward before the event that owns it
 * resolves, and forbids duplicate payouts. Both are pinned here: a reward needs
 * canonical just-resolved evidence to enter the ledger, its `secured` flag is
 * derived rather than declared by the caller, and materialization happens once,
 * only after terminal settlement.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { addExpeditionReward } from '../../src/context/expeditionActionCreators'
import {
  EXPEDITION_REWARD_REGISTRY,
  findExpeditionRewardsWithUnreachableTarget,
  isExpeditionRewardSecuredOnEarn,
  materializeExpeditionReward,
  resolveExpeditionRewardDefinition
} from '../../src/domain/expedition/rewardLedger'
import { createInitialState } from '../../src/context/initialState'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

const addReward = (state, payload) =>
  gameReducer(state, { type: ActionTypes.ADD_EXPEDITION_REWARD, payload })

const currentNodeId = state =>
  state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]

describe('reward registry invariants', () => {
  it('gives every reward exactly one real materialization owner', () => {
    const definitions = Object.values(EXPEDITION_REWARD_REGISTRY)
    assert.ok(definitions.length > 0)
    for (const definition of definitions) {
      assert.ok(['unlock', 'career', 'inventory'].includes(definition.owner))
      assert.equal(typeof definition.target, 'string')
      assert.ok(definition.target.length > 0)
      assert.ok(Number.isInteger(definition.amount))
      assert.ok(definition.amount > 0)
    }
  })

  it('keys every definition by its own id', () => {
    for (const [key, definition] of Object.entries(
      EXPEDITION_REWARD_REGISTRY
    )) {
      assert.equal(key, definition.id)
    }
  })

  it('points every reward at a target its owner can actually reach', () => {
    assert.deepEqual(findExpeditionRewardsWithUnreachableTarget(), [])
  })

  it('registers no reward for the career owner before G5 exists', () => {
    // A reward whose owner has no materialization path yet would be a promise
    // the game cannot keep.
    const careerRewards = Object.values(EXPEDITION_REWARD_REGISTRY).filter(
      definition => definition.owner === 'career'
    )
    assert.deepEqual(careerRewards, [])
  })

  it('rejects an unknown or malformed reward id', () => {
    for (const id of ['nope', '', null, 42, '__proto__']) {
      assert.equal(resolveExpeditionRewardDefinition(id), null)
    }
  })
})

describe('derived security', () => {
  it('leaves route and event rares unsecured', () => {
    for (const definition of Object.values(EXPEDITION_REWARD_REGISTRY)) {
      if (
        definition.sourceType === 'route_rare' ||
        definition.sourceType === 'event_rare'
      ) {
        assert.equal(isExpeditionRewardSecuredOnEarn(definition), false)
      }
    }
  })

  it('secures contract and crew-contact rewards', () => {
    for (const definition of Object.values(EXPEDITION_REWARD_REGISTRY)) {
      if (
        definition.sourceType === 'contract' ||
        definition.sourceType === 'crew_contact'
      ) {
        assert.equal(isExpeditionRewardSecuredOnEarn(definition), true)
      }
    }
  })

  it('lets each finale reward own its security rule', () => {
    assert.equal(
      isExpeditionRewardSecuredOnEarn(
        EXPEDITION_REWARD_REGISTRY.reward_finale_underground_ledger
      ),
      true
    )
    assert.equal(
      isExpeditionRewardSecuredOnEarn(
        EXPEDITION_REWARD_REGISTRY.reward_finale_road_crew_respect
      ),
      false
    )
  })

  it('ignores a caller-declared security claim', () => {
    const state = walkTo(startedState(), 1)
    const next = addReward(state, {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 1,
      secured: true
    })
    assert.equal(next.expedition.rewardLedger.length, 1)
    assert.equal(next.expedition.rewardLedger[0]?.secured, false)
  })
})

describe('canonical source evidence', () => {
  it('accepts a route rare from the node the run is standing on', () => {
    const state = walkTo(startedState(), 1)
    const next = addReward(state, {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 1
    })
    const entry = next.expedition.rewardLedger[0]
    assert.ok(entry)
    assert.equal(entry.rewardDefinitionId, 'reward_route_merch_crate')
    assert.equal(entry.earnedAtRouteStep, 1)
    assert.equal(entry.materialized, false)
  })

  it('refuses a route rare naming a node the run is not on', () => {
    const state = walkTo(startedState(), 1)
    for (const sourceId of [map.finaleNodeId, 'nope', '', map.startNodeId]) {
      assert.equal(
        addReward(state, {
          expectedRewardId: 'reward_route_merch_crate',
          sourceType: 'route_rare',
          sourceId,
          expectedRouteStep: 1
        }),
        state,
        `sourceId ${sourceId}`
      )
    }
  })

  it('refuses a source family whose producer arrives with G3 or G4', () => {
    const state = walkTo(startedState(), 1)
    for (const [expectedRewardId, sourceType] of [
      ['reward_event_spare_cables', 'event_rare'],
      ['reward_contract_patch_run', 'contract'],
      ['reward_contact_backline_deal', 'crew_contact']
    ]) {
      assert.equal(
        addReward(state, {
          expectedRewardId,
          sourceType,
          sourceId: currentNodeId(state),
          expectedRouteStep: 1
        }),
        state,
        expectedRewardId
      )
    }
  })

  it('refuses a reward whose declared family contradicts its definition', () => {
    const state = walkTo(startedState(), 1)
    assert.equal(
      addReward(state, {
        expectedRewardId: 'reward_route_merch_crate',
        sourceType: 'contract',
        sourceId: currentNodeId(state),
        expectedRouteStep: 1
      }),
      state
    )
  })

  it('refuses a stale route-step guard', () => {
    const state = walkTo(startedState(), 1)
    for (const expectedRouteStep of [0, 2, Number.NaN, '1']) {
      assert.equal(
        addReward(state, {
          expectedRewardId: 'reward_route_merch_crate',
          sourceType: 'route_rare',
          sourceId: currentNodeId(state),
          expectedRouteStep
        }),
        state
      )
    }
  })

  it('refuses a duplicate reward from the same source', () => {
    const state = walkTo(startedState(), 1)
    const payload = {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 1
    }
    const once = addReward(state, payload)
    const twice = addReward(once, payload)
    assert.equal(twice, once)
    assert.equal(twice.expedition.rewardLedger.length, 1)
  })

  it('allows the same reward definition from two different sources', () => {
    let state = walkTo(startedState(), 1)
    state = addReward(state, {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 1
    })
    state = walkTo(state, 2)
    state = addReward(state, {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 2
    })
    assert.equal(state.expedition.rewardLedger.length, 2)
  })

  it('refuses every reward outside an active run', () => {
    const state = walkTo(startedState(), 1)
    for (const status of [
      'idle',
      'prepared',
      'extracted',
      'completed',
      'failed'
    ]) {
      const source = { ...state, expedition: { ...state.expedition, status } }
      assert.equal(
        addReward(source, {
          expectedRewardId: 'reward_route_merch_crate',
          sourceType: 'route_rare',
          sourceId: currentNodeId(state),
          expectedRouteStep: 1
        }),
        source
      )
    }
  })

  it('is built by the creator from the current route step', () => {
    const state = walkTo(startedState(), 2)
    const action = addExpeditionReward(state, {
      expectedRewardId: 'reward_route_vinyl_stash',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state)
    })
    assert.equal(action.payload.expectedRouteStep, 2)
    assert.equal(gameReducer(state, action).expedition.rewardLedger.length, 1)
  })

  it('banks nothing into persistent state before settlement', () => {
    const state = walkTo(startedState(), 1)
    const next = addReward(state, {
      expectedRewardId: 'reward_route_merch_crate',
      sourceType: 'route_rare',
      sourceId: currentNodeId(state),
      expectedRouteStep: 1
    })
    // 15 shirts are promised by the definition but must not arrive yet.
    assert.equal(next.band.inventory.shirts, state.band.inventory.shirts)
    assert.deepEqual(next.unlocks, state.unlocks)
  })
})

describe('materialization owners', () => {
  it('adds a counted inventory reward', () => {
    const state = createInitialState()
    const before = state.band.inventory.shirts
    const next = materializeExpeditionReward(
      state,
      EXPEDITION_REWARD_REGISTRY.reward_route_merch_crate
    )
    assert.equal(next.band.inventory.shirts, before + 15)
  })

  it('sets a boolean consumable rather than counting it', () => {
    const state = createInitialState()
    state.band.inventory.cables = false
    const next = materializeExpeditionReward(
      state,
      EXPEDITION_REWARD_REGISTRY.reward_event_spare_cables
    )
    assert.equal(next.band.inventory.cables, true)

    // Already owned: nothing to do, and the state reference is preserved.
    assert.equal(
      materializeExpeditionReward(
        next,
        EXPEDITION_REWARD_REGISTRY.reward_event_spare_cables
      ),
      next
    )
  })

  it('appends an unlock to the persistent pool exactly once', () => {
    const state = createInitialState()
    const next = materializeExpeditionReward(
      state,
      EXPEDITION_REWARD_REGISTRY.reward_finale_underground_ledger
    )
    assert.deepEqual(next.unlocks, ['expedition_unlock_underground_ledger'])
    assert.equal(
      materializeExpeditionReward(
        next,
        EXPEDITION_REWARD_REGISTRY.reward_finale_underground_ledger
      ),
      next
    )
  })

  it('treats a non-finite stored inventory value as zero', () => {
    const state = createInitialState()
    state.band.inventory.shirts = Number.NaN
    const next = materializeExpeditionReward(
      state,
      EXPEDITION_REWARD_REGISTRY.reward_route_merch_crate
    )
    assert.equal(next.band.inventory.shirts, 15)
  })
})
