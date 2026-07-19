import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RackPanel } from '../../src/scenes/kabelsalat/components/HardwareProps'

// RackScrew is module-private decoration; its rendering contract is covered
// through RackPanel, the only production consumer.
describe('RackPanel screws', () => {
  const renderPanel = () =>
    render(
      <svg aria-hidden='true'>
        <title>RackPanel test wrapper</title>
        <RackPanel />
      </svg>
    )

  it('renders four screws at the rack corner positions', () => {
    const { container } = renderPanel()

    const screwGroups = [...container.querySelectorAll('g g')]
    expect(screwGroups.length).toBe(4)
    expect(screwGroups.map(g => g.getAttribute('transform'))).toEqual([
      'translate(60, 40)',
      'translate(760, 40)',
      'translate(60, 170)',
      'translate(760, 170)'
    ])
  })

  it('renders each screw circle with correct attributes', () => {
    const { container } = renderPanel()

    const circles = [...container.querySelectorAll('circle')]
    expect(circles.length).toBe(4)
    for (const circle of circles) {
      expect(circle.getAttribute('cx')).toBe('0')
      expect(circle.getAttribute('cy')).toBe('0')
      expect(circle.getAttribute('r')).toBe('4')
      expect(circle.getAttribute('fill')).toBe('var(--color-concrete-gray)')
      expect(circle.getAttribute('stroke')).toBe('var(--color-void-black)')
      expect(circle.getAttribute('stroke-width')).toBe('1')
    }
  })

  it('renders a cross pattern with two lines per screw', () => {
    const { container } = renderPanel()

    const screwGroups = [...container.querySelectorAll('g g')]
    for (const group of screwGroups) {
      const lines = group.querySelectorAll('line')
      expect(lines.length).toBe(2)

      expect(lines[0].getAttribute('x1')).toBe('-2')
      expect(lines[0].getAttribute('y1')).toBe('-2')
      expect(lines[0].getAttribute('x2')).toBe('2')
      expect(lines[0].getAttribute('y2')).toBe('2')
      expect(lines[0].getAttribute('stroke')).toBe('var(--color-void-black)')
      expect(lines[0].getAttribute('stroke-width')).toBe('1.5')

      expect(lines[1].getAttribute('x1')).toBe('-2')
      expect(lines[1].getAttribute('y1')).toBe('2')
      expect(lines[1].getAttribute('x2')).toBe('2')
      expect(lines[1].getAttribute('y2')).toBe('-2')
      expect(lines[1].getAttribute('stroke')).toBe('var(--color-void-black)')
      expect(lines[1].getAttribute('stroke-width')).toBe('1.5')
    }
  })

  it('renders the outer and inner panel rects', () => {
    const { container } = renderPanel()

    const rects = [...container.querySelectorAll('rect')]
    expect(rects.length).toBe(2)
    expect(rects[0].getAttribute('x')).toBe('40')
    expect(rects[0].getAttribute('y')).toBe('20')
    expect(rects[0].getAttribute('fill')).toBe('var(--color-shadow-black)')
    expect(rects[1].getAttribute('fill')).toBe('var(--color-void-black)')
  })
})
