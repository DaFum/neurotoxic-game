import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RackScrew } from '../src/scenes/kabelsalat/components/HardwareProps'

describe('RackScrew', () => {
  it('renders SVG group at correct position', () => {
    const { container } = render(
      <svg>
        <RackScrew x={50} y={100} />
      </svg>
    )

    const group = container.querySelector('g')
    expect(group).toBeTruthy()
    expect(group.getAttribute('transform')).toBe('translate(50, 100)')
  })

  it('renders circle with correct attributes', () => {
    const { container } = render(
      <svg>
        <RackScrew x={0} y={0} />
      </svg>
    )

    const circle = container.querySelector('circle')
    expect(circle).toBeTruthy()
    expect(circle.getAttribute('cx')).toBe('0')
    expect(circle.getAttribute('cy')).toBe('0')
    expect(circle.getAttribute('r')).toBe('4')
    expect(circle.getAttribute('fill')).toBe('var(--concrete-gray)')
    expect(circle.getAttribute('stroke')).toBe('var(--void-black)')
    expect(circle.getAttribute('stroke-width')).toBe('1')
  })

  it('renders cross pattern with lines', () => {
    const { container } = render(
      <svg>
        <RackScrew x={0} y={0} />
      </svg>
    )

    const lines = container.querySelectorAll('line')
    expect(lines.length).toBe(2)

    // Check first line
    expect(lines[0].getAttribute('x1')).toBe('-2')
    expect(lines[0].getAttribute('y1')).toBe('-2')
    expect(lines[0].getAttribute('x2')).toBe('2')
    expect(lines[0].getAttribute('y2')).toBe('2')
    expect(lines[0].getAttribute('stroke')).toBe('var(--void-black)')
    expect(lines[0].getAttribute('stroke-width')).toBe('1.5')

    // Check second line
    expect(lines[1].getAttribute('x1')).toBe('-2')
    expect(lines[1].getAttribute('y1')).toBe('2')
    expect(lines[1].getAttribute('x2')).toBe('2')
    expect(lines[1].getAttribute('y2')).toBe('-2')
    expect(lines[1].getAttribute('stroke')).toBe('var(--void-black)')
    expect(lines[1].getAttribute('stroke-width')).toBe('1.5')
  })

  it('handles zero coordinates', () => {
    const { container } = render(
      <svg>
        <RackScrew x={0} y={0} />
      </svg>
    )
    expect(container.querySelector('g').getAttribute('transform')).toBe(
      'translate(0, 0)'
    )
  })

  it('handles negative coordinates', () => {
    const { container } = render(
      <svg>
        <RackScrew x={-10} y={-20} />
      </svg>
    )
    expect(container.querySelector('g').getAttribute('transform')).toBe(
      'translate(-10, -20)'
    )
  })

  it('handles non-integer coordinates', () => {
    const { container } = render(
      <svg>
        <RackScrew x={10.5} y={20.75} />
      </svg>
    )
    expect(container.querySelector('g').getAttribute('transform')).toBe(
      'translate(10.5, 20.75)'
    )
  })
})
