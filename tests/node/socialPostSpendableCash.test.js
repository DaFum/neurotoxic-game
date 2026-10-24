import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { POST_OPTIONS } from '../../src/data/postOptions.ts'
import {
  calculatePostGigStateUpdates,
  SocialPostRefusalError
} from '../../src/utils/postGig/socialResolution.ts'
import { createApplySocialPostResultAction } from '../../src/context/actionCreators.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

describe('Social post spendable Cash eligibility & composite action regression', () => {
  const smashGearOpt = POST_OPTIONS.find(o => o.id === 'perf_smashed_gear')
  const influencerOpt = POST_OPTIONS.find(o => o.id === 'collab_influencer')

  it('refuses smashed_gear and paid influencer post when spendable Cash is insufficient', () => {
    // Player has €5,000 money, but €4,900 is protected career cash => €100 spendable Cash.
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4900 } }
    )

    // Option condition for smashGearOpt requires >500 spendable Cash.
    assert.equal(smashGearOpt.condition(state), false)

    // Option condition for influencerOpt: lowest cost influencer is ~€100 (or >€100 depending on discount), but if money is €100 or less than cost, should be false if no affordable influencer.
    // Give €50 spendable Cash (€5000 money, €4950 protected).
    const poorState = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4950 } }
    )
    assert.equal(smashGearOpt.condition(poorState), false)
    assert.equal(influencerOpt.condition(poorState), false)

    // Direct call to calculatePostGigStateUpdates with smashGearOpt on state with insufficient spendable Cash throws SocialPostRefusalError with code CONDITION_FAILED.
    assert.throws(
      () => {
        calculatePostGigStateUpdates({
          option: smashGearOpt,
          player: poorState.player,
          band: poorState.band,
          social: poorState.social,
          perfScore: 80,
          secureRandomValue: 0.5,
          selectionRandomValue: 0.5,
          viralRandomValue: 1,
          expedition: poorState.expedition
        })
      },
      err =>
        err instanceof SocialPostRefusalError && err.code === 'CONDITION_FAILED'
    )

    // Test direct action creator / reducer rejection for negative moneyDelta exceeding spendable cash (-300 debit with €100 spendable).
    const compositePayload = {
      moneyDelta: -300,
      social: {
        pendingSocialOptionId: 'perf_smashed_gear',
        tiktok: (poorState.social.tiktok || 0) + 2500
      }
    }
    const action = createApplySocialPostResultAction(
      poorState,
      compositePayload
    )
    assert.equal(action, null)

    const nextState = gameReducer(poorState, {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: compositePayload
    })
    // Identical state reference returned by reducer
    assert.equal(nextState, poorState)
    assert.equal(nextState.player.money, 5000)
    assert.equal(nextState.social.tiktok, poorState.social.tiktok)
  })

  it('allows paid post when spendable Cash is sufficient and applies single debit', () => {
    // €5,000 money, €4,300 protected => €700 spendable Cash (> 500).
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4300 } }
    )

    assert.equal(smashGearOpt.condition(state), true)

    const updates = calculatePostGigStateUpdates({
      option: smashGearOpt,
      player: state.player,
      band: state.band,
      social: state.social,
      perfScore: 80,
      secureRandomValue: 0.5,
      selectionRandomValue: 0.5,
      viralRandomValue: 1,
      expedition: state.expedition
    })

    assert.equal(updates.appliedMoneyDelta, -300)

    const compositePayload = {
      moneyDelta: updates.appliedMoneyDelta,
      social: {
        ...updates.updatedSocial,
        pendingSocialOptionId: smashGearOpt.id
      }
    }

    const action = createApplySocialPostResultAction(state, compositePayload)
    assert.notEqual(action, null)

    const nextState = gameReducer(state, action)
    assert.equal(nextState.player.money, 4700)
    assert.notEqual(nextState, state)
  })

  it('behaves correctly in ordinary Career mode with no active Expedition', () => {
    const base = createInitialState()
    base.player.money = 1000

    assert.equal(smashGearOpt.condition(base), true)

    const updates = calculatePostGigStateUpdates({
      option: smashGearOpt,
      player: base.player,
      band: base.band,
      social: base.social,
      perfScore: 80,
      secureRandomValue: 0.5,
      selectionRandomValue: 0.5,
      viralRandomValue: 1
    })

    const action = createApplySocialPostResultAction(base, {
      moneyDelta: updates.appliedMoneyDelta,
      social: {
        ...updates.updatedSocial,
        pendingSocialOptionId: smashGearOpt.id
      }
    })
    const nextState = gameReducer(base, action)
    assert.equal(nextState.player.money, 700)
  })

  it('influencer collaboration selects only affordable influencers', () => {
    const base = createInitialState()
    base.player.money = 5000
    base.expedition = {
      status: 'active',
      protectedCareerCash: 4850 // €150 spendable Cash
    }
    // Set up influencers: Micro tier costs ~€100, Macro costs ~€300, Mega costs ~€800
    base.social.influencers = {
      inf_micro: { id: 'inf_micro', tier: 'Micro', score: 0, name: 'Micro' },
      inf_macro: { id: 'inf_macro', tier: 'Macro', score: 0, name: 'Macro' },
      inf_mega: { id: 'inf_mega', tier: 'Mega', score: 0, name: 'Mega' }
    }

    assert.equal(influencerOpt.condition(base), true)

    const updates = calculatePostGigStateUpdates({
      option: influencerOpt,
      player: base.player,
      band: base.band,
      social: base.social,
      perfScore: 80,
      secureRandomValue: 0.5,
      selectionRandomValue: 0.5,
      viralRandomValue: 1,
      expedition: base.expedition
    })

    assert.equal(updates.finalResult.success, true)
    assert.equal(updates.finalResult.influencerUpdate.id, 'inf_micro')
  })

  it('rejects non-finite moneyDelta in action creator and reducer without state changes', () => {
    const base = createInitialState()
    base.player.money = 1000

    const malformedPayload = {
      moneyDelta: NaN,
      social: { pendingSocialOptionId: 'opt_1', followers: { tiktok: 5000 } }
    }

    // Action creator returns null for NaN moneyDelta
    const action = createApplySocialPostResultAction(base, malformedPayload)
    assert.equal(action, null)

    // Reducer returns identical state reference
    const nextState = gameReducer(base, {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: malformedPayload
    })
    assert.equal(nextState, base)
    assert.equal(nextState.player.money, 1000)
    assert.deepEqual(nextState.social, base.social)
  })

  it('marks the matching pending settlement socialReconciled atomically with the post', () => {
    const base = createInitialState()
    base.pendingGigSettlement = { id: 'settlement-1', socialReconciled: false }
    const payload = settlementId => ({
      settlementId,
      social: { pendingSocialOptionId: 'opt_1' }
    })

    const matched = gameReducer(base, {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: payload('settlement-1')
    })
    assert.equal(matched.pendingGigSettlement.socialReconciled, true)

    const mismatched = gameReducer(base, {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: payload('other')
    })
    assert.strictEqual(mismatched, base)

    const replayed = gameReducer(matched, {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: payload('settlement-1')
    })
    assert.strictEqual(replayed, matched)
  })
})
