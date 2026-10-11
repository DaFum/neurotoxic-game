import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  getExpeditionProtectedCash,
  getExpeditionSpendableCash,
  getExpeditionUpfrontCost,
  getExpeditionFuelTopUpCost
} from '../../src/domain/expedition/loadout.ts'
import {
  EXPEDITION_INSURANCE_POLICY_IDS,
  getExpeditionInsurancePremium
} from '../../src/domain/expedition/insurance.ts'
import {
  EXPEDITION_BAND_INJURY_STAGES,
  isBandInjuryStage,
  isCrewInjuryStage
} from '../../src/data/expedition/injuryStages.ts'
import { EXPEDITION_CONDITION_TIER_LABELS } from '../../src/domain/expedition/condition.ts'
import { getConditionBand } from '../../src/domain/expedition/inspections.ts'
import { getExpeditionRunResources } from '../../src/domain/expedition/runResources.ts'
import { isStringArray } from '../../src/utils/objectUtils.ts'

const withRun = (money, protectedCareerCash, status = 'active') => {
  const base = createInitialState()
  return {
    ...base,
    player: { ...base.player, money },
    expedition: { ...base.expedition, status, protectedCareerCash }
  }
}

test('protected cash is zero outside a run and the stored slice inside one', () => {
  assert.equal(getExpeditionProtectedCash(withRun(500, 200, 'idle')), 0)
  assert.equal(getExpeditionProtectedCash(withRun(500, 200)), 200)
  assert.equal(getExpeditionSpendableCash(withRun(500, 200)), 300)
})

test('a corrupt protected slice fails closed for both cash readers', () => {
  for (const corrupt of [Number.NaN, Number.POSITIVE_INFINITY, -5]) {
    const state = withRun(500, corrupt)
    assert.equal(getExpeditionProtectedCash(state), 500)
    assert.equal(getExpeditionSpendableCash(state), 0)
    assert.equal(getExpeditionRunResources(state).protectedCash, 500)
  }
})

test('upfront cost is the fuel top-up plus the insurance premium', () => {
  const base = createInitialState()
  const state = {
    ...base,
    player: { ...base.player, van: { ...base.player.van, fuel: 40 } }
  }
  const policyId = EXPEDITION_INSURANCE_POLICY_IDS[0]
  assert.equal(
    getExpeditionUpfrontCost(state, {
      startingFuelTarget: 60,
      insurancePolicyId: policyId
    }),
    getExpeditionFuelTopUpCost(40, 60) + getExpeditionInsurancePremium(policyId)
  )
  // A non-finite tank reads as empty, never as free fuel.
  const corruptTank = {
    ...base,
    player: { ...base.player, van: { ...base.player.van, fuel: Number.NaN } }
  }
  assert.equal(
    getExpeditionUpfrontCost(corruptTank, {
      startingFuelTarget: 10,
      insurancePolicyId: null
    }),
    getExpeditionFuelTopUpCost(0, 10)
  )
})

test('injury stage guards accept exactly their own tuple', () => {
  for (const stage of EXPEDITION_BAND_INJURY_STAGES)
    assert.equal(isBandInjuryStage(stage), true)
  assert.equal(isCrewInjuryStage('critical'), false)
  assert.equal(isCrewInjuryStage('serious'), true)
  for (const bad of ['', 'CRITICAL', 2, null, undefined, '__proto__'])
    assert.equal(isBandInjuryStage(bad), false)
})

test('one label table drives both condition readouts', () => {
  assert.equal(getConditionBand(100), 'optimal')
  assert.equal(getConditionBand(30), 'critical')
  assert.equal(getConditionBand(10), 'critical')
  assert.equal(getConditionBand(0), 'disabled')
  assert.equal(EXPEDITION_CONDITION_TIER_LABELS.damaged.hud, 'critical')
  assert.equal(EXPEDITION_CONDITION_TIER_LABELS.breaking.hud, 'breaking')
  assert.equal(EXPEDITION_CONDITION_TIER_LABELS.disabled.hud, 'breaking')
})

test('isStringArray rejects rather than filters', () => {
  assert.equal(isStringArray(['a', 'b']), true)
  assert.equal(isStringArray([]), true)
  assert.equal(isStringArray(['a', 1]), false)
  assert.equal(isStringArray('a'), false)
  assert.equal(isStringArray(null), false)
})
