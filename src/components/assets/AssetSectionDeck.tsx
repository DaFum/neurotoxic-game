import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { LongTermAsset } from '../../types/assets'
import { getNextChassisTier } from '../../utils/assetConfig'
import { AssetSlotActionList } from './AssetSlotActionList'
import { Tooltip } from '../../ui/shared'

interface AssetSectionDeckProps {
  asset: LongTermAsset
  hero: ReactNode
  onSlotClick: (slotId: string) => void
  onRepair: () => void
  onUpgrade: () => void
  onSell: () => void
}

/**
 * Displays the shared asset-section hero/deck area.
 * @param props - Selected asset, hero renderer, slot-click handler, and chassis repair/upgrade/sell callbacks.
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
  const needsRepair = asset.condition < 50
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
          {!needsRepair ? (
            <Tooltip content={t('assets:actions.notDamaged')}>
              <button
                type='button'
                onClick={onRepair}
                disabled={!needsRepair}
                className='assets-hub-control assets-hub-secondary-button min-h-11 border-2 px-2 py-2 text-xs uppercase disabled:opacity-40'
                style={{
                  borderColor:
                    'var(--section-accent, var(--color-toxic-green))',
                  background: 'transparent',
                  color: 'inherit'
                }}
              >
                {t('assets:actions.repair')}
              </button>
            </Tooltip>
          ) : (
            <button
              type='button'
              onClick={onRepair}
              disabled={!needsRepair}
              className='assets-hub-control assets-hub-primary-button min-h-11 border-2 px-2 py-2 text-xs uppercase disabled:opacity-40'
              style={{
                borderColor: 'var(--section-accent, var(--color-toxic-green))',
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void-black)'
              }}
            >
              {t('assets:actions.repair')}
            </button>
          )}
          {!canUpgrade ? (
            <Tooltip content={t('assets:actions.maxTier')}>
              <button
                type='button'
                onClick={onUpgrade}
                disabled={!canUpgrade}
                className='assets-hub-control assets-hub-secondary-button min-h-11 border-2 px-2 py-2 text-xs uppercase disabled:opacity-40'
                style={{
                  borderColor:
                    'var(--section-accent, var(--color-toxic-green))',
                  background: 'transparent',
                  color: 'inherit'
                }}
              >
                {t('assets:actions.upgrade')}
              </button>
            </Tooltip>
          ) : (
            <button
              type='button'
              onClick={onUpgrade}
              disabled={!canUpgrade}
              className='assets-hub-control assets-hub-primary-button min-h-11 border-2 px-2 py-2 text-xs uppercase disabled:opacity-40'
              style={{
                borderColor: 'var(--section-accent, var(--color-toxic-green))',
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void-black)'
              }}
            >
              {t('assets:actions.upgrade')}
            </button>
          )}
          <button
            type='button'
            onClick={onSell}
            className='assets-hub-control assets-hub-secondary-button min-h-11 border-2 px-2 py-2 text-xs uppercase'
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
