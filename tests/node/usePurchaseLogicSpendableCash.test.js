import { describe, test, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

// `t` must keep one identity across renders: a fresh `t` per render would
// refresh `handleBuy` on its own and hide the missing `spendableCash` dep.
const stableT = (key, options) => options?.defaultValue || key

mock.module('react-i18next', {
  namedExports: {
    useTranslation: () => ({ t: stableT }),
    initReactI18next: { type: '3rdParty', init: () => {} }
  }
})

const { usePurchaseLogic } =
  await import('../../src/ui/bandhq/hooks/usePurchaseLogic')

const item = {
  id: 'cash_rerender_strings',
  name: 'Strings',
  cost: 100,
  currency: 'money',
  effect: { type: 'inventory_add', item: 'strings', value: 1 }
}

const setup = initialSpendableCash => {
  const player = {
    money: 500,
    fame: 0,
    van: { upgrades: [] },
    hqUpgrades: []
  }
  const band = { inventory: {}, performance: {}, members: [] }
  const social = {}
  const playerUpdates = []
  const bandUpdates = []
  const updatePlayer = patch => playerUpdates.push(patch)
  const updateBand = patch => bandUpdates.push(patch)
  const addToast = () => {}
  const hook = renderHook(
    ({ spendableCash }) =>
      usePurchaseLogic({
        player,
        band,
        social,
        spendableCash,
        updatePlayer,
        updateBand,
        addToast
      }),
    { initialProps: { spendableCash: initialSpendableCash } }
  )
  return { ...hook, playerUpdates, bandUpdates }
}

describe('usePurchaseLogic spendableCash rerenders (#3364)', () => {
  before(() => setupJSDOM())
  after(() => teardownJSDOM())
  afterEach(() => cleanup())

  test('handleBuy refuses after spendableCash drops while the wallet is unchanged', () => {
    const { result, rerender, playerUpdates, bandUpdates } = setup(500)
    rerender({ spendableCash: 0 })

    assert.equal(result.current.getPurchaseDecision(item).canPurchase, false)
    let bought
    act(() => {
      bought = result.current.handleBuy(item)
    })
    assert.equal(bought, false)
    assert.equal(playerUpdates.length, 0)
    assert.equal(bandUpdates.length, 0)
  })

  test('handleBuy accepts after spendableCash rises while the wallet is unchanged', () => {
    const { result, rerender, playerUpdates } = setup(0)
    rerender({ spendableCash: 500 })

    assert.equal(result.current.getPurchaseDecision(item).canPurchase, true)
    let bought
    act(() => {
      bought = result.current.handleBuy(item)
    })
    assert.equal(bought, true)
    assert.equal(playerUpdates.length, 1)
    assert.equal(playerUpdates[0].money, 400)
  })
})
