import { useBandHQModal } from '../useBandHQModal'
import { useQuestsModal } from '../useQuestsModal'
import { useContrabandStash } from '../useContrabandStash'
import { usePirateRadio } from '../usePirateRadio'
import { useMerchPress } from '../useMerchPress'
import { useBloodBank } from '../useBloodBank'
import { useDarkWebLeak } from '../useDarkWebLeak'

export const useOverworldModals = () => {
  const hq = useBandHQModal()
  const quests = useQuestsModal()
  const stash = useContrabandStash()
  const pirateRadio = usePirateRadio()
  const merchPress = useMerchPress()
  const bloodBank = useBloodBank()
  const darkWebLeak = useDarkWebLeak()

  return {
    hq,
    quests,
    stash,
    pirateRadio,
    merchPress,
    bloodBank,
    darkWebLeak,
  }
}
