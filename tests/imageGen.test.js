import assert from 'node:assert'
import { test } from 'node:test'
import { getGenImageUrl, IMG_PROMPTS } from '../src/utils/imageGen.js'

test('getGenImageUrl generates correct Pollinations.ai URL', () => {
  const prompt = 'dark void aesthetic'
  const url = getGenImageUrl(prompt)

  // Validate URL structure
  assert.ok(url.startsWith('https://gen.pollinations.ai/image/'), 'URL should start with base URL')

  // Validate query parameters
  assert.ok(url.includes('?model=flux'), 'Should use flux model')
  assert.ok(url.includes('&seed=666'), 'Should use deterministic seed')
  assert.ok(url.includes('&key='), 'Should include API key')

  // Validate encoding
  const expectedEncoded = encodeURIComponent(prompt)
  assert.ok(url.includes(expectedEncoded), 'Should contain encoded prompt')
})

test('IMG_PROMPTS contains required keys', () => {
  assert.ok(IMG_PROMPTS.MAIN_MENU_BG, 'Should have MAIN_MENU_BG')
  assert.ok(IMG_PROMPTS.OVERWORLD_MAP, 'Should have OVERWORLD_MAP')
  assert.equal(typeof IMG_PROMPTS.MAIN_MENU_BG, 'string', 'Prompts should be strings')
})
