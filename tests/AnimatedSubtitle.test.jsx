import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AnimatedSubtitle } from '../src/ui/shared/AnimatedTypography.jsx'

test('AnimatedSubtitle renders as h2 by default', () => {
  render(<AnimatedSubtitle>Test Subtitle</AnimatedSubtitle>)
  const h2 = screen.getByRole('heading', { level: 2, name: 'Test Subtitle' })
  expect(h2).toBeInTheDocument()
  expect(h2.className).toContain('uppercase')
})

test('AnimatedSubtitle renders as custom element', () => {
  render(
    <AnimatedSubtitle as='h3' className='custom-subtitle'>
      Test Subtitle
    </AnimatedSubtitle>
  )
  const h3 = screen.getByRole('heading', { level: 3, name: 'Test Subtitle' })
  expect(h3).toBeInTheDocument()
  expect(h3.className).toContain('custom-subtitle')
})
