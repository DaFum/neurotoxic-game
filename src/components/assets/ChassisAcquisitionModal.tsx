import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import { LOAN_PROFILES, type LoanProfileId } from '../../utils/loanProfiles'
import { formatCurrency } from '../../utils/numberUtils'
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
  const { t, i18n } = useTranslation(['assets'])
  const money = useGameSelector(s => s.player.money)
  const { purchaseChassis } = useGameActions()

  const [flavor, setFlavor] = useState<AssetFlavor>('legit')
  const [tier, setTier] = useState<ChassisTier>(1)
  const [mode, setMode] = useState<AcquisitionMode>('cash')
  const [loanProfile, setLoanProfile] = useState<LoanProfileId>('shortTerm')

  const cfg = CHASSIS_CONFIG[kind]?.[flavor]?.[tier]
  const price = cfg?.price ?? 0
  const diyLoanBlocked = flavor === 'diy' && mode === 'loan'
  const insufficient = mode === 'cash' && money < price

  const onConfirm = () => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:actions.purchase')}
      className='max-w-2xl'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getChassisImagePrompt(kind, flavor, tier)}
          alt={t(`assets:kind.${kind}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />

        <div className='flex gap-4'>
          <ChoiceGroup
            label={t('assets:flavor.legit')}
            options={FLAVORS}
            value={flavor}
            onChange={setFlavor}
            renderLabel={f => t(`assets:flavor.${f}`)}
          />
          <ChoiceGroup
            label='Tier'
            options={TIERS}
            value={tier}
            onChange={setTier}
            renderLabel={tt => t(`assets:chassisTier.${tt}`)}
          />
        </div>

        <ChoiceGroup
          label='Mode'
          options={MODES}
          value={mode}
          onChange={setMode}
          renderLabel={m => t(`assets:mode.${m}`)}
          disabledOption={flavor === 'diy' ? 'loan' : undefined}
        />

        {mode === 'loan' && (
          <ChoiceGroup
            label='Loan profile'
            options={Object.keys(LOAN_PROFILES) as LoanProfileId[]}
            value={loanProfile}
            onChange={setLoanProfile}
            renderLabel={p => t(`assets:loan.profile.${p}`)}
          />
        )}

        <div
          className='flex items-center justify-between border-t-2 pt-2'
          style={{ borderColor: 'var(--section-accent)' }}
        >
          <span>{formatCurrency(price, i18n.language)}</span>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='border-2 px-3 py-1'
            >
              {t('action_cancel', { ns: 'ui', defaultValue: 'Cancel' })}
            </button>
            <button
              type='button'
              onClick={onConfirm}
              disabled={diyLoanBlocked || insufficient || price === 0}
              className='border-2 px-3 py-1 disabled:opacity-40'
              style={{
                background: 'var(--section-accent)',
                color: 'var(--color-void)'
              }}
            >
              {t('assets:actions.purchase')}
            </button>
          </div>
        </div>

        {diyLoanBlocked && (
          <p style={{ color: 'var(--color-blood)' }}>
            {t('assets:purchaseFailed.diy_loan_not_allowed')}
          </p>
        )}
        {insufficient && (
          <p style={{ color: 'var(--color-blood)' }}>
            {t('assets:purchaseFailed.insufficient_funds')}
          </p>
        )}
      </div>
    </Modal>
  )
}

interface ChoiceGroupProps<T extends string | number> {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  renderLabel: (v: T) => string
  disabledOption?: T
}

const ChoiceGroup = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  renderLabel,
  disabledOption
}: ChoiceGroupProps<T>) => (
  <div className='flex flex-col gap-1'>
    <span className='text-xs uppercase opacity-60'>{label}</span>
    <div className='flex gap-1'>
      {options.map(opt => {
        const isActive = opt === value
        const isDisabled = opt === disabledOption
        return (
          <button
            key={String(opt)}
            type='button'
            onClick={() => onChange(opt)}
            disabled={isDisabled}
            className='border-2 px-2 py-1 disabled:opacity-30'
            style={{
              background: isActive ? 'var(--section-accent)' : 'transparent',
              color: isActive ? 'var(--color-void)' : 'inherit',
              borderColor: isActive
                ? 'var(--section-accent)'
                : 'var(--color-toxic-green)'
            }}
          >
            {renderLabel(opt)}
          </button>
        )
      })}
    </div>
  </div>
)
