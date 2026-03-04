import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Panel } from '../src/ui/shared/index.jsx'
import React from 'react'

test('Panel renders children and optional title', () => {
  render(
    <Panel title="Test Title">
      <div data-testid="child">Child Content</div>
    </Panel>
  )
  expect(screen.getByText('Test Title')).toBeInTheDocument()
  expect(screen.getByTestId('child')).toBeInTheDocument()
  expect(screen.getByText('Child Content')).toBeInTheDocument()
})

test('Panel renders without title', () => {
  render(
    <Panel>
      <div data-testid="child">Child Content</div>
    </Panel>
  )
  expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  expect(screen.getByTestId('child')).toBeInTheDocument()
})
