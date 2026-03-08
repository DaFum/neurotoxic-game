import { logger } from './logger.js'
import { handleError } from './errorHandler.js'
import { GAME_PHASES } from '../context/gameConstants.js'
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
 */
export const handleNodeArrival = ({
  node,
  band,
  updateBand,
  triggerEvent,
  startGig,
  addToast,
  changeScene,
  onShowHQ,
  eventAlreadyActive = false
}) => {
  switch (node.type) {
    case 'REST_STOP': {
      const newMembers = (band?.members ?? []).map(m => ({
        ...m,
        stamina: Math.min(100, Math.max(0, m.stamina + 20)),
        mood: Math.min(100, Math.max(0, m.mood + 10))
      }))
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
