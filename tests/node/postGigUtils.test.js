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

const buildSocial = overrides => ({
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
  influencers: { influencer1: { score: 25 } },
  ...overrides
})

const buildPostGigParams = ({ result = {}, social = {} } = {}) => ({
  option: {
    id: 'post_gig_test_option',
    condition: () => true,
    resolve: () => ({
      success: true,
      platform: 'instagram',
      followers: 0,
      message: 'Post gig test result',
      ...result
    })
  },
  player: { money: 100, day: 1 },
  band: { harmony: 50, members: [] },
  social: buildSocial(social),
  secureRandomValue: 0.5
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
      calculatePostGigStateUpdates(
        buildPostGigParams({
          result: {
            influencerUpdate: {
              id: 'influencer1',
              scoreChange: 'bad-score'
            }
          }
        })
      ),
    /Invalid influencerUpdate scoreChange for influencer1: bad-score/
  )
})

test('calculatePostGigStateUpdates rejects malformed influencer updates', () => {
  assert.throws(
    () =>
      calculatePostGigStateUpdates(
        buildPostGigParams({
          result: {
            influencerUpdate: { scoreChange: 5 }
          }
        })
      ),
    /Invalid influencerUpdate: id must be a string/
  )
})

test('calculatePostGigStateUpdates rejects non-finite numeric deltas', () => {
  assert.throws(
    () =>
      calculatePostGigStateUpdates(
        buildPostGigParams({
          result: {
            moneyChange: Number.NaN
          }
        })
      ),
    /Invalid post result moneyChange: NaN/
  )
})

test('calculatePostGigStateUpdates rejects malformed active deal remainingGigs', () => {
  assert.throws(
    () =>
      calculatePostGigStateUpdates(
        buildPostGigParams({
          social: {
            activeDeals: [
              {
                id: 'deal_bad_remaining',
                type: 'SPONSORSHIP',
                remainingGigs: 'soon',
                offer: { duration: 3 }
              }
            ]
          }
        })
      ),
    /Invalid remainingGigs for active deal deal_bad_remaining: soon/
  )
})
