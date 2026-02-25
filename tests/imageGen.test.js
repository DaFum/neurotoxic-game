import assert from 'node:assert'
import { test } from 'node:test'

test('getGenImageUrl generates correct Pollinations.ai URL', async () => {
  // Mock environment variable
  globalThis.__IMPORT_META_ENV__ = { VITE_POLLINATIONS_KEY: 'test-key' }

  const { getGenImageUrl } = await import('../src/utils/imageGen.js')

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
  assert.ok(url.includes('&key=test-key'), 'Should include configured API key')
  assert.ok(!url.includes('&='), 'Should not have trailing &=')

  // Validate encoding
  const expectedEncoded = encodeURIComponent(prompt)
  assert.ok(url.includes(expectedEncoded), 'Should contain encoded prompt')
})

test('IMG_PROMPTS contains expected keys and string values', async () => {
  const { IMG_PROMPTS } = await import('../src/utils/imageGen.js')

  const expectedKeys = [
    'MAIN_MENU_BG',
    'OVERWORLD_MAP',
    'POST_GIG_BG',
    'MATZE_IDLE',
    'MARIUS_IDLE', // Renamed from Marius_IDLE
    'LARS_IDLE', // Renamed from Lars_IDLE
    'EVENT_GIG',
    'ITEM_HQ_SKULL'
  ]

  for (const key of expectedKeys) {
    assert.ok(IMG_PROMPTS[key], `Should have ${key}`)
    assert.equal(typeof IMG_PROMPTS[key], 'string', `${key} should be a string`)
  }
})
