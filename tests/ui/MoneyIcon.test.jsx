import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MoneyIcon } from '../../src/ui/shared/BrutalistUI.tsx'

test('MoneyIcon renders SVG element correctly with title', () => {
  const { container, getByText } = render(
    <MoneyIcon className='test-class' title='money' />
  )
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
  expect(getByText('money')).toBeInTheDocument()
})

test('MoneyIcon renders SVG element correctly without title', () => {
  const { container } = render(<MoneyIcon className='test-class' />)
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg).toHaveClass('test-class')
})
