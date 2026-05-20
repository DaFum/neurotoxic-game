import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let capturedPwaOptions

mock.module('@vitejs/plugin-react', {
  defaultExport: () => [{ name: 'mock-react' }]
})

mock.module('vite-plugin-compression', {
  defaultExport: () => ({ name: 'mock-compression' })
})

mock.module('vite-plugin-pwa', {
  namedExports: {
    VitePWA: options => {
      capturedPwaOptions = options
      return [{ name: 'mock-pwa' }]
    }
  }
})

await import('../../vite.config.js')

test('Vite PWA config caches generated Pollinations images at runtime', () => {
  const pollinationsRoute = capturedPwaOptions.workbox.runtimeCaching.find(
    route =>
      route.urlPattern.test(
        'https://gen.pollinations.ai/image/pixel-art?model=flux&seed=666'
      )
  )

  assert.ok(pollinationsRoute)
  assert.equal(pollinationsRoute.handler, 'CacheFirst')
  assert.equal(pollinationsRoute.options.cacheName, 'generated-images-runtime')
  assert.deepEqual(
    pollinationsRoute.options.cacheableResponse.statuses,
    [0, 200]
  )
  assert.equal(pollinationsRoute.options.expiration.maxEntries, 120)
  assert.equal(
    pollinationsRoute.options.expiration.maxAgeSeconds,
    30 * 24 * 60 * 60
  )
})
