import { BandHQ } from '../../ui/BandHQ'
import { QuestsModal } from '../../ui/QuestsModal'
import { ContrabandStash } from '../../ui/ContrabandStash'
import { PirateRadioModal } from '../../ui/PirateRadioModal'
import { MerchPressModal } from '../../ui/MerchPressModal'
import { BloodBankModal } from '../../ui/BloodBankModal'
import { DarkWebLeakModal } from '../../ui/DarkWebLeakModal'
import { CultIndoctrinationModal } from '../../ui/CultIndoctrinationModal'
import { SupplyStopModal } from '../../ui/SupplyStopModal'
import { useOverworldModals } from '../../hooks/overworld/useOverworldModals'

interface OverworldModalsProps {
  modals: ReturnType<typeof useOverworldModals>
}

/**
 * Mounts the active modal stack for overworld management and hustle actions.
 *
 * @remarks
 * Renders nothing while every modal is closed, so it is not memoized: a custom
 * comparator here would have to mirror every field of the modal bundle by hand.
 *
 * @param props - Modal state bundle for the overworld modal stack.
 */
export const OverworldModals = ({ modals }: OverworldModalsProps) => {
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
    cultIndoctrination: {
      showCultIndoctrination,
      closeCultIndoctrination,
      triggerIndoctrination,
      canIndoctrinate,
      hasIndoctrinatedToday,
      CULT_INDOCTRINATION_CONFIG
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
      {showCultIndoctrination && (
        <CultIndoctrinationModal
          onCancel={closeCultIndoctrination}
          onConfirm={triggerIndoctrination}
          canIndoctrinate={canIndoctrinate}
          hasIndoctrinatedToday={hasIndoctrinatedToday}
          config={CULT_INDOCTRINATION_CONFIG}
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
}
