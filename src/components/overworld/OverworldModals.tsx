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

export const OverworldModals = React.memo(
  ({ modals }: OverworldModalsProps) => {
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
  },
  (prev, next) => {
    const p = prev.modals
    const n = next.modals
    return (
      p.hq.showHQ === n.hq.showHQ &&
      p.quests.showQuests === n.quests.showQuests &&
      p.stash.showStash === n.stash.showStash &&
      p.pirateRadio.showPirateRadio === n.pirateRadio.showPirateRadio &&
      p.merchPress.showMerchPress === n.merchPress.showMerchPress &&
      p.bloodBank.showBloodBank === n.bloodBank.showBloodBank &&
      p.darkWebLeak.showDarkWebLeak === n.darkWebLeak.showDarkWebLeak &&
      p.supplyStop.showSupplyStop === n.supplyStop.showSupplyStop &&
      p.quests.questsProps === n.quests.questsProps &&
      p.stash.stashProps === n.stash.stashProps &&
      p.supplyStop.supplyStopInventory === n.supplyStop.supplyStopInventory &&
      p.pirateRadio.canBroadcast === n.pirateRadio.canBroadcast &&
      p.pirateRadio.hasBroadcastedToday === n.pirateRadio.hasBroadcastedToday &&
      p.merchPress.canPress === n.merchPress.canPress &&
      p.bloodBank.canDonate === n.bloodBank.canDonate &&
      p.bloodBank.canDonateMarrow === n.bloodBank.canDonateMarrow &&
      p.darkWebLeak.canLeak === n.darkWebLeak.canLeak &&
      p.darkWebLeak.hasLeakedToday === n.darkWebLeak.hasLeakedToday &&
      p.merchPress.config === n.merchPress.config &&
      p.merchPress.triggerPress === n.merchPress.triggerPress &&
      p.bloodBank.config === n.bloodBank.config &&
      p.bloodBank.marrowConfig === n.bloodBank.marrowConfig &&
      p.bloodBank.triggerDonate === n.bloodBank.triggerDonate &&
      p.darkWebLeak.DARK_WEB_LEAK_CONFIG ===
        n.darkWebLeak.DARK_WEB_LEAK_CONFIG &&
      p.darkWebLeak.triggerLeak === n.darkWebLeak.triggerLeak &&
      p.pirateRadio.PIRATE_RADIO_CONFIG === n.pirateRadio.PIRATE_RADIO_CONFIG &&
      p.pirateRadio.triggerBroadcast === n.pirateRadio.triggerBroadcast &&
      p.hq.closeHQ === n.hq.closeHQ &&
      p.pirateRadio.closePirateRadio === n.pirateRadio.closePirateRadio &&
      p.merchPress.closeMerchPress === n.merchPress.closeMerchPress &&
      p.bloodBank.closeBloodBank === n.bloodBank.closeBloodBank &&
      p.darkWebLeak.closeDarkWebLeak === n.darkWebLeak.closeDarkWebLeak &&
      p.supplyStop.closeSupplyStop === n.supplyStop.closeSupplyStop
    )
  }
)

OverworldModals.displayName = 'OverworldModals'
