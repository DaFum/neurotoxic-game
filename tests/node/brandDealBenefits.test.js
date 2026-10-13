import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getActiveDealBenefits } from '../../src/utils/brandDealBenefits.ts'
import { BRAND_DEALS_BY_ID } from '../../src/data/brandDeals.ts'
import { calculateGigFinancials } from '../../src/utils/economy/index.ts'
import { BREAKDOWN_LABEL_KEYS } from '../../src/utils/economy/breakdownLabelKeys.ts'
import {
  calculateContinueStats,
  buildPerGigSocialReconciliation
} from '../../src/utils/postGig/index.ts'
import { calculateDailyUpdates } from '../../src/utils/dailyTickLogic.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  BALANCE_CONSTANTS,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney
} from '../../src/utils/gameState/index.ts'

const activeDeal = id => ({
  ...BRAND_DEALS_BY_ID.get(id),
  remainingGigs: 3
})

const gigParams = activeDeals => ({
  gigData: { capacity: 300, price: 15, pay: 500, dist: 100, diff: 3 },
  performanceScore: 80,
  modifiers: { merch: true, promo: false, catering: false },
  bandInventory: { shirts: 50, hoodies: 20, patches: 100, cds: 30, vinyl: 10 },
  playerState: { fame: 100 },
  gigStats: { misses: 0, perfectHits: 20, maxCombo: 15, peakHype: 80 },
  context: { social: { activeDeals } }
})

describe('active brand-deal benefits', () => {
  it('aggregates registry benefits and revenue share', () => {
    const benefits = getActiveDealBenefits([
      activeDeal('indie_label_void'),
      activeDeal('community_radio'),
      activeDeal('vegan_snacks')
    ])
    assert.equal(benefits.loyaltyPerGig, 3)
    assert.equal(benefits.staminaRegenPerDay, 2)
    assert.ok(Math.abs(benefits.fameMultiplier - 1.2 * 1.05) < 1e-9)
    assert.equal(benefits.revenueShare, 0.1)
  })

  it('ignores tampered deal objects and unknown ids', () => {
    const benefits = getActiveDealBenefits([
      { ...activeDeal('basement_zine'), benefit: { loyalty: 999 } },
      { id: 'not_a_deal', benefit: { fameMultiplier: 50 } },
      null
    ])
    assert.deepEqual(benefits, {
      loyaltyPerGig: 0,
      fameMultiplier: 1,
      staminaRegenPerDay: 0,
      revenueShare: 0
    })
  })

  it('deducts the record-label share of merch as a visible expense line', () => {
    const without = calculateGigFinancials(gigParams([]))
    const withLabel = calculateGigFinancials(
      gigParams([activeDeal('indie_label_void')])
    )
    const line = withLabel.expenses.breakdown.find(
      item => item.labelKey === BREAKDOWN_LABEL_KEYS.LABEL_REVENUE_SHARE
    )
    assert.ok(line, 'label share must be itemized')
    assert.deepEqual(line.detailParams, { rate: 10 })
    assert.ok(line.value > 0)
    assert.equal(withLabel.income.total, without.income.total)
    assert.equal(
      withLabel.net,
      withLabel.income.total - withLabel.expenses.total
    )
    assert.ok(Math.abs(withLabel.dealFameMultiplier - 1.2) < 1e-9)
    assert.equal(without.dealFameMultiplier, 1)
    assert.equal(
      without.expenses.breakdown.some(
        item => item.labelKey === BREAKDOWN_LABEL_KEYS.LABEL_REVENUE_SHARE
      ),
      false
    )
  })

  it('applies the fame multiplier to positive post-gig fame gains only', () => {
    const base = {
      player: { fame: 0, money: 0 },
      financials: { net: 0 },
      calculateFameGain: raw => raw,
      calculateFameLevel,
      clampPlayerFame,
      clampPlayerMoney,
      BALANCE_CONSTANTS
    }
    const plain = calculateContinueStats({ ...base, perfScore: 80 })
    const boosted = calculateContinueStats({
      ...base,
      perfScore: 80,
      dealFameMultiplier: 1.2
    })
    assert.equal(boosted.newFame, Math.round(plain.newFame * 1.2))

    const badPlain = calculateContinueStats({
      ...base,
      player: { fame: 500, money: 0 },
      perfScore: 10
    })
    const badBoosted = calculateContinueStats({
      ...base,
      player: { fame: 500, money: 0 },
      perfScore: 10,
      dealFameMultiplier: 1.2
    })
    assert.equal(badBoosted.newFame, badPlain.newFame)
  })

  it('adds the loyalty benefit once per gig, including the final gig', () => {
    const state = createInitialState()
    const social = {
      ...state.social,
      loyalty: 10,
      activeDeals: [{ ...activeDeal('community_radio'), remainingGigs: 1 }]
    }
    const patch = buildPerGigSocialReconciliation({
      player: state.player,
      social,
      currentGig: null
    })
    assert.equal(patch.loyalty, 13)
    assert.deepEqual(patch.activeDeals, [])

    const noDeal = buildPerGigSocialReconciliation({
      player: state.player,
      social: { ...social, activeDeals: [] },
      currentGig: null
    })
    assert.equal(Object.hasOwn(noDeal, 'loyalty'), false)
  })

  it('adds the staminaRegen benefit to the daily tick', () => {
    const base = createInitialState()
    const state = {
      ...base,
      band: {
        ...base.band,
        members: base.band.members.map(m => ({
          ...m,
          stamina: 40,
          staminaMax: 100
        }))
      }
    }
    const withDeal = {
      ...state,
      social: {
        ...state.social,
        activeDeals: [activeDeal('sustainable_farming_coop')]
      }
    }
    const rng = () => 0.99
    const plain = calculateDailyUpdates(state, rng)
    const boosted = calculateDailyUpdates(withDeal, rng)
    for (let i = 0; i < state.band.members.length; i++) {
      assert.equal(
        boosted.band.members[i].stamina,
        plain.band.members[i].stamina + 5
      )
    }
  })
})
