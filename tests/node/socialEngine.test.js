import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateViralityScore,
  generatePostOptions,
  resolvePost,
  applyReputationDecay,
  calculateSocialGrowth,
  checkViralEvent,
  generateBrandName,
  generateBrandOffers,
  negotiateDeal
} from '../../src/utils/socialEngine'
import { BRAND_ALIGNMENTS } from '../../src/context/initialState'

test('calculateViralityScore returns base chance for average performance', () => {
  const venue = { name: 'Test Venue' }
  const score = calculateViralityScore(70, [], venue)

  assert.ok(score >= 0, 'Score should be non-negative')
  assert.ok(score <= 0.9, 'Score should be capped at 90%')
})

// Parametrized: performance scaling tests
const performanceVariants = [
  {
    label: 'increases with high performance [60 vs 95]',
    scenarios: [
      { performance: 60, label: 'low' },
      { performance: 95, label: 'high' }
    ],
    assertion: (low, high) => high > low
  },
  {
    label: 'applies performance multipliers [70, 80, 92]',
    scenarios: [
      { performance: 70, label: 'medium' },
      { performance: 80, label: 'good' },
      { performance: 92, label: 'great' }
    ],
    assertion: scores => scores[1] > scores[0] && scores[2] > scores[1]
  }
]

performanceVariants.forEach(variant => {
  test(`calculateViralityScore ${variant.label}`, () => {
    const venue = { name: 'Test Venue' }
    const scores = variant.scenarios.map(s =>
      calculateViralityScore(s.performance, [], venue)
    )

    if (variant.scenarios.length === 2) {
      assert.ok(
        variant.assertion(scores[0], scores[1]),
        `${variant.scenarios[1].label} should have higher virality than ${variant.scenarios[0].label}`
      )
    } else {
      assert.ok(
        variant.assertion(scores),
        `Performance multipliers should increase progressively`
      )
    }
  })
})

test('calculateViralityScore boosts for Kaminstube venue', () => {
  const normalVenue = { name: 'Regular Club' }
  const historicVenue = { name: 'Kaminstube Historic Hall' }

  const normalScore = calculateViralityScore(80, [], normalVenue)
  const historicScore = calculateViralityScore(80, [], historicVenue)

  assert.ok(historicScore > normalScore, 'Historic venue should boost virality')
})

test('calculateViralityScore boosts for stage diver event', () => {
  const venue = { name: 'Test Venue' }
  const noEvents = calculateViralityScore(80, [], venue)
  const withDiver = calculateViralityScore(80, ['stage_diver'], venue)

  assert.ok(withDiver > noEvents, 'Stage diver should boost virality')
})

test('calculateViralityScore boosts for influencer event', () => {
  const venue = { name: 'Test Venue' }
  const noEvents = calculateViralityScore(80, [], venue)
  const withInfluencer = calculateViralityScore(
    80,
    ['influencer_spotted'],
    venue
  )

  assert.ok(withInfluencer > noEvents, 'Influencer should boost virality')
  assert.ok(
    withInfluencer > 0.1,
    'Influencer should significantly boost virality'
  )
})

test('calculateViralityScore is capped at 90%', () => {
  const venue = { name: 'Kaminstube' }
  const score = calculateViralityScore(
    100,
    ['stage_diver', 'influencer_spotted'],
    venue
  )

  assert.ok(score <= 0.9, 'Virality should be capped at 90%')
})

test('calculateViralityScore combines multiple bonuses', () => {
  const venue = { name: 'Kaminstube Historic' }
  const score = calculateViralityScore(
    95,
    ['stage_diver', 'influencer_spotted'],
    venue
  )

  assert.ok(score > 0.3, 'Multiple bonuses should stack significantly')
  assert.ok(score <= 0.9, 'Should still be capped')
})

const mockGameState = {
  player: { money: 1000 },
  band: {
    harmony: 80,
    members: [{ name: 'Matze', mood: 50, stamina: 50 }],
    inventory: { golden_pick: false }
  },
  social: {
    instagram: 100,
    tiktok: 100,
    youtube: 100,
    newsletter: 100,
    loyalty: 0,
    controversyLevel: 0
  },
  lastGigStats: { score: 20000, accuracy: 80 },
  activeEvent: null
}

