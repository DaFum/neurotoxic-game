import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { CrosshairIcon } from '../../src/ui/shared/BrutalistUI.jsx'

test('CrosshairIcon renders SVG element correctly with title', () => {
  const { container, getByText } = render(
    <CrosshairIcon className='test-class' title='crosshair' />
  )
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
  expect(getByText('crosshair')).toBeInTheDocument()
})

test('CrosshairIcon renders SVG element correctly without title', () => {
  const { container } = render(<CrosshairIcon className='test-class' />)
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
})
