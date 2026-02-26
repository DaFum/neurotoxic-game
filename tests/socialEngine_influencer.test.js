import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePost } from '../src/utils/socialEngine.js'
import { POST_OPTIONS } from '../src/data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../src/data/platforms.js'

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

test('collab_influencer applies relationship discount', () => {
  const state = {
    player: { money: 1000 },
    social: {
      influencers: {
        partner: { tier: 'Micro', score: 50 } // 50 score -> 25% discount off 100 -> 75 cost
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  // Base 100. Discount 50 * 0.5 = 25%. Cost 75.
  assert.equal(result.moneyChange, -75, 'Cost should be discounted to 75')
})

test('collab_influencer caps discount at 50%', () => {
  const state = {
    player: { money: 1000 },
    social: {
      influencers: {
        bestie: { tier: 'Micro', score: 200 } // 200 score -> 100% discount? No, capped at 50%
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  // Base 100. Max discount 50%. Cost 50.
  assert.equal(
    result.moneyChange,
    -50,
    'Cost should be discounted to 50 (max cap)'
  )
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

test('collab_influencer applies trait: tech_savvy', () => {
  const state = {
    player: { money: 1000 },
    social: {
      influencers: {
        techie: { tier: 'Micro', score: 0, trait: 'tech_savvy' }
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  assert.equal(
    result.platform,
    SOCIAL_PLATFORMS.YOUTUBE.id,
    'Should switch platform to YouTube'
  )
  assert.match(result.message, /gear nerds/, 'Should include trait flavor text')
})

test('collab_influencer applies trait: drama_magnet', () => {
  const state = {
    player: { money: 1000 },
    social: {
      influencers: {
        queen: { tier: 'Micro', score: 0, trait: 'drama_magnet' }
      }
    }
  }

  const result = resolvePost(collabOption, state, 0)

  assert.equal(
    result.platform,
    SOCIAL_PLATFORMS.TIKTOK.id,
    'Should switch platform to TikTok'
  )
  assert.equal(result.controversyChange, 20, 'Should increase controversy')
  // Base gain 1000 * 1.5 = 1500
  assert.equal(result.followers, 1500, 'Should boost followers by 1.5x')
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
