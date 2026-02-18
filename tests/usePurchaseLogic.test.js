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
  })
})
