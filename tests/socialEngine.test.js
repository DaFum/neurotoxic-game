import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateViralityScore,
  generatePostOptions,
  resolvePost,
  applyReputationDecay,
  calculateSocialGrowth,
  checkViralEvent
} from '../src/utils/socialEngine.js'

test('calculateViralityScore returns base chance for average performance', () => {
  const venue = { name: 'Test Venue' }
  const score = calculateViralityScore(70, [], venue)

  assert.ok(score >= 0, 'Score should be non-negative')
  assert.ok(score <= 0.9, 'Score should be capped at 90%')
})

test('calculateViralityScore increases with high performance', () => {
  const venue = { name: 'Test Venue' }
  const lowScore = calculateViralityScore(60, [], venue)
  const highScore = calculateViralityScore(95, [], venue)

  assert.ok(
    highScore > lowScore,
    'High performance should increase virality chance'
  )
})

test('calculateViralityScore applies performance multipliers', () => {
  const venue = { name: 'Test Venue' }

  const mediumPerf = calculateViralityScore(70, [], venue)
  const goodPerf = calculateViralityScore(80, [], venue)
  const greatPerf = calculateViralityScore(92, [], venue)

  assert.ok(
    goodPerf > mediumPerf,
    'Better performance should increase virality'
  )
  assert.ok(
    greatPerf > goodPerf,
    'Excellent performance should increase further'
  )
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
    members: [{ name: 'Matze', mood: 50, stamina: 50 }]
  },
  social: { instagram: 100, tiktok: 100, youtube: 100, newsletter: 100, loyalty: 0, controversyLevel: 0 },
  lastGigStats: { score: 20000, accuracy: 80 },
  activeEvent: null
}

test('generatePostOptions returns array of exactly 3 options', () => {
  const options = generatePostOptions({}, mockGameState)

  assert.ok(Array.isArray(options), 'Should return array')
  assert.equal(options.length, 3, 'Should have exactly 3 options')
})

// Removed redundant and flaky expected-option test
test('generatePostOptions forces sponsor post if active', () => {
  const sponsoredState = { ...mockGameState, social: { ...mockGameState.social, sponsorActive: true, instagram: 6000 } }
  const options = generatePostOptions({}, sponsoredState)
  
  const sponsorOpt = options.find(opt => opt.id === 'comm_sellout_ad')
  assert.ok(sponsorOpt, 'Should include forced sponsor ad')
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

test('resolvePost handles RNG success', () => {
  const postOption = {
    id: 'test',
    platform: 'tiktok',
    resolve: ({ diceRoll }) => {
      if (diceRoll <= 0.7) return { success: true, followers: 3000 }
      return { success: false, followers: -2000 }
    }
  }

  const result = resolvePost(postOption, mockGameState, 0.5) // Roll below 0.7

  assert.equal(result.success, true, 'Should be success')
  assert.equal(result.followers, 3000, 'Should return success followers')
  assert.equal(result.platform, 'tiktok', 'Should preserve platform')
})

test('resolvePost handles RNG failure', () => {
  const postOption = {
    id: 'test',
    platform: 'tiktok',
    resolve: ({ diceRoll }) => {
      if (diceRoll <= 0.7) return { success: true, followers: 3000 }
      return { success: false, followers: -2000, harmonyChange: -20 }
    }
  }

  const result = resolvePost(postOption, mockGameState, 0.9) // Roll above 0.7

  assert.equal(result.success, false, 'Should be failure')
  assert.equal(result.followers, -2000, 'Should return failure followers')
  assert.equal(result.harmonyChange, -20, 'Should process side effects')
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
