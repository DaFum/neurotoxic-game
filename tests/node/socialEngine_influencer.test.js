import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePost } from '../../src/utils/socialEngine.js'
import { POST_OPTIONS } from '../../src/data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../../src/data/platforms.js'

const collabOption = POST_OPTIONS.find(o => o.id === 'collab_influencer')

test('collab_influencer option exists', () => {
  assert.ok(collabOption, 'collab_influencer option should exist')
})

test('collab_influencer selects affordable influencer (Micro)', () => {
  const state = {
    player: { money: 150 }, // Can afford Micro (100) but not Macro (300)
    social: {
      influencers: {
        micro: { tier: 'Micro', score: 0 },
        macro: { tier: 'Macro', score: 0 }
      }
    }
  }

  // Force random to pick 2nd element (index 1) which is macro if filtered list included it,
  // but if filtered correctly, should only include micro.
  // Actually random logic is: affordableIds[floor(roll * length)]
  // affordableIds should be ['micro']
  // roll 0 -> index 0

  const result = resolvePost(collabOption, state, 0)

  assert.equal(result.success, true)
  assert.ok(result.message.includes('micro'), 'Should select micro influencer')
  assert.equal(result.moneyChange, -100, 'Cost should be 100')
})

test('collab_influencer fails if no affordable influencer', () => {
  const state = {
    player: { money: 50 }, // Can't afford Micro (100)
    social: {
      influencers: {
        micro: { tier: 'Micro', score: 0 }
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  assert.equal(result.success, false)
  assert.match(
    result.message,
    /cannot afford/,
    'Should return affordability error'
  )
})

// Parametrized: discount application tests
const discountVariants = [
  {
    label: 'applies relationship discount [score=50 → 25% off]',
    influencerId: 'partner',
    influencer: { tier: 'Micro', score: 50 },
    expectedCost: -75
  },
  {
    label: 'caps discount at 50% [score=200 → max 50% off]',
    influencerId: 'bestie',
    influencer: { tier: 'Micro', score: 200 },
    expectedCost: -50
  }
]

discountVariants.forEach(variant => {
  test(`collab_influencer ${variant.label}`, () => {
    const state = {
      player: { money: 1000 },
      social: {
        influencers: {
          [variant.influencerId]: variant.influencer
        }
      }
    }

    const result = resolvePost(collabOption, state, 0)

    assert.equal(
      result.moneyChange,
      variant.expectedCost,
      `Cost should be ${Math.abs(variant.expectedCost)}`
    )
  })
})

test('collab_influencer returns influencerUpdate', () => {
  const state = {
    player: { money: 1000 },
    social: {
      influencers: {
        test: { tier: 'Micro', score: 0 }
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  assert.deepEqual(
    result.influencerUpdate,
    { id: 'test', scoreChange: 10 },
    'Should return score update'
  )
})

// Parametrized: trait effects tests
const traitVariants = [
  {
    label: 'applies trait: tech_savvy',
    influencerId: 'techie',
    influencer: { tier: 'Micro', score: 0, trait: 'tech_savvy' },
    expectedPlatform: SOCIAL_PLATFORMS.YOUTUBE.id,
    expectedMessageMatch: /gear nerds/
  },
  {
    label: 'applies trait: drama_magnet',
    influencerId: 'queen',
    influencer: { tier: 'Micro', score: 0, trait: 'drama_magnet' },
    expectedPlatform: SOCIAL_PLATFORMS.TIKTOK.id,
    expectedControversy: 20,
    expectedFollowers: 1500
  }
]

traitVariants.forEach(variant => {
  test(`collab_influencer ${variant.label}`, () => {
    const state = {
      player: { money: 1000 },
      social: {
        influencers: {
          [variant.influencerId]: variant.influencer
        }
      }
    }

    const result = resolvePost(collabOption, state, 0)

    assert.equal(
      result.platform,
      variant.expectedPlatform,
      `Should switch to ${variant.expectedPlatform}`
    )
    if (variant.expectedMessageMatch) {
      assert.match(
        result.message,
        variant.expectedMessageMatch,
        'Should include trait flavor text'
      )
    }
    if (variant.expectedControversy !== undefined) {
      assert.equal(
        result.controversyChange,
        variant.expectedControversy,
        'Should increase controversy'
      )
    }
    if (variant.expectedFollowers !== undefined) {
      assert.equal(
        result.followers,
        variant.expectedFollowers,
        'Should boost followers by 1.5x'
      )
    }
  })
})

test('collab_influencer ignores invalid influencer entries', () => {
  const state = {
    player: { money: 500 },
    social: {
      influencers: {
        broken: null,
        macro: { tier: 'Macro', score: 0 }
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  assert.equal(result.success, true)
  assert.ok(
    result.message.includes('macro'),
    'Should skip null influencer entries'
  )
  assert.equal(
    result.moneyChange,
    -300,
    'Should charge the valid influencer cost'
  )
})

test('collab_influencer tier followers', () => {
  const state = {
    player: { money: 2000 },
    social: {
      influencers: {
        macro: { tier: 'Macro', score: 0 },
        mega: { tier: 'Mega', score: 0 }
      }
    }
  }

  // Check Macro
  // Wait, let's isolate
  const stateMacro = {
    ...state,
    social: { influencers: { macro: { tier: 'Macro', score: 0 } } }
  }
  const result1 = resolvePost(collabOption, stateMacro, 0)
  assert.equal(result1.followers, 3000, 'Macro should give 3000 followers')

  const stateMega = {
    ...state,
    social: { influencers: { mega: { tier: 'Mega', score: 0 } } }
  }
  const result2 = resolvePost(collabOption, stateMega, 0)
  assert.equal(result2.followers, 10000, 'Mega should give 10000 followers')
})
