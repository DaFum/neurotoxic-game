// @ts-nocheck
import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState'
import { useTranslation } from 'react-i18next'
import {
  validateStashItemSelection,
  getStashItemUseMessage
} from '../utils/contrabandStashUtils'

/**
 * Hook to manage the Contraband Stash UI state and actions.
 * @returns {Object} Stash state and handlers
 */
export const useContrabandStash = () => {
  const {
    band,
    useContraband: dispatchUseContraband,
    addToast
  } = useGameState()
  const [showStash, setShowStash] = useState(false)
  const [selectedMember, setSelectedMember] = useState(band.members[0]?.id)
  const { t } = useTranslation(['ui'])

  const openStash = useCallback(() => setShowStash(true), [])
  const closeStash = useCallback(() => setShowStash(false), [])

  const stashArray = useMemo(
    () => Object.values(band.stash || {}),
    [band.stash]
  )

  const handleUseItem = useCallback(
    (instanceId, item) => {
      const validation = validateStashItemSelection(item, selectedMember)
      if (!validation.isValid) {
        addToast(
          t(validation.errorKey, {
            defaultValue: validation.defaultMessage
          }),
          'warning'
        )
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
