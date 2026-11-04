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

const { default: config } = await import('../../vite.config.js')

test('Vite PWA caches only successful same-origin proxy images', () => {
  const route = capturedPwaOptions.workbox.runtimeCaching.find(
    route =>
      typeof route.urlPattern === 'function' &&
      route.urlPattern({
        url: new URL('https://game.example/api/image?prompt=test'),
        sameOrigin: true
      })
  )
  assert.ok(route)
  assert.equal(
    route.urlPattern({
      url: new URL('https://other.example/api/image'),
      sameOrigin: false
    }),
    false
  )
  assert.equal(
    route.urlPattern({
      url: new URL('https://game.example/api/images'),
      sameOrigin: true
    }),
    false
  )
  assert.equal(route.handler, 'CacheFirst')
  assert.equal(route.options.cacheName, 'generated-images-runtime')
  assert.deepEqual(route.options.cacheableResponse.statuses, [200])
  assert.equal(route.options.expiration.maxEntries, 200)
  assert.equal(route.options.expiration.maxAgeSeconds, 30 * 24 * 60 * 60)
  assert.ok(
    capturedPwaOptions.workbox.navigateFallbackDenylist.some(pattern =>
      pattern.test('/api/image?prompt=test')
    )
  )
})

test('Vite never maps the server image credential into client definitions', async () => {
  const resolved =
    typeof config === 'function'
      ? await config({ mode: 'test', command: 'build' })
      : config
  assert.deepEqual([resolved.envPrefix ?? 'VITE_'].flat(), ['VITE_'])
  assert.equal(JSON.stringify(resolved.define ?? {}).includes('FLUX'), false)
  assert.equal(JSON.stringify(resolved.define ?? {}).includes('Flux'), false)
})
