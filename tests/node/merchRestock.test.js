/**
 * The pre-gig merch restock is one atomic purchase: the Cash debit and the
 * added stock are applied together or not at all, and only spendable Cash can
 * pay for it. Before it was one action, the pre-gig handler dispatched the
 * debit and the inventory update separately.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { createRestockMerchAction } from '../../src/context/actionCreators'
import { createInitialState } from '../../src/context/initialState'
import { startedState } from '../expeditionLifecycleFixture.js'

// hq_merch_shirts_bundle: 25 shirts for 150.
const SHIRT_BUNDLE = 25
const SHIRT_BUNDLE_COST = 150

/** A Career state outside any run with the given cash and merch stock. */
const careerWith = (money, inventory = {}) => {
  const base = createInitialState()
  return {
    ...base,
    player: { ...base.player, money },
    band: { ...base.band, inventory }
  }
}

const asset = (kind, slotType, moduleId) => ({
  id: `asset_${moduleId}`,
  kind,
  chassisFlavor: 'legit',
  chassisTier: 3,
  condition: 100,
  baseUpkeep: 0,
  baseDailyRevenue: 0,
  baseRiskEventChance: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  slots: [
    {
      id: `slot_${moduleId}`,
      slotType,
      position: { x: 0, y: 0 },
      installedModuleId: moduleId
    }
  ]
})

describe('RESTOCK_MERCH', () => {
  it('debits the bundle cost and adds the bundle in one update', () => {
    const state = careerWith(500, { shirts: 0 })
    const next = gameReducer(state, createRestockMerchAction('shirts'))
    assert.equal(next.player.money, 500 - SHIRT_BUNDLE_COST)
    assert.equal(next.band.inventory.shirts, SHIRT_BUNDLE)
  })

  it('changes neither cash nor stock when the balance is short', () => {
    const state = careerWith(SHIRT_BUNDLE_COST - 1, { shirts: 0 })
    const next = gameReducer(state, createRestockMerchAction('shirts'))
    assert.equal(next, state)
  })

  it('changes neither cash nor stock when only protected run cash could pay', () => {
    const run = startedState({ money: 10000 })
    const state = {
      ...run,
      band: { ...run.band, inventory: { shirts: 0 } },
      expedition: { ...run.expedition, protectedCareerCash: 9999 }
    }
    const next = gameReducer(state, createRestockMerchAction('shirts'))
    assert.equal(next.player.money, 10000)
    assert.equal(next.band.inventory.shirts, 0)
  })

  it('refuses outright during an active run, even with spendable cash', () => {
    const run = startedState({ money: 10000 })
    const state = { ...run, band: { ...run.band, inventory: { shirts: 0 } } }
    assert.equal(state.expedition.status, 'active')
    const next = gameReducer(state, createRestockMerchAction('shirts'))
    assert.equal(next, state)
  })

  it('refuses at full capacity and fills only the remaining room', () => {
    const full = careerWith(500, { shirts: 100 })
    assert.equal(gameReducer(full, createRestockMerchAction('shirts')), full)

    // 90 of 100 stocked: 10 shirts fit, charged pro rata (150 * 10/25 = 60).
    const partial = careerWith(500, { shirts: 90 })
    const next = gameReducer(partial, createRestockMerchAction('shirts'))
    assert.equal(next.band.inventory.shirts, 100)
    assert.equal(next.player.money, 500 - 60)
  })

  it('derives cost and capacity from the active assets', () => {
    // 4-colour carousel: 150 * 0.75 = 113 per bundle.
    const discounted = {
      ...careerWith(500, { shirts: 0 }),
      assets: [
        asset('merch_workshop_chassis', 'mw_print', 'mw_4color_carousel')
      ]
    }
    const paid = gameReducer(discounted, createRestockMerchAction('shirts'))
    assert.equal(paid.player.money, 500 - 113)

    // Roof rack raises the ceiling above the base 100.
    const racked = {
      ...careerWith(500, { shirts: 100 }),
      assets: [asset('tourbus_chassis', 'tb_roof', 'tb_roof_rack')]
    }
    const restocked = gameReducer(racked, createRestockMerchAction('shirts'))
    assert.equal(restocked.player.money, 500 - SHIRT_BUNDLE_COST)
    assert.equal(restocked.band.inventory.shirts, 100 + SHIRT_BUNDLE)
  })

  it('recovers a non-finite stored count before adding stock', () => {
    const state = careerWith(500, { shirts: Number.NaN })
    const next = gameReducer(state, createRestockMerchAction('shirts'))
    assert.equal(next.band.inventory.shirts, SHIRT_BUNDLE)
  })

  it('rejects unknown and hostile merch keys without charging', () => {
    const state = careerWith(500, { shirts: 0 })
    for (const key of ['not_merch', '__proto__', 'constructor', 42, null]) {
      const next = gameReducer(state, createRestockMerchAction(key))
      assert.equal(next, state)
    }
    const raw = gameReducer(state, {
      type: 'RESTOCK_MERCH',
      payload: { merchKey: '__proto__' }
    })
    assert.equal(raw, state)
    assert.equal(Object.hasOwn(raw.band.inventory, '__proto__'), false)
  })
})
