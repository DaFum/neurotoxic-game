import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { DealsPhase } from '../../src/components/postGig/DealsPhase.tsx'
import { handleError } from '../../src/utils/errorHandler.js'
import { negotiateDeal } from '../../src/utils/socialEngine'

vi.mock('../../src/utils/errorHandler.js', () => ({
  handleError: vi.fn()
}))

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => ({
    player: { stats: {} },
    band: {},
    social: { brandReputation: { Corp: 10 } },
    addToast: vi.fn()
  })
}))

vi.mock('../../src/utils/socialEngine', () => ({
  negotiateDeal: vi.fn().mockReturnValue({
    success: true,
    status: 'SUCCESS',
    feedback: 'Deal accepted!',
    deal: {
      id: 'test-deal',
      name: 'Sponsorship',
      alignment: 'Corp',
      offer: { upfront: 600, duration: 3 }
    }
  })
}))

vi.mock('../../src/ui/shared', () => ({
  Modal: ({ children, isOpen }) =>
    isOpen ? <div data-testid='modal'>{children}</div> : null,
  ActionButton: ({ children, onClick }) => (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  )
}))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

test('DealsPhase renders no deals message if empty', () => {
  const handleSkip = vi.fn()
  render(<DealsPhase offers={[]} onSkip={handleSkip} onAccept={vi.fn()} />)

  fireEvent.click(screen.getByText('Reject All Offers & Continue >'))
  expect(handleSkip).toHaveBeenCalledTimes(1)
})

test('DealsPhase renders offers and handles negotiation', async () => {
  const handleAccept = vi.fn()
  const mockOffers = [
    {
      id: 'deal-1',
      name: 'Test Deal',
      alignment: 'Corp',
      offer: { upfront: 500, duration: 3 }
    }
  ]

  render(
    <DealsPhase offers={mockOffers} onSkip={vi.fn()} onAccept={handleAccept} />
  )

  expect(screen.getByText('Test Deal')).toBeInTheDocument()

  const negotiateBtn = screen.getByText('NEGOTIATE')
  fireEvent.click(negotiateBtn)

  expect(screen.getByTestId('modal')).toBeInTheDocument()

  const aggressiveBtn = screen.getByText('AGGRESSIVE (High Risk)')
  fireEvent.click(aggressiveBtn)

  expect(screen.getByText('Deal accepted!')).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(1500)
  })

  await waitFor(() => {
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  const acceptListBtn = screen.getAllByText('ACCEPT')[0]
  fireEvent.click(acceptListBtn)

  expect(handleAccept).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Sponsorship' })
  )
})

test('DealsPhase handles negotiation error gracefully', async () => {
  const mockError = new Error('Network timeout')
  negotiateDeal.mockImplementationOnce(() => {
    throw mockError
  })
  handleError.mockClear()

  const mockOffers = [
    {
      id: 'deal-error',
      name: 'Error Deal',
      alignment: 'Corp',
      offer: { upfront: 500, duration: 3 }
    }
  ]

  render(<DealsPhase offers={mockOffers} onSkip={vi.fn()} onAccept={vi.fn()} />)

  const negotiateBtn = screen.getByText('NEGOTIATE')
  fireEvent.click(negotiateBtn)

  expect(screen.getByTestId('modal')).toBeInTheDocument()

  const safeBtn = screen.getByText('SAFE (Low Risk)')
  fireEvent.click(safeBtn)

  expect(handleError).toHaveBeenCalledWith(
    mockError,
    expect.objectContaining({
      fallbackMessage: 'ui:postGig.negotiationFailed'
    })
  )

  await waitFor(() => {
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })
})

test('DealsPhase handles accept deal error gracefully', async () => {
  const mockError = new Error('Deal processing failed')
  const handleAccept = vi.fn().mockRejectedValue(mockError)
  handleError.mockClear()

  const mockOffers = [
    {
      id: 'deal-error',
      name: 'Error Deal',
      alignment: 'Corp',
      offer: { upfront: 500, duration: 3 }
    }
  ]

  render(
    <DealsPhase offers={mockOffers} onSkip={vi.fn()} onAccept={handleAccept} />
  )

  const acceptBtn = screen.getByText('ACCEPT')
  fireEvent.click(acceptBtn)

  await waitFor(() => {
    expect(handleError).toHaveBeenCalledWith(
      mockError,
      expect.objectContaining({
        fallbackMessage: 'ui:postGig.dealFailed'
      })
    )
  })
})
