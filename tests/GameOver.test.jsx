import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import React, { useEffect } from 'react'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { GameStateProvider, useGameState } from '../src/context/GameState.jsx'
import { GameOver } from '../src/scenes/GameOver.jsx'

// Intercepts the game state to set up conditions for the GameOver screen
const GameOverTestHarness = ({ children }) => {
  const { updatePlayer, player, currentScene } = useGameState()
  
  useEffect(() => {
    if (player.score !== 100) {
      updatePlayer({ score: 100, day: 5, fame: 50, totalTravels: 2 })
    }
  }, [player.score, updatePlayer])

  if (player.score !== 100) return <div>Setting up state...</div>
  
  return (
    <div>
      <div data-testid="scene">{currentScene}</div>
      {children}
    </div>
  )
}

describe('GameOver Scene', () => {
  beforeEach(() => {
    setupJSDOM()
    // Mock localStorage to ensure a clean state
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('renders game over stats correctly with context', async () => {
    const { getByText, findByText } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )
    
    await findByText('SOLD OUT')
    assert.ok(getByText('The tour has ended prematurely.'))
    assert.ok(getByText('100')) // Score
    assert.ok(getByText('5')) // Days
    assert.ok(getByText('50')) // Fame
  })

  test('handles RETURN TO MENU', async () => {
    const { getByText, findByText, getByTestId } = render(
      <GameStateProvider>
        <GameOverTestHarness>
          <GameOver />
        </GameOverTestHarness>
      </GameStateProvider>
    )
    
    await findByText('RETURN TO MENU')
    const returnBtn = getByText('RETURN TO MENU')
    fireEvent.click(returnBtn)
    
    // We expect the scene to change to MENU
    await waitFor(() => {
        assert.equal(getByTestId('scene').textContent, 'MENU')
    })
  })
})
