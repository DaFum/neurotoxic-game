import { afterEach, expect, test, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Mock dependencies
vi.mock('../../src/components/HecklerOverlay.jsx', () => ({
  HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
}))

// Create spies with vi.hoisted so they're accessible in vi.mock factories
// (vi.mock factories are hoisted before const declarations, causing TDZ otherwise)
const ScoreDisplaySpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='score-display' {...props}>
      {children}
    </div>
  ))
)
const HealthBarSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='health-bar' {...props}>
      {children}
    </div>
  ))
)
const ComboDisplaySpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='combo-display' {...props}>
      {children}
    </div>
  ))
)
const OverloadMeterSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='overload-meter' {...props}>
      {children}
    </div>
  ))
)
const LaneInputAreaSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='lane-input-area' {...props}>
      {children}
    </div>
  ))
)
const ControlsHintSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='controls-hint' {...props}>
      {children}
    </div>
  ))
)
const PauseButtonSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='pause-button' {...props}>
      {children}
    </div>
  ))
)
const ToxicModeFlashSpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='toxic-mode-flash' {...props}>
      {children}
    </div>
  ))
)
const GameOverOverlaySpy = vi.hoisted(() =>
  vi.fn(({ children, ...props }) => (
    <div data-testid='game-over-overlay' {...props}>
      {children}
    </div>
  ))
)

// Use async factories so we can import React for React.memo wrapping,
// which is needed to simulate the real components' memoization behaviour.
vi.mock('../../src/components/hud/ScoreDisplay.jsx', async () => {
  const { default: React } = await import('react')
  return { ScoreDisplay: React.memo(ScoreDisplaySpy) }
})
vi.mock('../../src/components/hud/HealthBar.jsx', async () => {
  const { default: React } = await import('react')
  return { HealthBar: React.memo(HealthBarSpy) }
})
vi.mock('../../src/components/hud/ComboDisplay.jsx', async () => {
  const { default: React } = await import('react')
  return { ComboDisplay: React.memo(ComboDisplaySpy) }
})
vi.mock('../../src/components/hud/OverloadMeter.jsx', async () => {
  const { default: React } = await import('react')
  return { OverloadMeter: React.memo(OverloadMeterSpy) }
})
vi.mock('../../src/components/hud/LaneInputArea.jsx', async () => {
  const { default: React } = await import('react')
  return { LaneInputArea: React.memo(LaneInputAreaSpy) }
})
vi.mock('../../src/components/hud/ControlsHint.jsx', async () => {
  const { default: React } = await import('react')
  return { ControlsHint: React.memo(ControlsHintSpy) }
})
vi.mock('../../src/components/hud/PauseButton.jsx', async () => {
  const { default: React } = await import('react')
  return { PauseButton: React.memo(PauseButtonSpy) }
})
vi.mock('../../src/components/hud/ToxicModeFlash.jsx', async () => {
  const { default: React } = await import('react')
  return { ToxicModeFlash: React.memo(ToxicModeFlashSpy) }
})
vi.mock('../../src/components/hud/GameOverOverlay.jsx', async () => {
  const { default: React } = await import('react')
  return { GameOverOverlay: React.memo(GameOverOverlaySpy) }
})

import { GigHUD } from '../../src/components/GigHUD.jsx'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

test('GigHUD: updates only relevant components when props change', async () => {
  const initialStats = {
    score: 1000,
    combo: 10,
    health: 50,
    overload: 0,
    isGameOver: false,
    accuracy: 95,
    isToxicMode: false
  }
  const gameStateRef = { current: { projectiles: [] } }
  const onLaneInput = vi.fn()
  const onTogglePause = vi.fn()

  const { rerender } = render(
    <GigHUD
      stats={initialStats}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
      onTogglePause={onTogglePause}
    />
  )

  // Verify initial renders
  expect(ScoreDisplaySpy).toHaveBeenCalledTimes(1)
  expect(HealthBarSpy).toHaveBeenCalledTimes(1)
  expect(ComboDisplaySpy).toHaveBeenCalledTimes(1)

  // Update stats: only Score changes
  const newStatsScore = { ...initialStats, score: 2000 }

  rerender(
    <GigHUD
      stats={newStatsScore}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
      onTogglePause={onTogglePause}
    />
  )

  // ScoreDisplay should re-render
  expect(ScoreDisplaySpy).toHaveBeenCalledTimes(2)
  // HealthBar should NOT re-render (props didn't change)
  expect(HealthBarSpy).toHaveBeenCalledTimes(1)
  // ComboDisplay should NOT re-render (props didn't change)
  expect(ComboDisplaySpy).toHaveBeenCalledTimes(1)

  // Update stats: Health changes
  const newStatsHealth = { ...newStatsScore, health: 40 }

  rerender(
    <GigHUD
      stats={newStatsHealth}
      gameStateRef={gameStateRef}
      onLaneInput={onLaneInput}
      onTogglePause={onTogglePause}
    />
  )

  // ScoreDisplay should NOT re-render (score same as previous render)
  expect(ScoreDisplaySpy).toHaveBeenCalledTimes(2)
  // HealthBar should re-render
  expect(HealthBarSpy).toHaveBeenCalledTimes(2)
})
