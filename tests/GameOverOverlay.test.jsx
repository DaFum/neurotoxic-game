import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { GameOverOverlay } from '../src/components/hud/GameOverOverlay.jsx'

test('GameOverOverlay renders nothing when isGameOver is false', () => {
  const { container } = render(<GameOverOverlay isGameOver={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('GameOverOverlay renders overlay when isGameOver is true', () => {
  render(<GameOverOverlay isGameOver={true} />)
  expect(screen.getByText(/ui:game-over.booed-off-stage/i)).toBeInTheDocument()
  expect(screen.getByText(/ui:game-over.crowd-spoken/i)).toBeInTheDocument()
})
