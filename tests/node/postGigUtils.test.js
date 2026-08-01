import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyPostGigPerformancePenalty,
  calculateContinueStats,
  calculateExcessMissMoneyPenalty,
  calculatePerformanceScore,
  calculatePostGigStateUpdates,
  buildPerGigSocialReconciliation,
  getAcceptDealSocialUpdateFactory,
  getSpinStorySocialUpdateFactory,
  SPIN_STORY_CONTROVERSY_REDUCTION
} from '../../src/utils/postGigUtils'
import { BALANCE_CONSTANTS } from '../../src/utils/gameState'
import { POST_OPTIONS } from '../../src/data/postOptions'

test('calculatePerformanceScore clamps and rejects non-finite raw scores', () => {
  assert.equal(calculatePerformanceScore(15000), 100)
  assert.equal(calculatePerformanceScore(0), 30)
  // NaN passes through Math.min/Math.max untouched; the finite guard must
  // collapse it to the lower bound instead of returning NaN.
  assert.equal(calculatePerformanceScore(Number.NaN), 30)
  assert.equal(calculatePerformanceScore(Infinity), 30)
})

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
    platform: 'instagram',
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
  secureRandomValue: 0.5,
  selectionRandomValue: 0.5,
  viralRandomValue: 0.99
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

test('applyPostGigPerformancePenalty returns original financials if misses are within tolerance', () => {
  const baseFinancials = buildFinancials()
  const result = applyPostGigPerformancePenalty({
    financials: baseFinancials,
    misses: 2,
    missTolerance: 5,
    missMoneyPenalty: 10
  })
  assert.equal(result, baseFinancials)
})

test('applyPostGigPerformancePenalty adds penalty to expenses and adjusts net when misses exceed tolerance', () => {
  const baseFinancials = buildFinancials()
  const result = applyPostGigPerformancePenalty({
    financials: baseFinancials,
    misses: 7,
    missTolerance: 5,
    missMoneyPenalty: 10
  })

  assert.notEqual(result, baseFinancials)
  assert.equal(baseFinancials.expenses.total, 300)
  assert.equal(baseFinancials.net, 200)
  assert.equal(result.expenses.total, 320)
  assert.equal(result.net, 180)
  assert.equal(result.expenses.breakdown.length, 1)
  assert.equal(result.expenses.breakdown[0].value, 20)
  assert.equal(result.expenses.breakdown[0].detailParams.misses, 2)
})

