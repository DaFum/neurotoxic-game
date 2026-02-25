import assert from 'node:assert'
import { test } from 'node:test'
import { getGenImageUrl, IMG_PROMPTS } from '../src/utils/imageGen.js'

test('getGenImageUrl generates correct Pollinations.ai URL', () => {
  const prompt = 'dark void aesthetic'
  const url = getGenImageUrl(prompt)

  // Validate URL structure
  assert.ok(
    url.startsWith('https://gen.pollinations.ai/image/'),
    'URL should start with base URL'
  )

  // Validate query parameters
  assert.ok(url.includes('?model=flux'), 'Should use flux model')
  assert.ok(url.includes('&seed=666'), 'Should use deterministic seed')
  assert.ok(url.includes('&key='), 'Should include API key')

  // Validate encoding
  const expectedEncoded = encodeURIComponent(prompt)
  assert.ok(url.includes(expectedEncoded), 'Should contain encoded prompt')
})

test('IMG_PROMPTS contains expected keys and string values', () => {
  const expectedKeys = [
    'MAIN_MENU_BG',
    'OVERWORLD_MAP',
    'POST_GIG_BG',
    'MATZE_IDLE',
    'Marius_IDLE',
    'Lars_IDLE',
    'EVENT_GIG',
    'ITEM_HQ_SKULL'
  ]

  for (const key of expectedKeys) {
    assert.ok(IMG_PROMPTS[key], `Should have ${key}`)
    assert.equal(typeof IMG_PROMPTS[key], 'string', `${key} should be a string`)
  }
})
