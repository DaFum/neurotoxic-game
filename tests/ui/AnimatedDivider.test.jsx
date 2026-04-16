import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AnimatedDivider } from '../../src/ui/shared/AnimatedTypography.tsx'

test('AnimatedDivider renders with default props', () => {
  const { container } = render(<AnimatedDivider />)
  const div = container.querySelector('div')
  expect(div).toBeInTheDocument()
  expect(div.className).toContain('h-[2px]')
})

test('AnimatedDivider renders with custom width and class', () => {
  const { container } = render(
    <AnimatedDivider width='50%' className='custom-divider' />
  )
  const div = container.querySelector('div')
  expect(div).toBeInTheDocument()
  expect(div.className).toContain('custom-divider')
})
