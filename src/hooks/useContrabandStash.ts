import { useState, useCallback, useMemo } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { useTranslation } from 'react-i18next'
import {
  validateStashItemSelection,
  getStashItemUseMessage
} from '../utils/contrabandStashUtils'
import { logger } from '../utils/logger'
import {
  isPackedContrabandEntry,
  resolveActiveExpeditionCargo
} from '../domain/expedition/cargo'
import type { ContrabandStashItem, StashItem } from '../types'
import { useDisclosure } from './useDisclosure'

/**
 * Hook to manage the Contraband Stash UI state and actions.
 * @returns Stash state and handlers
 */
export const useContrabandStash = () => {
  const band = useGameSelector(state => state.band)
  const expedition = useGameSelector(state => state.expedition)
  // The effective cargo also covers an older active save that never stored
  // one; an active run whose cargo cannot be resolved shows nothing usable.
  const packedContraband = useMemo(
    () =>
      expedition?.status === 'active'
        ? (resolveActiveExpeditionCargo({ expedition })?.contraband ?? [])
        : null,
    [expedition]
  )
  const { useContraband: dispatchUseContraband, addToast } = useGameActions()
  const {
    isOpen: showStash,
    open: openStash,
    close: closeStash
  } = useDisclosure()
  const [selectedMember, setSelectedMember] = useState(band.members[0]?.id)
  const { t } = useTranslation(['ui'])

  // During a Tour only the committed cargo is usable, so only it is listed.
  const stashArray = useMemo<StashItem[]>(() => {
    const items = Object.values(band.stash ?? {}) as StashItem[]
    if (packedContraband === null) return items
    // Show the packed stack count, not the owned one: only that many can be used.
    return items.flatMap(item => {
      const packed = packedContraband.find(entry =>
        isPackedContrabandEntry(entry, item.id, item.instanceId)
      )
      return packed ? [{ ...item, stacks: packed.stacks }] : []
    })
  }, [band.stash, packedContraband])

  const handleUseItem = useCallback(
    (instanceId: string, item: ContrabandStashItem) => {
      const validation = validateStashItemSelection(item, selectedMember)
      if (!validation.isValid) {
        if (!validation.silent) {
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

      // The reducer (`handleUseContraband`) is the authority and no-ops for a
      // stale instanceId or an already-applied item, returning unchanged state.
      // Dispatch does not update refs synchronously, so predict acceptance from
      // the live pre-dispatch stash to keep success feedback honest. Object.hasOwn
      // guards prototype keys; the entry checks mirror the reducer's state gates.
      const stash = band?.stash ?? {}
      const entry = Object.hasOwn(stash, item.id)
        ? (stash[item.id] as Record<string, unknown> | undefined)
        : undefined
      // During a Tour the reducer also needs a packed entry for this exact
      // instance (a null packed instance matches any), so predict that too.
      const isPacked =
        packedContraband === null ||
        packedContraband.some(packed =>
          isPackedContrabandEntry(packed, item.id, instanceId)
        )
      const willApply =
        isPacked &&
        entry != null &&
        (entry.instanceId === undefined || entry.instanceId === instanceId) &&
        entry.applied !== true
      if (!willApply) {
        addToast(
          t('ui:stash.alreadyUsed', {
            defaultValue: "That item can't be used right now."
          }),
          'warning'
        )
        return
      }

      dispatchUseContraband(instanceId, item.id, selectedMember)

      const message = getStashItemUseMessage(item, t)
      addToast(t(message.key, message.options), 'success')
    },
    [
      band?.stash,
      packedContraband,
      dispatchUseContraband,
      selectedMember,
      addToast,
      t
    ]
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
