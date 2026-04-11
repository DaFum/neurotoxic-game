import assert from 'node:assert'
import { test } from 'node:test'

// Set dummy API key for tests
process.env.VITE_POLLINATIONS_API_KEY = 'test_key'

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
    if (key !== '') {
      assert.notEqual(
        key,
        '',
        'Should not include empty query parameter names unless it is the empty key used for nocache'
      )
    }
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

test('fetchGenImage & fetchGenImageAsObjectUrl', async t => {
  const { fetchGenImage, fetchGenImageAsObjectUrl, clearImageCache } =
    await import('../src/utils/imageGen.js')

  const originalFetch = globalThis.fetch
  const originalCreateObjectURL = globalThis.URL?.createObjectURL

  t.afterEach(async () => {
    await clearImageCache()
    globalThis.fetch = originalFetch
    if (globalThis.URL) {
      globalThis.URL.createObjectURL = originalCreateObjectURL
    }
  })

  await t.test(
    'fetchGenImage makes a fetch call with correct URL and headers',
    async () => {
      let fetchArgs = null
      globalThis.fetch = async (...args) => {
        fetchArgs = args
        return { ok: true }
      }

      const description = 'test image prompt'
      await fetchGenImage(description)

      assert.ok(fetchArgs)
      assert.ok(fetchArgs[0].includes(encodeURIComponent(description)))
      assert.ok(fetchArgs[0].includes('model=flux'))
      assert.ok(fetchArgs[0].includes('seed=666'))
      assert.equal(
        fetchArgs[1].headers.Accept,
        'image/jpeg, image/png, video/mp4'
      )
    }
  )

  await t.test(
    'fetchGenImageAsObjectUrl returns blob URL on success',
    async () => {
      globalThis.fetch = async () => ({
        ok: true,
        blob: async () => ({ size: 1024, type: 'image/png' })
      })

      if (!globalThis.URL) globalThis.URL = {}
      globalThis.URL.createObjectURL = blob => `blob:mock-url-${blob.type}`

      const url = await fetchGenImageAsObjectUrl('test')
      assert.strictEqual(url, 'blob:mock-url-image/png')
    }
  )

  await t.test(
    'fetchGenImageAsObjectUrl throws error if response is not ok',
    async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500
      })

      await assert.rejects(
        async () => await fetchGenImageAsObjectUrl('test fail'),
        { message: 'Image fetch failed: 500' }
      )
    }
  )

  await t.test(
    'fetchGenImageAsObjectUrl caches object URLs to avoid redundant requests',
    async () => {
      let fetchCallCount = 0
      globalThis.fetch = async () => {
        fetchCallCount++
        return {
          ok: true,
          blob: async () => ({ size: 1024, type: 'image/png' })
        }
      }

      if (!globalThis.URL) globalThis.URL = {}
      globalThis.URL.createObjectURL = _blob => `blob:mock-url-${Math.random()}`

      const url1 = await fetchGenImageAsObjectUrl('cache test')
      const url2 = await fetchGenImageAsObjectUrl('cache test')
      const url3 = await fetchGenImageAsObjectUrl('another test')

      assert.strictEqual(
        fetchCallCount,
        2,
        'Fetch should be called twice (once for each unique description)'
      )
      assert.strictEqual(url1, url2, 'Cached URLs should be strictly equal')
      assert.notStrictEqual(
        url1,
        url3,
        'Different descriptions should have different URLs'
      )
    }
  )
})
