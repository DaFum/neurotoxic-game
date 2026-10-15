import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { negotiateDeal } from '../utils/brandDealLogic'
import { handleError } from '../utils/errorHandler'
import type {
  DealNegotiationHook,
  DealNegotiationState,
  NegotiationResult
} from '../types/components'
import type { BrandDeal } from '../types/social'
import type { ToastType } from '../types/callbacks'

type Deal = BrandDeal

/**
 * Manages brand-deal negotiation modal state and strategy resolution.
 *
 * @param props - Accept callback used when the player confirms a negotiated deal.
 * @returns Negotiation state, modal controls, and deal negotiation handlers.
 */
export const useDealNegotiation = ({
  onAccept
}: {
  onAccept: (deal: Deal) => Promise<void> | void
}): DealNegotiationHook => {
  const { t } = useTranslation()
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const { addToast } = useGameActions()
  const [negotiatedDeals, setNegotiatedDeals] = useState<
    Record<string, DealNegotiationState>
  >({}) // id: { status, deal }

  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [negotiationResult, setNegotiationResult] =
    useState<NegotiationResult | null>(null) // To show result in modal before closing
  const negotiationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (negotiationTimerRef.current) {
        clearTimeout(negotiationTimerRef.current)
      }
    }
  }, [])

  const handleNegotiationStart = useCallback((deal: Deal) => {
    // A pending auto-close from the previous negotiation must not close this one.
    if (negotiationTimerRef.current) {
      clearTimeout(negotiationTimerRef.current)
      negotiationTimerRef.current = null
    }
    setSelectedDeal(deal)
    setNegotiationResult(null)
    setNegotiationModalOpen(true)
  }, [])

  const handleAcceptDeal = useCallback(
    async (deal: Deal) => {
      try {
        await onAccept(deal)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: t('ui:postGig.dealFailed')
        })
      }
    },
    [onAccept, addToast, t]
  )

  const handleNegotiationSubmit = (
    strategy: 'SAFE' | 'PERSUASIVE' | 'AGGRESSIVE'
  ) => {
    if (!selectedDeal) return

    try {
      const gameState = { player, band, social }
      const result = negotiateDeal(selectedDeal, strategy, gameState)

      setNegotiationResult(result)

      const [status, deal, toastType]: [
        NonNullable<DealNegotiationState['status']>,
        Deal | null,
        ToastType
      ] =
        result.status === 'REVOKED'
          ? ['REVOKED', null, 'error']
          : result.status === 'FAILED'
            ? ['FAILED', selectedDeal, 'warning']
            : result.success
              ? ['SUCCESS', result.deal, 'success']
              : // Accepted but worse terms (Persuasive fail)
                ['WORSENED', result.deal, 'warning']

      setNegotiatedDeals(prev => ({
        ...prev,
        [selectedDeal.id]: { status, deal }
      }))
      addToast(t(result.feedbackKey), toastType)

      if (negotiationTimerRef.current) {
        clearTimeout(negotiationTimerRef.current)
      }
      negotiationTimerRef.current = setTimeout(() => {
        setNegotiationModalOpen(false)
        setSelectedDeal(null)
      }, 1500)
    } catch (error) {
      handleError(error, {
        addToast,
        fallbackMessage: t('ui:postGig.negotiationFailed')
      })
      // Close modal on error to prevent stuck state
      setNegotiationModalOpen(false)
      setSelectedDeal(null)
    }
  }

  return {
    negotiatedDeals,
    negotiationModalOpen,
    setNegotiationModalOpen,
    selectedDeal,
    negotiationResult,
    handleNegotiationStart,
    handleAcceptDeal,
    handleNegotiationSubmit
  }
}
