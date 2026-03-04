import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ComboDisplay } from '../src/components/hud/ComboDisplay.jsx'

test('ComboDisplay renders zero combo', () => {
  render(<ComboDisplay combo={0} accuracy={100} />)
  expect(screen.getByText('0x')).toBeInTheDocument()
  expect(screen.getByText('0x').className).toContain('text-(--ash-gray)/50')
  expect(screen.queryByText('LOW ACC')).not.toBeInTheDocument()
})

test('ComboDisplay renders low combo', () => {
  render(<ComboDisplay combo={10} accuracy={100} />)
  expect(screen.getByText('10x')).toBeInTheDocument()
  expect(screen.getByText('10x').className).toContain('text-(--toxic-green)')
})

test('ComboDisplay boundary tests around 20', () => {
  const { rerender } = render(<ComboDisplay combo={19} accuracy={100} />)
  expect(screen.getByText('19x').className).toContain('text-(--toxic-green)')

  rerender(<ComboDisplay combo={20} accuracy={100} />)
  expect(screen.getByText('20x').className).toContain('text-(--warning-yellow)')

  rerender(<ComboDisplay combo={21} accuracy={100} />)
  expect(screen.getByText('21x').className).toContain('text-(--warning-yellow)')
})

test('ComboDisplay boundary tests around 50', () => {
  const { rerender } = render(<ComboDisplay combo={49} accuracy={100} />)
  expect(screen.getByText('49x').className).toContain('text-(--warning-yellow)')

  rerender(<ComboDisplay combo={50} accuracy={100} />)
  expect(screen.getByText('50x').className).toContain('text-(--blood-red)')
  expect(screen.getByText('50x').className).toContain('animate-pulse')

  rerender(<ComboDisplay combo={51} accuracy={100} />)
  expect(screen.getByText('51x').className).toContain('text-(--blood-red)')
  expect(screen.getByText('51x').className).toContain('animate-pulse')
})

test('ComboDisplay LOW ACC threshold boundary tests around 70', () => {
  const { rerender } = render(<ComboDisplay combo={10} accuracy={71} />)
  expect(screen.queryByText('LOW ACC')).not.toBeInTheDocument()

  rerender(<ComboDisplay combo={10} accuracy={70} />)
  expect(screen.queryByText('LOW ACC')).not.toBeInTheDocument()

  rerender(<ComboDisplay combo={10} accuracy={69} />)
  expect(screen.getByText('LOW ACC')).toBeInTheDocument()
})
