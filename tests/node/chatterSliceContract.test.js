import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getRandomChatter } from '../../src/data/chatter/index.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'

// Companion to tests/ui/ChatterOverlay.test.jsx: the UI test only checks which
// slices ChatterOverlay hands over; this runs the real chatter DB on them.
const buildChatterState = () => ({
  currentScene: GAME_PHASES.OVERWORLD,
  band: { members: [], harmony: 20, luck: 4, inventory: { strings: false } },
  player: {
    currentNodeId: 'none',
    money: 50,
    day: 1,
    van: { fuel: 10, condition: 90 }
  },
  gameMap: { nodes: {}, connections: [] },
  social: {},
  lastGigStats: null,
  gigModifiers: {}
})

test('real getRandomChatter does not throw on full player and band slices', () => {
  assert.doesNotThrow(() => getRandomChatter(buildChatterState()))
})

test('real getRandomChatter throws on the narrowed slices ChatterOverlay used to pass', () => {
  const state = {
    ...buildChatterState(),
    player: { currentNodeId: 'none' },
    band: { members: [] }
  }
  assert.throws(() => getRandomChatter(state), TypeError)
})