test('applyPostGigPerformancePenalty handles missing optional params safely', () => {
  const baseFinancials = buildFinancials()
  const result = applyPostGigPerformancePenalty({
    financials: baseFinancials,
    missTolerance: 5
  })
  assert.equal(result, baseFinancials)
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

test('calculatePostGigStateUpdates drops non-finite numeric deltas', () => {
  const updates = calculatePostGigStateUpdates(
    buildPostGigParams({
      result: {
        moneyChange: Number.NaN
      }
    })
  )

  assert.equal(updates.finalResult.moneyChange, undefined)
  assert.equal(updates.nextMoney, 100)
  assert.equal(updates.appliedMoneyDelta, 0)
})

const invalidPlatformVariants = [
  { label: 'empty', platform: '' },
  { label: 'whitespace', platform: '   ' },
  { label: 'numeric', platform: 404 }
]

invalidPlatformVariants.forEach(variant => {
  test(`calculatePostGigStateUpdates rejects explicit ${variant.label} resolver platform`, () => {
    assert.throws(
      () =>
        calculatePostGigStateUpdates(
          buildPostGigParams({
            result: {
              platform: variant.platform,
              followers: 25
            }
          })
        ),
      /Invalid social post platform:/
    )
  })
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

test('calculatePostGigStateUpdates grows scene presence after post-gig activity', () => {
  const updates = calculatePostGigStateUpdates({
    ...buildPostGigParams({
      social: { scenePresence: 24 },
      result: { followers: 10, success: true }
    }),
    perfScore: 80,
    lastGigStats: { accuracy: 0, maxCombo: 0, score: 0 }
  })

  assert.equal(updates.updatedSocial.scenePresence, 29)
})

test('calculatePostGigStateUpdates boosts positive follower gains by band affinity', () => {
  const params = buildPostGigParams({
    result: { followers: 100, success: true }
  })
  const base = calculatePostGigStateUpdates(params)
  const boosted = calculatePostGigStateUpdates({
    ...params,
    band: { ...params.band, affinity: 0.5 }
  })

  assert.ok(base.finalResult.totalFollowers > 0)
  assert.equal(
    boosted.finalResult.totalFollowers,
    Math.round(base.finalResult.totalFollowers * 1.5)
  )
})

test('calculatePostGigStateUpdates independently selects the crowdsurf member', () => {
  const params = buildPostGigParams()
  const option = POST_OPTIONS.find(
    candidate => candidate.id === 'drama_crowdsurf_fail'
  )
  assert.ok(option)
  const updates = calculatePostGigStateUpdates({
    ...params,
    option,
    band: {
      ...params.band,
      members: [
        { name: 'First', traits: {} },
        { name: 'Second', traits: {} },
        { name: 'Third', traits: {} },
        { name: 'Fourth', traits: {} }
      ]
    },
    secureRandomValue: 0.8,
    selectionRandomValue: 0.6,
    viralRandomValue: 0.9,
    lastGigStats: { accuracy: 50, maxCombo: 10, score: 100 }
  })

  assert.equal(updates.finalResult.success, true)
  assert.equal(updates.finalResult.followers, 1000)
  assert.equal(updates.finalResult.targetMember, 'Third')
})

test('calculatePostGigStateUpdates independently applies the viral roll', () => {
  const params = buildPostGigParams()
  const option = POST_OPTIONS.find(
    candidate => candidate.id === 'drama_crowdsurf_fail'
  )
  assert.ok(option)
  const common = {
    ...params,
    option,
    band: {
      ...params.band,
      members: [{ name: 'Only Member', traits: {} }]
    },
    secureRandomValue: 0.8,
    selectionRandomValue: 0.2,
    perfScore: 50,
    lastGigStats: { accuracy: 50, maxCombo: 10, score: 100 }
  }

  const viral = calculatePostGigStateUpdates({
    ...common,
    viralRandomValue: 0
  })
  const nonViral = calculatePostGigStateUpdates({
    ...common,
    viralRandomValue: 0.99
  })

  assert.equal(viral.finalResult.targetMember, 'Only Member')
  assert.equal(nonViral.finalResult.targetMember, 'Only Member')
  assert.equal(viral.updatedSocial.viral, nonViral.updatedSocial.viral + 1)
  assert.equal(
    viral.updatedSocial.scenePresence,
    nonViral.updatedSocial.scenePresence + 1
  )
  assert.ok(
    viral.finalResult.totalFollowers > nonViral.finalResult.totalFollowers
  )
})

test('calculatePostGigStateUpdates does not soften follower losses via affinity', () => {
  const params = buildPostGigParams({
    result: { followers: -500, success: false }
  })
  const base = calculatePostGigStateUpdates(params)
  const boosted = calculatePostGigStateUpdates({
    ...params,
    band: { ...params.band, affinity: 0.5 }
  })

  assert.ok(base.finalResult.totalFollowers < 0)
  assert.equal(
    boosted.finalResult.totalFollowers,
    base.finalResult.totalFollowers
  )
})

test('calculateContinueStats boosts positive fame gain by bandStyle', () => {
  const identity = n => n
  const params = {
    player: { money: 100, fame: 100 },
    perfScore: 80,
    financials: buildFinancials(),
    misses: 0,
    calculateFameGain: raw => raw,
    calculateFameLevel: () => 1,
    clampPlayerFame: identity,
    clampPlayerMoney: identity,
    BALANCE_CONSTANTS
  }
  const base = calculateContinueStats(params)
  const styled = calculateContinueStats({ ...params, bandStyle: 0.5 })

  const baseGain = base.newFame - 100
  const styledGain = styled.newFame - 100
  assert.ok(baseGain > 0)
  assert.equal(styledGain, Math.round(baseGain * 1.5))
})

test('getSpinStorySocialUpdateFactory decreases controversyLevel correctly', () => {
  const updateFactory = getSpinStorySocialUpdateFactory()

  // Case 1: normal reduction when above SPIN_STORY_CONTROVERSY_REDUCTION
  const prevSocial1 = buildSocial({ controversyLevel: 50 })
  const result1 = updateFactory(prevSocial1)
  assert.equal(result1.controversyLevel, 50 - SPIN_STORY_CONTROVERSY_REDUCTION)

  // Case 2: clamped to 0 when below SPIN_STORY_CONTROVERSY_REDUCTION
  const prevSocial2 = buildSocial({ controversyLevel: 10 })
  const result2 = updateFactory(prevSocial2)
  assert.equal(result2.controversyLevel, 0)

  // Case 3: defaults to 0 when controversyLevel is undefined
  const prevSocial3 = buildSocial({ controversyLevel: undefined })
  const result3 = updateFactory(prevSocial3)
  assert.equal(result3.controversyLevel, 0)
})

test('getAcceptDealSocialUpdateFactory updates activeDeals with remaining gigs based on duration', () => {
  const deal = { offer: { duration: 5 } }
  const updateFactory = getAcceptDealSocialUpdateFactory(deal)
  const prevSocial = buildSocial({})
  const updates = updateFactory(prevSocial)
  assert.equal(updates.activeDeals.length, 1)
  assert.equal(updates.activeDeals[0].remainingGigs, 5)
})

test('getAcceptDealSocialUpdateFactory applies and clamps loyalty and controversy penalties', () => {
  const deal = {
    penalty: { loyalty: -10, controversy: 20 },
    offer: { duration: 5 }
  }
  const updateFactory = getAcceptDealSocialUpdateFactory(deal)
  const prevSocial = buildSocial({ loyalty: 15, controversyLevel: 50 })
  const updates = updateFactory(prevSocial)
  assert.equal(updates.loyalty, 5)
  assert.equal(updates.controversyLevel, 70)
  const prevSocial2 = buildSocial({ loyalty: 5, controversyLevel: 90 })
  const updates2 = updateFactory(prevSocial2)
  assert.equal(updates2.loyalty, 0)
  assert.equal(updates2.controversyLevel, 100)
})

test('getAcceptDealSocialUpdateFactory updates brand reputation and opposing alignment', () => {
  const deal = { alignment: 'CORPORATE', offer: { duration: 5 } }
  const updateFactory = getAcceptDealSocialUpdateFactory(deal)

  const prevSocial = buildSocial({
    brandReputation: { CORPORATE: 10, INDIE: 20 }
  })
  const updates = updateFactory(prevSocial)

  assert.equal(updates.brandReputation.CORPORATE, 15)
  assert.equal(updates.brandReputation.INDIE, 17)
})

test('getAcceptDealSocialUpdateFactory handles missing social state values gracefully', () => {
  const deal = {
    penalty: { loyalty: -10, controversy: 20 },
    alignment: 'CORPORATE',
    offer: { duration: 5 }
  }
  const updateFactory = getAcceptDealSocialUpdateFactory(deal)
  const prevSocial = buildSocial({
    loyalty: undefined,
    controversyLevel: undefined,
    brandReputation: undefined
  })
  const updates = updateFactory(prevSocial)
  assert.equal(updates.loyalty, 0)
  assert.equal(updates.controversyLevel, 20)
  assert.equal(updates.brandReputation.CORPORATE, 5)
  assert.equal(updates.brandReputation.INDIE, 0)
})

test('buildPerGigSocialReconciliation records the gig and decrements active deals', () => {
  const updates = buildPerGigSocialReconciliation({
    player: { day: 12, location: 'venues:berlin_kb_club.name' },
    social: buildSocial({
      activeDeals: [
        { id: 'deal_multi', remainingGigs: 3 },
        { id: 'deal_final', remainingGigs: 1 }
      ],
      regionalGigHistory: { berlin: [9] }
    }),
    currentGig: { diff: 4 }
  })

  assert.equal(updates.lastGigDay, 12)
  assert.equal(updates.lastGigDifficulty, 4)
  assert.deepEqual(updates.regionalGigHistory, { berlin: [9, 12] })
  // A deal on its final gig expires instead of persisting at 0.
  assert.deepEqual(updates.activeDeals, [
    { id: 'deal_multi', remainingGigs: 2 }
  ])
})

test('buildPerGigSocialReconciliation falls back to difficulty 1 and leaves history untouched without a region', () => {
  const updates = buildPerGigSocialReconciliation({
    // An unresolvable location yields no region key, so the gig cannot be
    // attributed to one — the existing history must survive unchanged.
    player: { day: 3, location: undefined },
    social: buildSocial({ regionalGigHistory: { berlin: [1] } }),
    currentGig: null
  })

  assert.equal(updates.lastGigDifficulty, 1)
  assert.deepEqual(updates.regionalGigHistory, { berlin: [1] })
  assert.deepEqual(updates.activeDeals, [])
})

test('buildPerGigSocialReconciliation guards a non-finite player day', () => {
  for (const day of [Number.NaN, Infinity]) {
    const updates = buildPerGigSocialReconciliation({
      player: { day, location: 'venues:berlin_kb_club.name' },
      social: buildSocial({}),
      currentGig: { difficulty: 2 }
    })
    assert.equal(updates.lastGigDay, 0, `day ${String(day)} must collapse to 0`)
  }
})

test('buildPerGigSocialReconciliation rejects a hostile remainingGigs', () => {
  assert.throws(
    () =>
      buildPerGigSocialReconciliation({
        player: { day: 5, location: 'venues:berlin_kb_club.name' },
        social: buildSocial({
          activeDeals: [{ id: 'deal_bad', remainingGigs: -2 }]
        }),
        currentGig: { diff: 1 }
      }),
    /Invalid remainingGigs for active deal deal_bad/
  )
})
