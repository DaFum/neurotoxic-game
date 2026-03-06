import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Panel } from '../src/ui/shared/index.jsx'

test('Panel renders children and optional title', () => {
  render(
    <Panel title='Test Title'>
      <div data-testid='child'>Child Content</div>
    </Panel>
  )
  expect(
    screen.getByRole('heading', { level: 3, name: 'Test Title' })
  ).toBeInTheDocument()
  expect(screen.getByTestId('child')).toBeInTheDocument()
  expect(screen.getByText('Child Content')).toBeInTheDocument()
})

test('Panel renders without title', () => {
  render(
    <Panel>
      <div data-testid='child'>Child Content</div>
    </Panel>
  )
  expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  expect(screen.getByTestId('child')).toBeInTheDocument()
})
