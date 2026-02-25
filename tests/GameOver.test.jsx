import { describe, expect, test, vi } from 'vitest'
import React, { useEffect } from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
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
    // Mock localStorage to ensure a clean state
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    })
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
    expect(getByText('The tour has ended prematurely.')).toBeInTheDocument()
    expect(getByText('100')).toBeInTheDocument() // Score
    expect(getByText('5')).toBeInTheDocument() // Days
    expect(getByText('50')).toBeInTheDocument() // Fame
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
        expect(getByTestId('scene').textContent).toBe('MENU')
    })
  })
})
