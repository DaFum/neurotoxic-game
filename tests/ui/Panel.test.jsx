import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Panel } from '../../src/ui/shared/index.tsx'

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

test('Panel applies default contentClassName when not specified', () => {
  const { container } = render(
    <Panel>
      <div data-testid='child'>Child Content</div>
    </Panel>
  )
  const contentWrapper = container.querySelector('.space-y-1')
  expect(contentWrapper).toBeInTheDocument()
  expect(contentWrapper).toHaveClass('flex-1 min-h-0 flex flex-col space-y-1')
})

test('Panel applies contentClassName correctly for spacing', () => {
  const { container } = render(
    <Panel contentClassName='space-y-6'>
      <div data-testid='child'>Child Content</div>
    </Panel>
  )
  const contentWrapper = container.querySelector('.space-y-6')
  expect(contentWrapper).toBeInTheDocument()
  expect(contentWrapper).toHaveClass('flex-1 min-h-0 flex flex-col space-y-6')
})
