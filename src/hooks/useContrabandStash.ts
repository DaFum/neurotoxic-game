import { useState, useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { useTranslation } from 'react-i18next'
import {
  validateStashItemSelection,
  getStashItemUseMessage
} from '../utils/contrabandStashUtils'
import { logger } from '../utils/logger'
import type { ContrabandStashItem, StashItem } from '../types'

/**
 * Hook to manage the Contraband Stash UI state and actions.
 * @returns {Object} Stash state and handlers
 */
export const useContrabandStash = () => {
  const band = useGameSelector(state => state.band)
  const { useContraband: dispatchUseContraband, addToast } = useGameActions()
  const [showStash, setShowStash] = useState(false)
  const [selectedMember, setSelectedMember] = useState(band.members[0]?.id)
  const { t } = useTranslation(['ui'])

  const openStash = useCallback(() => setShowStash(true), [])
  const closeStash = useCallback(() => setShowStash(false), [])

  const stashArray = useMemo<StashItem[]>(
    () => Object.values(band.stash ?? {}) as StashItem[],
    [band.stash]
  )

  const handleUseItem = useCallback(
    (instanceId: string, item: ContrabandStashItem) => {
      const validation = validateStashItemSelection(item, selectedMember)
      if (!validation.isValid) {
        if (validation.errorKey) {
          addToast(
            t(validation.errorKey, {
              defaultValue: validation.defaultMessage
            }),
            'warning'
          )
        }
        return
      }

      if (!item.id) {
        addToast(
          t('ui:stash.missingItemId', {
            defaultValue: 'Unable to use contraband: missing item id'
          }),
          'warning'
        )
        logger.warn('ContrabandStash', 'Unable to use item: missing item id', {
          instanceId,
          selectedMember
        })
        return
      }
      dispatchUseContraband(instanceId, item.id, selectedMember)

      const message = getStashItemUseMessage(item, t)
      addToast(t(message.key, message.options), 'success')
    },
    [dispatchUseContraband, selectedMember, addToast, t]
  )

  return {
    showStash,
    openStash,
    closeStash,
    stashProps: {
      stash: stashArray,
      members: band.members,
      selectedMember,
      setSelectedMember,
      handleUseItem,
      onClose: closeStash
    }
  }
}