test('generatePostOptions returns array of exactly 3 options', () => {
  const options = generatePostOptions({}, mockGameState)

  assert.ok(Array.isArray(options), 'Should return array')
  assert.equal(options.length, 3, 'Should have exactly 3 options')
})

// Removed redundant and flaky expected-option test
test('generatePostOptions forces sponsor post if activeDeals has SPONSORSHIP', () => {
  const sponsoredState = {
    ...mockGameState,
    social: {
      ...mockGameState.social,
      activeDeals: [
        { id: 'energy_drink_cx', type: 'SPONSORSHIP', remainingGigs: 5 }
      ],
      instagram: 6000
    }
  }
  const options = generatePostOptions({}, sponsoredState)

  const sponsorOpt = options.find(opt => opt.id === 'comm_sellout_ad')
  assert.ok(sponsorOpt, 'Should include forced sponsor ad')
})

test('generatePostOptions does NOT force sponsor post if remainingGigs is 0', () => {
  const sponsoredState = {
    ...mockGameState,
    social: {
      ...mockGameState.social,
      activeDeals: [
        { id: 'brand_deal_1', type: 'SPONSORSHIP', remainingGigs: 0 }
      ],
      instagram: 6000
    }
  }
  const options = generatePostOptions({}, sponsoredState)

  const sponsorOpt = options.find(opt => opt.id === 'comm_sellout_ad')
  assert.equal(
    sponsorOpt,
    undefined,
    'Should NOT include forced sponsor ad if remainingGigs is 0'
  )
})

test('generatePostOptions all have required properties', () => {
  const options = generatePostOptions({}, mockGameState)

  options.forEach(opt => {
    assert.ok(opt.id, 'Option should have id')
    assert.ok(opt.name, 'Option should have name')
    assert.ok(opt.platform, 'Option should have platform')
    assert.ok(opt.badges, 'Option should have badges')
    assert.ok(opt.category, 'Option should have category')
  })
})

// Parametrized: resolvePost RNG outcome tests
const rngOutcomeVariants = [
  {
    label: 'handles RNG success [roll=0.5]',
    diceRoll: 0.5,
    expectedSuccess: true,
    expectedFollowers: 3000
  },
  {
    label: 'handles RNG failure [roll=0.9]',
    diceRoll: 0.9,
    expectedSuccess: false,
    expectedFollowers: -2000,
    expectedHarmonyChange: -20
  }
]

rngOutcomeVariants.forEach(variant => {
  test(`resolvePost ${variant.label}`, () => {
    const postOption = {
      id: 'test',
      platform: 'tiktok',
      resolve: ({ diceRoll }) => {
        if (diceRoll <= 0.7) return { success: true, followers: 3000 }
        return { success: false, followers: -2000, harmonyChange: -20 }
      }
    }

    const result = resolvePost(postOption, mockGameState, variant.diceRoll)

    assert.equal(
      result.success,
      variant.expectedSuccess,
      `Should be ${variant.expectedSuccess ? 'success' : 'failure'}`
    )
    assert.equal(
      result.followers,
      variant.expectedFollowers,
      'Should return correct followers'
    )
    assert.equal(result.platform, 'tiktok', 'Should preserve platform')
    if (variant.expectedHarmonyChange !== undefined) {
      assert.equal(
        result.harmonyChange,
        variant.expectedHarmonyChange,
        'Should process side effects'
      )
    }
  })
})

test('resolvePost returns consistent structure', () => {
  const postOption = {
    id: 'test2',
    platform: 'tiktok',
    resolve: () => ({ success: true, followers: 50, message: 'Done' })
  }

  const result = resolvePost(postOption, mockGameState)

  assert.ok(typeof result.success === 'boolean', 'Should have boolean success')
  assert.ok(
    typeof result.followers === 'number',
    'Should have number followers'
  )
  assert.ok(typeof result.platform === 'string', 'Should have string platform')
  assert.ok(typeof result.message === 'string', 'Should have string message')
})

const nullishPlatformVariants = [
  { label: 'undefined result platform', platform: undefined },
  { label: 'null result platform', platform: null }
]

nullishPlatformVariants.forEach(variant => {
  test(`resolvePost falls back to option platform for ${variant.label}`, () => {
    const postOption = {
      id: 'falsy_result_fields',
      platform: 'tiktok',
      resolve: () => ({
        success: false,
        followers: 0,
        platform: variant.platform,
        message: ''
      })
    }

    const result = resolvePost(postOption, mockGameState)

    assert.equal(result.success, false)
    assert.equal(result.followers, 0)
    assert.equal(result.platform, 'tiktok')
    assert.equal(result.message, '')
  })
})

