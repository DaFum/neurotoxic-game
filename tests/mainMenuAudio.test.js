import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  mockAudioContextCalls,
  createMockGameState,
  setupMainMenuAudioTest
} from './mainMenuAudioTestUtils.js'

const { MainMenu, mockUseGameState } = await setupMainMenuAudioTest()

beforeEach(() => {
  mockAudioContextCalls.startAmbientCalls.length = 0
  mockAudioContextCalls.ensureAudioContextCalls.length = 0
  mockUseGameState.mock.mockImplementation(() =>
    createMockGameState({ canLoad: true })
  )

  setupJSDOM()
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
    assert.equal(mockAudioContextCalls.startAmbientCalls.length, 1)
  })
  assert.equal(mockAudioContextCalls.ensureAudioContextCalls.length, 1)
})

test('MainMenu starts ambient audio when loading a save', async () => {
  const { getByRole } = render(React.createElement(MainMenu))
  const user = userEvent.setup({ document: globalThis.document })

  await user.click(getByRole('button', { name: /load game/i }))

  await waitFor(() => {
    assert.equal(mockAudioContextCalls.startAmbientCalls.length, 1)
  })
  assert.equal(mockAudioContextCalls.ensureAudioContextCalls.length, 1)
})
