import { test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { GAME_PHASES } from '../../src/context/gameConstants'

const readZIndexToken = (css, token) => {
  const match = css.match(new RegExp(`--z-${token}:\\s*(\\d+);`))

  expect(match, `Missing --z-${token}`).not.toBeNull()

  return Number(match[1])
}

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
  vi.doMock('../../src/context/GameState', () => ({
    useGameSelector: vi.fn((selector) => selector({
      currentScene: GAME_PHASES.GIG,
      band: { members: [] },
      player: { currentNodeId: 'none' },
      gameMap: { nodes: {} },
      social: {},
      lastGigStats: null,
      gigModifiers: null
    }))
  }))

  const { ChatterOverlay } =
    await import('../../src/components/ChatterOverlay.tsx')

  const { getByRole } = render(
    <ChatterOverlay />
  )

  const container = getByRole('status')

  expect(container.className).toContain('z-(--z-chatter)')
  expect(container.className).toContain('max-sm:z-(--z-chatter-mobile)')
}, 15000)

test('desktop chatter stays above opaque scene roots and below modal overlays', () => {
  const css = readFileSync('src/index.css', 'utf8')
  const chatterZ = readZIndexToken(css, 'chatter')
  const modalZ = readZIndexToken(css, 'modal')

  expect(chatterZ).toBeGreaterThan(50)
  expect(chatterZ).toBeLessThan(modalZ)
})
