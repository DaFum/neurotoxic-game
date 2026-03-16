import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { StatsOverlay } from '../src/components/hud/StatsOverlay.jsx'

vi.mock('../src/components/hud/ScoreDisplay', () => ({
  ScoreDisplay: ({ score }) => (
    <div data-testid='score-display'>Score: {score}</div>
  )
}))

vi.mock('../src/components/hud/ComboDisplay', () => ({
  ComboDisplay: ({ combo, accuracy }) => (
    <div data-testid='combo-display'>
      Combo: {combo}, Acc: {accuracy}
    </div>
  )
}))

vi.mock('../src/components/hud/OverloadMeter', () => ({
  OverloadMeter: ({ overload }) => (
    <div data-testid='overload-meter'>Overload: {overload}</div>
  )
}))

vi.mock('../src/ui/shared/Icons', () => ({
  UIFrameCorner: ({ className }) => (
    <div data-testid='ui-frame-corner' className={className} />
  )
}))

test('StatsOverlay renders all child components with correct props', () => {
  const props = {
    score: 12345,
    combo: 42,
    accuracy: 98,
    overload: 15
  }

  render(<StatsOverlay {...props} />)

  const scoreDisplay = screen.getByTestId('score-display')
  expect(scoreDisplay).toHaveTextContent('Score: 12345')

  const comboDisplay = screen.getByTestId('combo-display')
  expect(comboDisplay).toHaveTextContent('Combo: 42, Acc: 98')

  const overloadMeter = screen.getByTestId('overload-meter')
  expect(overloadMeter).toHaveTextContent('Overload: 15')
})

test('StatsOverlay renders four UIFrameCorner icons with correct classes', () => {
  const props = {
    score: 0,
    combo: 0,
    accuracy: 100,
    overload: 0
  }

  render(<StatsOverlay {...props} />)

  const corners = screen.getAllByTestId('ui-frame-corner')
  expect(corners).toHaveLength(4)

  // Verify specific classes for each corner position
  expect(corners[0]).toHaveClass('top-0 left-0')
  expect(corners[1]).toHaveClass('top-0 right-0 rotate-90')
  expect(corners[2]).toHaveClass('bottom-0 right-0 rotate-180')
  expect(corners[3]).toHaveClass('bottom-0 left-0 -rotate-90')

  // Verify common classes
  corners.forEach(corner => {
    expect(corner).toHaveClass('absolute w-4 h-4 text-ash-gray opacity-50')
  })
})
