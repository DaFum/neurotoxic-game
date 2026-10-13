import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createInitialState } from '../../src/context/initialState.ts'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState.ts'
import { handleConsumeItem } from '../../src/context/reducers/bandReducer.ts'
import { handleCompleteAmpCalibration } from '../../src/context/reducers/minigameReducer.ts'
import { handleTradeVoidItem } from '../../src/context/reducers/tradeReducer.ts'
import { sanitizeBand } from '../../src/context/reducers/sanitizers/stateSanitizers.ts'
import { MINIGAME_TYPES } from '../../src/context/gameConstants.ts'
import {
  INVENTORY_USE_EFFECTS,
  SPARE_GEAR_ITEM_IDS
} from '../../src/data/inventoryItems.ts'
import { HQ_ITEMS } from '../../src/data/hqItems.ts'
import {
  addContrabandToBand,
  BASE_STASH_SLOTS,
  getStashCapacity
} from '../../src/utils/contrabandStashUtils.ts'
import { validatePurchase } from '../../src/utils/purchaseLogicUtils.ts'
import { calculateDailyUpdates } from '../../src/utils/dailyTickLogic.ts'
import { applyQuestRewards } from '../../src/domain/questRewards.ts'
import { TRANSPORT_EVENTS } from '../../src/data/events/transport.ts'
import { VOID_TRADER_CONTROVERSY_THRESHOLD } from '../../src/data/contraband.ts'

const withInventory = (state, inventory) => ({
  ...state,
  band: {
    ...state.band,
    inventory: { ...state.band.inventory, ...inventory }
  }
})

const withMembers = (state, patch) => ({
  ...state,
  band: {
    ...state.band,
    members: state.band.members.map(m => ({ ...m, ...patch }))
  }
})

const findShopItem = id =>
  [...HQ_ITEMS.van, ...HQ_ITEMS.gear].find(item => item.id === id)

describe('inventory item effects', () => {
  it('keeps every effect-bearing key in the default inventory', () => {
    const keys = [
      ...Object.keys(INVENTORY_USE_EFFECTS),
      ...SPARE_GEAR_ITEM_IDS,
      'sleeping_bags'
    ]
    for (const key of keys) {
      assert.ok(
        Object.hasOwn(DEFAULT_BAND_STATE.inventory, key),
        `${key} would be dropped by sanitizeBandInventory on load`
      )
    }
  })

  it('persists bought items across a save/load round-trip', () => {
    const state = withInventory(createInitialState(), {
      sleeping_bags: true,
      tape_glue: 2,
      canned_food: 7,
      diy_patch_kit: true,
      lucky_pick: true
    })
    const loaded = sanitizeBand(JSON.parse(JSON.stringify(state.band)))
    assert.equal(loaded.inventory.sleeping_bags, true)
    assert.equal(loaded.inventory.tape_glue, 2)
    assert.equal(loaded.inventory.canned_food, 7)
    assert.equal(loaded.inventory.diy_patch_kit, true)
    assert.equal(loaded.inventory.lucky_pick, true)
  })

  it('canned food restores stamina and decrements the count', () => {
    const state = withMembers(
      withInventory(createInitialState(), { canned_food: 2 }),
      { stamina: 50, staminaMax: 100 }
    )
    const next = handleConsumeItem(state, 'canned_food')
    assert.equal(next.band.inventory.canned_food, 1)
    for (const member of next.band.members) assert.equal(member.stamina, 55)
  })

  it('beer, patch kit and energy drink apply their member deltas, clamped', () => {
    let state = withMembers(
      withInventory(createInitialState(), {
        beer_bulk: 1,
        diy_patch_kit: true,
        energy_drink: true
      }),
      { mood: 99, stamina: 95, staminaMax: 100 }
    )
    state = handleConsumeItem(state, 'beer_bulk')
    state = handleConsumeItem(state, 'diy_patch_kit')
    state = handleConsumeItem(state, 'energy_drink')
    for (const member of state.band.members) {
      assert.equal(member.mood, 100)
      assert.equal(member.stamina, 100)
    }
    assert.equal(state.band.inventory.beer_bulk, 0)
    assert.equal(state.band.inventory.diy_patch_kit, false)
    assert.equal(state.band.inventory.energy_drink, false)
  })

  it('tape & glue repairs the van and the lucky pick raises luck', () => {
    const base = withInventory(createInitialState(), {
      tape_glue: 1,
      lucky_pick: true
    })
    const state = {
      ...base,
      player: { ...base.player, van: { ...base.player.van, condition: 60 } },
      band: { ...base.band, luck: 1 }
    }
    const repaired = handleConsumeItem(state, 'tape_glue')
    assert.equal(repaired.player.van.condition, 65)
    assert.equal(repaired.band.inventory.tape_glue, 0)
    const lucky = handleConsumeItem(repaired, 'lucky_pick')
    assert.equal(lucky.band.luck, 3)
    assert.equal(lucky.band.inventory.lucky_pick, false)
  })

  it('refuses tape & glue during an active Expedition (between_tours_only)', () => {
    const base = withInventory(createInitialState(), { tape_glue: 1 })
    const state = {
      ...base,
      expedition: { ...base.expedition, status: 'active' }
    }
    assert.equal(handleConsumeItem(state, 'tape_glue'), state)
  })

  it('leaves state untouched when the item is not owned', () => {
    const state = createInitialState()
    assert.equal(handleConsumeItem(state, 'canned_food'), state)
  })

  it('sleeping bags are non-stackable and add daily stamina', () => {
    const item = findShopItem('hq_van_sleeping_bags')
    const base = withMembers(createInitialState(), {
      stamina: 50,
      staminaMax: 100
    })
    const owned = withInventory(base, { sleeping_bags: true })
    const player = { ...owned.player, fame: 10_000 }
    const decision = validatePurchase(item, player, owned.band, owned.social)
    assert.equal(decision.isValid, false)
    assert.equal(decision.errorType, 'already_owned')

    const rng = () => 0.99
    const without = calculateDailyUpdates(base, rng)
    const withBags = calculateDailyUpdates(owned, rng)
    for (let i = 0; i < base.band.members.length; i++) {
      assert.equal(
        withBags.band.members[i].stamina,
        without.band.members[i].stamina + 1
      )
    }
  })

  it('stackable consumables stay repeatable in the shop', () => {
    const state = withInventory(createInitialState(), { canned_food: 4 })
    const player = { ...state.player, money: 10_000 }
    const decision = validatePurchase(
      findShopItem('hq_gear_tour_food_canned'),
      player,
      state.band,
      state.social
    )
    assert.equal(decision.isValid, true)
  })

  it('spare gear replaces the damaged_gear penalty on a failed setup', () => {
    const base = {
      ...withInventory(createInitialState(), { cheap_mics: 1 }),
      minigame: {
        ...createInitialState().minigame,
        active: true,
        type: MINIGAME_TYPES.AMP_CALIBRATION
      },
      toasts: []
    }
    const saved = handleCompleteAmpCalibration(base, { score: 0 })
    assert.notEqual(saved.gigModifiers.damaged_gear, true)
    assert.equal(saved.band.inventory.cheap_mics, 0)
    assert.equal(saved.toasts.at(-1).messageKey, 'ui:toast.spareGearUsed')
    assert.deepEqual(saved.toasts.at(-1).options, {
      item: 'items:cheap_mics.name'
    })

    const broken = handleCompleteAmpCalibration(
      { ...base, band: saved.band, toasts: [] },
      { score: 0 }
    )
    assert.equal(broken.gigModifiers.damaged_gear, true)
    assert.deepEqual(broken.toasts, [])
  })

  it('quest item toasts name the received item', () => {
    const state = createInitialState()
    const { state: next, toasts } = applyQuestRewards(state, {
      id: 'quest_pick_of_destiny',
      label: 'events:quest_pick_of_destiny.label',
      rewards: [{ type: 'item.add', itemId: 'lucky_pick' }]
    })
    assert.equal(next.band.inventory.lucky_pick, true)
    const itemToast = toasts.find(
      toast => toast.messageKey === 'ui:toast.quest_complete_item'
    )
    assert.equal(itemToast.options.item, 'items:lucky_pick.name')
  })
})