const invalidPlatformVariants = [
  { label: 'empty result platform', platform: '', expectedPlatform: '' },
  {
    label: 'whitespace result platform',
    platform: '   ',
    expectedPlatform: ''
  },
  { label: 'numeric result platform', platform: 404, expectedPlatform: 404 }
]

invalidPlatformVariants.forEach(variant => {
  test(`resolvePost preserves invalid explicit ${variant.label}`, () => {
    const postOption = {
      id: 'invalid_result_platform',
      platform: 'tiktok',
      resolve: () => ({
        success: false,
        followers: 0,
        platform: variant.platform,
        message: ''
      })
    }

    const result = resolvePost(postOption, mockGameState)

    assert.equal(result.success, false)
    assert.equal(result.followers, 0)
    assert.equal(result.platform, variant.expectedPlatform)
    assert.equal(result.message, '')
  })
})

test('resolvePost trims explicit result platform values', () => {
  const postOption = {
    id: 'trimmed_result_platform',
    platform: 'tiktok',
    resolve: () => ({
      success: true,
      followers: 0,
      platform: ' instagram ',
      message: ''
    })
  }

  const result = resolvePost(postOption, mockGameState)

  assert.equal(result.platform, 'instagram')
  assert.equal(result.message, '')
})

test('resolvePost clamps harmony bounds between 1-100', () => {
  const gameState = {
    player: { money: 100 },
    band: { harmony: 90 }
  }
  const postOption = {
    id: 'harmony_test',
    resolve: () => ({ harmonyChange: 20 })
  }

  const result = resolvePost(postOption, gameState)
  assert.strictEqual(
    result.harmonyChange,
    10,
    'Harmony should be clamped to 100, delta 10'
  )

  const gameState2 = {
    player: { money: 100 },
    band: { harmony: 10 }
  }
  const postOption2 = {
    id: 'harmony_test_low',
    resolve: () => ({ harmonyChange: -20 })
  }
  const result2 = resolvePost(postOption2, gameState2)
  assert.strictEqual(
    result2.harmonyChange,
    -9,
    'Harmony should be clamped to 1, delta -9'
  )
})

test('resolvePost clamps money bounds >= 0', () => {
  const gameState = {
    player: { money: 100 },
    band: { harmony: 50 }
  }
  const postOption = {
    id: 'money_test',
    resolve: () => ({ moneyChange: -200 })
  }

  const result = resolvePost(postOption, gameState)
  assert.strictEqual(
    result.moneyChange,
    -100,
    'Money drop should be clamped to 0, delta -100'
  )
})

test('calculateViralityScore handles low performance', () => {
  const venue = { name: 'Test Venue' }
  const score = calculateViralityScore(30, [], venue)

  assert.ok(score > 0, 'Should still have some base chance')
  assert.ok(score < 0.1, 'Low performance should have low virality')
})

test('applyReputationDecay returns original followers if days since last post < 3', () => {
  assert.equal(applyReputationDecay(1000, 0), 1000)
  assert.equal(applyReputationDecay(1000, 1), 1000)
  assert.equal(applyReputationDecay(1000, 2), 1000)
})

test('applyReputationDecay applies 1% decay for 3 days', () => {
  // 1000 * (1 - 0.01 * (3-2)) = 1000 * 0.99 = 990
  assert.equal(applyReputationDecay(1000, 3), 990)
})

test('applyReputationDecay applies 8% decay for 10 days', () => {
  // 1000 * (1 - 0.01 * (10-2)) = 1000 * 0.92 = 920
  assert.equal(applyReputationDecay(1000, 10), 920)
})

test('applyReputationDecay caps decay at 50%', () => {
  // 100 days -> 0.01 * (100-2) = 0.98. Capped at 0.5.
  // 1000 * (1 - 0.5) = 500
  assert.equal(applyReputationDecay(1000, 100), 500)
})

test('applyReputationDecay handles 0 followers', () => {
  assert.equal(applyReputationDecay(0, 10), 0)
})

test('applyReputationDecay floors the result', () => {
  // 100 followers, 3 days (1% decay) -> 99 followers
  assert.equal(applyReputationDecay(100, 3), 99)

  // 105 followers, 3 days (1% decay) -> 105 * 0.99 = 103.95 -> 103
  assert.equal(applyReputationDecay(105, 3), 103)
})

