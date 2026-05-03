import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem } from '../../types/components'
import type { PlayerState } from '../../types/game'

type UpgradesTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money' | 'fame'>
  upgrades: CatalogItem[]
}

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
