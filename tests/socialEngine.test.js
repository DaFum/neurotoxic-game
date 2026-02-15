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

test('generatePostOptions returns array of options', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  assert.ok(Array.isArray(options), 'Should return array')
  assert.ok(options.length >= 3, 'Should have at least 3 options')
})

test('generatePostOptions includes moshpit option', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  const moshOption = options.find(opt => opt.id === 'clip_mosh')
  assert.ok(moshOption, 'Should include moshpit option')
  assert.equal(moshOption.platform, 'TIKTOK', 'Moshpit should be for TikTok')
  assert.ok(moshOption.viralChance > 0, 'Should have viral chance')
})

test('generatePostOptions includes technical option', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  const techOption = options.find(opt => opt.id === 'clip_tech')
  assert.ok(techOption, 'Should include technical option')
  assert.equal(
    techOption.platform,
    'YOUTUBE',
    'Technical should be for YouTube'
  )
})

test('generatePostOptions includes band pic option', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  const picOption = options.find(opt => opt.id === 'pic_group')
  assert.ok(picOption, 'Should include band pic option')
  assert.equal(
    picOption.platform,
    'INSTAGRAM',
    'Band pic should be for Instagram'
  )
})

test('generatePostOptions scales mosh viral chance', () => {
  const lowVirality = { viralityScore: 0.2 }
  const highVirality = { viralityScore: 0.8 }

  const lowOptions = generatePostOptions(lowVirality)
  const highOptions = generatePostOptions(highVirality)

  const lowMosh = lowOptions.find(opt => opt.id === 'clip_mosh')
  const highMosh = highOptions.find(opt => opt.id === 'clip_mosh')

  assert.ok(
    highMosh.viralChance > lowMosh.viralChance,
    'Higher base virality should increase mosh chance'
  )
})

test('generatePostOptions all have required properties', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  options.forEach(opt => {
    assert.ok(opt.id, 'Option should have id')
    assert.ok(opt.title, 'Option should have title')
    assert.ok(opt.platform, 'Option should have platform')
    assert.ok(opt.description, 'Option should have description')
    assert.ok(
      typeof opt.viralChance === 'number',
      'Option should have viral chance'
    )
    assert.ok(opt.effect, 'Option should have effect')
    assert.ok(opt.effect.platform, 'Effect should specify platform')
  })
})

test('resolvePost handles viral success', () => {
  const postOption = {
    viralChance: 0.8,
    effect: { followers: 50, platform: 'tiktok' }
  }

  const result = resolvePost(postOption, 0.5) // Roll below viral chance

  assert.equal(result.success, true, 'Should be viral success')
  assert.equal(result.followers, 500, 'Viral should multiply followers by 10')
  assert.equal(result.platform, 'tiktok', 'Should preserve platform')
  assert.ok(result.message.includes('VIRAL'), 'Message should mention viral')
})

test('resolvePost handles non-viral post', () => {
  const postOption = {
    viralChance: 0.2,
    effect: { followers: 50, platform: 'instagram' }
  }

  const result = resolvePost(postOption, 0.9) // Roll above viral chance

  assert.equal(result.success, false, 'Should not be viral')
  assert.equal(result.followers, 50, 'Should get base followers')
  assert.equal(result.platform, 'instagram', 'Should preserve platform')
  assert.ok(
    !result.message.includes('VIRAL'),
    'Message should not mention viral'
  )
})

test('resolvePost viral multiplies by 10', () => {
  const postOption = {
    viralChance: 1.0,
    effect: { followers: 20, platform: 'youtube' }
  }

  const result = resolvePost(postOption, 0.0) // Guaranteed viral

  assert.equal(result.followers, 200, 'Viral should multiply by exactly 10')
})

test('resolvePost handles edge case of 0 base followers', () => {
  const postOption = {
    viralChance: 1.0,
    effect: { followers: 0, platform: 'tiktok' }
  }

  const result = resolvePost(postOption, 0.0)

  assert.equal(result.followers, 0, 'Should handle 0 followers gracefully')
})

test('resolvePost threshold at exact viral chance', () => {
  const postOption = {
    viralChance: 0.5,
    effect: { followers: 100, platform: 'instagram' }
  }

  const atThreshold = resolvePost(postOption, 0.5)
  const justBelow = resolvePost(postOption, 0.49)

  assert.equal(atThreshold.success, false, 'At threshold should not be viral')
  assert.equal(justBelow.success, true, 'Just below threshold should be viral')
})

test('resolvePost preserves all platforms', () => {
  const platforms = ['instagram', 'tiktok', 'youtube']

  platforms.forEach(platform => {
    const postOption = {
      viralChance: 0.5,
      effect: { followers: 50, platform }
    }

    const result = resolvePost(postOption, 0.9)
    assert.equal(result.platform, platform, `Should preserve ${platform}`)
  })
})

test('resolvePost returns consistent structure', () => {
  const postOption = {
    viralChance: 0.5,
    effect: { followers: 50, platform: 'tiktok' }
  }

  const result = resolvePost(postOption, 0.3)

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

test('generatePostOptions viral chances are reasonable', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  options.forEach(opt => {
    assert.ok(opt.viralChance >= 0, 'Viral chance should be non-negative')
    assert.ok(opt.viralChance <= 1.0, 'Viral chance should not exceed 100%')
  })
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
