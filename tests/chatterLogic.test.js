import { test, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mock the data modules before importing the logic
mock.module('../src/data/chatter/standardChatter.js', {
  namedExports: {
    CHATTER_DB: [
      {
        text: 'Standard 1',
        weight: 1,
        condition: state => state.currentScene === 'ALLOWED'
      },
      {
        text: 'Standard 2',
        weight: 9,
        condition: state => state.currentScene === 'ALLOWED'
      }
    ],
    ALLOWED_DEFAULT_SCENES: ['ALLOWED']
  }
})

mock.module('../src/data/chatter/venueChatter.js', {
  namedExports: {
    VENUE_CHATTER_DB: [
      {
        venueId: 'v1',
        linesByScene: {
          ANY: ['Venue Any'],
          SPECIAL: ['Venue Special']
        }
      },
      {
        venueId: 'v_legacy',
        lines: ['Legacy 1', 'Legacy 2']
      }
    ],
    VENUE_CHATTER_LOOKUP: {
      v1: {
        venueId: 'v1',
        linesByScene: {
          ANY: ['Venue Any'],
          SPECIAL: ['Venue Special']
        }
      },
      v_legacy: {
        venueId: 'v_legacy',
        lines: ['Legacy 1', 'Legacy 2']
      }
    }
  }
})

// Now import the function under test
const { getRandomChatter } = await import('../src/data/chatter/index.js')

const buildState = (overrides = {}) => ({
  currentScene: 'ALLOWED',
  player: {
    currentNodeId: 'node1',
    money: 500,
    van: { fuel: 100, condition: 100 }
  },
  band: {
    members: [{ name: 'Matze', mood: 80, stamina: 100 }],
    harmony: 80,
    inventory: {}
  },
  gameMap: {
    nodes: {
      node1: { id: 'node1', type: 'CITY', venue: { id: 'v1' } }
    }
  },
  ...overrides
})

test('getRandomChatter returns null when pool is empty', () => {
  const state = buildState({
    currentScene: 'DISALLOWED',
    gameMap: { nodes: { node1: { id: 'node1', type: 'CITY' } } } // No venue
  })
  const result = getRandomChatter(state)
  assert.strictEqual(result, null)
})

test('getRandomChatter returns venue-specific chatter', t => {
  const state = buildState({
    currentScene: 'SPECIAL',
    gameMap: {
      nodes: {
        node1: { id: 'node1', type: 'CITY', venue: { id: 'v1' } }
      }
    }
  })

  t.mock.method(Math, 'random', () => 0)
  const result = getRandomChatter(state)
  assert.strictEqual(result.text, 'Venue Special')
})

test('getRandomChatter falls back to ANY venue chatter', t => {
  const state = buildState({
    currentScene: 'OTHER',
    gameMap: {
      nodes: {
        node1: { id: 'node1', type: 'CITY', venue: { id: 'v1' } }
      }
    }
  })

  t.mock.method(Math, 'random', () => 0)
  const result = getRandomChatter(state)
  assert.strictEqual(result.text, 'Venue Any')
})

test('getRandomChatter supports legacy lines format', t => {
  const state = buildState({
    currentScene: 'OTHER',
    gameMap: {
      nodes: {
        node1: { id: 'node1', type: 'CITY', venue: { id: 'v_legacy' } }
      }
    }
  })

  t.mock.method(Math, 'random', () => 0)
  const originalCrypto = globalThis.crypto
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...originalCrypto,
      getRandomValues: (arr) => { arr.fill(0) }
    },
    configurable: true
  })
  cryptoUtils.resetSecureRandomBatchForTesting()

  const result = getRandomChatter(state)
  assert.strictEqual(result.text, 'Legacy 1')

  Object.defineProperty(globalThis, 'crypto', {
    value: originalCrypto,
    configurable: true
  })
})

test('getRandomChatter includes standard chatter when conditions met', () => {
  const state = buildState({
    currentScene: 'ALLOWED',
    gameMap: { nodes: { node1: { id: 'node1', type: 'CITY' } } } // No venue
  })

  const result = getRandomChatter(state)
  assert.ok(['Standard 1', 'Standard 2'].includes(result.text))
})

import * as cryptoUtils from '../src/utils/crypto.js'
import { vi } from 'vitest'

test('getRandomChatter implements weighted random selection', async t => {
  const state = buildState({
    currentScene: 'ALLOWED',
    gameMap: { nodes: { node1: { id: 'node1', type: 'CITY' } } } // No venue
  })

  // Pool: Standard 1 (weight 1), Standard 2 (weight 9). Total = 10.

  // mock secureRandom globally using esm mock functionality for test-runner
  t.mock.method(Math, 'random', () => 0.05)

  // It throws "Cannot redefine property: secureRandom" using node test runner because it's an ES module export
  // Instead of redefining, we'll mock crypto.getRandomValues
  const originalCrypto = globalThis.crypto
  const mockGetRandomValues = (arr) => {
    // Fill with values that will result in 0.05 when divided by 4294967296
    arr.fill(Math.floor(0.05 * 4294967296))
  }

  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...originalCrypto,
      getRandomValues: mockGetRandomValues
    },
    configurable: true
  })
  cryptoUtils.resetSecureRandomBatchForTesting()

  let result = getRandomChatter(state)
  assert.strictEqual(result.text, 'Standard 1')

  // Change implementation to return 0.5
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...originalCrypto,
      getRandomValues: (arr) => {
        arr.fill(Math.floor(0.5 * 4294967296))
      }
    },
    configurable: true
  })
  cryptoUtils.resetSecureRandomBatchForTesting()

  result = getRandomChatter(state)
  assert.strictEqual(result.text, 'Standard 2')

  Object.defineProperty(globalThis, 'crypto', {
    value: originalCrypto,
    configurable: true
  })
})
