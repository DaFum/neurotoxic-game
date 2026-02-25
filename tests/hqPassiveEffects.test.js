import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { usePurchaseLogic } from '../src/hooks/usePurchaseLogic.js'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'

describe('HQ Passive Effects', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('hq_room_label purchase gives money bonus', () => {
    let playerPatch = null
    const player = {
      money: 5000,
      fame: 5000,
      van: { upgrades: [] },
      hqUpgrades: []
    }

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band: { members: [], inventory: {}, performance: {} },
        updatePlayer: patch => {
          playerPatch = patch
        },
        updateBand: () => {},
        addToast: () => {}
      })
    )

    const item = {
      id: 'hq_room_label',
      name: 'Label',
      cost: 5000,
      currency: 'fame',
      effects: [{ type: 'unlock_hq', id: 'hq_label' }]
    }

    act(() => {
      const success = result.current.handleBuy(item)
      assert.equal(success, true)
    })

    assert.ok(playerPatch)
    assert.equal(playerPatch.fame, 0)
    // 5000 (starting) + 500 (bonus) = 5500
    assert.equal(playerPatch.money, 5500)
    assert.ok(playerPatch.hqUpgrades.includes('hq_room_label'))
  })

  test('calculateDailyUpdates applies passive boosts for HQ items', () => {
    const currentState = {
      player: {
        day: 1,
        money: 1000,
        hqUpgrades: [
          'hq_room_coffee',
          'hq_room_cheap_beer_fridge',
          'hq_room_sofa',
          'hq_room_old_couch',
          'hq_room_diy_soundproofing'
        ],
        van: { condition: 100 }
      },
      band: {
        members: [
          { name: 'Matze', mood: 50, stamina: 50 },
          { name: 'Marius', mood: 50, stamina: 50 }
        ],
        harmony: 50
      },
      social: { instagram: 100 }
    }

    const { band } = calculateDailyUpdates(currentState)

    // Expected Mood: 50 (base) + 2 (coffee) + 1 (beer fridge) = 53
    // Expected Stamina: 50 (base) - 5 (daily decay) + 3 (sofa) + 1 (old couch) = 49
    // Expected Harmony: 50 (base) + 1 (soundproofing) = 51

    assert.equal(band.members[0].mood, 53)
    assert.equal(band.members[1].mood, 53)
    assert.equal(band.members[0].stamina, 49)
    assert.equal(band.members[1].stamina, 49)
    assert.equal(band.harmony, 51)
  })

  test('passive boosts are clamped to 100', () => {
    const currentState = {
      player: {
        day: 1,
        money: 1000,
        hqUpgrades: ['hq_room_coffee', 'hq_room_sofa'],
        van: { condition: 100 }
      },
      band: {
        members: [{ name: 'Matze', mood: 99, stamina: 99 }],
        harmony: 99.5
      },
      social: { instagram: 100 }
    }

    const { band } = calculateDailyUpdates(currentState)

    // Expected Mood: 99 (base) - 2 (drift) + 2 (coffee) = 99
    // Expected Stamina: 99 (base) - 5 (decay) + 3 (harmony boost) + 3 (sofa) = 100
    // Expected Harmony: 99.5 (base) - 2 (drift) = 97.5 (Soundproofing NOT owned in this test case)

    assert.equal(band.members[0].mood, 99)
    assert.equal(band.members[0].stamina, 100)
    assert.equal(band.harmony, 97.5)
  })

  test('passive boosts are clamped to 100 (properly)', () => {
    const currentState = {
      player: {
        day: 1,
        money: 1000,
        hqUpgrades: [
          'hq_room_coffee',
          'hq_room_sofa',
          'hq_room_diy_soundproofing'
        ],
        van: { condition: 100 }
      },
      band: {
        members: [{ name: 'Matze', mood: 100, stamina: 100 }],
        harmony: 100
      },
      social: { instagram: 100 }
    }

    const { band } = calculateDailyUpdates(currentState)

    // Mood: 100 - 2 (drift) + 2 (coffee) = 100
    // Stamina: 100 - 5 (decay) + 3 (sofa) = 98 (Harmony > 60 gives +3 more = 101, clamped to 100)
    // Harmony: 100 - 2 (drift) + 1 (soundproofing) = 99

    assert.equal(band.members[0].mood, 100)
    assert.equal(band.members[0].stamina, 100)
    assert.equal(band.harmony, 99)
  })
})
