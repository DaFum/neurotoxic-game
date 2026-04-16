import { expect, test, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { StatBox } from '../../src/ui/shared/index.jsx'

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

test('StatBox handles numeric value correctly', () => {
  const props = {
    label: 'MONEY',
    value: 500,
    icon: '💰'
  }

  const { getByText } = render(<StatBox {...props} />)

  expect(getByText('500')).toBeInTheDocument()
})
