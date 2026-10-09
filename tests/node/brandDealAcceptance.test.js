import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { resolveBrandDealAcceptance } from '../../src/domain/expedition/sponsors.ts'

const deal = {
  id: 'test-deal',
  name: 'Test brand',
  description: '',
  type: 'SPONSORSHIP',
  alignment: 'CORPORATE',
  requirements: { followers: 0 },
  offer: { upfront: 0, duration: 2 }
}

test('brand-deal quest trust matches the normalized applied social update', () => {
  for (const [stored, expected] of [
    [0, 5],
    [98, 2],
    [100, 0],
    [NaN, 5],
    [Infinity, 5],
    [-Infinity, 5],
    ['4', 5]
  ]) {
    const state = createInitialState()
    state.social.brandReputation.CORPORATE = stored
    const resolved = resolveBrandDealAcceptance(state, deal)
    assert.ok(resolved)
    const trust = resolved.questEvents.filter(
      event => event.type === 'brand.trustChanged'
    )
    assert.equal(trust.length, expected === 0 ? 0 : 1, String(stored))
    if (expected !== 0) assert.equal(trust[0].amount, expected)
    assert.equal(
      resolved.nextSocial.brandReputation.CORPORATE,
      (Number.isFinite(stored) ? stored : 0) + expected
    )
    assert.ok(
      resolved.questEvents.some(event => event.type === 'brand.offerAccepted')
    )
    assert.ok(
      resolved.questEvents.some(event => event.type === 'brand.dealCompleted')
    )
  }
})

test('brand-deal events tolerate missing alignment and credit only applied positive money', () => {
  for (const upfront of [0, -50, 50]) {
    const resolved = resolveBrandDealAcceptance(createInitialState(), {
      ...deal,
      alignment: undefined,
      offer: { ...deal.offer, upfront }
    })
    const money = resolved.questEvents.filter(
      event => event.type === 'economy.moneyEarned'
    )
    assert.equal(
      resolved.questEvents.filter(event => event.type === 'brand.trustChanged')
        .length,
      0
    )
    assert.equal(money.length, upfront > 0 ? 1 : 0)
    if (money.length) assert.equal(money[0].amount, resolved.appliedMoneyDelta)
  }
})

test('brand-deal resolver refuses another active deal', () => {
  const state = createInitialState()
  state.social.activeDeals = [{ ...deal, remainingGigs: 2 }]
  assert.equal(resolveBrandDealAcceptance(state, deal), null)
})
