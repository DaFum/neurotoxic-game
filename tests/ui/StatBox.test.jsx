import { expect, test, afterEach, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { StatBox } from '../../src/ui/shared/index.tsx'

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

afterEach(cleanup)

test('StatBox renders label, value, and icon correctly', () => {
  const props = {
    label: 'FAME',
    value: '1200',
    icon: '🤘'
  }

  const { getByText } = render(<StatBox {...props} />)

  expect(getByText('FAME')).toBeInTheDocument()
  expect(getByText('1200')).toBeInTheDocument()
  expect(getByText('🤘')).toBeInTheDocument()
})

test('StatBox applies custom className', () => {
  const props = {
    label: 'FAME',
    value: '1200',
    icon: '🤘',
    className: 'custom-class'
  }

  const { container } = render(<StatBox {...props} />)
  const rootElement = container.firstChild

  expect(rootElement.classList.contains('custom-class')).toBe(true)
})

test('StatBox renders four frame corners with correct classes', () => {
  render(<StatBox label='FAME' value='1200' icon='🤘' />)

  const corners = screen.getAllByTestId('ui-frame-corner')
  expect(corners).toHaveLength(4)

  expect(corners[0]).toHaveClass('top-0 left-0')
  expect(corners[1]).toHaveClass('top-0 right-0 rotate-90')
  expect(corners[2]).toHaveClass('bottom-0 right-0 rotate-180')
  expect(corners[3]).toHaveClass('bottom-0 left-0 -rotate-90')

  corners.forEach(corner => {
    expect(corner).toHaveClass(
      'absolute w-3 h-3 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60'
    )
  })
})

test('StatBox handles numeric value correctly', () => {
  const props = {
    label: 'MONEY',
    value: 500,
    icon: '💰'
  }

  const { getByText } = render(<StatBox {...props} />)

  expect(getByText('500')).toBeInTheDocument()
})
