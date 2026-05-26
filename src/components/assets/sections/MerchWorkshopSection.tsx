import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../../context/GameState'
import { WorkshopProductionLineView } from './WorkshopProductionLineView'
import { ModulePickerModal } from '../ModulePickerModal'
import { ChassisAcquisitionModal } from '../ChassisAcquisitionModal'
import type { LongTermAsset } from '../../../types/assets'

export const MerchWorkshopSection = () => {
  const { t } = useTranslation(['assets'])
  // Subscribe to the stable `assets` slice and memo-filter so unrelated state
  // updates do not rebuild a fresh filtered array in the selector.
  const assets = useGameSelector(s => s.assets)
  const workshopAssets = useMemo(
    () =>
      assets.filter((a: LongTermAsset) => a.kind === 'merch_workshop_chassis'),
    [assets]
  )
  const [picker, setPicker] = useState<{
    asset: LongTermAsset
    slotId: string
  } | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)

  return (
    <div className='flex flex-col gap-4'>
      {workshopAssets.length === 0 ? (
        <button
          type='button'
          onClick={() => setAcquireOpen(true)}
          className='self-start border-2 px-4 py-2 font-mono uppercase'
          style={{
            borderColor: 'var(--section-accent, var(--color-warning-yellow))',
            background: 'var(--section-accent, var(--color-warning-yellow))',
            color: 'var(--color-void)'
          }}
        >
          {t('assets:actions.purchase')}
        </button>
      ) : (
        workshopAssets.map((asset: LongTermAsset) => (
          <WorkshopProductionLineView
            key={asset.id}
            asset={asset}
            onSlotClick={slotId => setPicker({ asset, slotId })}
          />
        ))
      )}
      <ChassisAcquisitionModal
        kind='merch_workshop_chassis'
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
