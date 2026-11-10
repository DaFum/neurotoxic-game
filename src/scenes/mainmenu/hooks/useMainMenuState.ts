import { useState, useRef, useEffect, useCallback } from 'react'

export type MainMenuModal =
  | null
  | { type: 'nameInput' }
  | { type: 'socials' }
  | { type: 'features' }
  | { type: 'existingSave'; target: 'tour' | 'expedition' }

/**
 * Owns transient main-menu UI state, modal visibility, and focus refs.
 * @returns Main-menu modal state, booleans, setters, player-name input state, and refs.
 */
export const useMainMenuState = () => {
  const isMountedRef = useRef(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [activeModal, setActiveModal] = useState<MainMenuModal>(null)
  const [playerNameInput, setPlayerNameInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const showNameInput = activeModal?.type === 'nameInput'
  const showSocials = activeModal?.type === 'socials'
  const showFeatures = activeModal?.type === 'features'
  const showExistingSavePrompt = activeModal?.type === 'existingSave'

  const setShowNameInput = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current => {
        const isShowing = current?.type === 'nameInput'
        const next = typeof show === 'function' ? show(isShowing) : show
        return next
          ? { type: 'nameInput' }
          : current?.type === 'nameInput'
            ? null
            : current
      })
    },
    []
  )

  const setShowSocials = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current => {
        const isShowing = current?.type === 'socials'
        const next = typeof show === 'function' ? show(isShowing) : show
        return next
          ? { type: 'socials' }
          : current?.type === 'socials'
            ? null
            : current
      })
    },
    []
  )

  const setShowFeatures = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current => {
        const isShowing = current?.type === 'features'
        const next = typeof show === 'function' ? show(isShowing) : show
        return next
          ? { type: 'features' }
          : current?.type === 'features'
            ? null
            : current
      })
    },
    []
  )

  const setShowExistingSavePrompt = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current => {
        const isShowing = current?.type === 'existingSave'
        const next = typeof show === 'function' ? show(isShowing) : show
        return next
          ? { type: 'existingSave', target: 'tour' }
          : current?.type === 'existingSave'
            ? null
            : current
      })
    },
    []
  )

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (activeModal?.type === 'nameInput') {
      inputRef.current?.focus()
    }
  }, [activeModal])

  return {
    isMountedRef,
    isStarting,
    setIsStarting,
    isLoadingGame,
    setIsLoadingGame,
    activeModal,
    setActiveModal,
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
