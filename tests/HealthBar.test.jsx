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
    expect(getByText('15 / 20')).toBeInTheDocument()
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
    const healthValue = getByText('3 / 20')
    expect(healthValue.className).toContain('animate-fuel-warning')
  })

  test('does not apply warning styling when health is adequate', () => {
    const { getByText } = render(<HealthBar health={50} isToxicMode={false} />)
    const healthValue = getByText('10 / 20')
    expect(healthValue.className).not.toContain('animate-fuel-warning')
  })

  test('renders BlockMeter component segments', () => {
    const { container } = render(<HealthBar health={100} isToxicMode={false} />)
    // Check for segmented bar container elements
    const bars = container.querySelectorAll('.flex-1')
    expect(bars.length).toBeGreaterThan(0)
  })

  test('handles edge case: zero health', () => {
    const { getByText } = render(<HealthBar health={0} isToxicMode={false} />)
    expect(getByText('0 / 20')).toBeInTheDocument()
  })

  test('handles edge case: maximum health', () => {
    const { getByText } = render(<HealthBar health={100} isToxicMode={false} />)
    expect(getByText('20 / 20')).toBeInTheDocument()
  })

  test('handles fractional health values', () => {
    const { getByText } = render(
      <HealthBar health={75.6} isToxicMode={false} />
    )
    expect(getByText('15 / 20')).toBeInTheDocument() // Should map to segments appropriately (75.6 -> ~15/20)
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

describe('BlockMeter (via HealthBar)', () => {
  test('renders correct number of segments', () => {
    const { container } = render(<HealthBar health={100} isToxicMode={false} />)
    // BlockMeter uses 20 segments in HealthBar
    const segments = container.querySelectorAll('.flex-1')
    expect(segments.length).toBe(20)
  })

  test('applies correct fill color based on health', () => {
    const { container } = render(<HealthBar health={50} isToxicMode={false} />)
    const filledSegments = container.querySelectorAll('.bg-\\(--toxic-green\\)')
    expect(filledSegments.length).toBe(10)
  })

  test('applies warning color when health is below threshold', () => {
    const { container } = render(<HealthBar health={15} isToxicMode={false} />)
    const warningSegments = container.querySelectorAll('.bg-\\(--blood-red\\)')
    expect(warningSegments.length).toBeGreaterThan(0)
  })
})
