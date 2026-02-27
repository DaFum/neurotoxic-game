import assert from 'node:assert/strict'
import { afterEach, beforeEach, test, mock } from 'node:test'
import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockAudioManager,
  createMockGameState,
  setupMainMenuAudioTest
} from './mainMenuAudioTestUtils.js'

const { MainMenu, mockUseGameState } = await setupMainMenuAudioTest()

beforeEach(() => {
  mockAudioManager.ensureAudioContext.mock.resetCalls()
  mockAudioManager.startAmbient.mock.resetCalls()
  mockUseGameState.mock.mockImplementation(() =>
    createMockGameState({ canLoad: true })
  )

  setupJSDOM()
  globalThis.localStorage = {
    getItem: mock.fn(key => {
      if (key === 'neurotoxic_player_id') return '123'
      if (key === 'neurotoxic_player_name') return 'TestPlayer'
      return null
    }),
    setItem: mock.fn(),
    removeItem: mock.fn()
  }
})

afterEach(() => {
  cleanup()
  teardownJSDOM()
})

test('MainMenu starts ambient audio when starting a tour', async () => {
  const { getByRole } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  await user.click(getByRole('button', { name: /start tour/i }))

  await waitFor(() => {
    assert.equal(mockAudioManager.startAmbient.mock.calls.length, 1)
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })
})

test('MainMenu starts ambient audio when loading a save', async () => {
  const { getByRole } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  await user.click(getByRole('button', { name: /load game/i }))

  await waitFor(() => {
    assert.equal(mockAudioManager.startAmbient.mock.calls.length, 1)
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })
})