describe('stash capacity', () => {
  const fillStash = count => {
    const stash = Object.create(null)
    for (let i = 0; i < count; i++) {
      stash[`filler_${i}`] = { id: `filler_${i}`, stacks: 1 }
    }
    return stash
  }

  it('storage upgrades raise the base capacity', () => {
    assert.equal(getStashCapacity({ inventorySlots: 0 }), BASE_STASH_SLOTS)
    assert.equal(
      getStashCapacity({ inventorySlots: 10 }),
      BASE_STASH_SLOTS + 10
    )
    assert.equal(getStashCapacity({ inventorySlots: Number.NaN }), 15)
  })

  it('refuses a new entry when full but still stacks owned items', () => {
    const band = {
      ...createInitialState().band,
      stash: fillStash(BASE_STASH_SLOTS)
    }
    assert.equal(
      addContrabandToBand(band, { contrabandId: 'c_void_energy' }),
      band
    )

    const stash = fillStash(BASE_STASH_SLOTS - 1)
    stash.c_void_energy = { id: 'c_void_energy', stacks: 1 }
    const fullWithStackable = { ...band, stash }
    const stacked = addContrabandToBand(fullWithStackable, {
      contrabandId: 'c_void_energy'
    })
    assert.equal(stacked.stash.c_void_energy.stacks, 2)

    const upgraded = { ...band, inventorySlots: 10 }
    const added = addContrabandToBand(upgraded, {
      contrabandId: 'c_void_energy'
    })
    assert.ok(Object.hasOwn(added.stash, 'c_void_energy'))
  })

  it('a void trade into a full stash keeps the fame and explains why', () => {
    const state = {
      player: { fame: 5000 },
      band: { stash: fillStash(BASE_STASH_SLOTS), inventorySlots: 0 },
      social: { controversyLevel: VOID_TRADER_CONTROVERSY_THRESHOLD },
      toasts: []
    }
    const next = handleTradeVoidItem(state, {
      contrabandId: 'c_phantom_strings',
      fameCost: 1000,
      instanceId: 'trade-1'
    })
    assert.equal(next.player.fame, 5000)
    assert.equal(next.toasts.at(-1).messageKey, 'ui:stash.full')
    assert.deepEqual(next.toasts.at(-1).options, {
      item: 'items:contraband.c_phantom_strings.name',
      used: BASE_STASH_SLOTS,
      total: BASE_STASH_SLOTS
    })
  })

  it('hides the paid trunk-dealer options while the stash is full', () => {
    const event = TRANSPORT_EVENTS.find(e => e.id === 'reststop_trunk_dealer')
    const state = {
      player: { money: 1000 },
      band: { stash: fillStash(BASE_STASH_SLOTS), inventorySlots: 0 }
    }
    assert.equal(event.options[0].condition(state), false)
    assert.equal(event.options[1].condition(state), false)
    const roomy = { ...state, band: { ...state.band, inventorySlots: 10 } }
    assert.equal(event.options[0].condition(roomy), true)
  })
})
