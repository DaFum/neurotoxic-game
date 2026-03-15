import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ReportPhase } from '../src/components/postGig/ReportPhase.jsx'

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
  expect(
    screen.getAllByText('economy:report.amount_positive').length
  ).toBeGreaterThan(0)
  expect(
    screen.getAllByText('economy:report.amount_negative').length
  ).toBeGreaterThan(0)

  const button = screen.getByRole('button')
  fireEvent.click(button)

  expect(handleNext).toHaveBeenCalledTimes(1)
})
