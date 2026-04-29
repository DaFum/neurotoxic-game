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

test('destroyPixiApp turns queued resize and render callbacks into no-ops before destroy', () => {
  const app = {
    resize() {
      throw new Error('stale Pixi resize touched destroyed stage')
    },
    render() {
      throw new Error('stale Pixi render touched destroyed stage')
    },
    renderer: {
      render() {
        throw new Error('stale renderer render touched destroyed stage')
      }
    },
    destroy() {}
  }

  destroyPixiApp(app, undefined, 'PixiAppTeardownTest')

  assert.doesNotThrow(() => app.resize())
  assert.doesNotThrow(() => app.render())
  assert.doesNotThrow(() => app.renderer.render())
})