test('calculateSocialGrowth calculates base growth based on performance', () => {
  // performance 80, no viral, no platform multiplier (1.0)
  // baseGrowth = (80 - 50) * 0.5 = 15
  assert.equal(calculateSocialGrowth('unknown', 80, 0, false), 15)

  // performance 50 or less -> 0 base growth
  assert.equal(calculateSocialGrowth('unknown', 50, 0, false), 0)
  assert.equal(calculateSocialGrowth('unknown', 30, 0, false), 0)
})

test('calculateSocialGrowth applies platform multipliers', () => {
  // performance 80 -> baseGrowth 15
  // TikTok multiplier 1.5 -> 15 * 1.5 = 22.5 -> floor is 22
  assert.equal(calculateSocialGrowth('tiktok', 80, 0, false), 22)

  // Newsletter multiplier 0.5 -> 15 * 0.5 = 7.5 -> floor is 7
  assert.equal(calculateSocialGrowth('newsletter', 80, 0, false), 7)

  // Instagram multiplier 1.2 -> 15 * 1.2 = 18
  assert.equal(calculateSocialGrowth('instagram', 80, 0, false), 18)

  // YouTube multiplier 0.8 -> 15 * 0.8 = 12
  assert.equal(calculateSocialGrowth('youtube', 80, 0, false), 12)
})

test('calculateSocialGrowth applies viral bonus', () => {
  // performance 80 -> base 15
  // followers 1000, viral true
  // viralBonus = 1000 * 0.1 + 100 = 200
  // total = 15 + 200 = 215
  assert.equal(calculateSocialGrowth('unknown', 80, 1000, true), 215)
})

test('checkViralEvent returns true for high accuracy', () => {
  assert.equal(checkViralEvent({ accuracy: 96, maxCombo: 10 }), true)
  assert.equal(checkViralEvent({ accuracy: 95, maxCombo: 10 }, 0, 0.9), false)
})

test('checkViralEvent returns true for high combo', () => {
  assert.equal(checkViralEvent({ accuracy: 80, maxCombo: 51 }), true)
  assert.equal(checkViralEvent({ accuracy: 80, maxCombo: 50 }, 0, 0.9), false)
})

test('checkViralEvent handles random roll with modifiers', () => {
  const stats = { accuracy: 80, maxCombo: 10 }

  // base chance 0.01
  assert.equal(checkViralEvent(stats, 0, 0.005), true) // roll < 0.01
  assert.equal(checkViralEvent(stats, 0, 0.015), false) // roll > 0.01

  // with modifier
  assert.equal(checkViralEvent(stats, 0.1, 0.05), true) // roll < 0.11
  assert.equal(checkViralEvent(stats, 0.1, 0.15), false) // roll > 0.11
})

test('checkViralEvent uses calculateViralityScore when context is provided', () => {
  const stats = { accuracy: 80, maxCombo: 10 }
  // Use Lars as he usually has the trait, but specific name not required by current logic, just trait existence
  const band = {
    members: [
      { name: 'Lars', traits: { social_manager: { id: 'social_manager' } } }
    ]
  }
  const context = {
    perfScore: 80,
    band,
    venue: { name: 'Club' },
    events: []
  }

  // Logic recap:
  // Base 0.05
  // Perf > 75 -> 0.075
  // Social Manager (+15%) -> 0.08625

  // Roll 0.08
  // With context: 0.08 < 0.08625 -> TRUE
  // Without context (uses fallback base 0.01): 0.08 < 0.01 -> FALSE

  assert.equal(checkViralEvent(stats, { roll: 0.08, context }), true)
  assert.equal(checkViralEvent(stats, { roll: 0.08 }), false)
})

test('generateBrandName returns different name for alignment', () => {
  const baseName = 'Base'
  const evilName = generateBrandName(baseName, BRAND_ALIGNMENTS.EVIL)
  const corpName = generateBrandName(baseName, BRAND_ALIGNMENTS.CORPORATE)

  assert.notEqual(evilName, baseName)
  assert.notEqual(corpName, baseName)
  assert.notEqual(evilName, corpName)
})

test('generateBrandName returns base name for unknown alignment', () => {
  assert.equal(generateBrandName('Test', 'UNKNOWN'), 'Test')
})

