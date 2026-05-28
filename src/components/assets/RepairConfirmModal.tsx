import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRepairImagePrompt } from '../../utils/imageGen'
import { REPAIR_COST_PER_POINT } from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  isOpen: boolean
  onClose: () => void
}

export const RepairConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { repairChassis } = useGameActions()
  const money = useGameSelector(state => state.player.money)
  const cost = Math.max(0, (100 - asset.condition) * REPAIR_COST_PER_POINT)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:actions.repair')}
      className='assets-modal-sheet max-w-lg'
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
          <button
            type='button'
            onClick={onClose}
            className='min-h-11 border-2 px-3 py-2'
          >
            {t('ui:action_cancel')}
          </button>
          <Tooltip
            content={
              money < cost
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <button
              type='button'
              onClick={() => {
                repairChassis(asset.id)
                onClose()
              }}
              disabled={cost === 0 || money < cost}
              className='min-h-11 border-2 px-3 py-2 disabled:opacity-40'
              style={{
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void)'
              }}
            >
              {t('assets:actions.repair')}
            </button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
