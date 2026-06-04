import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem } from '../../types/components'
import type { PlayerState } from '../../types'

type UpgradesTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money' | 'fame'>
  upgrades: CatalogItem[]
}

/**
 * Renders the Upgrades Tab view from player, upgrades, handleBuy, isItemOwned, isItemDisabled, getAdjustedCost, and processingItemId.
 * @param props - Player state, upgrade catalog, purchase handler, ownership/disabled checks, adjusted-cost resolver, and processing lock id.
 * @returns The rendered Upgrades Tab UI.
 */
export const UpgradesTab = ({
  player,
  upgrades,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: UpgradesTabProps) => {
  return (
    <CatalogTab
      items={upgrades}
      balances={{ fame: player.fame, money: player.money }}
      handleBuyCallback={handleBuy}
      isItemOwnedCallback={isItemOwned}
      isItemDisabledCallback={isItemDisabled}
      getAdjustedCostCallback={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}
