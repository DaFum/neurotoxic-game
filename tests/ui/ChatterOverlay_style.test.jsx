import { test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
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

test('ChatterOverlay uses responsive stacking classes', async () => {
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
}, 15000)

test('desktop chatter remains below modal overlays and fixed action chrome', () => {
  const css = readFileSync('src/index.css', 'utf8')

  expect(css).toContain('--z-modal: 100;')
  expect(css).toContain('--z-hud: 50;')
  expect(css).toContain('--z-chatter: 45;')
})
