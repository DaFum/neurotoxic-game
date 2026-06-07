import { useRef, useState, useCallback } from 'react'

export type ProcessingGuardReturn = {
  isProcessingAction: boolean
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  guardedCallback: <T extends (...args: never[]) => void>(callback: T) => T
}

export function useProcessingGuard(): ProcessingGuardReturn {
  const isProcessingActionRef = useRef(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const guardedCallback = useCallback(
    <T extends (...args: never[]) => void>(callback: T) => {
      return ((...args: Parameters<T>) => {
        if (isProcessingActionRef.current) return
        isProcessingActionRef.current = true
        setIsProcessingAction(true)

        try {
          callback(...args)
        } finally {
          // If queueMicrotask was needed we would add it, but tests rely on immediate flush
          // for the non-continue handlers.
          isProcessingActionRef.current = false
          setIsProcessingAction(false)
        }
      }) as T
    },
    []
  )

  return {
    isProcessingAction,
    isProcessingActionRef,
    setIsProcessingAction,
    guardedCallback
  }
}
