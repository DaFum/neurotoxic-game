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
