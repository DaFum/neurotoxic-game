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
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

const addReward = (state, payload) =>
  gameReducer(state, { type: ActionTypes.ADD_EXPEDITION_REWARD, payload })

const currentNodeId = state =>
  state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]

/** The first route step of the fixture walk whose node carries a route rare. */
const RARE_ROUTE_STEP = 5

/**
 * The run standing on a rare-bearing node, with the ledger cleared.
 *
 * Arriving on the node is itself the canonical evidence, so the route advance
 * already banked the entry. Clearing the ledger is what leaves the explicit
 * dispatch a legal path to test instead of an immediate duplicate.
 */
const atRare = () => {
  const walked = walkTo(startedState(), RARE_ROUTE_STEP)
  const nodeId = currentNodeId(walked)
  const rareRewardId = map.meta[nodeId]?.hidden.rareRewardId
  assert.ok(rareRewardId, 'the fixture walk reaches no rare-bearing node')
  return {
    state: {
      ...walked,
      expedition: { ...walked.expedition, rewardLedger: [] }
    },
    nodeId,
    rareRewardId
  }
}

/** The other registered route rare, i.e. one this node does not carry. */
const otherRouteRare = rareRewardId =>
  Object.values(EXPEDITION_REWARD_REGISTRY).find(
    definition =>
      definition.sourceType === 'route_rare' && definition.id !== rareRewardId
  )?.id

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
    const { state, nodeId, rareRewardId } = atRare()
    const next = addReward(state, {
      expectedRewardId: rareRewardId,
      sourceType: 'route_rare',
      sourceId: nodeId,
      expectedRouteStep: RARE_ROUTE_STEP,
      secured: true
    })
    assert.equal(next.expedition.rewardLedger.length, 1)
    assert.equal(next.expedition.rewardLedger[0]?.secured, false)
  })
})

