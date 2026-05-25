import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getModuleImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import {
  getModulePoolForAsset,
  getSlotConflicts,
  type LockReason
} from '../../utils/assetSelectors'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  slotId: string | null
  isOpen: boolean
  onClose: () => void
}

const formatLockReason = (
  reason: LockReason,
  t: (k: string, opts?: object) => string
): string => {
  switch (reason.kind) {
    case 'fame':
      return t('assets:module.unlock.fame', { amount: reason.amount })
    case 'money':
      return t('assets:module.unlock.money', { amount: reason.amount })
    case 'scene':
      return t('assets:module.unlock.scene', { amount: reason.amount })
    case 'chassisTier':
      return t('assets:module.unlock.chassisTier', { tier: reason.amount })
    case 'story':
      return t('assets:module.unlock.story', { flag: reason.ref })
    case 'skill':
      return t('assets:module.unlock.skill', {
        member: reason.ref,
        skill: reason.ref,
        tier: reason.amount
      })
    case 'skillAny':
      return t('assets:module.unlock.skillAny', {
        skill: reason.ref,
        tier: reason.amount
      })
    case 'otherModule':
      return t('assets:module.unlock.otherModule', {
        moduleRefs: (reason.refs ?? []).join(', ')
      })
  }
}

export const ModulePickerModal = ({
  asset,
  slotId,
  isOpen,
  onClose
}: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const state = useGameSelector(s => s)
  const { installModule } = useGameActions()
  const slot = useMemo(
    () => asset.slots.find(s => s.id === slotId),
    [asset, slotId]
  )

  // Pool filtered to modules that fit the active slot type.
  const pool = useMemo(() => {
    if (!slot) return []
    return getModulePoolForAsset(asset, state).filter(
      entry => entry.module.slotType === slot.slotType
    )
  }, [asset, slot, state])

  if (!slot) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:modulePicker.title')}
      className='max-w-3xl'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        {pool.length === 0 && (
          <p className='opacity-60'>
            {t('assets:modulePicker.noModulesAvailable')}
          </p>
        )}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {pool.map(({ module, unlocked, lockReasons }) => {
            const conflict = getSlotConflicts(asset, module.id)
            const blocked = !unlocked || !conflict.canInstall
            return (
              <div
                key={module.id}
                className='flex gap-3 border-2 p-2'
                style={{ borderColor: 'var(--section-accent)' }}
              >
                <div className='w-24 shrink-0'>
                  <GeneratedImagePanel
                    prompt={getModuleImagePrompt(module.id)}
                    alt={t(`assets:module.${module.id}.name`, {
                      defaultValue: module.id
                    })}
                    aspectRatio='1:1'
                    sizeHint={{ width: 128, height: 128 }}
                  />
                </div>
                <div className='flex flex-1 flex-col gap-1'>
                  <strong>
                    {t(`assets:module.${module.id}.name`, {
                      defaultValue: module.id
                    })}
                  </strong>
                  <span className='text-xs opacity-60'>
                    {t(`assets:module.${module.id}.description`, {
                      defaultValue: ''
                    })}
                  </span>
                  <span className='text-xs'>
                    {t('assets:modulePicker.installCost', {
                      amount: formatCurrency(
                        module.cost + module.installCost,
                        i18n.language
                      )
                    })}
                  </span>
                  {lockReasons.length > 0 && (
                    <ul
                      className='text-xs'
                      style={{ color: 'var(--color-blood)' }}
                    >
                      {lockReasons.map(r => (
                        <li
                          key={`${r.kind}-${r.ref ?? ''}-${r.amount ?? ''}-${r.refs?.join(',') ?? ''}`}
                        >
                          {formatLockReason(r, t)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!conflict.canInstall && (
                    <span
                      className='text-xs'
                      style={{ color: 'var(--color-warning-yellow)' }}
                    >
                      {t('assets:modulePicker.exclusivityConflict', {
                        otherName: conflict.conflictingModuleIds.join(', ')
                      })}
                    </span>
                  )}
                  <button
                    type='button'
                    onClick={() => {
                      installModule({
                        assetId: asset.id,
                        slotId: slot.id,
                        moduleId: module.id
                      })
                      onClose()
                    }}
                    disabled={blocked}
                    className='mt-1 self-start border-2 px-2 py-1 disabled:opacity-30'
                    style={{
                      background: blocked
                        ? 'transparent'
                        : 'var(--section-accent)',
                      color: blocked ? 'inherit' : 'var(--color-void)'
                    }}
                  >
                    {t('assets:actions.install')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
