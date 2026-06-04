import { useState, useRef, useEffect } from 'react'

/**
 * Owns transient main-menu UI state and focus refs.
 * @returns Main-menu booleans, setters, player-name input state, and refs.
 */
export const useMainMenuState = () => {
  const isMountedRef = useRef(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [showSocials, setShowSocials] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showExistingSavePrompt, setShowExistingSavePrompt] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (showNameInput) {
      inputRef.current?.focus()
    }
  }, [showNameInput])

  return {
    isMountedRef,
    isStarting,
    setIsStarting,
    isLoadingGame,
    setIsLoadingGame,
    showNameInput,
    setShowNameInput,
    playerNameInput,
    setPlayerNameInput,
    showSocials,
    setShowSocials,
    showFeatures,
    setShowFeatures,
    showExistingSavePrompt,
    setShowExistingSavePrompt,
    inputRef
  }
}
