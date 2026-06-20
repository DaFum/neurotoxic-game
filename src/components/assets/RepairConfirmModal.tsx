import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { CancelButton } from './shared/CancelButton'
import { ConfirmButton } from './shared/ConfirmButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getRepairImagePrompt } from '../../utils/imageGen'
import { calculateChassisRepairCost } from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  isOpen: boolean
  onClose: () => void
}

/**
 * Confirms chassis repair cost and action for one asset.
 * @param props - Asset, modal state, and close handler for chassis repair confirmation.
 */
export const RepairConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { repairChassis } = useGameActions()
  const money = useGameSelector(state => state.player.money)
  const cost = calculateChassisRepairCost(asset.condition)

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
          <CancelButton onClick={onClose} />
          <Tooltip
            content={
              money < cost
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <ConfirmButton
              onClick={() => {
                repairChassis(asset.id)
                onClose()
              }}
              disabled={cost === 0 || money < cost}
            >
              {t('assets:actions.repair')}
            </ConfirmButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
