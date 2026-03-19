// TODO: Review this file
import { logger } from './logger.js'
import { handleError } from './errorHandler.js'
import { GAME_PHASES } from '../context/gameConstants.js'
import { clampMemberStamina, clampMemberMood, clampPlayerFame, BALANCE_CONSTANTS } from './gameStateUtils.js'
import { secureRandom } from './crypto.js'
import i18n from '../i18n.js'

/**
 * Shared logic for handling arrival at a map node.
 * This can be used by both the legacy travel system and the new arrival logic hook.
 *
 * @param {object} params
 * @param {object} params.node - The node being arrived at.
 * @param {object} params.band - Current band state.
 * @param {Function} params.updateBand - Function to update band state.
 * @param {Function} params.triggerEvent - Function to trigger events.
 * @param {Function} params.startGig - Function to start a gig.
 * @param {Function} params.addToast - Function to show notifications.
 * @param {Function} [params.changeScene] - Function to change scene (fallback).
 * @param {Function} [params.onShowHQ] - Optional callback to show HQ (for START node).
 * @param {boolean} [params.eventAlreadyActive=false] - Whether an event is already active (to prevent stacking).
 * @param {Function} [params.rng=secureRandom] - RNG function for probabilistic outcomes.
 */
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
      const newMembers = (band?.members ?? []).map(m => {
        const newStamina = clampMemberStamina(m.stamina + 20, m.staminaMax)
        const newMood = clampMemberMood(m.mood + 10)
        return {
          ...m,
          stamina: newStamina,
          mood: newMood
        }
      })
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
      if ((band?.harmony ?? 0) <= 0) {
        addToast(
          i18n.t('ui:arrival.harmonyTooLowToPerform', {
            defaultValue: "Band's harmony too low to perform!"
          }),
          'warning'
        )
        if (changeScene) changeScene(GAME_PHASES.OVERWORLD)
        return
      }

      // Chaos Tour fix: Show cancellation check
      if ((band?.harmony ?? 100) < 15 && rng() < 0.25) {
        addToast(
          i18n.t('ui:arrival.showCancelled', {
            defaultValue: "Show cancelled! The band refused to go on stage due to low harmony."
          }),
          'error'
        )
        // Apply fame penalty directly (double the standard bad gig loss)
        if (player && updatePlayer) {
           const currentFame = player.fame || 0
           const loss = BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
           const newFame = clampPlayerFame(currentFame - loss)
           updatePlayer({ fame: newFame })
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
