import { describe, it } from 'vitest'
import assert from 'node:assert'
import { handleTradeVoidItem } from '../../src/context/reducers/tradeReducer.js'
import { ActionTypes } from '../../src/context/actionTypes.js'
import { createTradeVoidItemAction } from '../../src/context/actionCreators.js'

describe('Trade Reducer', () => {
  it('should reject trades if fame is insufficient', () => {
    const initialState = {
      player: { fame: 100 },
      band: { stash: {} },
      toasts: []
    }

    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 1000,
      instanceId: '123'
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 100) // Fame should remain unchanged
    assert.deepStrictEqual(nextState.band.stash, {}) // Stash should remain empty
    assert.deepStrictEqual(nextState.toasts, initialState.toasts) // Toasts should remain unchanged
  })

  it('should deduct fame and add item to stash on successful trade', () => {
    const initialState = {
      player: { fame: 2000 },
      band: { stash: {} },
      toasts: []
    }

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
    const initialState = {
      player: { fame: 1200 },
      band: { stash: {} },
      toasts: []
    }

    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 300,
      instanceId: 'structured-1',
      successToast: {
        messageKey: 'ui:toast.void_trade_success',
        options: { itemName: 'items:contraband.c_phantom_strings.name' },
        type: 'success'
      }
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 900)
    assert.strictEqual(nextState.toasts.length, 1)
    assert.strictEqual(
      nextState.toasts[0].messageKey,
      payload.successToast.messageKey
    )
    assert.strictEqual(
      nextState.toasts[0].options.itemName,
      payload.successToast.options.itemName
    )
    assert.strictEqual(nextState.toasts[0].options.fame, 300)
  })

  it('should preserve legacy pipe-message enrichment fallback', () => {
    const initialState = {
      player: { fame: 950 },
      band: { stash: {} },
      toasts: []
    }

    const payload = {
      contrabandId: 'c_phantom_strings',
      fameCost: 250,
      instanceId: 'legacy-1',
      successToast: {
        message:
          'ui:toast.void_trade_success|{"itemName":"items:contraband.c_phantom_strings.name"}',
        type: 'success'
      }
    }

    const nextState = handleTradeVoidItem(initialState, payload)
    assert.strictEqual(nextState.player.fame, 700)
    assert.strictEqual(nextState.toasts.length, 1)

    const toastMessage = nextState.toasts[0].message
    const pipeIdx = toastMessage.indexOf('|')
    const jsonStr = toastMessage.slice(pipeIdx + 1)
    const parsedContext = JSON.parse(jsonStr)

    assert.strictEqual(parsedContext.fame, 250)
    assert.strictEqual(
      parsedContext.itemName,
      'items:contraband.c_phantom_strings.name'
    )
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
