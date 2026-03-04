import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { AnimatedSubtitle } from '../src/ui/shared/AnimatedTypography.jsx'
import React from 'react'

test('AnimatedSubtitle renders as h2 by default', () => {
  const { container } = render(<AnimatedSubtitle>Test Subtitle</AnimatedSubtitle>)
  const h2 = container.querySelector('h2')
  expect(h2).toBeInTheDocument()
  expect(h2).toHaveTextContent('Test Subtitle')
  expect(h2.className).toContain('uppercase')
})

test('AnimatedSubtitle renders as custom element', () => {
  const { container } = render(<AnimatedSubtitle as="h3" className="custom-subtitle">Test Subtitle</AnimatedSubtitle>)
  const h3 = container.querySelector('h3')
  expect(h3).toBeInTheDocument()
  expect(h3).toHaveTextContent('Test Subtitle')
  expect(h3.className).toContain('custom-subtitle')
})
