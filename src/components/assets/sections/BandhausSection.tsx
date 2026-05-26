import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../../context/GameState'
import { BandhausCrossSectionView } from './BandhausCrossSectionView'
import { ModulePickerModal } from '../ModulePickerModal'
import { ChassisAcquisitionModal } from '../ChassisAcquisitionModal'
import type { LongTermAsset } from '../../../types/assets'

export const BandhausSection = () => {
  const { t } = useTranslation(['assets'])
  // Subscribe to the stable `assets` slice and memo-filter — returning a
  // freshly-filtered array from the selector itself would re-render on every
  // unrelated state change because the new array reference !== the previous.
  const assets = useGameSelector(s => s.assets)
  const bandhausAssets = useMemo(
    () => assets.filter((a: LongTermAsset) => a.kind === 'bandhaus_chassis'),
    [assets]
  )
  const [picker, setPicker] = useState<{
    asset: LongTermAsset
    slotId: string
  } | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)

  return (
    <div className='flex flex-col gap-4'>
      {bandhausAssets.length === 0 ? (
        <button
          type='button'
          onClick={() => setAcquireOpen(true)}
          className='self-start border-2 px-4 py-2 font-mono uppercase'
          style={{
            borderColor: 'var(--section-accent, var(--color-cosmic-purple))',
            background: 'var(--section-accent, var(--color-cosmic-purple))',
            color: 'var(--color-void)'
          }}
        >
          {t('assets:actions.purchase')}
        </button>
      ) : (
        bandhausAssets.map((asset: LongTermAsset) => (
          <BandhausCrossSectionView
            key={asset.id}
            asset={asset}
            onSlotClick={slotId => setPicker({ asset, slotId })}
          />
        ))
      )}
      <ChassisAcquisitionModal
        kind='bandhaus_chassis'
        isOpen={acquireOpen}
        onClose={() => setAcquireOpen(false)}
      />
      {picker && (
        <ModulePickerModal
          asset={picker.asset}
          slotId={picker.slotId}
          isOpen
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
