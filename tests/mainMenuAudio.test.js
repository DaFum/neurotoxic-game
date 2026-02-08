import assert from 'node:assert/strict'
import { afterEach, beforeEach, test, mock } from 'node:test'
import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JSDOM } from 'jsdom'

let startAmbientCalls = []
let ensureAudioContextCalls = []
let dom = null
let originalGlobalDescriptors = null

const audioManager = {
  ensureAudioContext: async () => {
    ensureAudioContextCalls.push(true)
  },
  startAmbient: async () => {
    startAmbientCalls.push(true)
  }
}


let gameState = {}

mock.module('../src/utils/AudioManager', {
  namedExports: { audioManager }
})

mock.module('../src/hooks/useAudioControl', {
  namedExports: {
    useAudioControl: () => ({
      audioState: { isMuted: false },
      handleAudioChange: () => {}
    })
  }
})

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => gameState
  }
})

const { MainMenu } = await import('../src/scenes/MainMenu.jsx')

const createGameState = ({ canLoad } = {}) => ({
  changeScene: () => {},
  loadGame: () => Boolean(canLoad),
  addToast: () => {},
  player: { money: 100, currentNodeId: 'node_0_0' },
  updatePlayer: () => {},
  band: { harmony: 3 },
  updateBand: () => {},
  social: {},
  settings: { crtEnabled: false },
  updateSettings: () => {},
  deleteSave: () => {},
  setlist: [],
  setSetlist: () => {},
  resetState: () => {}
})

beforeEach(() => {
  startAmbientCalls = []
  ensureAudioContextCalls = []
  gameState = createGameState({ canLoad: true })

  // Preserve original global descriptors to avoid leaking overrides.
  originalGlobalDescriptors = new Map(
    ['window', 'document', 'navigator'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  )
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost'
  })
  for (const [key, value] of [
    ['window', dom.window],
    ['document', dom.window.document],
    ['navigator', dom.window.navigator]
  ]) {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true
    })
  }
})

afterEach(() => {
  cleanup()
  if (dom) {
    dom.window.close()
  }
  for (const key of ['window', 'document', 'navigator']) {
    const descriptor = originalGlobalDescriptors?.get(key)
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      delete globalThis[key]
    }
  }
  originalGlobalDescriptors = null
  dom = null
})

test('MainMenu starts ambient audio when starting a tour', async () => {
  const { getByRole } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  await user.click(getByRole('button', { name: /start tour/i }))

  await waitFor(() => {
    assert.equal(startAmbientCalls.length, 1)
  })
  assert.equal(ensureAudioContextCalls.length, 1)
})

test('MainMenu starts ambient audio when loading a save', async () => {
  const { getByRole } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  await user.click(getByRole('button', { name: /load game/i }))

  await waitFor(() => {
    assert.equal(startAmbientCalls.length, 1)
  })
  assert.equal(ensureAudioContextCalls.length, 1)
})
