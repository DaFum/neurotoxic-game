import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { LongTermAsset } from '../../types/assets'
import {
  calculateChassisRepairCost,
  getNextChassisTier
} from '../../utils/assetConfig'
import { AssetSlotActionList } from './AssetSlotActionList'
import { Tooltip } from '../../ui/shared'

/**
 * Defines the configuration properties for the AssetSectionDeck component.
 */
interface AssetSectionDeckProps {
  /** The long-term asset data model to display. */
  asset: LongTermAsset
  /** The visual React node to render as the asset's hero image or graphic. */
  hero: ReactNode
  /** The callback invoked when a specific asset slot is selected. */
  onSlotClick: (slotId: string) => void
  /** The callback invoked when the repair action is triggered. */
  onRepair: () => void
  /** The callback invoked when the upgrade action is triggered. */
  onUpgrade: () => void
  /** The callback invoked when the sell action is triggered. */
  onSell: () => void
}

/**
 * Properties for one lifecycle action button in the asset deck.
 */
interface DeckActionButtonProps {
  /** The localized button label. */
  label: string
  /** The callback invoked when the enabled button is clicked. */
  onClick: () => void
  /** Whether the action is currently unavailable. */
  disabled: boolean
  /** The localized tooltip explaining why the action is unavailable. */
  disabledReason: string
}

/**
 * Renders a deck action as a primary button, or as a muted secondary button
 * wrapped in an explanatory tooltip while the action is unavailable.
 *
 * @param props - The component properties.
 * @returns The rendered action button.
 */
const DeckActionButton = ({
  label,
  onClick,
  disabled,
  disabledReason
}: DeckActionButtonProps) => {
  const button = (
    <button
      type='button'
      onClick={e => {
        if (disabled) {
          e.preventDefault()
          return
        }
        onClick()
      }}
      aria-disabled={disabled}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-void-black assets-hub-control ${disabled ? 'assets-hub-secondary-button opacity-40 cursor-not-allowed' : 'assets-hub-primary-button'} min-h-11 border-2 px-2 py-2 text-xs uppercase`}
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))',
        background: disabled
          ? 'transparent'
          : 'var(--section-accent, var(--color-toxic-green))',
        color: disabled ? 'inherit' : 'var(--color-void-black)'
      }}
    >
      {label}
    </button>
  )

  return disabled ? (
    <Tooltip content={disabledReason}>{button}</Tooltip>
  ) : (
    button
  )
}

/**
 * Renders the shared hero and deck area for an asset section.
 *
 * @remarks
 * This component visualizes the primary attributes of a long-term asset, including its condition,
 * tier, and available actionable slots. It provides the interface for core asset lifecycle actions
 * such as repair, upgrade, and sale.
 *
 * @param props - The component properties.
 * @returns The rendered asset deck structure.
 */
export const AssetSectionDeck = ({
  asset,
  hero,
  onSlotClick,
  onRepair,
  onUpgrade,
  onSell
}: AssetSectionDeckProps) => {
  const { t } = useTranslation(['assets'])
  const needsRepair = calculateChassisRepairCost(asset.condition) > 0
  const canUpgrade = getNextChassisTier(asset.chassisTier) !== null

  return (
    <article className='grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]'>
      <div className='assets-hub-panel assets-hub-reveal min-w-0 overflow-hidden p-2'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='min-w-0'>
            <h2 className='assets-hub-title truncate text-xl uppercase sm:text-2xl'>
              {t(`assets:kind.${asset.kind}`)}
            </h2>
            <p className='assets-hub-control truncate text-xs uppercase opacity-70'>
              {t(`assets:flavor.${asset.chassisFlavor}`)} /{' '}
              {t(`assets:chassisTier.${asset.chassisTier}`)} /{' '}
              {t(`assets:mode.${asset.acquisitionMode}`)}
            </p>
          </div>
          <span className='assets-hub-control shrink-0 border-2 px-2 py-1 text-xs uppercase'>
            {asset.condition}%
          </span>
        </div>
        <div className='asset-hero-frame'>{hero}</div>
      </div>

      <div className='flex min-w-0 flex-col gap-3'>
        <div className='assets-hub-reveal grid grid-cols-3 gap-2'>
          <DeckActionButton
            label={t('assets:actions.repair')}
            onClick={onRepair}
            disabled={!needsRepair}
            disabledReason={t('assets:actions.notDamaged')}
          />
          <DeckActionButton
            label={t('assets:actions.upgrade')}
            onClick={onUpgrade}
            disabled={!canUpgrade}
            disabledReason={t('assets:actions.maxTier')}
          />
          <button
            type='button'
            onClick={onSell}
            className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-void-black assets-hub-control assets-hub-secondary-button min-h-11 border-2 px-2 py-2 text-xs uppercase'
            style={{
              borderColor: 'var(--section-accent, var(--color-toxic-green))'
            }}
          >
            {t('assets:actions.sell')}
          </button>
        </div>
        <AssetSlotActionList asset={asset} onSlotClick={onSlotClick} />
      </div>
    </article>
  )
}
