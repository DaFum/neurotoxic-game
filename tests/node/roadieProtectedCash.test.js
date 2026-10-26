import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import i18n from '../../src/i18n'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { startedState } from '../expeditionLifecycleFixture'
import { SPARE_GEAR_ITEM_IDS } from '../../src/data/inventoryItems'
import { QuestLifecycle } from '../../src/domain/questLifecycle'

describe('roadie minigame protected cash', () => {
  beforeEach(() => {
    i18n.language = 'en'
  })

  it('acceptance case: caps repair at spendable cash and sets damaged_gear when no spare', () => {
    // Money €5000, protected €4990 -> spendable €10.
    // Damage 100 -> repairCost €200.
    // Available = 10, paid = 10, waived = 190.
    // nextMoney = 5000 - 10 = 4990.
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4990 } }
    )
    const initialHarmony = state.band.harmony

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    assert.equal(started.minigame.active, true)

    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.notStrictEqual(completed, started)
    assert.equal(completed.player.money, 4990)
    assert.equal(completed.band.harmony, initialHarmony - 20)
    assert.equal(completed.gigModifiers.damaged_gear, true)
    assert.equal(completed.minigame.active, false)
    assert.equal(completed.currentScene, started.currentScene)

    const waivedToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.roadieRepairWaived'
    )
    assert.ok(waivedToast, 'should include waived repair toast')
    assert.equal(waivedToast.options.amount, 190)
  })

  it('replay case: ignores re-dispatched completion on inactive minigame', () => {
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4990 } }
    )
    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    const replayed = gameReducer(completed, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.strictEqual(replayed, completed)
  })

  it('boundary case: exact-floor payment', () => {
    // Money €5000, protected €4800 -> spendable €200.
    // Damage 100 -> repairCost €200. Paid = 200, waived = 0.
    // nextMoney = 4800.
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4800 } }
    )
    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 4800)
    const waivedToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.roadieRepairWaived'
    )
    assert.equal(waivedToast, undefined)
  })

  it('boundary case: full payment above the floor', () => {
    // Money €5000, protected €4000 -> spendable €1000.
    // Damage 100 -> repairCost €200. Paid = 200, waived = 0.
    // nextMoney = 4800.
    const state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4000 } }
    )
    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 4800)
    assert.ok(completed.player.money > 4000)
  })

  it('boundary case: delivery bonus that pays part of repair with stash consumed once', () => {
    // Stash contains 2 contraband items.
    // Money €5000, protected €4990 -> spendable €10.
    // Damage 100 (repairCost €200), delivery 1 (bonus €50).
    // Available = 10 + 50 = 60. Paid = 60, waived = 140.
    // nextMoney = 5000 + 50 - 60 = 4990.
    let state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4990 } }
    )
    const stashKey = 'c_vintage_mic'
    state = {
      ...state,
      band: {
        ...state.band,
        stash: {
          [stashKey]: { type: 'contraband', stacks: 2, instanceId: 'inst_1' }
        }
      }
    }

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: {
        equipmentDamage: 100,
        contrabandDelivered: 1,
        deliveredStashItemId: stashKey
      }
    })

    assert.equal(completed.player.money, 4990)
    assert.equal(completed.band.stash[stashKey].stacks, 1)

    const waivedToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.roadieRepairWaived'
    )
    assert.ok(waivedToast)
    assert.equal(waivedToast.options.amount, 140)
  })

  it('boundary case: gear_nerd discount changes the repair crossing', () => {
    // Money €5000, protected €4850 -> spendable €150.
    // Damage 100 -> base repair €200. Without trait: paid 150, waived 50, money 4850.
    // With gear_nerd (20% off): repair €160. Spendable 150 -> paid 150, waived 10, money 4850.
    let state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4850 } }
    )
    state = {
      ...state,
      band: {
        ...state.band,
        members: state.band.members.map((m, i) =>
          i === 0
            ? {
                ...m,
                traits: {
                  ...(typeof m.traits === 'object' && m.traits !== null
                    ? m.traits
                    : {}),
                  gear_nerd: { id: 'gear_nerd' }
                }
              }
            : m
        )
      }
    }

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 4850)
    const waivedToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.roadieRepairWaived'
    )
    assert.ok(waivedToast)
    assert.equal(waivedToast.options.amount, 10)
  })

  it('boundary case: damage > 50 with spare consumes spare, avoids damaged_gear, repair still capped', () => {
    let state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4990 } }
    )
    const spareItemId = SPARE_GEAR_ITEM_IDS[0]
    state = {
      ...state,
      band: {
        ...state.band,
        inventory: {
          ...state.band.inventory,
          [spareItemId]: 1
        }
      }
    }

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 4990)
    assert.equal(completed.gigModifiers.damaged_gear, undefined)
    assert.equal(completed.band.inventory[spareItemId], 0)

    const spareToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.spareGearUsed'
    )
    assert.ok(spareToast)
  })

  it('boundary case: outside an active expedition, no waived toast is emitted', () => {
    // Money €10 outside an active expedition. Damage 100 -> repairCost €200.
    // Money drops to 0, waived = 190, but state.expedition is undefined/idle -> no toast.
    const state = {
      ...startedState({ money: 10 }),
      expedition: undefined
    }

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 0)
    const waivedToast = completed.toasts.find(
      t => t.messageKey === 'ui:toast.roadieRepairWaived'
    )
    assert.equal(waivedToast, undefined)
  })

  it('boundary case: malformed protection keeps money at starting balance when spendable cash is 0', () => {
    let state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 0 } }
    )
    state = {
      ...state,
      expedition: {
        ...state.expedition,
        protectedCareerCash: Number.NaN
      }
    }

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    assert.equal(completed.player.money, 5000)
  })

  it('quest-reward case: settlement uses pre-emit balance and protected cash survives', () => {
    // Set up a state with active quest that rewards money on minigame completion.
    let state = startedState(
      { money: 5000 },
      { build: { protectedCareerCash: 4990 } }
    )
    const quest = {
      id: 'quest_test_money',
      label: 'Test Money Quest',
      required: 1,
      progress: 0,
      progressSource: 'minigame_completed',
      progressRules: [
        {
          event: 'minigame.failed',
          amount: 'fixed',
          fixedAmount: 1
        }
      ],
      rewards: [{ type: 'money', amount: 600 }]
    }
    state = QuestLifecycle.addQuest(state, quest)

    const started = gameReducer(state, {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_1' }
    })
    const completed = gameReducer(started, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: { equipmentDamage: 100 }
    })

    // Pre-emit money: 5000, protected 4990 -> spendable 10. Charge 200 -> paid 10, waived 190.
    // Post-settlement money = 4990.
    // Quest emits minigame.failed event -> quest completes -> +600 money reward.
    // Final money = 4990 + 600 = 5590.
    assert.equal(completed.player.money, 5590)
    assert.ok(completed.player.money >= 4990)
  })
})

describe('roadieRepairWaived toast formatting', () => {
  it('the locale string formats the raw amount per language at render time', () => {
    for (const lng of ['en', 'de']) {
      const bundle = JSON.parse(
        readFileSync(`public/locales/${lng}/ui.json`, 'utf8')
      )
      i18n.addResourceBundle(lng, 'ui', bundle, true, true)
    }
    const en = i18n.getFixedT('en', 'ui')('toast.roadieRepairWaived', {
      amount: 1190
    })
    const de = i18n.getFixedT('de', 'ui')('toast.roadieRepairWaived', {
      amount: 1190
    })

    assert.match(en, /€1,190/)
    assert.match(de, /1\.190\s?€/)
  })
})
