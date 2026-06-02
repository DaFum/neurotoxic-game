import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { ActionButton } from '../../ui/shared/ActionButton'
import { CrowdfundSetupModal } from './CrowdfundSetupModal'
import { LoanProfileChoiceGrid } from './LoanProfileModal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import type { LoanProfileId } from '../../utils/loanProfiles'
import { formatCurrency } from '../../utils/numberUtils'
import { hasActiveAssetAcquisition } from '../../utils/assetSelectors'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type {
  AcquisitionMode,
  AssetFlavor,
  AssetKind,
  ChassisTier
} from '../../types/assets'

interface Props {
  /** Pre-selected kind (section views open the modal scoped to their kind). */
  kind: AssetKind
  isOpen: boolean
  onClose: () => void
}

const TIERS: readonly ChassisTier[] = [1, 2, 3]
const FLAVORS: readonly AssetFlavor[] = ['legit', 'diy']
const MODES: readonly AcquisitionMode[] = ['cash', 'loan', 'crowdfund']

/**
 * Chassis acquisition flow: flavor → tier → mode → confirm. Picks up the
 * kind from props (sections open the modal scoped to their own kind).
 *
 * DIY+loan is disabled in the UI as the first defense; the action creator
 * is the second (it returns PURCHASE_CHASSIS_FAILED with reason
 * DIY_LOAN_NOT_ALLOWED). The hub-level toast bridge surfaces the failure
 * to the player.
 */
export const ChassisAcquisitionModal = ({ kind, isOpen, onClose }: Props) => {
  const { t } = useTranslation(['assets'])
  const money = useGameSelector(s => s.player.money)
  const acquisitionBlocked = useGameSelector(s =>
    hasActiveAssetAcquisition(s, kind)
  )
  const { purchaseChassis } = useGameActions()

  const [flavor, setFlavor] = useState<AssetFlavor>('legit')
  const [tier, setTier] = useState<ChassisTier>(1)
  const [mode, setMode] = useState<AcquisitionMode>('cash')
  const [loanProfile, setLoanProfile] = useState<LoanProfileId>('shortTerm')
  const [showCrowdfundSetup, setShowCrowdfundSetup] = useState(false)

  const cfg = CHASSIS_CONFIG[kind]?.[flavor]?.[tier]
  const price = cfg?.price ?? 0
  const diyLoanBlocked = flavor === 'diy' && mode === 'loan'
  const insufficient = mode === 'cash' && money < price

  const onConfirm = () => {
    if (acquisitionBlocked) return
    if (mode === 'crowdfund') {
      setShowCrowdfundSetup(true)
      return
    }
    purchaseChassis({
      kind,
      flavor,
      tier,
      mode,
      ...(mode === 'loan' ? { loanProfileId: loanProfile } : {})
    })
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('assets:actions.purchase')}
        className='assets-modal-sheet max-w-2xl'
      >
        <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
          <GeneratedImagePanel
            prompt={getChassisImagePrompt(kind, flavor, tier)}
            alt={t(`assets:kind.${kind}`)}
            aspectRatio='16:9'
            sizeHint={{ width: 640, height: 360 }}
          />

          <div className='flex flex-col gap-3 sm:flex-row sm:gap-4'>
            <ChoiceGroup<AssetFlavor>
              label={t('assets:flavor.legit')}
              options={FLAVORS}
              value={flavor}
              onChange={setFlavor}
              renderLabel={f => t(`assets:flavor.${f}`)}
            />
            <ChoiceGroup<ChassisTier>
              label={t('assets:chassisAcquisition.tier')}
              options={TIERS}
              value={tier}
              onChange={setTier}
              renderLabel={tt => t(`assets:chassisTier.${tt}`)}
            />
          </div>

          <ChoiceGroup<AcquisitionMode>
            label={t('assets:chassisAcquisition.mode')}
            options={MODES}
            value={mode}
            onChange={setMode}
            renderLabel={m => t(`assets:mode.${m}`)}
            disabledOption={flavor === 'diy' ? 'loan' : undefined}
            disabledReason={t('assets:purchaseFailed.diy_loan_not_allowed')}
          />

          {mode === 'loan' && (
            <div className='flex flex-col gap-1'>
              <span className='text-xs uppercase opacity-60'>
                {t('assets:chassisAcquisition.loanProfile')}
              </span>
              <LoanProfileChoiceGrid
                value={loanProfile}
                onSelect={setLoanProfile}
              />
            </div>
          )}

          <ChassisAcquisitionFooter
            price={price}
            acquisitionBlocked={acquisitionBlocked}
            diyLoanBlocked={diyLoanBlocked}
            insufficient={insufficient}
            onClose={onClose}
            onConfirm={onConfirm}
          />
          <ChassisAcquisitionWarnings
            acquisitionBlocked={acquisitionBlocked}
            diyLoanBlocked={diyLoanBlocked}
            insufficient={insufficient}
          />
        </div>
      </Modal>
      {showCrowdfundSetup && (
        <CrowdfundSetupModal
          kind={kind}
          flavor={flavor}
          tier={tier}
          targetAmount={price}
          isOpen={showCrowdfundSetup}
          onClose={() => {
            setShowCrowdfundSetup(false)
            onClose()
          }}
        />
      )}
    </>
  )
}

