import test from 'node:test'
import assert from 'node:assert/strict'
import { destroyPixiApp } from '../../src/components/stage/pixiAppTeardown.ts'

test('destroyPixiApp clears inherited resizeTo target before destroy', () => {
  const proto = { resizeTo: { nodeName: 'WINDOW' } }
  const app = Object.create(proto)
  app.destroy = () => {}

  destroyPixiApp(app, undefined, 'PixiAppTeardownTest')

  assert.equal(app.resizeTo, null)
})
