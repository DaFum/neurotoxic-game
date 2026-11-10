import { useState, useRef, useEffect, useCallback } from 'react'

export type MainMenuModal =
  | null
  | { type: 'nameInput' }
  | { type: 'socials' }
  | { type: 'features' }
  | { type: 'existingSave'; target: 'tour' | 'expedition' }

type ModalType = Exclude<NonNullable<MainMenuModal>, null>['type']

const toggleModalState = (
  current: MainMenuModal,
  type: ModalType,
  show: boolean | ((prev: boolean) => boolean),
  createModal: () => NonNullable<MainMenuModal>
): MainMenuModal => {
  const isShowing = current?.type === type
  const next = typeof show === 'function' ? show(isShowing) : show
  if (next) {
    return isShowing && current ? current : createModal()
  }
  return isShowing ? null : current
}

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
      setActiveModal(current =>
        toggleModalState(current, 'nameInput', show, () => ({
          type: 'nameInput'
        }))
      )
    },
    []
  )

  const setShowSocials = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current =>
        toggleModalState(current, 'socials', show, () => ({ type: 'socials' }))
      )
    },
    []
  )

  const setShowFeatures = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current =>
        toggleModalState(current, 'features', show, () => ({
          type: 'features'
        }))
      )
    },
    []
  )

  const setShowExistingSavePrompt = useCallback(
    (show: boolean | ((prev: boolean) => boolean)) => {
      setActiveModal(current =>
        toggleModalState(current, 'existingSave', show, () => ({
          type: 'existingSave',
          target: 'tour'
        }))
      )
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
