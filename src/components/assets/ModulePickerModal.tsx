import { useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getModuleImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import {
  getModulePoolForAsset,
  getSlotConflicts,
  selectAssetSlotsMap,
  type LockReason
} from '../../utils/assetSelectors'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset, AssetModule } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  slotId: string | null
  isOpen: boolean
  onClose: () => void
}

const formatLockReason = (
  reason: LockReason,
  t: TFunction<readonly ['assets'], undefined>
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
    case 'story': {
      const flag = reason.ref ?? ''
      const flagLabel = t(`assets:storyFlag.${flag}`, { defaultValue: flag })
      return t('assets:module.unlock.story', { flag: flagLabel })
    }
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
        moduleRefs: (reason.refs ?? [])
          .map(moduleId =>
            t(`assets:module.${moduleId}.name`, { defaultValue: moduleId })
          )
          .join(', ')
      })
  }
}

interface InstalledModuleCardProps {
  assetId: string
  slotId: string
  installedModuleId: string
  installedModule?: AssetModule
  removalRefund: number
  removalBlocked: boolean
  onClose: () => void
  removeModule: (assetId: string, slotId: string) => void
  t: TFunction<readonly ['assets'], undefined>
  language: string
}

const InstalledModuleCard = memo(
  ({
    assetId,
    slotId,
    installedModuleId,
    installedModule,
    removalRefund,
    removalBlocked,
    onClose,
    removeModule,
    t,
    language
  }: InstalledModuleCardProps) => {
    return (
      <div
        className='flex gap-3 border-2 p-2'
        style={{
          borderColor: 'var(--section-accent, var(--color-cosmic-purple))'
        }}
      >
        {installedModule && (
          <div className='w-24 shrink-0'>
            <GeneratedImagePanel
              prompt={getModuleImagePrompt(installedModule.id)}
              alt={t(`assets:module.${installedModule.id}.name`, {
                defaultValue: installedModule.id
              })}
              aspectRatio='1:1'
              sizeHint={{ width: 128, height: 128 }}
            />
          </div>
        )}
        <div className='flex flex-1 flex-col gap-1'>
          <strong>
            {installedModule
              ? t(`assets:module.${installedModule.id}.name`, {
                  defaultValue: installedModule.id
                })
              : installedModuleId}
          </strong>
          {installedModule && (
            <span className='text-xs opacity-60'>
              {t(`assets:module.${installedModule.id}.description`, {
                defaultValue: ''
              })}
            </span>
          )}
          <span className='text-xs'>
            {t('assets:modulePicker.removeRefund', {
              amount: formatCurrency(removalRefund, language)
            })}
          </span>
          <p className='text-xs opacity-70'>
            {t('assets:actions.removeModuleConfirm', {
              amount: formatCurrency(removalRefund, language)
            })}
          </p>
          <button
            type='button'
            onClick={() => {
              removeModule(assetId, slotId)
              onClose()
            }}
            disabled={removalBlocked}
            className='mt-1 min-h-11 self-start border-2 px-2 py-2 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-void-black'
            style={{
              background: removalBlocked
                ? 'transparent'
                : 'var(--section-accent)',
              color: removalBlocked ? 'inherit' : 'var(--color-void-black)'
            }}
          >
            {t('assets:actions.remove')}
          </button>
        </div>
      </div>
    )
  }
)
InstalledModuleCard.displayName = 'InstalledModuleCard'

interface AvailableModuleCardProps {
  assetId: string
  slotId: string
  module: AssetModule
  unlocked: boolean
  lockReasons: LockReason[]
  canInstall: boolean
  conflictingModuleNames: string
  money: number
  onClose: () => void
  installModule: (payload: {
    assetId: string
    slotId: string
    moduleId: string
  }) => void
  t: TFunction<readonly ['assets'], undefined>
  language: string
}

const AvailableModuleCard = memo(
  ({
    assetId,
    slotId,
    module,
    unlocked,
    lockReasons,
    canInstall,
    conflictingModuleNames,
    money,
    onClose,
    installModule,
    t,
    language
  }: AvailableModuleCardProps) => {
    const installCost = module.cost + module.installCost
    const insufficientFunds = money < installCost
    const blocked = !unlocked || !canInstall || insufficientFunds

    return (
      <div
        className='flex gap-3 border-2 p-2'
        style={{
          borderColor: 'var(--section-accent, var(--color-cosmic-purple))'
        }}
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
              amount: formatCurrency(installCost, language)
            })}
          </span>
          {lockReasons.length > 0 && (
            <ul className='text-xs' style={{ color: 'var(--color-blood-red)' }}>
              {lockReasons.map(r => (
                <li
                  key={`${r.kind}-${r.ref ?? ''}-${r.amount ?? ''}-${r.refs?.join(',') ?? ''}`}
                >
                  {formatLockReason(r, t)}
                </li>
              ))}
            </ul>
          )}
          {!canInstall && (
            <span
              className='text-xs'
              style={{ color: 'var(--color-warning-yellow)' }}
            >
              {t('assets:modulePicker.exclusivityConflict', {
                otherName: conflictingModuleNames
              })}
            </span>
          )}
          {insufficientFunds && (
            <span
              className='text-xs'
              style={{ color: 'var(--color-blood-red)' }}
            >
              {t('assets:modulePicker.insufficientFunds')}
            </span>
          )}
          <button
            type='button'
            onClick={() => {
              installModule({
                assetId,
                slotId,
                moduleId: module.id
              })
              onClose()
            }}
            disabled={blocked}
            className='mt-1 min-h-11 self-start border-2 px-2 py-2 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-void-black'
            style={{
              background: blocked ? 'transparent' : 'var(--section-accent)',
              color: blocked ? 'inherit' : 'var(--color-void-black)'
            }}
          >
            {t('assets:actions.install')}
          </button>
        </div>
      </div>
    )
  }
)
AvailableModuleCard.displayName = 'AvailableModuleCard'

