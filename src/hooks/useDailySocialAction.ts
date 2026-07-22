import { useCallback, useState } from 'react'
import { audioService } from '../utils/audio/audioEngine'
import { logger } from '../utils/logger'

type DailySocialActionOptions<Payload, Config> = {
  config: Config
  loggerScope: string
  validationFailureMessage: string
  successMessageKey: string
  validate: () => boolean
  hasRunToday: () => boolean
  dispatchAction: (payload: Payload) => void
  buildPayload: (successMessageKey: string) => Payload
}

export const useDailySocialAction = <Payload, Config>({
  config,
  loggerScope,
  validationFailureMessage,
  successMessageKey,
  validate,
  hasRunToday,
  dispatchAction,
  buildPayload
}: DailySocialActionOptions<Payload, Config>) => {
  const [showModal, setShowModal] = useState(false)

  const openModal = useCallback(() => setShowModal(true), [])
  const closeModal = useCallback(() => setShowModal(false), [])

  const hasRunTodayValue = hasRunToday()
  let canRun = false
  try {
    canRun = validate()
  } catch (error) {
    logger.error(loggerScope, validationFailureMessage, {
      error,
      config
    })
    canRun = false
  }

  const trigger = useCallback(() => {
    if (!canRun || hasRunToday()) return

    audioService.playSFX('cash')
    dispatchAction(buildPayload(successMessageKey))
    closeModal()
  }, [
    buildPayload,
    canRun,
    closeModal,
    dispatchAction,
    hasRunToday,
    successMessageKey
  ])

  return {
    showModal,
    hasRunToday: hasRunTodayValue,
    openModal,
    closeModal,
    trigger,
    canRun,
    config
  }
}
