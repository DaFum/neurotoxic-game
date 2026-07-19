import test from 'node:test'
import assert from 'node:assert/strict'
import { getModuleDescription } from '../../src/components/assets/moduleDescription.ts'

const makeModule = boni => ({
  id: 'bh_basement_bar',
  ownerKind: 'bandhaus_chassis',
  slotType: 'bh_lounge',
  flavor: 'legit',
  cost: 1500,
  installCost: 300,
  removalRefundFraction: 0.3,
  boni,
  unlock: {},
  imagePromptKey: 'bh_basement_bar'
})

test('getModuleDescription passes a formatted amount to the description key', () => {
  const calls = []
  const t = (key, options) => {
    calls.push({ key, options })
    return `translated:${options.amount}`
  }

  const result = getModuleDescription(
    t,
    makeModule({ baseDailyRevenueDelta: 25 }),
    'en'
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0].key, 'assets:module.bh_basement_bar.description')
  assert.equal(calls[0].options.defaultValue, '')
  // formatCurrency('en') renders EUR with no fraction digits.
  assert.match(String(calls[0].options.amount), /€\s?25|25\s?€/)
  assert.equal(result, `translated:${calls[0].options.amount}`)
})

test('getModuleDescription falls back to 0 when baseDailyRevenueDelta is absent', () => {
  let amount
  const t = (_key, options) => {
    amount = options.amount
    return ''
  }

  getModuleDescription(t, makeModule({ merchCapacityBonus: 60 }), 'en')

  assert.match(String(amount), /€\s?0|0\s?€/)
})
