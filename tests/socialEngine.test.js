import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateViralityScore, generatePostOptions, resolvePost, SOCIAL_PLATFORMS } from '../src/utils/socialEngine.js'

test('SOCIAL_PLATFORMS contains expected platforms', () => {
  assert.ok(SOCIAL_PLATFORMS.INSTAGRAM, 'Should have Instagram platform')
  assert.ok(SOCIAL_PLATFORMS.TIKTOK, 'Should have TikTok platform')
  assert.ok(SOCIAL_PLATFORMS.YOUTUBE, 'Should have YouTube platform')

  assert.equal(SOCIAL_PLATFORMS.INSTAGRAM.id, 'instagram', 'Instagram ID should be lowercase')
  assert.equal(SOCIAL_PLATFORMS.TIKTOK.id, 'tiktok', 'TikTok ID should be lowercase')
  assert.equal(SOCIAL_PLATFORMS.YOUTUBE.id, 'youtube', 'YouTube ID should be lowercase')
})

test('SOCIAL_PLATFORMS have multipliers', () => {
  assert.ok(SOCIAL_PLATFORMS.INSTAGRAM.multiplier > 0, 'Instagram should have positive multiplier')
  assert.ok(SOCIAL_PLATFORMS.TIKTOK.multiplier > 0, 'TikTok should have positive multiplier')
  assert.ok(SOCIAL_PLATFORMS.YOUTUBE.multiplier > 0, 'YouTube should have positive multiplier')
})

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

  assert.ok(highScore > lowScore, 'High performance should increase virality chance')
})

test('calculateViralityScore applies performance multipliers', () => {
  const venue = { name: 'Test Venue' }

  const mediumPerf = calculateViralityScore(70, [], venue)
  const goodPerf = calculateViralityScore(80, [], venue)
  const greatPerf = calculateViralityScore(92, [], venue)

  assert.ok(goodPerf > mediumPerf, 'Better performance should increase virality')
  assert.ok(greatPerf > goodPerf, 'Excellent performance should increase further')
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
  const withInfluencer = calculateViralityScore(80, ['influencer_spotted'], venue)

  assert.ok(withInfluencer > noEvents, 'Influencer should boost virality')
  assert.ok(withInfluencer > 0.1, 'Influencer should significantly boost virality')
})

test('calculateViralityScore is capped at 90%', () => {
  const venue = { name: 'Kaminstube' }
  const score = calculateViralityScore(100, ['stage_diver', 'influencer_spotted'], venue)

  assert.ok(score <= 0.9, 'Virality should be capped at 90%')
})

test('calculateViralityScore combines multiple bonuses', () => {
  const venue = { name: 'Kaminstube Historic' }
  const score = calculateViralityScore(95, ['stage_diver', 'influencer_spotted'], venue)

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
  assert.equal(techOption.platform, 'YOUTUBE', 'Technical should be for YouTube')
})

test('generatePostOptions includes band pic option', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  const picOption = options.find(opt => opt.id === 'pic_group')
  assert.ok(picOption, 'Should include band pic option')
  assert.equal(picOption.platform, 'INSTAGRAM', 'Band pic should be for Instagram')
})

test('generatePostOptions scales mosh viral chance', () => {
  const lowVirality = { viralityScore: 0.2 }
  const highVirality = { viralityScore: 0.8 }

  const lowOptions = generatePostOptions(lowVirality)
  const highOptions = generatePostOptions(highVirality)

  const lowMosh = lowOptions.find(opt => opt.id === 'clip_mosh')
  const highMosh = highOptions.find(opt => opt.id === 'clip_mosh')

  assert.ok(highMosh.viralChance > lowMosh.viralChance, 'Higher base virality should increase mosh chance')
})

test('generatePostOptions all have required properties', () => {
  const gigResult = { viralityScore: 0.5 }
  const options = generatePostOptions(gigResult)

  options.forEach(opt => {
    assert.ok(opt.id, 'Option should have id')
    assert.ok(opt.title, 'Option should have title')
    assert.ok(opt.platform, 'Option should have platform')
    assert.ok(opt.description, 'Option should have description')
    assert.ok(typeof opt.viralChance === 'number', 'Option should have viral chance')
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
  assert.ok(!result.message.includes('VIRAL'), 'Message should not mention viral')
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
  assert.ok(typeof result.followers === 'number', 'Should have number followers')
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
