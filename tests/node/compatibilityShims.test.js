import test from 'node:test'
import assert from 'node:assert/strict'

test('stage utils shim forwards stageRenderUtils exports', async () => {
  const shim = await import('../../src/components/stage/utils')
  const canonical = await import('../../src/components/stage/stageRenderUtils')
  assert.strictEqual(
    shim.getPixiColorFromToken,
    canonical.getPixiColorFromToken
  )
})

test('minigame constants shim forwards canonical exports', async () => {
  const shim = await import('../../src/hooks/minigames/constants')
  const canonical = await import('../../src/hooks/minigames/minigameConstants')
  assert.strictEqual(shim.ROADIE_GRID_WIDTH, canonical.ROADIE_GRID_WIDTH)
})

test('kabelsalat constants shim forwards canonical exports', async () => {
  const shim = await import('../../src/scenes/kabelsalat/constants')
  const canonical =
    await import('../../src/scenes/kabelsalat/kabelsalatConstants')
  assert.strictEqual(shim.SOCKET_Y, canonical.SOCKET_Y)
})

test('kabelsalat utils shim forwards canonical exports', async () => {
  const shim = await import('../../src/scenes/kabelsalat/utils')
  const canonical = await import('../../src/scenes/kabelsalat/kabelsalatUtils')
  assert.strictEqual(shim.getMessyPath, canonical.getMessyPath)
})
