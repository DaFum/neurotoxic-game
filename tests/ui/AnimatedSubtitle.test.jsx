import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AnimatedSubtitle } from '../../src/ui/shared/AnimatedTypography.tsx'

test('AnimatedSubtitle renders as h2 by default', () => {
  render(<AnimatedSubtitle>Test Subtitle</AnimatedSubtitle>)
  const h2 = screen.getByRole('heading', { level: 2, name: 'Test Subtitle' })
  expect(h2).toBeInTheDocument()
  expect(h2.className).toContain('uppercase')
})

test('AnimatedSubtitle appends a custom className', () => {
  render(
    <AnimatedSubtitle className='custom-subtitle'>
      Test Subtitle
    </AnimatedSubtitle>
  )
  const h2 = screen.getByRole('heading', { level: 2, name: 'Test Subtitle' })
  expect(h2.className).toContain('uppercase')
  expect(h2.className).toContain('custom-subtitle')
})
