import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HealthBar } from '../src/components/hud/HealthBar.jsx'

describe('HealthBar', () => {
  test('renders without crashing', () => {
    const { container } = render(<HealthBar health={100} isToxicMode={false} />)
    expect(container).toBeTruthy()
  })

  test('displays correct health percentage', () => {
    const { getByText } = render(<HealthBar health={75} isToxicMode={false} />)
    expect(getByText('75%')).toBeInTheDocument()
  })

  test('displays CROWD ENERGY label', () => {
    const { getByText } = render(<HealthBar health={100} isToxicMode={false} />)
    expect(getByText('CROWD ENERGY')).toBeInTheDocument()
  })

  test('displays toxic mode indicator when active', () => {
    const { getByText } = render(<HealthBar health={80} isToxicMode={true} />)
    expect(getByText('TOXIC MODE ACTIVE')).toBeInTheDocument()
  })

  test('does not display toxic mode indicator when inactive', () => {
    const { queryByText } = render(
      <HealthBar health={80} isToxicMode={false} />
    )
    expect(queryByText('TOXIC MODE ACTIVE')).toBeNull()
  })

  test('applies warning styling when health is low', () => {
    const { getByText } = render(<HealthBar health={15} isToxicMode={false} />)
    const healthValue = getByText('15%')
    expect(healthValue.className).toContain('text-(--blood-red)')
    expect(healthValue.className).toContain('animate-fuel-warning')
  })

  test('does not apply warning styling when health is adequate', () => {
    const { getByText } = render(<HealthBar health={50} isToxicMode={false} />)
    const healthValue = getByText('50%')
    expect(healthValue.className).not.toContain('text-(--blood-red)')
    expect(healthValue.className).not.toContain('animate-fuel-warning')
  })

  test('renders SegmentedBar component', () => {
    const { container } = render(<HealthBar health={100} isToxicMode={false} />)
    // Check for segmented bar container
    const bars = container.querySelectorAll('.flex.gap-\\[2px\\]')
    expect(bars.length).toBeGreaterThan(0)
  })

  test('handles edge case: zero health', () => {
    const { getByText } = render(<HealthBar health={0} isToxicMode={false} />)
    expect(getByText('0%')).toBeInTheDocument()
  })

  test('handles edge case: maximum health', () => {
    const { getByText } = render(<HealthBar health={100} isToxicMode={false} />)
    expect(getByText('100%')).toBeInTheDocument()
  })

  test('handles fractional health values', () => {
    const { getByText } = render(
      <HealthBar health={75.6} isToxicMode={false} />
    )
    expect(getByText('75%')).toBeInTheDocument() // Should floor
  })

  test('renders with correct z-index positioning', () => {
    const { container } = render(<HealthBar health={80} isToxicMode={false} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('z-10')
  })

  test('applies correct styling to container', () => {
    const { container } = render(<HealthBar health={80} isToxicMode={false} />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('absolute')
    expect(wrapper.className).toContain('bottom-20')
    expect(wrapper.className).toContain('pointer-events-none')
  })
})

describe('SegmentedBar (via HealthBar)', () => {
  test('renders correct number of segments', () => {
    const { container } = render(<HealthBar health={100} isToxicMode={false} />)
    // HealthBar uses 25 segments
    const segments = container.querySelectorAll('.flex-1.h-full')
    expect(segments.length).toBe(25)
  })

  test('applies correct fill color based on health', () => {
    const { container } = render(<HealthBar health={50} isToxicMode={false} />)
    const filledSegments = container.querySelectorAll('.bg-\\(--toxic-green\\)')
    // At 50%, should have ~12-13 filled segments out of 25
    expect(filledSegments.length).toBeGreaterThan(10)
    expect(filledSegments.length).toBeLessThan(15)
  })

  test('applies warning color when health is below threshold', () => {
    const { container } = render(<HealthBar health={15} isToxicMode={false} />)
    const warningSegments = container.querySelectorAll('.bg-\\(--blood-red\\)')
    expect(warningSegments.length).toBeGreaterThan(0)
  })
})
