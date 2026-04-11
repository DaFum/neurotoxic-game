// TODO: Review this file
import { logger } from './logger.js'
import { handleError } from './errorHandler.js'
import { GAME_PHASES } from '../context/gameConstants.js'
import {
  clampMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel,
  clampBandHarmony,
  BALANCE_CONSTANTS
} from './gameStateUtils.js'
import { secureRandom } from './crypto.js'
import i18n from '../i18n.js'

/**
 * Shared logic for handling arrival at a map node.
 * This can be used by both the legacy travel system and the new arrival logic hook.
 *
 * @param {object} params
 * @param {object} params.node - The node being arrived at.
 * @param {object} params.band - Current band state.
 * @param {object} params.player - Current player state (inventory, stats, etc.).
 * @param {Function} params.updateBand - Function to update band state.
 * @param {Function} params.updatePlayer - Function to update player state (handles side effects).
 * @param {Function} params.triggerEvent - Function to trigger events.
 * @param {Function} params.startGig - Function to start a gig.
 * @param {Function} params.addToast - Function to show notifications.
 * @param {Function} [params.changeScene] - Function to change scene (fallback).
 * @param {Function} [params.onShowHQ] - Optional callback to show HQ (for START node).
 * @param {boolean} [params.eventAlreadyActive=false] - Whether an event is already active (to prevent stacking).
 * @param {Function} [params.rng=secureRandom] - RNG function for probabilistic outcomes.
 */
/**
 * Calculates new harmony value if band has harmony regen active.
 * @param {object} band - The current band state.
 * @returns {number|null} The new harmony value, or null if regen is not applicable.
 */
export const processHarmonyRegen = band => {
  if (band?.harmonyRegenTravel) {
    return clampBandHarmony((band.harmony ?? 0) + 5)
  }
  return null
}

/**
 * Checks if the current node is a gig node.
 * @param {object} node - The current node.
 * @returns {boolean} True if the node is a GIG, FESTIVAL, or FINALE.
 */
export const isGigNode = node => {
  return (
    node?.type === 'GIG' || node?.type === 'FESTIVAL' || node?.type === 'FINALE'
  )
}

/**
 * Triggers travel events if applicable for the current node.
 * @param {object} node - The current node.
 * @param {Function} triggerEvent - The function to trigger events.
 * @returns {boolean} True if a travel event was triggered.
 */
export const processTravelEvents = (node, triggerEvent) => {
  if (isGigNode(node)) {
    return false
  }

  let travelEventActive = triggerEvent('transport', 'travel')
  if (!travelEventActive) {
    travelEventActive = triggerEvent('band', 'travel')
  }
  return travelEventActive
}

export const handleNodeArrival = ({
  node,
  band,
  player,
  updateBand,
  updatePlayer,
  triggerEvent,
  startGig,
  addToast,
  changeScene,
  onShowHQ,
  eventAlreadyActive = false,
  rng = secureRandom
}) => {
  switch (node.type) {
    case 'REST_STOP': {
      const members = band?.members ?? []
      const newMembers = new Array(members.length)
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        const newStamina = clampMemberStamina(m.stamina + 20, m.staminaMax)
        const newMood = clampMemberMood(m.mood + 10)
        newMembers[i] = {
          ...m,
          stamina: newStamina,
          mood: newMood
        }
      }
      updateBand({ members: newMembers })
      addToast(
        i18n.t('ui:arrival.restedAtStop', {
          defaultValue: 'Rested at stop. Band feels better.'
        }),
        'success'
      )
      break
    }
    case 'SPECIAL': {
      if (!eventAlreadyActive) {
        const specialEvent = triggerEvent('special')
        if (!specialEvent) {
          addToast(
            i18n.t('ui:arrival.specialNothingHappened', {
              defaultValue: 'A mysterious place, but nothing happened.'
            }),
            'info'
          )
        }
      }
      break
    }
    case 'START': {
      if (onShowHQ) onShowHQ()
      addToast(
        i18n.t('ui:arrival.homeSweetHome', {
          defaultValue: 'Home Sweet Home.'
        }),
        'success'
      )
      break
    }
    case 'FESTIVAL':
    case 'FINALE':
    case 'GIG': {
      const harmony = clampBandHarmony(band?.harmony)

      // Show cancellation check: Deterministic for harmony <= 1, probabilistic for low harmony (Chaos Tour Mechanic)
      const isLowHarmony = harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
      const luckCheck =
        rng() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
      const shouldCancel = harmony <= 1 || (isLowHarmony && luckCheck)

      if (shouldCancel) {
        addToast(
          i18n.t('ui:arrival.showCancelled', {
            defaultValue:
              'Show cancelled! The band refused to go on stage due to low harmony.'
          }),
          'error'
        )

        // Apply fame penalty directly (double the standard bad gig loss)
        if (player && updatePlayer) {
          const currentFame = player.fame || 0
          const loss = BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
          const newFame = clampPlayerFame(currentFame - loss)
          updatePlayer({
            fame: newFame,
            fameLevel: calculateFameLevel(newFame)
          })
        }

        if (changeScene) changeScene(GAME_PHASES.OVERWORLD)
        return
      }

      logger.info('ArrivalLogic', 'Starting Gig at destination', {
        venue: node.venue.name
      })
      try {
        startGig(node.venue)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:arrival.failedToStartGig', {
            defaultValue: 'Failed to start Gig.'
          })
        })
      }
      break
    }
  }
}
