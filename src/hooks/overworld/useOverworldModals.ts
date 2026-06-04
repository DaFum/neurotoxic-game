import { useBandHQModal } from '../useBandHQModal'
import { useQuestsModal } from '../useQuestsModal'
import { useContrabandStash } from '../useContrabandStash'
import { usePirateRadio } from '../usePirateRadio'
import { useMerchPress } from '../useMerchPress'
import { useBloodBank } from '../useBloodBank'
import { useDarkWebLeak } from '../useDarkWebLeak'
import { useSupplyStopModal } from './useSupplyStopModal'

/**
 * Composes all modal state hooks used by the Overworld screen.
 *
 * @returns Modal state and controls grouped by modal domain.
 */
export const useOverworldModals = () => {
  const hq = useBandHQModal()
  const quests = useQuestsModal()
  const stash = useContrabandStash()
  const pirateRadio = usePirateRadio()
  const merchPress = useMerchPress()
  const bloodBank = useBloodBank()
  const darkWebLeak = useDarkWebLeak()
  const supplyStop = useSupplyStopModal()

  return {
    hq,
    quests,
    stash,
    pirateRadio,
    merchPress,
    bloodBank,
    darkWebLeak,
    supplyStop
  }
}
