import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { HexBorder } from '../../src/ui/shared/BrutalistUI.tsx'

test('HexBorder renders SVG element correctly with title', () => {
  const { container, getByText } = render(
    <HexBorder className='test-class' title='test-title' />
  )
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
  expect(getByText('test-title')).toBeInTheDocument()
})

test('HexBorder renders SVG element correctly without title', () => {
  const { container } = render(<HexBorder className='test-class' />)
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
})
