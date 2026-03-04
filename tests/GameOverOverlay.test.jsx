import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { GameOverOverlay } from '../src/components/hud/GameOverOverlay.jsx'
import React from 'react'

test('GameOverOverlay renders nothing when isGameOver is false', () => {
  const { container } = render(<GameOverOverlay isGameOver={false} />)
  expect(container).toBeEmptyDOMElement()
})

test('GameOverOverlay renders overlay when isGameOver is true', () => {
  render(<GameOverOverlay isGameOver={true} />)
  expect(screen.getByText('BOOED OFF STAGE')).toBeInTheDocument()
  expect(screen.getByText('THE CROWD HAS SPOKEN')).toBeInTheDocument()
})
