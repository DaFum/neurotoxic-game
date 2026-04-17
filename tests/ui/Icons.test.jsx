import { render } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { RazorPlayIcon, VoidSkullIcon } from '../../src/ui/shared/Icons.tsx'

describe('RazorPlayIcon', () => {
  test('renders SVG element', () => {
    const { container } = render(<RazorPlayIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  test('applies custom className', () => {
    const { container } = render(<RazorPlayIcon className='custom-class' />)
    const svg = container.querySelector('svg')
    expect(svg.className.baseVal).toContain('custom-class')
    expect(svg.className.baseVal).toContain('text-toxic-green')
  })
})

describe('VoidSkullIcon', () => {
  test('renders SVG element', () => {
    const { container } = render(<VoidSkullIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 32')
  })

  test('applies custom className', () => {
    const { container } = render(<VoidSkullIcon className='custom-skull' />)
    const svg = container.querySelector('svg')
    expect(svg.className.baseVal).toContain('custom-skull')
    expect(svg.className.baseVal).toContain('text-toxic-green')
  })
})
