import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions
} from '../../src/context/GameState.tsx'

const Probe = () => {
  const { endGig, saveGame, loadGame } = useGameActions()

  return (
    <div data-testid='provider-probe'>
      {`${typeof endGig}|${typeof saveGame}|${typeof loadGame}`}
    </div>
  )
}

describe('GameStateProvider smoke', () => {
  test('renders provider context actions without initialization crashes', () => {
    render(
      <GameStateProvider>
        <Probe />
      </GameStateProvider>
    )

    expect(screen.getByTestId('provider-probe').textContent).toBe(
      'function|function|function'
    )
  })
})
