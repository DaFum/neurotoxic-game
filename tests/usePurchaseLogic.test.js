import { describe, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { usePurchaseLogic } from '../src/hooks/usePurchaseLogic.js'

describe('usePurchaseLogic', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('handleBuy marks one-time stat_modifier upgrades as owned in van.upgrades', () => {
    let playerPatch = null

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player: {
          money: 500,
          fame: 0,
          van: { upgrades: [] },
          hqUpgrades: []
        },
        band: { inventory: {}, performance: {} },
        updatePlayer: patch => {
          playerPatch = patch
        },
        updateBand: () => {},
        addToast: () => {}
      })
    )

    act(() => {
      result.current.handleBuy({
        id: 'test_stat_mod',
        name: 'Stat Mod',
        cost: 100,
        currency: 'money',
        oneTime: true,
        effects: [
          {
            type: 'stat_modifier',
            target: 'player',
            stat: 'fame',
            value: 5
          }
        ]
      })
    })

    assert.ok(playerPatch)
    assert.deepStrictEqual(playerPatch.van?.upgrades, ['test_stat_mod'])
    assert.equal(playerPatch.money, 400)
  })

  test('handleBuy prevents duplicate purchase of one-time passive upgrades', () => {
    let playerPatch = null
    const player = {
      money: 500,
      fame: 0,
      van: { upgrades: ['test_passive'] },
      hqUpgrades: []
    }

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band: { inventory: {}, performance: {} },
        updatePlayer: patch => {
          playerPatch = patch
        },
        updateBand: () => {},
        addToast: () => {}
      })
    )

    const item = {
      id: 'test_passive',
      name: 'Passive Item',
      cost: 100,
      currency: 'money',
      oneTime: true,
      effects: [{ type: 'passive', key: 'test_key', value: 5 }]
    }

    // Attempt to buy already owned item
    act(() => {
      const success = result.current.handleBuy(item)
      assert.equal(success, false)
    })

    // Assert no update occurred
    assert.equal(playerPatch, null)
  })

  test('handleBuy allows negative values for performance stats', () => {
    let bandPatch = null
    const player = {
      money: 500,
      fame: 0,
      van: { upgrades: [] },
      hqUpgrades: []
    }
    const band = {
      inventory: {},
      performance: { guitarDifficulty: 1.0 }
    }

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band,
        updatePlayer: () => {},
        updateBand: patch => {
          bandPatch = patch
        },
        addToast: () => {}
      })
    )

    const item = {
      id: 'test_guitar_custom',
      name: 'Custom Guitar',
      cost: 100,
      currency: 'money',
      effects: [
        {
          type: 'stat_modifier',
          target: 'performance',
          stat: 'guitarDifficulty',
          value: -0.15
        }
      ]
    }

    act(() => {
      const success = result.current.handleBuy(item)
      assert.equal(success, true)
    })

    assert.ok(bandPatch)
    assert.ok(bandPatch.performance)
    // 1.0 - 0.15 = 0.85. Should not be clamped to 0.
    assert.ok(Math.abs(bandPatch.performance.guitarDifficulty - 0.85) < 0.0001)

    // Test with base 0 (should go negative)
    const { result: result2 } = renderHook(() =>
      usePurchaseLogic({
        player,
        band: { ...band, performance: { guitarDifficulty: 0 } },
        updatePlayer: () => {},
        updateBand: patch => {
          bandPatch = patch
        },
        addToast: () => {}
      })
    )

    act(() => {
      result2.current.handleBuy(item)
    })
    assert.ok(Math.abs(bandPatch.performance.guitarDifficulty - -0.15) < 0.0001)
  })

  test('handleBuy applies harmony_regen_travel passive effect using key', () => {
    let bandPatch = null
    const player = { money: 1000, fame: 0, van: { upgrades: [] } }
    const band = { harmonyRegenTravel: false }

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band,
        updatePlayer: () => {},
        updateBand: patch => {
          bandPatch = patch
        },
        addToast: () => {}
      })
    )

    const item = {
      id: 'van_sound_system',
      cost: 500,
      currency: 'money',
      effects: [{ type: 'passive', key: 'harmony_regen_travel' }]
    }

    act(() => {
      result.current.handleBuy(item)
    })

    assert.ok(bandPatch, 'Band patch should be created')
    assert.equal(bandPatch.harmonyRegenTravel, true)
  })

  test('handleBuy applies passive_followers passive effect using key', () => {
    let playerPatch = null
    const player = { money: 1000, fame: 0, passiveFollowers: 10 }

    const { result } = renderHook(() =>
      usePurchaseLogic({
        player,
        band: {},
        updatePlayer: patch => {
          playerPatch = patch
        },
        updateBand: () => {},
        addToast: () => {}
      })
    )

    const item = {
      id: 'social_bot',
      cost: 500,
      currency: 'money',
      effects: [{ type: 'passive', key: 'passive_followers', value: 5 }]
    }

    act(() => {
      result.current.handleBuy(item)
    })

    assert.ok(playerPatch, 'Player patch should be created')
    assert.equal(playerPatch.passiveFollowers, 15)
  })
})