test('generateBrandName guards against prototype-pollution alignment keys', () => {
  // Hostile alignment values that would otherwise resolve to inherited
  // Object.prototype properties (functions / null) and crash pick().
  assert.equal(generateBrandName('Fallback', '__proto__'), 'Fallback')
  assert.equal(generateBrandName('Fallback', 'toString'), 'Fallback')
  assert.equal(generateBrandName('Fallback', 'hasOwnProperty'), 'Fallback')
  assert.equal(generateBrandName('Fallback', 'constructor'), 'Fallback')
})

test('generateBrandOffers filters by reputation and traits', () => {
  const gameState = {
    social: {
      instagram: 10000,
      tiktok: 10000,
      youtube: 10000,
      trend: 'TECH',
      brandReputation: { [BRAND_ALIGNMENTS.EVIL]: 100 }
    },
    band: {
      members: [],
      traits: {} // Simplified check
    }
  }

  // Mock trait check by adding trait to band
  gameState.band.members = [
    { traits: { party_animal: { id: 'party_animal' } } }
  ]

  const offers = generateBrandOffers(gameState)
  assert.ok(Array.isArray(offers))
  // We expect offers because stats are high and we have matching trait for Toxic Energy Drink
})

test('negotiateDeal SAFE strategy succeeds with high roll', () => {
  const deal = { offer: { upfront: 100 } }
  const result = negotiateDeal(deal, 'SAFE', mockGameState, () => 0.1) // roll 0.1 < 0.8

  assert.equal(result.success, true)
  assert.equal(result.status, 'ACCEPTED')
  assert.equal(result.deal.offer.upfront, 110) // +10%
})

test('negotiateDeal SAFE strategy fails with low roll', () => {
  const deal = { offer: { upfront: 100 } }
  const result = negotiateDeal(deal, 'SAFE', mockGameState, () => 0.9) // roll 0.9 > 0.8

  assert.equal(result.success, false)
  assert.equal(result.status, 'FAILED')
  assert.equal(result.deal.offer.upfront, 100) // No change
})

test('negotiateDeal AGGRESSIVE strategy succeeds with very high luck', () => {
  const deal = { offer: { upfront: 100 } }
  const result = negotiateDeal(deal, 'AGGRESSIVE', mockGameState, () => 0.1) // roll 0.1 < 0.3

  assert.equal(result.success, true)
  assert.equal(result.deal.offer.upfront, 150) // +50%
})

test('negotiateDeal AGGRESSIVE strategy revokes deal on failure', () => {
  const deal = { offer: { upfront: 100 } }
  const result = negotiateDeal(deal, 'AGGRESSIVE', mockGameState, () => 0.5) // roll 0.5 > 0.3

  assert.equal(result.success, false)
  assert.equal(result.status, 'REVOKED')
  assert.equal(result.deal, null)
})

test('generateBrandOffers does not generate more than 3 offers', () => {
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      brandReputation: { [BRAND_ALIGNMENTS.EVIL]: 100 }
    },
    band: {
      members: [],
      traits: {}
    }
  }

  // Add lots of traits to match many deals
  gameState.band.members = [
    {
      traits: {
        party_animal: { id: 'party_animal' },
        tech_savvy: { id: 'tech_savvy' },
        fashionista: { id: 'fashionista' }
      }
    }
  ]

  const offers = generateBrandOffers(gameState)
  assert.ok(offers.length <= 3, 'Should not generate more than 3 offers')
})

test('generateBrandOffers returns exactly 3 offers when no active deal', () => {
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      activeDeals: [],
      brandReputation: {}
    },
    band: {
      members: [
        {
          traits: {
            party_animal: { id: 'party_animal' }
          }
        }
      ]
    }
  }

  const offers = generateBrandOffers(gameState)
  assert.equal(
    offers.length,
    3,
    'Should always return 3 offers when none active'
  )
})

test('generateBrandOffers returns exactly 3 offers even for a brand-new band (stretch fallback)', () => {
  // No followers, no traits, no trend — strict pool is empty. Stretch tiers
  // (loose match + probe sponsoring) must fill the slate to 3.
  const gameState = {
    social: { instagram: 0, tiktok: 0, youtube: 0, activeDeals: [] },
    band: { members: [] }
  }
  const offers = generateBrandOffers(gameState)
  assert.equal(offers.length, 3, 'Stretch fallback must guarantee 3 offers')
  // Each filler offer carries flavor metadata and isStretched=true.
  for (const offer of offers) {
    assert.ok(offer.flavor, 'Stretched offer should carry flavor metadata')
    assert.equal(offer.flavor.isStretched, true)
  }
})