describe('canonical source evidence', () => {
  it('banks the node\u2019s own rare on arrival', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const nodeId = currentNodeId(walked)
    const entry = walked.expedition.rewardLedger.at(-1)
    assert.ok(entry)
    assert.equal(entry.rewardDefinitionId, map.meta[nodeId].hidden.rareRewardId)
    assert.equal(entry.earnedAtRouteStep, RARE_ROUTE_STEP)
    assert.equal(entry.materialized, false)
  })

  it('accepts a route rare from the node the run is standing on', () => {
    const { state, nodeId, rareRewardId } = atRare()
    const next = addReward(state, {
      expectedRewardId: rareRewardId,
      sourceType: 'route_rare',
      sourceId: nodeId,
      expectedRouteStep: RARE_ROUTE_STEP
    })
    const entry = next.expedition.rewardLedger[0]
    assert.ok(entry)
    assert.equal(entry.rewardDefinitionId, rareRewardId)
    assert.equal(entry.earnedAtRouteStep, RARE_ROUTE_STEP)
    assert.equal(entry.materialized, false)
  })

  it('refuses a route rare the node does not carry', () => {
    const { state, nodeId, rareRewardId } = atRare()
    const other = otherRouteRare(rareRewardId)
    assert.ok(other, 'the registry has only one route rare to compare against')
    // Standing on a rare-bearing node is not evidence for the *other* rare.
    assert.equal(
      addReward(state, {
        expectedRewardId: other,
        sourceType: 'route_rare',
        sourceId: nodeId,
        expectedRouteStep: RARE_ROUTE_STEP
      }),
      state
    )
  })

  it('refuses a route rare from a node that carries none', () => {
    const state = walkTo(startedState(), 1)
    const nodeId = currentNodeId(state)
    assert.equal(map.meta[nodeId]?.hidden.rareRewardId, null)
    assert.equal(
      addReward(state, {
        expectedRewardId: 'reward_route_merch_crate',
        sourceType: 'route_rare',
        sourceId: nodeId,
        expectedRouteStep: 1
      }),
      state
    )
  })

  it('refuses a route rare naming a node the run is not on', () => {
    const { state, rareRewardId } = atRare()
    for (const sourceId of [map.finaleNodeId, 'nope', '', map.startNodeId]) {
      assert.equal(
        addReward(state, {
          expectedRewardId: rareRewardId,
          sourceType: 'route_rare',
          sourceId,
          expectedRouteStep: RARE_ROUTE_STEP
        }),
        state,
        `sourceId ${sourceId}`
      )
    }
  })

  it('refuses a source family whose producer arrives with a later gate', () => {
    const { state, nodeId } = atRare()
    for (const [expectedRewardId, sourceType] of [
      ['reward_event_spare_cables', 'event_rare'],
      ['reward_contract_patch_run', 'contract'],
      ['reward_contact_backline_deal', 'crew_contact'],
      // Standing on the Finale does not say *which* Finale reward was earned,
      // so the family stays refused until G4 maps a resolved finale result to
      // its canonical reward.
      ['reward_finale_underground_ledger', 'finale_nonlegendary'],
      ['reward_finale_road_crew_respect', 'finale_nonlegendary']
    ]) {
      assert.equal(
        addReward(state, {
          expectedRewardId,
          sourceType,
          sourceId: nodeId,
          expectedRouteStep: RARE_ROUTE_STEP
        }),
        state,
        expectedRewardId
      )
    }
  })

  it('refuses a Finale reward from the Finale node itself', () => {
    const state = walkToFinale(startedState())
    assert.equal(currentNodeId(state), map.finaleNodeId)
    assert.equal(
      addReward(state, {
        expectedRewardId: 'reward_finale_underground_ledger',
        sourceType: 'finale_nonlegendary',
        sourceId: map.finaleNodeId,
        expectedRouteStep: state.expedition.routeStep
      }),
      state
    )
  })

  it('refuses a reward whose declared family contradicts its definition', () => {
    const { state, nodeId, rareRewardId } = atRare()
    assert.equal(
      addReward(state, {
        expectedRewardId: rareRewardId,
        sourceType: 'contract',
        sourceId: nodeId,
        expectedRouteStep: RARE_ROUTE_STEP
      }),
      state
    )
  })

  it('refuses a stale route-step guard', () => {
    const { state, nodeId, rareRewardId } = atRare()
    for (const expectedRouteStep of [
      0,
      RARE_ROUTE_STEP + 1,
      Number.NaN,
      String(RARE_ROUTE_STEP)
    ]) {
      assert.equal(
        addReward(state, {
          expectedRewardId: rareRewardId,
          sourceType: 'route_rare',
          sourceId: nodeId,
          expectedRouteStep
        }),
        state
      )
    }
  })

  it('refuses a duplicate reward from the same source', () => {
    const { state, nodeId, rareRewardId } = atRare()
    const payload = {
      expectedRewardId: rareRewardId,
      sourceType: 'route_rare',
      sourceId: nodeId,
      expectedRouteStep: RARE_ROUTE_STEP
    }
    const once = addReward(state, payload)
    const twice = addReward(once, payload)
    assert.equal(twice, once)
    assert.equal(twice.expedition.rewardLedger.length, 1)
  })

  it('allows the same reward definition from two different sources', () => {
    // Both rare-bearing nodes on the walk carry the same definition, so the
    // ledger has to key on the source rather than on the reward.
    const state = walkTo(startedState(), RARE_ROUTE_STEP + 1)
    const entries = state.expedition.rewardLedger
    assert.equal(entries.length, 2)
    assert.equal(entries[0].rewardDefinitionId, entries[1].rewardDefinitionId)
    assert.notEqual(entries[0].id, entries[1].id)
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
    const { state, nodeId, rareRewardId } = atRare()
    const action = addExpeditionReward(state, {
      expectedRewardId: rareRewardId,
      sourceType: 'route_rare',
      sourceId: nodeId
    })
    assert.equal(action.payload.expectedRouteStep, RARE_ROUTE_STEP)
    assert.equal(gameReducer(state, action).expedition.rewardLedger.length, 1)
  })

  it('banks nothing into persistent state before settlement', () => {
    const { state, nodeId, rareRewardId } = atRare()
    const next = addReward(state, {
      expectedRewardId: rareRewardId,
      sourceType: 'route_rare',
      sourceId: nodeId,
      expectedRouteStep: RARE_ROUTE_STEP
    })
    assert.equal(next.expedition.rewardLedger.length, 1)
    // The definition promises inventory, but it must not arrive yet.
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

describe('persisted reward ledger hardening regressions', () => {
  it('1. forged secured Contract reward in active save -> dropped', () => {
    const base = startedState()
    const rawSave = {
      ...base,
      expedition: {
        ...base.expedition,
        rewardLedger: [
          {
            id: 'reward_contract_patch_run::forged_source',
            rewardDefinitionId: 'reward_contract_patch_run',
            sourceType: 'contract',
            sourceId: 'forged_source',
            secured: true,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(base, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('2. forged Crew-contact reward -> dropped', () => {
    const base = startedState()
    const rawSave = {
      ...base,
      expedition: {
        ...base.expedition,
        rewardLedger: [
          {
            id: 'reward_contact_backline_deal::forged_source',
            rewardDefinitionId: 'reward_contact_backline_deal',
            sourceType: 'crew_contact',
            sourceId: 'forged_source',
            secured: true,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(base, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('3. forged Finale reward -> dropped', () => {
    const base = startedState()
    const rawSave = {
      ...base,
      expedition: {
        ...base.expedition,
        rewardLedger: [
          {
            id: 'reward_finale_underground_ledger::forged_source',
            rewardDefinitionId: 'reward_finale_underground_ledger',
            sourceType: 'finale_nonlegendary',
            sourceId: 'forged_source',
            secured: true,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(base, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('4. Route-Rare with wrong/unvisited node -> dropped', () => {
    const base = startedState()
    const rawSave = {
      ...base,
      expedition: {
        ...base.expedition,
        visitedNodeIds: ['exp_start'],
        rewardLedger: [
          {
            id: 'reward_route_merch_crate::exp_unvisited_node',
            rewardDefinitionId: 'reward_route_merch_crate',
            sourceType: 'route_rare',
            sourceId: 'exp_unvisited_node',
            secured: false,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(base, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('5. Route-Rare with wrong reward ID for real node -> dropped', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const nodeId = currentNodeId(walked)
    const realReward = map.meta[nodeId]?.hidden.rareRewardId
    const otherReward = otherRouteRare(realReward)

    const rawSave = {
      ...walked,
      expedition: {
        ...walked.expedition,
        rewardLedger: [
          {
            id: `${otherReward}::${nodeId}`,
            rewardDefinitionId: otherReward,
            sourceType: 'route_rare',
            sourceId: nodeId,
            secured: false,
            earnedAtRouteStep: RARE_ROUTE_STEP,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(walked, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('6. genuine visited Route-Rare -> survives round trip', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const nodeId = currentNodeId(walked)
    const realReward = map.meta[nodeId]?.hidden.rareRewardId

    const rawSave = {
      ...walked,
      expedition: {
        ...walked.expedition,
        rewardLedger: [
          {
            id: `${realReward}::${nodeId}`,
            rewardDefinitionId: realReward,
            sourceType: 'route_rare',
            sourceId: nodeId,
            secured: false,
            earnedAtRouteStep: RARE_ROUTE_STEP,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(walked, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 1)
    assert.equal(loaded.expedition.rewardLedger[0].id, `${realReward}::${nodeId}`)
  })

  it('7. duplicate entries -> deduplicated', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const nodeId = currentNodeId(walked)
    const realReward = map.meta[nodeId]?.hidden.rareRewardId

    const entry = {
      id: `${realReward}::${nodeId}`,
      rewardDefinitionId: realReward,
      sourceType: 'route_rare',
      sourceId: nodeId,
      secured: false,
      earnedAtRouteStep: RARE_ROUTE_STEP,
      materialized: false
    }

    const rawSave = {
      ...walked,
      expedition: {
        ...walked.expedition,
        rewardLedger: [entry, entry]
      }
    }
    const loaded = gameReducer(walked, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 1)
  })

  it('8. corrupted/prototype keys -> rejected', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const rawSave = {
      ...walked,
      expedition: {
        ...walked.expedition,
        rewardLedger: [
          {
            id: '__proto__',
            rewardDefinitionId: 'reward_route_merch_crate',
            sourceType: 'route_rare',
            sourceId: 'exp_start',
            secured: false,
            earnedAtRouteStep: 1,
            materialized: false
          }
        ]
      }
    }
    const loaded = gameReducer(walked, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    assert.equal(loaded.expedition.rewardLedger.length, 0)
  })

  it('9. accepted persisted reward with materialized: true -> does not re-materialize on terminal transition', () => {
    const walked = walkTo(startedState(), RARE_ROUTE_STEP)
    const nodeId = currentNodeId(walked)
    const realReward = map.meta[nodeId]?.hidden.rareRewardId

    const initialShirts = walked.band.inventory.shirts ?? 0

    const rawSave = {
      ...walked,
      expedition: {
        ...walked.expedition,
        status: 'completed',
        runId: walked.expedition.prep.prepId,
        rewardLedger: [
          {
            id: `${realReward}::${nodeId}`,
            rewardDefinitionId: realReward,
            sourceType: 'route_rare',
            sourceId: nodeId,
            secured: false,
            earnedAtRouteStep: RARE_ROUTE_STEP,
            materialized: true
          }
        ],
        outcome: {
          runId: walked.expedition.prep.prepId,
          kind: 'completed',
          reason: null,
          finalizedAtRouteStep: RARE_ROUTE_STEP,
          settlement: {
            retentionRate: 1,
            moneyEarned: 100,
            moneyRetained: 100,
            moneyForfeited: 0,
            fameEarned: 50,
            fameRetained: 50,
            fameForfeited: 0,
            retainedRewardEntryIds: [`${realReward}::${nodeId}`],
            abandonedRewardEntryIds: []
          },
          finaleResultId: null
        }
      }
    }

    const loaded = gameReducer(walked, { type: ActionTypes.LOAD_GAME, payload: rawSave })
    const next = gameReducer(loaded, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: loaded.expedition.runId }
    })

    assert.equal(next.band.inventory.shirts ?? 0, initialShirts, 'materialized reward did not re-grant inventory')
  })
})
