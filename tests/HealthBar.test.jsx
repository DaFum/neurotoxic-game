import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HealthBar } from '../src/components/hud/HealthBar.jsx'

describe('HealthBar', () => {
  test('renders baseline and structural elements', () => {
    const { container, getByText, queryByText } = render(<HealthBar health={100} isToxicMode={false} />)

    // Baseline checks
    expect(container).toBeTruthy()
    expect(getByText('20 / 20')).toBeInTheDocument()
    expect(getByText('ui:gig.crowdEnergy')).toBeInTheDocument()
    expect(queryByText('ui:gig.toxicModeActive')).toBeNull()

    // Structural / CSS checks
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('z-10')
    expect(wrapper.className).toContain('absolute')
    expect(wrapper.className).toContain('bottom-20')
    expect(wrapper.className).toContain('pointer-events-none')
  })

  test('handles health value changes correctly', () => {
    const { getByText, rerender } = render(<HealthBar health={75} isToxicMode={false} />)
    expect(getByText('15 / 20')).toBeInTheDocument()

    // Fractional health
    rerender(<HealthBar health={75.6} isToxicMode={false} />)
    expect(getByText('15 / 20')).toBeInTheDocument()

    // Adequate health styling
    rerender(<HealthBar health={50} isToxicMode={false} />)
    const midHealthValue = getByText('10 / 20')
    expect(midHealthValue.className).not.toContain('animate-fuel-warning')

    // Low health warning styling
    rerender(<HealthBar health={15} isToxicMode={false} />)
    const lowHealthValue = getByText('3 / 20')
    expect(lowHealthValue.className).toContain('animate-fuel-warning')

    // Zero health
    rerender(<HealthBar health={0} isToxicMode={false} />)
    expect(getByText('0 / 20')).toBeInTheDocument()
  })

  test('displays toxic mode indicator when active', () => {
    const { getByText } = render(<HealthBar health={80} isToxicMode={true} />)
    expect(getByText('ui:gig.toxicModeActive')).toBeInTheDocument()
  })
})

describe('BlockMeter (via HealthBar)', () => {
  test('renders correct segments and applies appropriate colors', () => {
    const { container, rerender } = render(<HealthBar health={100} isToxicMode={false} />)

    // Check total segments
    const segments = container.querySelectorAll('.flex-1')
    expect(segments.length).toBe(20)

    // Check partial fill
    rerender(<HealthBar health={50} isToxicMode={false} />)
    const filledSegments = container.querySelectorAll('.bg-toxic-green')
    expect(filledSegments.length).toBe(10)

    // Check warning threshold colors
    rerender(<HealthBar health={15} isToxicMode={false} />)
    const warningSegments = container.querySelectorAll('.bg-blood-red')
    expect(warningSegments.length).toBeGreaterThan(0)
  })
})
