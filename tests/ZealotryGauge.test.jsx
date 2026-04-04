import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ZealotryGauge } from '../src/components/postGig/ZealotryGauge'
import { ZEALOTRY_PROMO_THRESHOLD } from '../src/utils/economyEngine'

// Mock i18next
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => {
      const template = options?.defaultValue || key
      if (!options) return template

      return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
        String(options[token] ?? `{{${token}}}`)
      )
    }
  })
}))

// Mock imageGen
vi.mock('../src/utils/imageGen.js', () => ({
  getGenImageUrl: vi.fn(() => 'mock-image-url'),
  IMG_PROMPTS: { ZEALOTRY_CULT: 'ZEALOTRY_CULT' }
}))

describe('ZealotryGauge', () => {
  it('returns null when zealotryLevel is 0', () => {
    const { container } = render(<ZealotryGauge zealotryLevel={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when zealotryLevel is negative', () => {
    const { container } = render(<ZealotryGauge zealotryLevel={-10} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders correctly when zealotryLevel is positive', () => {
    render(<ZealotryGauge zealotryLevel={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('CULT ZEALOTRY')).toBeInTheDocument()

    // Find the progress bar div. It's the one with bg-blood-red class.
    const bar = screen
      .getByText('50%')
      .closest('.flex-1')
      .querySelector('.bg-blood-red')
    expect(bar).toHaveStyle({ width: '50%' })
  })

  it('displays warning when zealotryLevel is at threshold', () => {
    render(<ZealotryGauge zealotryLevel={ZEALOTRY_PROMO_THRESHOLD} />)
    expect(
      screen.getByText(/WARNING: FANS ARE BECOMING RADICALIZED/i)
    ).toBeInTheDocument()
  })

  it('displays warning when zealotryLevel is above threshold', () => {
    render(<ZealotryGauge zealotryLevel={ZEALOTRY_PROMO_THRESHOLD + 10} />)
    expect(
      screen.getByText(/WARNING: FANS ARE BECOMING RADICALIZED/i)
    ).toBeInTheDocument()
  })

  it('does not display warning when zealotryLevel is below threshold', () => {
    render(<ZealotryGauge zealotryLevel={ZEALOTRY_PROMO_THRESHOLD - 1} />)
    expect(
      screen.queryByText(/WARNING: FANS ARE BECOMING RADICALIZED/i)
    ).not.toBeInTheDocument()
  })

  it('clamps the progress bar width to 100%', () => {
    render(<ZealotryGauge zealotryLevel={150} />)
    expect(screen.getByText('150%')).toBeInTheDocument()
    const bar = screen.getByText('150%').closest('.flex-1').querySelector('.bg-blood-red')
    expect(bar).toHaveStyle({ width: '100%' })
  })
})
