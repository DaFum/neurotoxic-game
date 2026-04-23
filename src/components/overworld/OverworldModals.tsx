import React from 'react'
import { BandHQ } from '../../ui/BandHQ'
import { QuestsModal } from '../../ui/QuestsModal'
import { ContrabandStash } from '../../ui/ContrabandStash'
import { PirateRadioModal } from '../../ui/PirateRadioModal'
import { MerchPressModal } from '../../ui/MerchPressModal'
import { BloodBankModal } from '../../ui/BloodBankModal'
import { DarkWebLeakModal } from '../../ui/DarkWebLeakModal'

export interface OverworldModalsProps {
  // Band HQ
  showHQ: boolean
  closeHQ: () => void

  // Quests
  showQuests: boolean
  questsProps: any // Ideally this should be properly typed, but avoiding structural changes

  // Stash
  showStash: boolean
  stashProps: any // Same as questsProps

  // Pirate Radio
  showPirateRadio: boolean
  closePirateRadio: () => void
  triggerBroadcast: () => void
  canBroadcast: boolean
  hasBroadcastedToday: boolean
  PIRATE_RADIO_CONFIG: any

  // Merch Press
  showMerchPress: boolean
  closeMerchPress: () => void
  triggerPress: () => void
  canPress: boolean
  merchPressConfig: any

  // Blood Bank
  showBloodBank: boolean
  closeBloodBank: () => void
  triggerDonate: () => void
  canDonate: boolean
  bloodBankConfig: any

  // Dark Web Leak
  showDarkWebLeak: boolean
  closeDarkWebLeak: () => void
  triggerLeak: () => void
  canDarkWebLeak: boolean
  hasLeakedToday: boolean
  DARK_WEB_LEAK_CONFIG: any
}

export const OverworldModals = React.memo(
  ({
    showHQ,
    closeHQ,
    showQuests,
    questsProps,
    showStash,
    stashProps,
    showPirateRadio,
    closePirateRadio,
    triggerBroadcast,
    canBroadcast,
    hasBroadcastedToday,
    PIRATE_RADIO_CONFIG,
    showMerchPress,
    closeMerchPress,
    triggerPress,
    canPress,
    merchPressConfig,
    showBloodBank,
    closeBloodBank,
    triggerDonate,
    canDonate,
    bloodBankConfig,
    showDarkWebLeak,
    closeDarkWebLeak,
    triggerLeak,
    canDarkWebLeak,
    hasLeakedToday,
    DARK_WEB_LEAK_CONFIG
  }: OverworldModalsProps) => {
    return (
      <>
        {showHQ && <BandHQ onClose={closeHQ} />}
        {showQuests && <QuestsModal {...questsProps} />}
        {showStash && <ContrabandStash {...stashProps} />}
        {showPirateRadio && (
          <PirateRadioModal
            onClose={closePirateRadio}
            onBroadcast={triggerBroadcast}
            canBroadcast={canBroadcast}
            hasBroadcastedToday={hasBroadcastedToday}
            config={PIRATE_RADIO_CONFIG}
          />
        )}
        {showMerchPress && (
          <MerchPressModal
            onClose={closeMerchPress}
            onPress={triggerPress}
            canPress={canPress}
            config={merchPressConfig}
          />
        )}
        {showBloodBank && (
          <BloodBankModal
            onClose={closeBloodBank}
            onDonate={triggerDonate}
            canDonate={canDonate}
            config={bloodBankConfig}
          />
        )}
        {showDarkWebLeak && (
          <DarkWebLeakModal
            onCancel={closeDarkWebLeak}
            onConfirm={triggerLeak}
            canLeak={canDarkWebLeak}
            hasLeakedToday={hasLeakedToday}
            config={DARK_WEB_LEAK_CONFIG}
          />
        )}
      </>
    )
  }
)

OverworldModals.displayName = 'OverworldModals'
