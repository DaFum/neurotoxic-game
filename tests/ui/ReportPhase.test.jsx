import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ReportPhase } from '../../src/components/postGig/ReportPhase.tsx'

test('ReportPhase renders loading state', () => {
  render(<ReportPhase />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('ReportPhase renders financials and calls onNext', () => {
  const mockFinancials = {
    income: {
      breakdown: [{ labelKey: 'economy:postGig.ticketSales', value: 500 }],
      total: 500
    },
    expenses: {
      breakdown: [{ labelKey: 'economy:postGig.gearRepair', value: 100 }],
      total: 100
    },
    net: 400
  }
  const handleNext = vi.fn()

  render(<ReportPhase financials={mockFinancials} onNext={handleNext} />)

  expect(screen.getByText('economy:postGig.ticketSales')).toBeInTheDocument()
  expect(screen.getByText('economy:postGig.gearRepair')).toBeInTheDocument()
  // formatCurrency with signDisplay='always' renders signed Intl currency strings.
  expect(screen.getAllByText(/^\+.*500/).length).toBeGreaterThan(0)
  expect(screen.getAllByText(/^-.*100/).length).toBeGreaterThan(0)

  const button = screen.getByRole('button')
  fireEvent.click(button)

  expect(handleNext).toHaveBeenCalledTimes(1)
})

test('ReportPhase uses a mobile-first report grid and touch-sized action', () => {
  const mockFinancials = {
    income: {
      breakdown: [{ labelKey: 'economy:postGig.ticketSales', value: 500 }],
      total: 500
    },
    expenses: {
      breakdown: [{ labelKey: 'economy:postGig.gearRepair', value: 100 }],
      total: 100
    },
    net: 400
  }

  render(<ReportPhase financials={mockFinancials} onNext={vi.fn()} />)

  const grid = screen.getByTestId('post-gig-financial-grid')
  expect(grid).toHaveClass('grid-cols-1')
  expect(grid).toHaveClass('md:grid-cols-2')
  expect(grid).toHaveClass('gap-4')
  expect(grid).toHaveClass('sm:gap-6')

  const button = screen.getByRole('button')
  expect(button).toHaveClass('w-full')
  expect(button).toHaveClass('sm:w-auto')
  expect(button).toHaveClass('min-h-11')
})
