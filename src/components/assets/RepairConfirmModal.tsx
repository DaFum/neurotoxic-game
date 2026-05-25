import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRepairImagePrompt } from '../../utils/imageGen'
import { REPAIR_COST_PER_POINT } from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  isOpen: boolean
  onClose: () => void
}

export const RepairConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { repairChassis } = useGameActions()
  const cost = Math.max(0, (100 - asset.condition) * REPAIR_COST_PER_POINT)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:actions.repair')}
      className='max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getRepairImagePrompt(
            asset.kind,
            asset.chassisFlavor,
            asset.chassisTier,
            asset.condition
          )}
          alt={t(`assets:kind.${asset.kind}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        <p>
          {t('assets:actions.repairConfirm', {
            amount: formatCurrency(cost, i18n.language)
          })}
        </p>
        <div className='flex justify-end gap-2'>
          <button onClick={onClose} className='border-2 px-3 py-1'>
            {t('ui:action_cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={() => {
              repairChassis(asset.id)
              onClose()
            }}
            disabled={cost === 0}
            className='border-2 px-3 py-1 disabled:opacity-40'
            style={{
              background: 'var(--section-accent)',
              color: 'var(--color-void)'
            }}
          >
            {t('assets:actions.repair')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
