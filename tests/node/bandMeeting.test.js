/**
 * The paid band meeting is one atomic purchase: the Cash debit and the harmony
 * reward are applied together or not at all. Before it was one action, the
 * pre-gig handler dispatched them separately, so the Expedition cash floor
 * could reject the debit while the harmony update still landed (a free
 * meeting).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { createHoldBandMeetingAction } from '../../src/context/actionCreators'
import { createInitialState } from '../../src/context/initialState'
import { startedState } from '../expeditionLifecycleFixture.js'
import { QuestLifecycle } from '../../src/domain/questLifecycle'

const MEETING_COST = 50
const MEETING_HARMONY = 15

/** An active run with `money` total and `protectedCash` off-limits. */
const runWith = (money, protectedCash, harmony = 50) => {
  const state = startedState({ money })
  return {
    ...state,
    band: { ...state.band, harmony },
    expedition: { ...state.expedition, protectedCareerCash: protectedCash }
  }
}

describe('HOLD_BAND_MEETING', () => {
  it('changes neither money nor harmony when spendable cash is short', () => {
    // 10000 total, 9999 protected: one spendable euro against a 50 meeting.
    const state = runWith(10000, 9999)
    const next = gameReducer(state, createHoldBandMeetingAction())
    assert.equal(next.player.money, 10000)
    assert.equal(next.band.harmony, 50)
  })

  it('applies exactly one debit and one reward when spendable cash covers it', () => {
    const state = runWith(10000, 9000)
    const next = gameReducer(state, createHoldBandMeetingAction())
    assert.equal(next.player.money, 10000 - MEETING_COST)
    assert.equal(next.band.harmony, 50 + MEETING_HARMONY)
  })

  it('charges once on rapid repeated activation with cash for one meeting', () => {
    // 60 spendable: the second click must be refused on both axes.
    let state = runWith(10000, 9940)
    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, createHoldBandMeetingAction())
    }
    assert.equal(state.player.money, 10000 - MEETING_COST)
    assert.equal(state.band.harmony, 50 + MEETING_HARMONY)
  })

  it('does not charge for a meeting once harmony is maxed', () => {
    let state = runWith(10000, 0, 95)
    state = gameReducer(state, createHoldBandMeetingAction())
    assert.equal(state.band.harmony, 100)
    assert.equal(state.player.money, 10000 - MEETING_COST)
    const again = gameReducer(state, createHoldBandMeetingAction())
    assert.equal(again.player.money, 10000 - MEETING_COST)
    assert.equal(again.band.harmony, 100)
  })

  it('outside a run, refuses when the full balance is short', () => {
    const base = createInitialState()
    const state = {
      ...base,
      player: { ...base.player, money: MEETING_COST - 1 },
      band: { ...base.band, harmony: 40 }
    }
    const next = gameReducer(state, createHoldBandMeetingAction())
    assert.equal(next.player.money, MEETING_COST - 1)
    assert.equal(next.band.harmony, 40)

    const funded = { ...state, player: { ...state.player, money: 500 } }
    const paid = gameReducer(funded, createHoldBandMeetingAction())
    assert.equal(paid.player.money, 500 - MEETING_COST)
    assert.equal(paid.band.harmony, 40 + MEETING_HARMONY)
  })

  describe('harmony quests (#3390)', () => {
    const withQuest = (harmony, money = 500) => {
      const base = createInitialState()
      const state = {
        ...base,
        player: { ...base.player, money },
        band: { ...base.band, harmony }
      }
      return QuestLifecycle.addQuest(state, { id: 'quest_ego_management' })
    }
    const egoQuest = state =>
      state.activeQuests.find(q => q.id === 'quest_ego_management')

    it('completes Ego Management when the meeting reaches its target', () => {
      const next = gameReducer(withQuest(40), createHoldBandMeetingAction())
      assert.equal(next.band.harmony, 40 + MEETING_HARMONY)
      assert.equal(egoQuest(next), undefined)
      assert.ok(
        next.activeQuests.some(q => q.id === 'quest_band_pact'),
        'the follow-up quest opens'
      )
    })

    it('updates progress for a below-target meeting', () => {
      const next = gameReducer(withQuest(20), createHoldBandMeetingAction())
      assert.equal(next.band.harmony, 20 + MEETING_HARMONY)
      assert.equal(egoQuest(next).progress, 20 + MEETING_HARMONY)
    })

    it('emits nothing for an unaffordable meeting', () => {
      const state = withQuest(40, MEETING_COST - 1)
      assert.strictEqual(
        gameReducer(state, createHoldBandMeetingAction()),
        state
      )
    })
  })
})