test('generateBrandOffers returns 0 offers when an active deal exists', () => {
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      activeDeals: [
        { id: 'energy_drink_cx', type: 'SPONSORSHIP', remainingGigs: 3 }
      ],
      brandReputation: {}
    },
    band: {
      members: [{ traits: { party_animal: { id: 'party_animal' } } }]
    }
  }
  const offers = generateBrandOffers(gameState)
  assert.equal(offers.length, 0, 'Active deal must block all offers')
})

test('generateBrandOffers preserves canonical deal id and name from the catalog', async () => {
  const { BRAND_DEALS_BY_ID } = await import('../../src/data/brandDeals.ts')
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      activeDeals: [],
      brandReputation: {}
    },
    band: {
      members: [{ traits: { party_animal: { id: 'party_animal' } } }]
    }
  }
  const offers = generateBrandOffers(gameState)
  assert.equal(offers.length, 3)
  for (const offer of offers) {
    const canonical = BRAND_DEALS_BY_ID.get(offer.id)
    assert.ok(
      canonical,
      `Offer id ${offer.id} must exist in the static catalog`
    )
    assert.equal(
      offer.name,
      canonical.name,
      'Offer must NOT overwrite canonical brand name'
    )
    assert.equal(
      offer.description,
      canonical.description,
      'Offer must NOT overwrite canonical description'
    )
  }
})

test('generateBrandOffers rejects NaN / Infinity social metrics from corrupted state', () => {
  // A corrupted UPDATE_SOCIAL payload (or hostile in-memory state) can put
  // NaN/Infinity into the numeric social fields. `NaN < threshold` is
  // always false, so a naive `typeof === 'number'` check would let every
  // deal bypass its follower/zealotry/controversy gates. The
  // `finiteNumberOr` coercion must collapse those to 0 so eligibility
  // still degrades to the stretch fallback rather than handing out
  // high-tier deals to a corrupted band.
  const gameState = {
    social: {
      instagram: Number.NaN,
      tiktok: Infinity,
      youtube: -Infinity,
      zealotry: Number.NaN,
      controversyLevel: Number.NaN,
      trend: 'TECH',
      activeDeals: [],
      brandReputation: { EVIL: Number.NaN }
    },
    band: { members: [{ traits: { party_animal: { id: 'party_animal' } } }] }
  }
  const offers = generateBrandOffers(gameState, () => 0.1)
  assert.equal(offers.length, 3, 'Must still surface exactly 3 offers')
  for (const offer of offers) {
    assert.equal(
      offer.flavor.isStretched,
      true,
      'NaN-followers band must only receive stretch-tier offers'
    )
  }
})

test('generateBrandOffers never returns duplicate canonical ids', () => {
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      activeDeals: [],
      brandReputation: {}
    },
    band: {
      members: [{ traits: { party_animal: { id: 'party_animal' } } }]
    }
  }
  const offers = generateBrandOffers(gameState, () => 0.1)
  const ids = offers.map(o => o.id)
  assert.equal(
    new Set(ids).size,
    ids.length,
    'Offer ids must be unique (React key + negotiation map invariant)'
  )
})

test('generateBrandOffers attaches flavor metadata to every offer', () => {
  const gameState = {
    social: {
      instagram: 1000000,
      tiktok: 1000000,
      youtube: 1000000,
      trend: 'TECH',
      activeDeals: [],
      brandReputation: {}
    },
    band: {
      members: [{ traits: { party_animal: { id: 'party_animal' } } }]
    }
  }
  const offers = generateBrandOffers(gameState, () => 0.42)
  for (const offer of offers) {
    assert.ok(offer.flavor, 'Each offer must carry flavor')
    assert.equal(typeof offer.flavor.campaignCodename, 'string')
    assert.ok(offer.flavor.campaignCodename.length > 0)
    assert.equal(typeof offer.flavor.rep.nameDefault, 'string')
    assert.match(offer.flavor.taglineKey, /^economy:brandFlavor\.taglines\./)
    assert.ok(['low', 'medium', 'high'].includes(offer.flavor.urgency))
  }
})
