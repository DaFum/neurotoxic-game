import { test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

// Mock data to prevent network or other issues
vi.mock('../../src/data/chatter', () => ({
  getRandomChatter: () => null,
  CHATTER_DB: [],
  ALLOWED_DEFAULT_SCENES: ['GIG']
}))

vi.mock('../../src/hooks/useChatterLogic', () => ({
  useChatterLogic: () => ({
    messages: [],
    removeMessage: vi.fn()
  })
}))

test('ChatterOverlay stays above chrome on desktop and below touch overlays on mobile', async () => {
  // Use a dynamic import to ensure mocks are applied if needed (though here we mock before import anyway)
  // But for consistency with existing tests:
  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')

  const gameState = {
    currentScene: GAME_PHASES.GIG,
    band: { members: [] },
    player: { currentNodeId: 'none' },
    gameMap: { nodes: {} }
  }

  const { getByRole } = render(<ChatterOverlay gameState={gameState} />)

  const container = getByRole('status')

  expect(container.className).toContain('z-(--z-chatter)')
  expect(container.className).toContain('max-sm:z-(--z-chatter-mobile)')
})
