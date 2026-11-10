/**
 * @fileoverview Pins `canSpendExpeditionCash` at its home in `spendableCash`
 * and the `loadout` compatibility re-export.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import {
  canSpendExpeditionCash,
  capExpeditionSpendAtCashFloor,
  enforceExpeditionCashFloor,
  getExpeditionDayPolicy,
  settleExpeditionDailyObligation
} from '../../src/domain/expedition/spendableCash'
import {
  canSpendExpeditionCash as reExportedCanSpend,
  capExpeditionSpendAtCashFloor as reExportedCapSpend,
  enforceExpeditionCashFloor as reExportedEnforceFloor,
  getExpeditionDayPolicy as reExportedGetPolicy,
  settleExpeditionDailyObligation as reExportedSettleObligation
} from '../../src/domain/expedition/loadout'

const activeRun = (money, protectedCareerCash) => {
  const state = createInitialState()
  state.player.money = money
  state.expedition = { status: 'active', protectedCareerCash }
  return state
}

describe('canSpendExpeditionCash (spendableCash)', () => {
  it('is the same function loadout re-exports', () => {
    assert.equal(reExportedCanSpend, canSpendExpeditionCash)
    assert.equal(reExportedCapSpend, capExpeditionSpendAtCashFloor)
    assert.equal(reExportedEnforceFloor, enforceExpeditionCashFloor)
    assert.equal(reExportedGetPolicy, getExpeditionDayPolicy)
    assert.equal(reExportedSettleObligation, settleExpeditionDailyObligation)
  })

  it('rejects non-finite and negative amounts', () => {
    const state = activeRun(9000, 0)
    for (const amount of [Number.NaN, Infinity, -Infinity, -1, '5', null]) {
      assert.equal(canSpendExpeditionCash(state, amount), false)
    }
    assert.equal(canSpendExpeditionCash(state, 0), true)
  })

  it('fails closed when the protected slice is corrupt', () => {
    for (const bad of [Number.NaN, -10, Infinity]) {
      assert.equal(canSpendExpeditionCash(activeRun(9000, bad), 1), false)
    }
  })

  it('respects the protected slice', () => {
    const state = activeRun(9000, 8500)
    assert.equal(canSpendExpeditionCash(state, 500), true)
    assert.equal(canSpendExpeditionCash(state, 501), false)
  })
})
