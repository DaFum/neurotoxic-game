import { useCallback, useState } from 'react'
import { audioService } from '../utils/audio/audioEngine'
import { logger } from '../utils/logger'

/**
 * Configuration options for the daily social action hook.
 *
 * @typeParam Payload - The structure of the action payload to be dispatched.
 * @typeParam Config - The shape of the validation configuration object.
 */
type DailySocialActionOptions<Payload, Config> = {
  /** The configuration object used to validate the action. */
  config: Config
  /** The prefix or namespace for error logs if validation fails. */
  loggerScope: string
  /** The message to log when the action validation throws an error. */
  validationFailureMessage: string
  /** The localization key used for the success message payload. */
  successMessageKey: string
  /** A function that evaluates whether the action can currently be run. */
  validate: () => boolean
  /** A function that checks if the action was already executed today. */
  hasRunToday: () => boolean
  /** A function that dispatches the built payload to the state store. */
  dispatchAction: (payload: Payload) => void
  /** A function that constructs the action payload using the success message key. */
  buildPayload: (successMessageKey: string) => Payload
}

/**
 * Manages the state and validation lifecycle for daily repeatable social actions.
 *
 * @remarks
 * This hook encapsulates common functionality for UI actions that should only occur
 * once per game day, handling modal visibility, pre-validation checks, and execution
 * with audio feedback.
 *
 * @typeParam Payload - The structure of the action payload to be dispatched.
 * @typeParam Config - The shape of the validation configuration object.
 *
 * @param options - The configuration options for the daily social action.
 *
 * @returns An object containing the modal state, capability flags, and trigger functions:
 * - `showModal` - Boolean indicating whether the action modal should be visible.
 * - `hasRunToday` - Boolean indicating if the action was already executed today.
 * - `openModal` - Function to open the action modal.
 * - `closeModal` - Function to close the action modal.
 * - `trigger` - Function to execute the action, which is gated by validation and a once-per-day check.
 * - `canRun` - Boolean indicating if the action passes the validation check.
 * - `config` - The provided configuration object.
 */
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
