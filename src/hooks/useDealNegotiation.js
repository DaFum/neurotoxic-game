/**
 * (#1) Actual Updates: Extracted deal negotiation state and logic from `DealsPhase.tsx` into a reusable hook `useDealNegotiation.js` to improve component readability and maintainability.
 * (#2) Next Steps: Consider writing tests for the `useDealNegotiation` hook, ensuring different negotiation outcomes and cleanup are properly verified.
 * (#3) Found Errors + Solutions: No errors found.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { negotiateDeal } from '../utils/socialEngine'
import { handleError } from '../utils/errorHandler.js'

export const useDealNegotiation = ({ onAccept }) => {
  const { t } = useTranslation()
  const { player, band, social, addToast } = useGameState()
  const [negotiatedDeals, setNegotiatedDeals] = useState({}) // id: { status, deal }

  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [negotiationResult, setNegotiationResult] = useState(null) // To show result in modal before closing
  const negotiationTimerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (negotiationTimerRef.current) {
        clearTimeout(negotiationTimerRef.current)
      }
    }
  }, [])

  const handleNegotiationStart = useCallback(deal => {
    setSelectedDeal(deal)
    setNegotiationResult(null)
    setNegotiationModalOpen(true)
  }, [])

  const handleAcceptDeal = useCallback(
    async deal => {
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

  const handleNegotiationSubmit = strategy => {
    if (!selectedDeal) return

    try {
      const gameState = { player, band, social }
      const result = negotiateDeal(selectedDeal, strategy, gameState)

      setNegotiationResult(result)

      if (result.status === 'REVOKED') {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'REVOKED', deal: null }
        }))
        addToast(result.feedback, 'error')
      } else if (result.status === 'FAILED') {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'FAILED', deal: selectedDeal }
        }))
        addToast(result.feedback, 'warning')
      } else if (result.success) {
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'SUCCESS', deal: result.deal }
        }))
        addToast(result.feedback, 'success')
      } else {
        // Accepted but worse terms (Persuasive fail)
        setNegotiatedDeals(prev => ({
          ...prev,
          [selectedDeal.id]: { status: 'WORSENED', deal: result.deal }
        }))
        addToast(result.feedback, 'warning')
      }

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
