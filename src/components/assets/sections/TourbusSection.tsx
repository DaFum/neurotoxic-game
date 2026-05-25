import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../../context/GameState'
import { TourbusVehicleView } from './TourbusVehicleView'
import { ModulePickerModal } from '../ModulePickerModal'
import { ChassisAcquisitionModal } from '../ChassisAcquisitionModal'
import type { LongTermAsset } from '../../../types/assets'

export const TourbusSection = () => {
  const { t } = useTranslation(['assets'])
  const tourbusAssets = useGameSelector(s =>
    s.assets.filter((a: LongTermAsset) => a.kind === 'tourbus_chassis')
  )
  const [picker, setPicker] = useState<{
    asset: LongTermAsset
    slotId: string
  } | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)

  return (
    <div className='flex flex-col gap-4'>
      {tourbusAssets.length === 0 ? (
        <button
          type='button'
          onClick={() => setAcquireOpen(true)}
          className='self-start border-2 px-4 py-2 font-mono uppercase'
          style={{
            borderColor: 'var(--section-accent, var(--color-toxic-green))',
            background: 'var(--section-accent, var(--color-toxic-green))',
            color: 'var(--color-void)'
          }}
        >
          {t('assets:actions.purchase')}
        </button>
      ) : (
        tourbusAssets.map((asset: LongTermAsset) => (
          <TourbusVehicleView
            key={asset.id}
            asset={asset}
            onSlotClick={slotId => setPicker({ asset, slotId })}
          />
        ))
      )}
      <ChassisAcquisitionModal
        kind='tourbus_chassis'
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
