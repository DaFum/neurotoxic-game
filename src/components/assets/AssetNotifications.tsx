import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { useForeclosureModal } from '../../hooks/useForeclosureModal'
import type { RiskEventDescriptor } from '../../types/assets'
import { ForeclosureModal } from './ForeclosureModal'
import { RiskEventModal } from './RiskEventModal'
import './assetsHub.css'

/**
 * Global owner for asset risk-event and foreclosure modals.
 *
 * @remarks
 * Risk events and foreclosure notices are raised by `advanceDay()` and can fire
 * from any scene, so these modals are mounted near the app shell rather than
 * inside `AssetsScene` — otherwise a notice raised in OVERWORLD would never be
 * shown until the player happened to open the Assets hub. This is the single
 * render site; do not also render these modals inside a scene or they appear
 * twice. `lastRiskEvent` keeps the risk card mounted through its close
 * animation after `pendingRiskEvent` clears.
 */
export const AssetNotifications = () => {
  const { t } = useTranslation(['assets'])
  const pendingRiskEvent = useGameSelector(state => state.pendingRiskEvent)
  const { setPendingRiskEvent } = useGameActions()
  const foreclosureModal = useForeclosureModal()
  const [lastRiskEvent, setLastRiskEvent] =
    useState<RiskEventDescriptor | null>(null)
  const activeRiskEvent = pendingRiskEvent ?? lastRiskEvent
  const isRiskEventOpen = Boolean(pendingRiskEvent)

  const foreclosureAssetLabel = foreclosureModal.currentKind
    ? t(`assets:kind.${foreclosureModal.currentKind}`)
    : undefined

  const closeRiskEventModal = useCallback(() => {
    if (activeRiskEvent) setLastRiskEvent(activeRiskEvent)
    setPendingRiskEvent(null)
  }, [activeRiskEvent, setPendingRiskEvent])

  return (
    <>
      {activeRiskEvent ? (
        <RiskEventModal
          eventType={activeRiskEvent.eventType}
          isOpen={isRiskEventOpen}
          onClose={closeRiskEventModal}
        />
      ) : null}

      <ForeclosureModal
        isOpen={foreclosureModal.isOpen}
        assetLabel={foreclosureAssetLabel}
        onClose={foreclosureModal.dismiss}
      />
    </>
  )
}
