import { afterEach, expect, test, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

// Mock dependencies
vi.mock('../../src/components/HecklerOverlay.jsx', () => ({
  HecklerOverlay: () => <div data-testid='heckler-overlay-mock' />
}))

// Mock sub-components with tracking
// We must wrap mocks in React.memo to simulate the real components behavior,
// otherwise they will re-render on every parent render regardless of props.
const ScoreDisplaySpy = vi.fn(() => <div data-testid='score-display' />)
const ScoreDisplayMock = React.memo(ScoreDisplaySpy)

const HealthBarSpy = vi.fn(() => <div data-testid='health-bar' />)
const HealthBarMock = React.memo(HealthBarSpy)

const ComboDisplaySpy = vi.fn(() => <div data-testid='combo-display' />)
const ComboDisplayMock = React.memo(ComboDisplaySpy)

const OverloadMeterSpy = vi.fn(() => <div data-testid='overload-meter' />)
const OverloadMeterMock = React.memo(OverloadMeterSpy)

const LaneInputAreaSpy = vi.fn(() => <div data-testid='lane-input-area' />)
const LaneInputAreaMock = React.memo(LaneInputAreaSpy)

const ControlsHintSpy = vi.fn(() => <div data-testid='controls-hint' />)
const ControlsHintMock = React.memo(ControlsHintSpy)

const PauseButtonSpy = vi.fn(() => <div data-testid='pause-button' />)
const PauseButtonMock = React.memo(PauseButtonSpy)

const ToxicModeFlashSpy = vi.fn(() => <div data-testid='toxic-mode-flash' />)
const ToxicModeFlashMock = React.memo(ToxicModeFlashSpy)

const GameOverOverlaySpy = vi.fn(() => <div data-testid='game-over-overlay' />)
const GameOverOverlayMock = React.memo(GameOverOverlaySpy)

vi.mock('../../src/components/hud/ScoreDisplay.jsx', () => ({
  ScoreDisplay: ScoreDisplayMock
}))
vi.mock('../../src/components/hud/HealthBar.jsx', () => ({
  HealthBar: HealthBarMock
}))
vi.mock('../../src/components/hud/ComboDisplay.jsx', () => ({
  ComboDisplay: ComboDisplayMock
}))
vi.mock('../../src/components/hud/OverloadMeter.jsx', () => ({
  OverloadMeter: OverloadMeterMock
}))
vi.mock('../../src/components/hud/LaneInputArea.jsx', () => ({
  LaneInputArea: LaneInputAreaMock
}))
vi.mock('../../src/components/hud/ControlsHint.jsx', () => ({
  ControlsHint: ControlsHintMock
}))
vi.mock('../../src/components/hud/PauseButton.jsx', () => ({
  PauseButton: PauseButtonMock
}))
vi.mock('../../src/components/hud/ToxicModeFlash.jsx', () => ({
  ToxicModeFlash: ToxicModeFlashMock
}))
vi.mock('../../src/components/hud/GameOverOverlay.jsx', () => ({
  GameOverOverlay: GameOverOverlayMock
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

test('GigHUD: updates only relevant components when props change', async () => {
  const { GigHUD } = await import('../../src/components/GigHUD.jsx')

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
