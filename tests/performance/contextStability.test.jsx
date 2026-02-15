/* eslint-env node */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act, render } from '@testing-library/react'
import { useEffect } from 'react'

// Setup JSDOM global environment
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost'
})
global.window = dom.window
global.document = dom.window.document

// Handle navigator
Object.defineProperty(global, 'navigator', {
  value: dom.window.navigator,
  writable: true,
  configurable: true
})

global.HTMLElement = dom.window.HTMLElement

// Mock localStorage
const localStorageMock = (function () {
  let store = {}
  return {
    getItem: function (key) {
      return store[key] || null
    },
    setItem: function (key, value) {
      store[key] = value.toString()
    },
    clear: function () {
      store = {}
    },
    removeItem: function (key) {
      delete store[key]
    }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
global.localStorage = localStorageMock // Add to global

// Mock AudioContext to prevent Tone.js initialization errors during import/render
global.window.AudioContext = class {
  constructor() {
    this.state = 'suspended'
  }
  createGain() {
    return { connect: () => {}, gain: { value: 1 } }
  }
  createOscillator() {
    return { connect: () => {}, start: () => {}, stop: () => {} }
  }
  destination = {}
}

test('GameState context functions stability', async _t => {
  // Dynamic import to ensure globals are set
  const { GameStateProvider, useGameState } =
    await import('../../src/context/GameState.jsx')

  let renderCount = 0
  let changeSceneRef = null

  const Consumer = () => {
    const { changeScene, updatePlayer, player } = useGameState()
    renderCount++

    // Store references to check stability
    useEffect(() => {
      changeSceneRef = changeScene
    })

    return (
      <div>
        <button
          onClick={() => updatePlayer({ money: (player.money || 0) + 10 })}
        >
          Update
        </button>
        <span data-testid='money'>{player.money}</span>
      </div>
    )
  }

  const { getByText } = render(
    <GameStateProvider>
      <Consumer />
    </GameStateProvider>
  )

  // Wait for initial effects to settle (map generation)
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })

  const initialRenderCount = renderCount
  const initialChangeScene = changeSceneRef

  // Trigger update
  await act(async () => {
    getByText('Update').click()
  })

  // Should have re-rendered
  assert.ok(
    renderCount > initialRenderCount,
    'Should verify re-render occurred'
  )

  if (changeSceneRef === initialChangeScene) {
    console.log('Success: changeScene is STABLE!')
  } else {
    console.log('Failure: changeScene changed reference')
  }

  // Verification: Stable
  assert.strictEqual(
    changeSceneRef,
    initialChangeScene,
    'changeScene function reference should be stable after optimization'
  )
})
