import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkMilestones } from '../../src/domain/progression/checkMilestones.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  createUpdatePlayerAction,
  createUpdateBandAction,
  createUpdateSocialAction
} from '../../src/context/actionCreators.ts'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { createInitialState } from '../../src/context/initialState.ts'

describe('checkMilestones domain module', () => {
  const createBaseState = () => {
    const base = createInitialState()
    return {
      ...base,
      player: {
        ...base.player,
        day: 1,
        money: 500,
        fame: 0,
        stats: { ...base.player.stats }
      },
      band: {
        ...base.band,
        harmony: 50,
        luck: 10,
        stress: 0,
        members: []
      },
      social: {
        ...base.social,
        tiktok: 0,
        instagram: 0,
        youtube: 0,
        newsletter: 0,
        viral: 0,
        zealotry: 0,
        loyalty: 0
      },
      completedMilestones: [],
      toasts: []
    }
  }

  it('returns identical state reference when no milestones are triggered', () => {
    const state = createBaseState()
    const milestones = [
      {
        id: 'day_10',
        condition: s => s.player.day >= 10,
        labelKey: 'ui:milestones.day_10'
      }
    ]

    const result = checkMilestones(state, milestones)
    assert.strictEqual(result, state)
  })

  it('adds completed milestone id to completedMilestones without mutating original', () => {
    const state = createBaseState()
    const milestones = [
      {
        id: 'start_game',
        condition: s => s.player.day >= 1,
        labelKey: 'ui:milestones.start'
      }
    ]

    const result = checkMilestones(state, milestones)
    assert.notStrictEqual(result, state)
    assert.deepStrictEqual(result.completedMilestones, ['start_game'])
    assert.deepStrictEqual(state.completedMilestones, [])
  })

  it('does not re-trigger already completed milestones', () => {
    const state = {
      ...createBaseState(),
      completedMilestones: ['start_game']
    }
    const milestones = [
      {
        id: 'start_game',
        condition: s => s.player.day >= 1,
        labelKey: 'ui:milestones.start'
      }
    ]

    const result = checkMilestones(state, milestones)
    assert.strictEqual(result, state)
  })

  it('applies createRewardAction updates directly without gameReducer', () => {
    const state = createBaseState()
    const milestones = [
      {
        id: 'bonus_money',
        condition: s => s.player.day >= 1,
        createRewardAction: () =>
          createUpdatePlayerAction(prev => ({
            money: prev.money + 300,
            fame: prev.fame + 20
          })),
        labelKey: 'ui:milestones.bonus_money'
      },
      {
        id: 'bonus_harmony',
        condition: s => s.player.day >= 1,
        createRewardAction: () =>
          createUpdateBandAction(prev => ({
            harmony: prev.harmony + 15,
            luck: prev.luck + 5
          })),
        labelKey: 'ui:milestones.bonus_harmony'
      },
      {
        id: 'bonus_social',
        condition: s => s.player.day >= 1,
        createRewardAction: () =>
          createUpdateSocialAction(prev => ({
            tiktok: prev.tiktok + 50,
            viral: prev.viral + 5
          })),
        labelKey: 'ui:milestones.bonus_social'
      }
    ]

    const result = checkMilestones(state, milestones)
    assert.strictEqual(result.player.money, 800)
    assert.strictEqual(result.player.fame, 20)
    assert.strictEqual(result.band.harmony, 65)
    assert.strictEqual(result.band.luck, 15)
    assert.strictEqual(result.social.tiktok, 50)
    assert.strictEqual(result.social.viral, 5)
    assert.deepStrictEqual(result.completedMilestones, [
      'bonus_money',
      'bonus_harmony',
      'bonus_social'
    ])
  })

  it('applies declarative rewards directly', () => {
    const state = createBaseState()
    const milestones = [
      {
        id: 'declarative_reward',
        condition: () => true,
        reward: {
          cash: 250,
          fans: 40,
          harmony: 10,
          luck: 2,
          unlock: 'special_guitar',
          unlocks: ['merch_table', 'custom_amp'],
          social: { instagram: 100 }
        },
        labelKey: 'ui:milestones.declarative_reward'
      }
    ]

    const result = checkMilestones(state, milestones)
    assert.strictEqual(result.player.money, 750)
    assert.strictEqual(result.player.fame, 40)
    assert.strictEqual(result.band.harmony, 60)
    assert.strictEqual(result.band.luck, 12)
    assert.strictEqual(result.social.instagram, 100)
    assert.ok(result.unlocks?.includes('special_guitar'))
    assert.ok(result.unlocks?.includes('merch_table'))
    assert.ok(result.unlocks?.includes('custom_amp'))
  })

  it('builds deterministic milestone toasts', () => {
    const state = createBaseState()
    const milestones = [
      {
        id: 'toast_1',
        condition: () => true,
        labelKey: 'ui:milestones.toast_1'
      },
      {
        id: 'toast_2',
        condition: () => true,
        labelKey: 'ui:milestones.toast_2'
      }
    ]

    const first = checkMilestones(state, milestones)
    const second = checkMilestones(state, milestones)

    assert.strictEqual(first.toasts.length, 2)
    assert.strictEqual(first.toasts[0]?.id, 'milestone-toast-0')
    assert.strictEqual(first.toasts[1]?.id, 'milestone-toast-1')
    assert.strictEqual(first.toasts[0]?.messageKey, 'ui:milestones.toast_1')
    assert.strictEqual(first.toasts[1]?.messageKey, 'ui:milestones.toast_2')
    assert.deepStrictEqual(first.toasts, second.toasts)
  })

  it('integrates seamlessly with checkMilestones after handleAdvanceDay', () => {
    const state = {
      ...createBaseState(),
      player: {
        ...createBaseState().player,
        day: 7 // Advancing to day 8 triggers survive_1_week
      },
      completedMilestones: [],
      toasts: []
    }

    const advancedState = handleAdvanceDay(state)
    assert.strictEqual(advancedState.player.day, 8)
    const nextState = checkMilestones(advancedState)
    assert.ok(nextState.completedMilestones.includes('survive_1_week'))
    const milestoneToast = nextState.toasts.find(
      t => t.messageKey === 'ui:milestones.survive_1_week'
    )
    assert.ok(milestoneToast)
    assert.strictEqual(milestoneToast.id, 'milestone-toast-0')
  })

  it('integrates with gameReducer ADVANCE_DAY action without recursive dispatches', () => {
    const state = {
      ...createBaseState(),
      player: {
        ...createBaseState().player,
        day: 7
      },
      completedMilestones: [],
      toasts: []
    }

    const nextState = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.strictEqual(nextState.player.day, 8)
    assert.ok(nextState.completedMilestones.includes('survive_1_week'))
    const milestoneToast = nextState.toasts.find(
      t => t.messageKey === 'ui:milestones.survive_1_week'
    )
    assert.ok(milestoneToast)
  })

  it('applies the survive_1_week reward once and does not re-award it', () => {
    const state = {
      ...createBaseState(),
      player: { ...createBaseState().player, day: 8, money: 500 },
      completedMilestones: [],
      toasts: []
    }

    const first = checkMilestones(state)
    assert.strictEqual(first.player.money, 600)
    assert.ok(first.completedMilestones.includes('survive_1_week'))

    const second = checkMilestones(first)
    assert.strictEqual(second.player.money, 600)
  })

  it('treats a throwing milestone condition as not met and returns the same state', () => {
    const state = createBaseState()
    const throwing = [
      {
        id: 'throws',
        condition: () => {
          throw new Error('boom')
        },
        labelKey: 'ui:milestones.survive_1_week'
      }
    ]

    assert.strictEqual(checkMilestones(state, throwing), state)
  })

  it('evaluates canonical milestones against partial state without throwing', () => {
    const base = createBaseState()
    const partial = {
      ...base,
      band: undefined,
      social: undefined,
      completedMilestones: [],
      toasts: []
    }

    assert.doesNotThrow(() => checkMilestones(partial))
  })
})
