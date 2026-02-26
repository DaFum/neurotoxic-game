import test from 'node:test'
import assert from 'node:assert/strict'
import { generatePostOptions, resolvePost } from '../src/utils/socialEngine.js'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'
import { POST_OPTIONS } from '../src/data/postOptions.js'

// Helper to generate a highly randomized game state
const createRandomGameState = () => ({
  player: {
    money: Math.floor(Math.random() * 10000) - 500, // Sometimes negative
    day: Math.floor(Math.random() * 365),
    hqUpgrades:
      Math.random() > 0.5 ? ['hq_room_coffee', 'hq_room_cheap_beer_fridge'] : []
  },
  band: {
    harmony: Math.floor(Math.random() * 120) - 10, // Test out of bounds bounds
    members: [
      {
        name: 'Matze',
        mood: Math.floor(Math.random() * 100),
        stamina: Math.floor(Math.random() * 100)
      },
      {
        name: 'Marius',
        mood: Math.floor(Math.random() * 100),
        stamina: Math.floor(Math.random() * 100)
      },
      {
        name: 'Lars',
        mood: Math.floor(Math.random() * 100),
        stamina: Math.floor(Math.random() * 100)
      }
    ]
  },
  social: {
    instagram: Math.floor(Math.random() * 15000),
    tiktok: Math.floor(Math.random() * 15000),
    youtube: Math.floor(Math.random() * 15000),
    newsletter: Math.floor(Math.random() * 5000),
    loyalty: Math.floor(Math.random() * 100),
    controversyLevel: Math.floor(Math.random() * 150),
    egoFocus: Math.random() > 0.8 ? 'Matze' : null,
    sponsorActive: Math.random() > 0.9,
    viral: Math.floor(Math.random() * 3)
  },
  lastGigStats: {
    score: Math.floor(Math.random() * 40000),
    accuracy: Math.floor(Math.random() * 100),
    events: Math.random() > 0.5 ? ['stage_diver', 'influencer_spotted'] : []
  },
  gigEvents: Math.random() > 0.5 ? ['stage_diver', 'influencer_spotted'] : [],
  activeEvent:
    Math.random() > 0.8
      ? { id: 'van_breakdown', type: 'negative_travel' }
      : null
})

test('Stress Test: generatePostOptions over 10,000 random states', () => {
  for (let i = 0; i < 10000; i++) {
    const gameState = createRandomGameState()
    const options = generatePostOptions({}, gameState)

    // 1. Must never crash
    // 2. Must consistently return 3 options (even if pool is tight)
    assert.equal(
      options.length,
      3,
      `Expected 3 options, got ${options.length} on iteration ${i}`
    )

    // 3. Must not mutate options in a way that breaks them
    options.forEach(opt => {
      assert.ok(opt.id, 'Option id missing')
      assert.ok(typeof opt.platform === 'string', 'Platform missing')
    })
  }
})

test('Stress Test: resolvePost over 10,000 random selections and RNG rolls', () => {
  for (let i = 0; i < 10000; i++) {
    const gameState = createRandomGameState()
    // Pick a random post option from the full dictionary to resolve
    const postOption =
      POST_OPTIONS[Math.floor(Math.random() * POST_OPTIONS.length)]

    const result = resolvePost(postOption, gameState, Math.random())

    assert.ok(typeof result.success === 'boolean')
    assert.ok(typeof result.followers === 'number')
    assert.ok(!isNaN(result.followers), 'Followers is NaN')

    if (result.moneyChange !== undefined) assert.ok(!isNaN(result.moneyChange))
    if (result.harmonyChange !== undefined)
      assert.ok(!isNaN(result.harmonyChange))
    if (result.controversyChange !== undefined)
      assert.ok(!isNaN(result.controversyChange))
    if (result.loyaltyChange !== undefined)
      assert.ok(!isNaN(result.loyaltyChange))
  }
})

test('Stress Test: calculateDailyUpdates over 10,000 random states', () => {
  for (let i = 0; i < 10000; i++) {
    const gameState = createRandomGameState()
    const nextState = calculateDailyUpdates(gameState, Math.random)

    // Verify critical bounds
    assert.ok(
      nextState.band.harmony >= 1 && nextState.band.harmony <= 100,
      `Harmony out of bounds: ${nextState.band.harmony}`
    )
    assert.ok(!isNaN(nextState.player.money), 'Money is NaN')
    assert.ok(
      nextState.player.money >= 0,
      `Money dropped below zero: ${nextState.player.money}`
    )

    nextState.band.members.forEach(m => {
      assert.ok(
        m.mood >= 0 && m.mood <= 100,
        `Mood out of bounds for ${m.name}: ${m.mood}`
      )
      assert.ok(
        m.stamina >= 0 && m.stamina <= 100,
        `Stamina out of bounds for ${m.name}: ${m.stamina}`
      )
    })

    assert.ok(!isNaN(nextState.social.controversyLevel), 'Controversy is NaN')
    assert.ok(nextState.social.controversyLevel >= 0, 'Controversy below 0')
  }
})
