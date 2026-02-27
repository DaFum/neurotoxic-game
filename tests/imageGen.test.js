import assert from 'node:assert'
import { test } from 'node:test'

test('getGenImageUrl generates correct Pollinations.ai URL', async () => {
  const { getGenImageUrl } = await import('../src/utils/imageGen.js')

  const prompt = 'dark void aesthetic'
  const urlString = getGenImageUrl(prompt)
  const url = new URL(urlString)

  // Validate URL structure
  assert.equal(
    url.origin + url.pathname,
    'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt)
  )

  // Validate query parameters
  assert.equal(url.searchParams.get('model'), 'flux', 'Should use flux model')
  assert.equal(
    url.searchParams.get('seed'),
    '666',
    'Should use deterministic seed'
  )
  assert.ok(url.searchParams.has('key'), 'Should include key parameter')

  for (const key of url.searchParams.keys()) {
    assert.notEqual(key, '', 'Should not include empty query parameter names')
  }
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