/**
 * Presents installable modules for a selected asset slot.
 *
 * @remarks
 * Evaluates available modules against player state (fame, money, story flags, etc.)
 * and slot constraints to present valid installation or removal options.
 *
 * @param props - Contains the target asset, the specific slot ID, modal visibility state, and close handler.
 * @returns A modal component containing the module selection interface, or null if the slot is invalid.
 */
export const ModulePickerModal = memo(
  ({ asset, slotId, isOpen, onClose }: Props) => {
    const { t, i18n } = useTranslation(['assets'])
    // Narrow selectors so the modal only re-renders when an input that actually
    // affects unlock/conflict evaluation changes. Subscribing to the whole
    // state tree (`s => s`) re-rendered on every tick.
    const fame = useGameSelector(s => s.player.fame)
    const money = useGameSelector(s => s.player.money)
    const scenePresence = useGameSelector(
      s => (s.social as { scenePresence?: number }).scenePresence ?? 0
    )
    const activeStoryFlags = useGameSelector(s => s.activeStoryFlags)
    const band = useGameSelector(s => s.band)
    const assets = useGameSelector(s => s.assets)
    const { installModule, removeModule } = useGameActions()
    const slot = useMemo(
      () => (slotId ? selectAssetSlotsMap(asset).get(slotId) : undefined),
      [asset, slotId]
    )

    // Pool filtered to modules that fit the active slot type. The composite
    // state is rebuilt only when one of the relevant slices changes.
    const pool = useMemo(() => {
      if (!slot) return []
      const composite = {
        player: { fame, money },
        social: { scenePresence },
        activeStoryFlags,
        band,
        assets
      } as unknown as Parameters<typeof getModulePoolForAsset>[1]
      // ⚡ BOLT OPTIMIZATION: Passed slotType down to the selector to eliminate O(N) .filter() array allocation.
      return getModulePoolForAsset(asset, composite, slot.slotType)
    }, [
      asset,
      slot,
      fame,
      money,
      scenePresence,
      activeStoryFlags,
      band,
      assets
    ])

    if (!slot) return null

    const installedModuleId = slot.installedModuleId
    const installedModule =
      installedModuleId === null
        ? undefined
        : MODULE_REGISTRY[installedModuleId]
    const removalRefund = installedModule
      ? installedModule.cost * installedModule.removalRefundFraction
      : 0
    let removalBlocked = false
    if (installedModuleId !== null) {
      for (let i = 0; i < asset.slots.length; i++) {
        const assetSlot = asset.slots[i]
        if (
          assetSlot &&
          assetSlot.addedByModuleId === installedModuleId &&
          assetSlot.installedModuleId !== null
        ) {
          removalBlocked = true
          break
        }
      }
    }

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('assets:modulePicker.title')}
        className='assets-modal-sheet max-w-3xl'
      >
        <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
          {installedModuleId !== null && (
            <InstalledModuleCard
              assetId={asset.id}
              slotId={slot.id}
              installedModuleId={installedModuleId}
              installedModule={installedModule}
              removalRefund={removalRefund}
              removalBlocked={removalBlocked}
              onClose={onClose}
              removeModule={removeModule}
              t={t}
              language={i18n.language}
            />
          )}
          {installedModuleId === null && pool.length === 0 && (
            <p className='opacity-60'>
              {t('assets:modulePicker.noModulesAvailable')}
            </p>
          )}
          {installedModuleId === null && pool.length > 0 && (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {pool.map(({ module, unlocked, lockReasons }) => {
                const conflict = getSlotConflicts(asset, module.id)
                return (
                  <AvailableModuleCard
                    key={module.id}
                    assetId={asset.id}
                    slotId={slot.id}
                    module={module}
                    unlocked={unlocked}
                    lockReasons={lockReasons}
                    canInstall={conflict.canInstall}
                    conflictingModuleNames={conflict.conflictingModuleIds
                      .map(id =>
                        t(`assets:module.${id}.name`, { defaultValue: id })
                      )
                      .join(', ')}
                    money={money}
                    onClose={onClose}
                    installModule={installModule}
                    t={t}
                    language={i18n.language}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Modal>
    )
  }
)
ModulePickerModal.displayName = 'ModulePickerModal'
