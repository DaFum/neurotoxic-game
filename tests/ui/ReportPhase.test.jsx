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
      breakdown: [
        { labelKey: 'economy:gigIncome.ticketSales.label', value: 500 }
      ],
      total: 500
    },
    expenses: {
      breakdown: [
        { labelKey: 'economy:gigExpenses.catering.label', value: 100 }
      ],
      total: 100
    },
    net: 400
  }
  const handleNext = vi.fn()

  render(<ReportPhase financials={mockFinancials} onNext={handleNext} />)

  expect(
    screen.getByText('economy:gigIncome.ticketSales.label')
  ).toBeInTheDocument()
  expect(
    screen.getByText('economy:gigExpenses.catering.label')
  ).toBeInTheDocument()
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
      breakdown: [
        { labelKey: 'economy:gigIncome.ticketSales.label', value: 500 }
      ],
      total: 500
    },
    expenses: {
      breakdown: [
        { labelKey: 'economy:gigExpenses.catering.label', value: 100 }
      ],
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

test('ReportPhase renders a breakdown row detail line when a detailKey is present', () => {
  const mockFinancials = {
    income: {
      breakdown: [
        {
          labelKey: 'economy:gigIncome.ticketSales.label',
          value: 500,
          detailKey: 'economy:gigIncome.swingBoost.detail'
        }
      ],
      total: 500
    },
    expenses: {
      breakdown: [
        { labelKey: 'economy:gigExpenses.catering.label', value: 100 }
      ],
      total: 100
    },
    net: 400
  }

  render(<ReportPhase financials={mockFinancials} onNext={vi.fn()} />)

  expect(
    screen.getByText('economy:gigIncome.swingBoost.detail')
  ).toBeInTheDocument()
  // Rows without a detailKey render no extra line.
  expect(
    screen.queryByText('economy:gigExpenses.swingDampener.detail')
  ).toBeNull()
})

test('ReportPhase replaces an unregistered breakdown label key with the generic label', () => {
  const mockFinancials = {
    income: {
      breakdown: [{ labelKey: 'economy:totally.madeUp.key', value: 500 }],
      total: 500
    },
    expenses: {
      breakdown: [
        { labelKey: 'economy:gigExpenses.catering.label', value: 100 }
      ],
      total: 100
    },
    net: 400
  }

  render(<ReportPhase financials={mockFinancials} onNext={vi.fn()} />)

  expect(screen.queryByText('economy:totally.madeUp.key')).toBeNull()
  expect(screen.getByText('economy:unknownBreakdownLabel')).toBeInTheDocument()
  expect(
    screen.getByText('economy:gigExpenses.catering.label')
  ).toBeInTheDocument()
})