interface ChoiceGroupProps<T extends string | number> {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  renderLabel: (v: T) => string
  disabledOption?: T
  disabledReason?: string
}

const ChoiceGroup = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  renderLabel,
  disabledOption,
  disabledReason
}: ChoiceGroupProps<T>) => (
  <div className='flex min-w-0 flex-1 flex-col gap-1'>
    <span className='text-xs uppercase opacity-60'>{label}</span>
    <div className='flex flex-wrap gap-1'>
      {options.map(opt => {
        const isActive = opt === value
        const isDisabled = opt === disabledOption
        const btn = (
          <button
            key={String(opt)}
            type='button'
            onClick={() => onChange(opt)}
            disabled={isDisabled}
            className='min-h-11 border-2 px-2 py-2 disabled:opacity-30'
            style={{
              background: isActive
                ? 'var(--section-accent, var(--color-toxic-green))'
                : 'transparent',
              color: isActive ? 'var(--color-void-black)' : 'inherit',
              borderColor: isActive
                ? 'var(--section-accent, var(--color-toxic-green))'
                : 'var(--color-toxic-green)'
            }}
          >
            {renderLabel(opt)}
          </button>
        )
        return isDisabled && disabledReason ? (
          <Tooltip key={String(opt)} content={disabledReason}>
            {btn}
          </Tooltip>
        ) : (
          btn
        )
      })}
    </div>
  </div>
)


interface ChassisAcquisitionFooterProps {
  price: number
  acquisitionBlocked: boolean
  diyLoanBlocked: boolean
  insufficient: boolean
  onClose: () => void
  onConfirm: () => void
}

const ChassisAcquisitionFooter = ({
  price,
  acquisitionBlocked,
  diyLoanBlocked,
  insufficient,
  onClose,
  onConfirm
}: ChassisAcquisitionFooterProps) => {
  const { t, i18n } = useTranslation(['assets', 'ui'])
  return (
    <div
      className='flex flex-col items-stretch gap-2 border-t-2 pt-2 sm:flex-row sm:items-center sm:justify-between'
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))'
      }}
    >
      <span className='text-base sm:text-sm'>
        {formatCurrency(price, i18n.language)}
      </span>
      <div className='flex gap-2'>
        <ActionButton
          onClick={onClose}
          variant='custom'
          className='bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black'
        >
          {t('ui:action_cancel')}
        </ActionButton>
        <Tooltip
          content={
            acquisitionBlocked
              ? t('assets:purchaseFailed.acquisition_already_active')
              : diyLoanBlocked
                ? t('assets:purchaseFailed.diy_loan_not_allowed')
                : insufficient
                  ? t('assets:purchaseFailed.insufficient_funds')
                  : undefined
          }
        >
          <ActionButton
            onClick={onConfirm}
            disabled={
              acquisitionBlocked ||
              diyLoanBlocked ||
              insufficient ||
              price === 0
            }
            variant='custom'
            className='px-3 py-2 text-sm disabled:opacity-40'
            style={{
              background:
                'var(--section-accent, var(--color-toxic-green))',
              color: 'var(--color-void-black)'
            }}
          >
            {t('assets:actions.purchase')}
          </ActionButton>
        </Tooltip>
      </div>
    </div>
  )
}

const ChassisAcquisitionWarnings = ({
  acquisitionBlocked,
  diyLoanBlocked,
  insufficient
}: {
  acquisitionBlocked: boolean
  diyLoanBlocked: boolean
  insufficient: boolean
}) => {
  const { t } = useTranslation(['assets'])
  return (
    <>
      {diyLoanBlocked && (
        <p style={{ color: 'var(--color-blood-red)' }}>
          {t('assets:purchaseFailed.diy_loan_not_allowed')}
        </p>
      )}
      {acquisitionBlocked && (
        <p style={{ color: 'var(--color-warning-yellow)' }}>
          {t('assets:purchaseFailed.acquisition_already_active')}
        </p>
      )}
      {insufficient && (
        <p style={{ color: 'var(--color-blood-red)' }}>
          {t('assets:purchaseFailed.insufficient_funds')}
        </p>
      )}
    </>
  )
}
