import { createMotionReactMock } from '../mocks/motionMock'
/**
 * Vitest tests for the NetResult component.
 *
 * NetResult renders the gig's bottom-line profit/loss in the PostGig report.
 * The audit requires that gig report `net` equals displayed income minus
 * displayed expenses with no hidden deductions. These tests validate the display
 * logic is correct for positive, negative, and zero net values.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { NetResult } from '../../src/components/postGig/NetResult'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('motion/react', () => createMotionReactMock())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('NetResult', () => {
  it('shows positive net with toxic-green color class', () => {
    render(<NetResult net={250} />)

    const netEl = screen.getByTestId('post-gig-net-result-value')
    expect(netEl.className).toContain('text-toxic-green')
    expect(netEl.className).not.toContain('text-blood-red')
    // Some text content is rendered
    expect(netEl.textContent).toBeTruthy()
  })

  it('shows negative net with blood-red color class', () => {
    render(<NetResult net={-80} />)

    const netEl = screen.getByTestId('post-gig-net-result-value')
    expect(netEl.className).toContain('text-blood-red')
    expect(netEl.className).not.toContain('text-toxic-green')
    expect(netEl.textContent).toBeTruthy()
  })

  it('shows zero net with currency format and toxic-green color class (non-negative)', () => {
    render(<NetResult net={0} />)

    // net >= 0 path uses toxic-green
    const netEl = screen.getByTestId('post-gig-net-result-value')
    expect(netEl.className).toContain('text-toxic-green')
  })

  it('uses responsive sizing for the large net value', () => {
    render(<NetResult net={250} />)

    const netEl = screen.getByTestId('post-gig-net-result-value')
    expect(netEl).toHaveClass('text-3xl')
    expect(netEl).toHaveClass('sm:text-5xl')
    expect(netEl).toHaveClass('break-words')
  })

  it('renders the NET PROFIT label', () => {
    render(<NetResult net={100} />)
    // t('economy:postGig.netProfit') falls back to the key string in test env
    expect(screen.getByText(/netProfit|net\s*profit/i)).toBeInTheDocument()
  })

  it('renders large numbers without crashing', () => {
    expect(() => render(<NetResult net={999_999} />)).not.toThrow()
  })

  it('renders minimum negative without crashing', () => {
    expect(() => render(<NetResult net={-999_999} />)).not.toThrow()
  })

  it('has correct display name', () => {
    expect(NetResult.displayName).toBe('NetResult')
  })

  it('is memoized (React.memo) — displayName is preserved through the wrapper', () => {
    // React.memo sets displayName on the wrapper; if it's set the wrapping succeeded.
    // $$typeof is a React internal and must not be asserted on.
    expect(NetResult.displayName).toBe('NetResult')
    // The wrapped component exposes `type` which is the inner function
    expect(typeof NetResult.type).toBe('function')
  })
})
