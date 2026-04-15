import assert from 'node:assert/strict'
import { afterEach, beforeEach, before, after, test, mock } from 'node:test'
import React from 'react'
import { cleanup, render, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockAudioManager,
  createMockGameState,
  setupMainMenuAudioTest
} from './mainMenuAudioTestUtils.js'

const { MainMenu, mockUseGameState } = await setupMainMenuAudioTest()

const flushPromises = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

before(() => {
  setupJSDOM()
})

after(() => {
  teardownJSDOM()
})

beforeEach(() => {
  mockAudioManager.ensureAudioContext.mock.resetCalls()
  mockAudioManager.startAmbient.mock.resetCalls()
  mockUseGameState.mock.mockImplementation(() =>
    createMockGameState({ canLoad: true })
  )

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
})

test('MainMenu starts ambient audio when starting a tour', async () => {
  const { getByRole, queryByRole, queryByPlaceholderText } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  fireEvent.click(getByRole('button', { name: /start tour/i }))

  const confirmBtn = queryByRole('button', { name: /confirm/i })
  if (confirmBtn) {
     const input = queryByPlaceholderText(/enter your name/i) || queryByPlaceholderText(/ui:enter_name_placeholder/i)
     if (input) {
       await user.type(input, 'TestName')
     }
     await user.click(confirmBtn)
  }

  await waitFor(() => {
    assert.equal(mockAudioManager.startAmbient.mock.calls.length, 1)
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })
})

test('MainMenu starts ambient audio when loading a save', async () => {
  const { getByRole } = render(React.createElement(MainMenu))

  fireEvent.click(getByRole('button', { name: /load game/i }))

  await flushPromises()

  assert.equal(mockAudioManager.startAmbient.mock.calls.length, 1)
  assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
})
