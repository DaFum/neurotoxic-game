import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { handleTradeVoidItem } from '../../src/context/reducers/tradeReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createTradeVoidItemAction } from '../../src/context/actionCreators'
import {
  VOID_TRADER_CONTROVERSY_THRESHOLD,
  VOID_TRADER_COSTS
} from '../../src/data/contraband'

describe('Trade Reducer', () => {
  const makeState = (
    fame,
    controversyLevel = VOID_TRADER_CONTROVERSY_THRESHOLD
  ) => ({
    player: { fame },
    band: { stash: {} },
    social: { controversyLevel },
    toasts: []
  })

  it('should reject trades if fame is insufficient', () => {
    const initialState = makeState(100)

    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 1000,
      instanceId: '123'
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 100)
    assert.deepStrictEqual(nextState.band.stash, {})
    assert.deepStrictEqual(nextState.toasts, initialState.toasts)
  })

  it('rejects trades with a missing or non-numeric fameCost', () => {
    for (const fameCost of [undefined, null, '', '10', Number.NaN, -1]) {
      const initialState = makeState(2000)
      const nextState = handleTradeVoidItem(initialState, {
        contrabandId: 'c_phantom_strings',
        fameCost,
        instanceId: '123'
      })
      assert.strictEqual(nextState, initialState)
    }
  })

  it('rejects a raw dispatch while controversy is below the unlock threshold', () => {
    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 1000,
      instanceId: '123'
    }

    for (const controversyLevel of [
      VOID_TRADER_CONTROVERSY_THRESHOLD - 1,
      0,
      Number.NaN,
      null
    ]) {
      const initialState = makeState(2000, controversyLevel)
      assert.strictEqual(
        handleTradeVoidItem(initialState, payload),
        initialState
      )
    }

    const noSocial = { ...makeState(2000), social: undefined }
    assert.strictEqual(handleTradeVoidItem(noSocial, payload), noSocial)
  })

  it('allows the trade exactly at the unlock threshold', () => {
    const nextState = handleTradeVoidItem(
      makeState(2000, VOID_TRADER_CONTROVERSY_THRESHOLD),
      { contrabandId: 'c_phantom_strings', fameCost: 1000, instanceId: '123' }
    )
    assert.strictEqual(nextState.player.fame, 1000)
  })

  it('should deduct fame and add item to stash on successful trade', () => {
    const initialState = makeState(2000)

    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 1000,
      instanceId: '123',
      successToast: { message: 'Success', type: 'success' }
    }

    const nextState = handleTradeVoidItem(initialState, payload)

    assert.strictEqual(nextState.player.fame, 1000)
    assert.ok(
      nextState.band.stash['c_phantom_strings'],
      'Item should be in stash'
    )
    assert.strictEqual(
      nextState.band.stash['c_phantom_strings'].instanceId,
      '123'
    )
    assert.strictEqual(nextState.toasts.length, 1)
  })

  it('should merge actual fame delta into structured success toast options', () => {
    const initialState = makeState(1200)

    const payload = {
      contrabandId: 'c_cursed_pick',
      fameCost: VOID_TRADER_COSTS.rare,
      instanceId: 'structured-1',
      successToast: {
        messageKey: 'ui:toast.void_trade_success',
        options: { itemName: 'items:contraband.c_phantom_strings.name' },
        type: 'success'
      }
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 800)
    assert.strictEqual(nextState.toasts.length, 1)
    assert.strictEqual(
      nextState.toasts[0].messageKey,
      payload.successToast.messageKey
    )
    assert.strictEqual(
      nextState.toasts[0].options.itemName,
      payload.successToast.options.itemName
    )
    assert.strictEqual(nextState.toasts[0].options.fame, 400)
  })

  it('should preserve legacy pipe-message enrichment fallback', () => {
    const initialState = makeState(950)

    const payload = {
      contrabandId: 'c_cursed_pick',
      fameCost: VOID_TRADER_COSTS.rare,
      instanceId: 'legacy-1',
      successToast: {
        message:
          'ui:toast.void_trade_success|{"itemName":"items:contraband.c_phantom_strings.name"}',
        type: 'success'
      }
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 550)
    assert.strictEqual(nextState.toasts.length, 1)

    const toastMessage = nextState.toasts[0].message
    const pipeIdx = toastMessage.indexOf('|')
    const jsonStr = toastMessage.slice(pipeIdx + 1)
    const parsedContext = JSON.parse(jsonStr)

    assert.strictEqual(parsedContext.fame, 400)
    assert.strictEqual(
      parsedContext.itemName,
      'items:contraband.c_phantom_strings.name'
    )
  })

  it('charges the canonical rarity price and rejects any other payload cost', () => {
    // The price is derived from the catalogue, never trusted from the payload:
    // a raw TRADE_VOID_ITEM with fameCost 0 must not hand out the item.
    for (const [contrabandId, fameCost] of [
      ['c_phantom_strings', 0],
      ['c_phantom_strings', VOID_TRADER_COSTS.rare],
      ['c_cursed_pick', VOID_TRADER_COSTS.epic],
      ['c_cursed_pick', 1]
    ]) {
      const initialState = makeState(5000)
      assert.strictEqual(
        handleTradeVoidItem(initialState, {
          contrabandId,
          fameCost,
          instanceId: 'x'
        }),
        initialState
      )
    }

    const nextState = handleTradeVoidItem(makeState(5000), {
      contrabandId: 'c_cursed_pick',
      fameCost: VOID_TRADER_COSTS.rare,
      instanceId: 'x'
    })
    assert.strictEqual(nextState.player.fame, 5000 - VOID_TRADER_COSTS.rare)
    assert.ok(nextState.band.stash['c_cursed_pick'])
  })

  it('rejects items the Void Trader does not sell', () => {
    // Unknown ids and rarities without a trader price (common/uncommon).
    for (const contrabandId of ['c_void_energy', 'c_unknown_item']) {
      const initialState = makeState(5000)
      assert.strictEqual(
        handleTradeVoidItem(initialState, {
          contrabandId,
          fameCost: VOID_TRADER_COSTS.rare,
          instanceId: 'x'
        }),
        initialState
      )
    }
  })

  it('action creator formats payload correctly', () => {
    const action = createTradeVoidItemAction({
      contrabandId: 'c_test',
      fameCost: 500
    })

    assert.strictEqual(action.type, ActionTypes.TRADE_VOID_ITEM)
    assert.strictEqual(action.payload.contrabandId, 'c_test')
    assert.strictEqual(action.payload.fameCost, 500)
    assert.ok(action.payload.instanceId, 'Instance ID should be generated')
  })
})
