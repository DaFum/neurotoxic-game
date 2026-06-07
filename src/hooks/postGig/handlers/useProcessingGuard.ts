import { useRef, useState } from 'react'

export type ProcessingGuardReturn = {
  isProcessingAction: boolean
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
}

export function useProcessingGuard(): ProcessingGuardReturn {
  const isProcessingActionRef = useRef(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  return { isProcessingAction, isProcessingActionRef, setIsProcessingAction }
}
