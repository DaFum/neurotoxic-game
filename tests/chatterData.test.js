import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_DEFAULT_SCENES,
  CHATTER_DB,
  getRandomChatter
} from '../src/data/chatter.js'

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

test('getRandomChatter returns null for scenes without default chatter', () => {
  const disallowedScenes = ['GIG', 'SETTINGS', 'CREDITS', 'GAMEOVER']

  disallowedScenes.forEach(scene => {
    assert.strictEqual(ALLOWED_DEFAULT_SCENES.includes(scene), false)

    const state = buildState(scene)
    const activeConditionalEntries = CHATTER_DB.filter(entry =>
      typeof entry.condition === 'function' ? entry.condition(state) : false
    )

    assert.strictEqual(activeConditionalEntries.length, 0)
    assert.strictEqual(getRandomChatter(state), null)
  })
})
