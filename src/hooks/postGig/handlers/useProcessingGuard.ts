import { useRef, useState } from 'react'

/** Re-entrancy guard state for post-gig handlers: a synchronous ref plus its React-state mirror. */
type ProcessingGuardReturn = {
  isProcessingAction: boolean
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Provides a re-entrancy guard so a post-gig action cannot run twice
 * concurrently: a synchronous `ref` for immediate checks plus a state flag for
 * rendering disabled controls.
 */
export function useProcessingGuard(): ProcessingGuardReturn {
  const isProcessingActionRef = useRef(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  return { isProcessingAction, isProcessingActionRef, setIsProcessingAction }
}
