import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNamedLazyLoader } from '../src/utils/lazySceneLoader.js'

test('createNamedLazyLoader maps a named export to default', async () => {
  const mockComponent = () => 'scene'
  const loader = createNamedLazyLoader(
    async () => ({ Overworld: mockComponent }),
    'Overworld'
  )

  const loaded = await loader()
  assert.strictEqual(loaded.default, mockComponent)
})

test('createNamedLazyLoader throws a helpful error when export is missing', async () => {
  const loader = createNamedLazyLoader(
    async () => ({ Menu: () => 'scene' }),
    'Overworld'
  )

  await assert.rejects(loader, /Missing export "Overworld" in module/)
})
