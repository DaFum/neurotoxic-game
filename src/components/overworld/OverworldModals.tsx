import React from 'react'
import { BandHQ } from '../../ui/BandHQ'
import { QuestsModal } from '../../ui/QuestsModal'
import { ContrabandStash } from '../../ui/ContrabandStash'
import { PirateRadioModal } from '../../ui/PirateRadioModal'
import { MerchPressModal } from '../../ui/MerchPressModal'
import { BloodBankModal } from '../../ui/BloodBankModal'
import { DarkWebLeakModal } from '../../ui/DarkWebLeakModal'
import { SupplyStopModal } from '../../ui/SupplyStopModal'
import { useOverworldModals } from '../../hooks/overworld/useOverworldModals'

interface OverworldModalsProps {
  modals: ReturnType<typeof useOverworldModals>
}

export const OverworldModals = React.memo(({ modals }: OverworldModalsProps) => {
  const {
    hq: { showHQ, closeHQ },
    quests: { showQuests, questsProps },
    stash: { showStash, stashProps },
    pirateRadio: {
      showPirateRadio,
      closePirateRadio,
      triggerBroadcast,
      canBroadcast,
      hasBroadcastedToday,
      PIRATE_RADIO_CONFIG
    },
    merchPress: {
      showMerchPress,
      closeMerchPress,
      triggerPress,
      canPress,
      config: merchPressConfig
    },
    bloodBank: {
      showBloodBank,
      closeBloodBank,
      triggerDonate,
      canDonate,
      canDonateMarrow,
      config: bloodBankConfig,
      marrowConfig
    },
    darkWebLeak: {
      showDarkWebLeak,
      closeDarkWebLeak,
      triggerLeak,
      canLeak: canDarkWebLeak,
      hasLeakedToday,
      DARK_WEB_LEAK_CONFIG
    },
    supplyStop: { showSupplyStop, supplyStopInventory, closeSupplyStop }
  } = modals

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
          canDonateMarrow={canDonateMarrow}
          config={bloodBankConfig}
          marrowConfig={marrowConfig}
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
      {showSupplyStop && supplyStopInventory && (
        <SupplyStopModal
          inventory={supplyStopInventory}
          onClose={closeSupplyStop}
        />
      )}
    </>
  )
})

OverworldModals.displayName = 'OverworldModals'
