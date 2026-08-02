import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Panel } from '../../src/ui/shared/index.tsx'

// Mirrors UIFrameCorner's real SVG hierarchy (svg > path, rect, path) so the
// structural mock matches the DOM the component renders.
vi.mock('../../src/ui/shared/Icons', () => ({
  UIFrameCorner: ({ className }) => (
    <svg
      data-testid='ui-frame-corner'
      className={className}
      viewBox='0 0 48 48'
    >
      <path d='M2 46V2H46' />
      <rect x='2' y='2' width='12' height='12' />
      <path d='M18 2L28 12H46' />
    </svg>
  )
}))

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

test('Panel renders four frame corners with correct classes', () => {
  render(
    <Panel>
      <div data-testid='child'>Child Content</div>
    </Panel>
  )

  const corners = screen.getAllByTestId('ui-frame-corner')
  expect(corners).toHaveLength(4)

  expect(corners[0]).toHaveClass('top-0 left-0')
  expect(corners[1]).toHaveClass('top-0 right-0 rotate-90')
  expect(corners[2]).toHaveClass('bottom-0 right-0 rotate-180')
  expect(corners[3]).toHaveClass('bottom-0 left-0 -rotate-90')

  corners.forEach(corner => {
    expect(corner).toHaveClass(
      'absolute w-6 h-6 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60'
    )
  })
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
