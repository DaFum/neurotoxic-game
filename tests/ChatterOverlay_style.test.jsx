import { test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Mock data to prevent network or other issues
vi.mock('../src/data/chatter.js', () => ({
  getRandomChatter: () => null,
  CHATTER_DB: [],
  ALLOWED_DEFAULT_SCENES: ['GIG']
}))

test('ChatterOverlay renders with correct z-index style', async () => {
  // Use a dynamic import to ensure mocks are applied if needed (though here we mock before import anyway)
  // But for consistency with existing tests:
  const { ChatterOverlay } =
    await import('../src/components/ChatterOverlay.jsx')

  const gameState = {
    currentScene: 'GIG',
    band: { members: [] },
    player: { currentNodeId: 'none' },
    gameMap: { nodes: {} }
  }

  const { getByRole } = render(<ChatterOverlay gameState={gameState} />)

  const container = getByRole('status')

  // Verify the style is applied correctly
  expect(container.style.zIndex).toBe('var(--z-chatter)')
})
