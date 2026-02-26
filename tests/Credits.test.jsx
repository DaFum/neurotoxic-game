import { describe, expect, test } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { GameStateProvider, useGameState } from '../src/context/GameState.jsx'
import { Credits } from '../src/scenes/Credits.jsx'

// A small harness to capture global actions if needed, though Credits just fires changeScene
const CreditsTestHarness = () => {
  const { currentScene } = useGameState()
  return (
    <div>
      <div data-testid='scene'>{currentScene}</div>
      <Credits />
    </div>
  )
}

describe('Credits Scene', () => {
  test('renders credits content', () => {
    const { getByText } = render(
      <GameStateProvider>
        <Credits />
      </GameStateProvider>
    )
    expect(getByText('CREDITS')).toBeInTheDocument()
    expect(getByText('VOCAL CODE VOMIT')).toBeInTheDocument()
  })

  test('calls changeScene("MENU") when RETURN is clicked', async () => {
    const { getByText, getByTestId } = render(
      <GameStateProvider>
        <CreditsTestHarness />
      </GameStateProvider>
    )

    // Initial scene might be OVERWORLD or MENU based on initial state, but let's click RETURN
    const returnBtn = getByText('RETURN')
    fireEvent.click(returnBtn)

    // Check if the scene updated to MENU
    expect(getByTestId('scene').textContent).toBe('MENU')
  })
})
