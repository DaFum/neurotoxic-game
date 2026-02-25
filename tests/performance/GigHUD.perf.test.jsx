import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { render, fireEvent, cleanup } from '@testing-library/react'

// Mock HecklerOverlay to avoid animation loops and isolate the test
vi.mock('../../src/components/HecklerOverlay.jsx', () => ({
  HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
}))
afterEach(cleanup)

test('GigHUD: renders lane inputs and handles interactions', async () => {
  const { GigHUD } = await import('../../src/components/GigHUD.jsx')

  const stats = {
    score: 0,
    combo: 0,
    health: 100,
    overload: 0,
    isGameOver: false,
    accuracy: 100,
    isToxicMode: false
  }
  const gameStateRef = { current: { projectiles: [] } }

  const onLaneInput = vi.fn()

  const { getByRole, getAllByRole, rerender } = render(
    <GigHUD
      stats={stats}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
    />
  )

  // Verify 3 lane inputs are rendered
  const laneInputs = getAllByRole('button', { name: /lane/i })
  expect(laneInputs.length).toBe(3)

  // Verify labels
  expect(laneInputs[0].getAttribute('aria-label')).toBe('Guitar lane')
  expect(laneInputs[1].getAttribute('aria-label')).toBe('Drums lane')
  expect(laneInputs[2].getAttribute('aria-label')).toBe('Bass lane')

  // Test MouseDown on first lane (Guitar)
  fireEvent.mouseDown(laneInputs[0])
  expect(onLaneInput).toHaveBeenCalledTimes(1)
  expect(onLaneInput).toHaveBeenLastCalledWith(0, true)

  // Test MouseUp on first lane
  fireEvent.mouseUp(laneInputs[0])
  expect(onLaneInput).toHaveBeenCalledTimes(2)
  expect(onLaneInput).toHaveBeenLastCalledWith(0, false)

  // Test TouchStart on second lane (Drums)
  fireEvent.touchStart(laneInputs[1])
  expect(onLaneInput).toHaveBeenCalledTimes(3)
  expect(onLaneInput).toHaveBeenLastCalledWith(1, true)

  // Test TouchEnd on second lane
  fireEvent.touchEnd(laneInputs[1])
  expect(onLaneInput).toHaveBeenCalledTimes(4)
  expect(onLaneInput).toHaveBeenLastCalledWith(1, false)

  // Re-render with new stats (simulate game loop update)
  const newStats = { ...stats, score: 100 }
  rerender(
    <GigHUD
      stats={newStats}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
    />
  )

  // Verify interactions still work after re-render
  fireEvent.mouseDown(laneInputs[2]) // Bass lane
  expect(onLaneInput).toHaveBeenCalledTimes(5)
  expect(onLaneInput).toHaveBeenLastCalledWith(2, true)
})
