// TODO: Implement this
import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState'
import { useTranslation } from 'react-i18next'

/**
 * Hook to manage the Contraband Stash UI state and actions.
 * @returns {Object} Stash state and handlers
 */
export const useContrabandStash = () => {
  const { band, useContraband, addToast } = useGameState()
  const [showStash, setShowStash] = useState(false)
  const [selectedMember, setSelectedMember] = useState(band.members[0]?.id)
  const { t } = useTranslation(['ui'])

  const openStash = useCallback(() => setShowStash(true), [])
  const closeStash = useCallback(() => setShowStash(false), [])

  const stashArray = useMemo(
    () => Object.values(band.stash || {}),
    [band.stash]
  )

  const useItem = useCallback(
    (instanceId, item) => {
      // If it's a member-targeted effect but no member selected, error
      if (
        (item.effectType === 'stamina' || item.effectType === 'mood') &&
        !selectedMember
      ) {
        addToast(
          t('ui:stash.selectMemberFirst', {
            defaultValue: 'Select a band member first!'
          }),
          'warning'
        )
        return
      }

      useContraband(instanceId, item.id, selectedMember)

      const translatedName = t(item.name, { defaultValue: item.name })
      const messageAction =
        item.type === 'consumable'
          ? t('ui:stash.actionUsed', { defaultValue: 'Used' })
          : t('ui:stash.actionApplied', { defaultValue: 'Applied' })
      addToast(
        t('ui:stash.itemUsed', {
          itemName: translatedName,
          action: messageAction,
          defaultValue: `${messageAction} ${translatedName}!`
        }),
        'success'
      )
    },
    [useContraband, selectedMember, addToast, t]
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
      useItem,
      onClose: closeStash
    }
  }
}
