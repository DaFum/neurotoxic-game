import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { DealsPhase } from '../src/components/postGig/DealsPhase.jsx'

vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    player: { stats: {} },
    band: {},
    social: { brandReputation: { Corp: 10 } },
    addToast: vi.fn()
  })
}))

vi.mock('../src/utils/socialEngine', () => ({
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


vi.mock('../src/ui/shared', () => ({
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
