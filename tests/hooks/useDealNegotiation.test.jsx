import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDealNegotiation } from '../../src/hooks/useDealNegotiation'
import { negotiateDeal } from '../../src/utils/socialEngine'
import { handleError } from '../../src/utils/errorHandler'

vi.mock('../../src/utils/socialEngine', () => ({
  negotiateDeal: vi.fn()
}))

vi.mock('../../src/utils/errorHandler', () => ({
  handleError: vi.fn()
}))

const mockAddToast = vi.fn()
const mockGameState = {
  player: { money: 1000 },
  band: { harmony: 50 },
  social: { brandReputation: {} },
  addToast: mockAddToast
}

vi.mock('../../src/context/GameState', () => ({
  useGameState: () => mockGameState
}))

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
}))

describe('useDealNegotiation', () => {
  const mockOnAccept = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    expect(result.current.negotiatedDeals).toEqual({})
    expect(result.current.negotiationModalOpen).toBe(false)
    expect(result.current.selectedDeal).toBe(null)
    expect(result.current.negotiationResult).toBe(null)
  })

  it('handleNegotiationStart sets the selected deal and opens modal', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = {
      id: 'deal-1',
      name: 'Test Deal',
      offer: { upfront: 500, duration: 3 }
    }

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    expect(result.current.selectedDeal).toBe(deal)
    expect(result.current.negotiationModalOpen).toBe(true)
    expect(result.current.negotiationResult).toBe(null)
  })

  it('handleAcceptDeal calls onAccept and handles success', async () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }
    mockOnAccept.mockResolvedValueOnce(undefined)

    await act(async () => {
      await result.current.handleAcceptDeal(deal)
    })

    expect(mockOnAccept).toHaveBeenCalledWith(deal)
    expect(handleError).not.toHaveBeenCalled()
  })

  it('handleAcceptDeal calls handleError on failure', async () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }
    const error = new Error('Accept failed')
    mockOnAccept.mockRejectedValueOnce(error)

    await act(async () => {
      await result.current.handleAcceptDeal(deal)
    })

    expect(mockOnAccept).toHaveBeenCalledWith(deal)
    expect(handleError).toHaveBeenCalledWith(error, {
      addToast: mockAddToast,
      fallbackMessage: 'ui:postGig.dealFailed'
    })
  })

  it('handleNegotiationSubmit handles SUCCESS outcome', async () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }
    const negotiatedDeal = { ...deal, offer: { upfront: 600 } }

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    vi.mocked(negotiateDeal).mockReturnValueOnce({
      status: 'ACCEPTED',
      success: true,
      deal: negotiatedDeal,
      feedback: 'Success!'
    })

    act(() => {
      result.current.handleNegotiationSubmit('SAFE')
    })

    expect(result.current.negotiationResult).toEqual({
      status: 'ACCEPTED',
      success: true,
      deal: negotiatedDeal,
      feedback: 'Success!'
    })
    expect(result.current.negotiatedDeals['deal-1']).toEqual({
      status: 'SUCCESS',
      deal: negotiatedDeal
    })
    expect(mockAddToast).toHaveBeenCalledWith('Success!', 'success')

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.negotiationModalOpen).toBe(false)
    expect(result.current.selectedDeal).toBe(null)
  })

  it('handleNegotiationSubmit handles REVOKED outcome', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    vi.mocked(negotiateDeal).mockReturnValueOnce({
      status: 'REVOKED',
      success: false,
      deal: null,
      feedback: 'Revoked!'
    })

    act(() => {
      result.current.handleNegotiationSubmit('AGGRESSIVE')
    })

    expect(result.current.negotiatedDeals['deal-1']).toEqual({
      status: 'REVOKED',
      deal: null
    })
    expect(mockAddToast).toHaveBeenCalledWith('Revoked!', 'error')
  })

  it('handleNegotiationSubmit handles FAILED outcome', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    vi.mocked(negotiateDeal).mockReturnValueOnce({
      status: 'FAILED',
      success: false,
      deal: deal,
      feedback: 'Failed!'
    })

    act(() => {
      result.current.handleNegotiationSubmit('SAFE')
    })

    expect(result.current.negotiatedDeals['deal-1']).toEqual({
      status: 'FAILED',
      deal: deal
    })
    expect(mockAddToast).toHaveBeenCalledWith('Failed!', 'warning')
  })

  it('handleNegotiationSubmit handles WORSENED outcome', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }
    const worsenedDeal = { ...deal, offer: { upfront: 400 } }

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    vi.mocked(negotiateDeal).mockReturnValueOnce({
      status: 'ACCEPTED',
      success: false,
      deal: worsenedDeal,
      feedback: 'Worsened!'
    })

    act(() => {
      result.current.handleNegotiationSubmit('PERSUASIVE')
    })

    expect(result.current.negotiatedDeals['deal-1']).toEqual({
      status: 'WORSENED',
      deal: worsenedDeal
    })
    expect(mockAddToast).toHaveBeenCalledWith('Worsened!', 'warning')
  })

  it('handleNegotiationSubmit handles error during negotiation', () => {
    const { result } = renderHook(() =>
      useDealNegotiation({ onAccept: mockOnAccept })
    )
    const deal = { id: 'deal-1', name: 'Test Deal' }
    const error = new Error('Negotiation crashed')

    act(() => {
      result.current.handleNegotiationStart(deal)
    })

    vi.mocked(negotiateDeal).mockImplementationOnce(() => {
      throw error
    })

    act(() => {
      result.current.handleNegotiationSubmit('SAFE')
    })

    expect(handleError).toHaveBeenCalledWith(error, {
      addToast: mockAddToast,
      fallbackMessage: 'ui:postGig.negotiationFailed'
    })
    expect(result.current.negotiationModalOpen).toBe(false)
    expect(result.current.selectedDeal).toBe(null)
  })
})
