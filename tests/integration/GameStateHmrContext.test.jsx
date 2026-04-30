import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

describe('GameStateProvider hot reload context identity', () => {
  test('keeps old providers compatible with newly imported hooks', async () => {
    vi.resetModules()
    const firstModule = await import('../../src/context/GameState.tsx')
    const StaleProvider = firstModule.GameStateProvider

    vi.resetModules()
    const refreshedModule = await import('../../src/context/GameState.tsx')
    const useRefreshedGameState = refreshedModule.useGameState

    const Probe = () => {
      const { saveGame } = useRefreshedGameState()
      return <div data-testid='hmr-probe'>{typeof saveGame}</div>
    }

    render(
      <StaleProvider>
        <Probe />
      </StaleProvider>
    )

    expect(screen.getByTestId('hmr-probe').textContent).toBe('function')
  })
})
