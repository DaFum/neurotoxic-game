import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ReportPhase } from '../src/components/postGig/ReportPhase.jsx'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

test('ReportPhase renders loading state', () => {
  render(<ReportPhase />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('ReportPhase renders financials and calls onNext', () => {
  const mockFinancials = {
    income: {
      breakdown: [{ labelKey: 'Ticket Sales', value: 500 }],
      total: 500
    },
    expenses: {
      breakdown: [{ labelKey: 'Gear Repair', value: 100 }],
      total: 100
    },
    net: 400
  }
  const handleNext = vi.fn()

  render(<ReportPhase financials={mockFinancials} onNext={handleNext} />)

  expect(screen.getByText('Ticket Sales')).toBeInTheDocument()
  expect(screen.getByText('Gear Repair')).toBeInTheDocument()
  expect(screen.getByText('+500€')).toBeInTheDocument()
  expect(screen.getByText('-100€')).toBeInTheDocument()

  const button = screen.getByRole('button')
  fireEvent.click(button)

  expect(handleNext).toHaveBeenCalledTimes(1)
})
