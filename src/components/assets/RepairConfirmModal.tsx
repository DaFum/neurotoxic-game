import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { ActionButton } from '../../ui/shared/ActionButton'
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

/**
 * Renders the Repair Confirm Modal.
 * @param props - Asset, modal state, and close handler for chassis repair confirmation.
 */
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
          <ActionButton
            onClick={onClose}
            variant='custom'
            className='bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black'
          >
            {t('ui:action_cancel')}
          </ActionButton>
          <Tooltip
            content={
              money < cost
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <ActionButton
              onClick={() => {
                repairChassis(asset.id)
                onClose()
              }}
              disabled={cost === 0 || money < cost}
              variant='custom'
              className='px-3 py-2 text-sm disabled:opacity-40'
              style={{
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void-black)'
              }}
            >
              {t('assets:actions.repair')}
            </ActionButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
