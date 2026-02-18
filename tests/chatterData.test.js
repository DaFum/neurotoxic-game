import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getRandomChatter } from '../src/data/chatter.js'

const buildState = scene => ({
  currentScene: scene,
  player: { currentNodeId: 'none' },
  band: { members: [{ name: 'Matze' }] },
  gameMap: { nodes: {} }
})

test('getRandomChatter supports default chatter in all top-level scenes', () => {
  const scenes = ['MENU', 'OVERWORLD', 'PREGIG', 'POSTGIG']

  scenes.forEach(scene => {
    const chatter = getRandomChatter(buildState(scene))
    assert.ok(chatter, `Expected chatter for scene: ${scene}`)
    assert.strictEqual(typeof chatter.text, 'string')
  })
})
