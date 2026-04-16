import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ControlsHint } from '../../src/components/hud/ControlsHint.jsx'

test('ControlsHint renders lanes and keys', () => {
  render(<ControlsHint />)
  expect(screen.getByText(/Guitar/i)).toBeInTheDocument()
  expect(screen.getByText(/Drums/i)).toBeInTheDocument()
  expect(screen.getByText(/Bass/i)).toBeInTheDocument()
  expect(screen.getByText('←')).toBeInTheDocument()
  expect(screen.getByText('↓')).toBeInTheDocument()
  expect(screen.getByText('→')).toBeInTheDocument()
})
