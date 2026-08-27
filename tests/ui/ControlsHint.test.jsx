import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ControlsHint } from '../../src/components/hud/ControlsHint.tsx'

test('ControlsHint renders lanes and keys', () => {
  render(<ControlsHint />)
  expect(screen.getByText(/Guitar/i)).toBeInTheDocument()
  expect(screen.getByText(/Drums/i)).toBeInTheDocument()
  expect(screen.getByText(/Bass/i)).toBeInTheDocument()
  expect(screen.getByText('←')).toBeInTheDocument()
  expect(screen.getByText('↓')).toBeInTheDocument()
  expect(screen.getByText('→')).toBeInTheDocument()
})

test('ControlsHint yields to the toxic-mode warning', () => {
  // Below the hit line there are only ~38px, filled by this hint row and the
  // crowd-energy strip. Toxic mode adds a warning row to that strip, which
  // would otherwise paint over this one.
  const { container } = render(<ControlsHint isToxicMode={true} />)
  expect(container).toBeEmptyDOMElement()
  expect(screen.queryByText(/Guitar/i)).toBeNull()
})
