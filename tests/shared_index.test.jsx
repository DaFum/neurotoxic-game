import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatBox, ProgressBar, Panel } from '../src/ui/shared/index.jsx'

test('StatBox renders with correct label and value', () => {
  render(<StatBox label='Fame' value={100} icon='⭐' />)
  expect(screen.getByText('Fame')).toBeInTheDocument()
  expect(screen.getByText('100')).toBeInTheDocument()
  expect(screen.getByText('⭐')).toBeInTheDocument()
})

test('ProgressBar renders with correct ARIA attributes', () => {
  render(<ProgressBar label='Fuel' value={50} max={100} color='bg-red-500' />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow', '50')
  expect(bar).toHaveAttribute('aria-valuemax', '100')
  expect(bar).toHaveAttribute('aria-label', 'Fuel')
})

test('Panel renders title and children', () => {
  render(
    <Panel title='Test Panel'>
      <div>Panel Content</div>
    </Panel>
  )
  expect(screen.getByText('Test Panel')).toBeInTheDocument()
  expect(screen.getByText('Panel Content')).toBeInTheDocument()
})

test('ProgressBar renders differently when mini', () => {
  render(<ProgressBar value={50} max={100} color='bg-red-500' size="mini" />)
  const bar = screen.getByRole('progressbar')
  // Should not show labels when mini
  expect(screen.queryByText('50/100')).not.toBeInTheDocument()
})

test('ProgressBar handles negative or NaN values gracefully', () => {
  render(<ProgressBar label='Bad' value={NaN} max={-5} color='bg-red-500' />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow', '0')
  expect(bar).toHaveAttribute('aria-valuemax', '1') // Max falls back to 1
})

test('ProgressBar renders with unknown size class', () => {
  render(<ProgressBar value={50} max={100} color='bg-red-500' size="unknown" />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toBeInTheDocument()
})

test('ProgressBar renders with warn prop', () => {
  render(<ProgressBar value={50} max={100} color='bg-red-500' warn={true} />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toBeInTheDocument()
})
