import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyPostGigPerformancePenalty,
  calculateExcessMissMoneyPenalty,
  calculatePostGigStateUpdates
} from '../../src/utils/postGigUtils'

const buildFinancials = () => ({
  income: { total: 500, breakdown: [] },
  expenses: { total: 300, breakdown: [] },
  net: 200
})

test('calculateExcessMissMoneyPenalty rejects invalid numeric invariants', () => {
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1.5,
        missTolerance: 3,
        missMoneyPenalty: 20
      }),
    /misses must be a finite integer >= 0/
  )
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1,
        missTolerance: -1,
        missMoneyPenalty: 20
      }),
    /missTolerance must be a finite integer >= 0/
  )
  assert.throws(
    () =>
      calculateExcessMissMoneyPenalty({
        misses: 1,
        missTolerance: 3,
        missMoneyPenalty: Number.NaN
      }),
    /missMoneyPenalty must be a finite number >= 0/
  )
})

test('applyPostGigPerformancePenalty validates penalty inputs before financial math', () => {
  assert.throws(
    () =>
      applyPostGigPerformancePenalty({
        financials: buildFinancials(),
        misses: 8,
        missTolerance: 5,
        missMoneyPenalty: Number.POSITIVE_INFINITY
      }),
    /missMoneyPenalty must be a finite number >= 0/
  )
})

test('calculatePostGigStateUpdates rejects invalid influencer score changes', () => {
  assert.throws(
    () =>
      calculatePostGigStateUpdates({
        option: {
          id: 'bad_influencer_update',
          condition: () => true,
          resolve: () => ({
            success: true,
            platform: 'instagram',
            followers: 0,
            message: 'Invalid influencer payload',
            influencerUpdate: { id: 'influencer1', scoreChange: 'bad-score' }
          })
        },
        player: { money: 100, day: 1 },
        band: { harmony: 50, members: [] },
        social: {
          instagram: 0,
          tiktok: 0,
          youtube: 0,
          newsletter: 0,
          viral: 0,
          controversyLevel: 0,
          loyalty: 0,
          zealotry: 0,
          reputationCooldown: 0,
          trend: 'MUSIC',
          activeDeals: [],
          influencers: { influencer1: { score: 25 } }
        },
        secureRandomValue: 0.5
      }),
    /Invalid influencerUpdate scoreChange for influencer1: bad-score/
  )
})
