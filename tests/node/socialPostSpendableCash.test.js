import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  POST_OPTIONS,
  SMASHED_GEAR_COST,
  SMASHED_GEAR_CASH_BUFFER
} from '../../src/data/postOptions.ts'
import {
  calculatePostGigStateUpdates,
  SocialPostRefusalError
} from '../../src/utils/postGig/socialResolution.ts'
import { createApplySocialPostResultAction } from '../../src/context/actionCreators.ts'
import { validateSocialPostResult } from '../../src/utils/postGig/socialPostResultValidation.ts'
import { startedState } from '../expeditionLifecycleFixture.js'
import { QUEST_APOLOGY_TOUR } from '../../src/data/questsConstants.ts'

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

  it('refuses a named settlement id when no settlement is pending', () => {
    const base = createInitialState()
    base.pendingGigSettlement = null
    const payload = {
      settlementId: 'settlement-1',
      social: { pendingSocialOptionId: 'opt_1' }
    }

    assert.equal(validateSocialPostResult(base, payload), 'STALE_SETTLEMENT')
    assert.equal(createApplySocialPostResultAction(base, payload), null)
    assert.strictEqual(
      gameReducer(base, {
        type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
        payload
      }),
      base
    )
  })

  describe('perf_smashed_gear Cash gate (#3270)', () => {
    const resolveWith = money => {
      const state = startedState({ money })
      return () =>
        calculatePostGigStateUpdates({
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
    }

    const gate = SMASHED_GEAR_COST + SMASHED_GEAR_CASH_BUFFER

    it('prices the gear as a positive whole Cash amount', () => {
      assert.ok(Number.isInteger(SMASHED_GEAR_COST))
      assert.ok(SMASHED_GEAR_COST > 0)
    })

    it('needs more than cost plus buffer in spendable Cash, not just the cost it debits', () => {
      assert.equal(smashGearOpt.condition(startedState({ money: gate })), false)
      assert.equal(
        smashGearOpt.condition(startedState({ money: gate + 1 })),
        true
      )
    })

    it('debits the cost once it is offered, leaving the buffer', () => {
      const updates = resolveWith(gate + 1)()
      assert.equal(updates.appliedMoneyDelta, -SMASHED_GEAR_COST)
      assert.equal(updates.nextMoney, SMASHED_GEAR_CASH_BUFFER + 1)
      assert.throws(
        resolveWith(gate),
        err =>
          err instanceof SocialPostRefusalError &&
          err.code === 'CONDITION_FAILED'
      )
    })
  })

  describe('selection-time condition recheck inputs (#3270)', () => {
    const rivalOpt = POST_OPTIONS.find(o => o.id === 'drama_rival_callout')

    it('treats an omitted slice as a failed condition instead of throwing', () => {
      const state = startedState({ money: 100000 })
      const params = {
        option: rivalOpt,
        player: state.player,
        band: state.band,
        social: state.social,
        perfScore: 80,
        secureRandomValue: 0.5,
        selectionRandomValue: 0.5,
        viralRandomValue: 1
      }
      assert.throws(
        () => calculatePostGigStateUpdates(params),
        err =>
          err instanceof SocialPostRefusalError &&
          err.code === 'CONDITION_FAILED'
      )
      assert.doesNotThrow(() =>
        calculatePostGigStateUpdates({
          ...params,
          rivalBand: { name: 'Rivals', hostility: 50, fame: 10 }
        })
      )
    })

    const omittedSliceParams = option => {
      const state = startedState({ money: 100000 })
      return {
        option,
        player: state.player,
        band: state.band,
        social: state.social,
        perfScore: 80,
        secureRandomValue: 0.5,
        selectionRandomValue: 0.5,
        viralRandomValue: 1
      }
    }
    const isConditionFailed = err =>
      err instanceof SocialPostRefusalError && err.code === 'CONDITION_FAILED'

    it('refuses an event-gated option when activeEvent is omitted', () => {
      const vanOpt = POST_OPTIONS.find(o => o.id === 'drama_van_breakdown')
      const params = omittedSliceParams(vanOpt)
      assert.throws(
        () => calculatePostGigStateUpdates(params),
        isConditionFailed
      )
      assert.doesNotThrow(() =>
        calculatePostGigStateUpdates({
          ...params,
          activeEvent: { id: 'van_breakdown_tire' }
        })
      )
    })

    it('refuses the apology-tour option when activeQuests is omitted', () => {
      const apologyOpt = POST_OPTIONS.find(
        o => o.id === 'recovery_apology_tour_promo'
      )
      const params = omittedSliceParams(apologyOpt)
      assert.throws(
        () => calculatePostGigStateUpdates(params),
        isConditionFailed
      )
      assert.doesNotThrow(() =>
        calculatePostGigStateUpdates({
          ...params,
          activeQuests: [{ id: QUEST_APOLOGY_TOUR }]
        })
      )
    })
  })
})
