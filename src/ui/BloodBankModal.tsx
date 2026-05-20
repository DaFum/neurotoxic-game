import { useTranslation } from 'react-i18next'
import { ActionButton } from './shared/ActionButton'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { formatCurrency } from '../utils/numberUtils'

import { useEffect, useRef, type KeyboardEvent } from 'react'

type BloodBankConfig = {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
}

const DonationCosts = ({
  config,
  pulseCosts,
  t
}: {
  config: BloodBankConfig
  pulseCosts?: boolean
  t: ReturnType<typeof useTranslation>['t']
}) => {
  const costValueClass = `text-blood-red font-bold${pulseCosts ? ' animate-pulse' : ''}`
  return (
    <div className='flex flex-col gap-1 text-sm font-mono'>
      <div className='flex justify-between items-center'>
        <span className='text-ash-gray'>
          {t('ui:blood_bank.cost_harmony', { defaultValue: 'BAND HARMONY' })}
        </span>
        <span className={costValueClass}>-{config.harmonyCost}</span>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-ash-gray'>
          {t('ui:blood_bank.cost_stamina', { defaultValue: 'STAMINA (ALL)' })}
        </span>
        <span className={costValueClass}>-{config.staminaCost}</span>
      </div>
      <div className='flex justify-between items-center'>
        <span className='text-ash-gray'>
          {t('ui:blood_bank.cost_controversy', { defaultValue: 'CONTROVERSY' })}
        </span>
        <span className='text-blood-red font-bold'>
          +{config.controversyGain}
        </span>
      </div>
    </div>
  )
}

const ProfitRow = ({
  moneyGain,
  size,
  t,
  language
}: {
  moneyGain: number
  size: 'sm' | 'lg'
  t: ReturnType<typeof useTranslation>['t']
  language: string
}) => {
  const valueClass =
    size === 'lg'
      ? 'text-3xl font-bold text-toxic-green drop-shadow-[0_0_8px_var(--color-toxic-green)]'
      : 'text-2xl font-bold text-toxic-green drop-shadow-[0_0_4px_var(--color-toxic-green)]'
  return (
    <div className='flex justify-between items-center bg-toxic-green/10 p-2'>
      <span className='text-toxic-green font-mono uppercase tracking-widest text-sm'>
        {t('ui:blood_bank.gain', { defaultValue: 'PROFIT' })}
      </span>
      <span className={valueClass}>
        {formatCurrency(moneyGain, language, 'always')}
      </span>
    </div>
  )
}

type DonationCardProps = {
  variant: 'blood' | 'marrow'
  config: BloodBankConfig
  canDonate: boolean
  onDonate: () => void
  t: ReturnType<typeof useTranslation>['t']
  language: string
}

type DonationVariantConfig = {
  container: string
  title: string
  warning: string
  buttonEnabled: string
  titleKey: string
  titleDefault: string
  actionKey: string
  actionDefault: string
  size: 'sm' | 'lg'
  pulseCosts: boolean
  showWarningGlyph: boolean
}

const DONATION_VARIANTS = {
  blood: {
    container: 'border-2 border-blood-red',
    title: 'text-blood-red border-b border-blood-red',
    warning: 'text-blood-red',
    buttonEnabled:
      'bg-blood-red text-void-black border-blood-red hover:bg-void-black hover:text-blood-red shadow-[0_0_15px_var(--color-blood-red)]',
    titleKey: 'ui:blood_bank.blood_title',
    titleDefault: 'BLOOD DONATION',
    actionKey: 'ui:blood_bank.action',
    actionDefault: 'DONATE BLOOD',
    size: 'sm' as const,
    pulseCosts: false,
    showWarningGlyph: false
  },
  marrow: {
    container: 'border-2 border-warning-yellow',
    title:
      'text-warning-yellow border-b border-warning-yellow flex items-center justify-center gap-2',
    warning: 'text-warning-yellow',
    buttonEnabled:
      'bg-warning-yellow text-void-black border-warning-yellow hover:bg-void-black hover:text-warning-yellow shadow-[0_0_20px_var(--color-warning-yellow)]',
    titleKey: 'ui:blood_bank.marrow_title',
    titleDefault: 'MARROW EXTRACTION',
    actionKey: 'ui:blood_bank.action_marrow',
    actionDefault: 'EXTRACT MARROW',
    size: 'lg' as const,
    pulseCosts: true,
    showWarningGlyph: true
  }
} as const satisfies Record<'blood' | 'marrow', DonationVariantConfig>

const DonationCard = ({
  variant,
  config,
  canDonate,
  onDonate,
  t,
  language
}: DonationCardProps) => {
  const v = DONATION_VARIANTS[variant]
  return (
    <div className={`flex flex-col gap-4 ${v.container} p-4 bg-void-black/80`}>
      <h3
        className={`font-bold font-mono uppercase tracking-widest text-center pb-2 ${v.title}`}
      >
        {v.showWarningGlyph && <span className='animate-pulse'>⚠️</span>}
        {t(v.titleKey, { defaultValue: v.titleDefault })}
        {v.showWarningGlyph && <span className='animate-pulse'>⚠️</span>}
      </h3>

      <ProfitRow
        moneyGain={config.moneyGain}
        size={v.size}
        t={t}
        language={language}
      />

      <DonationCosts config={config} pulseCosts={v.pulseCosts} t={t} />

      <div className='mt-auto pt-4'>
        <ActionButton
          onClick={onDonate}
          disabled={!canDonate}
          className={`w-full ${canDonate ? v.buttonEnabled : ''}`}
        >
          {t(v.actionKey, { defaultValue: v.actionDefault })}
        </ActionButton>
        {!canDonate && (
          <p
            className={`text-xs font-mono uppercase tracking-wider text-center mt-2 ${v.warning}`}
          >
            {t('ui:blood_bank.warning', { defaultValue: 'TOO WEAK' })}
          </p>
        )}
      </div>
    </div>
  )
}

export const BloodBankModal = ({
  onClose,
  onDonate,
  canDonate,
  canDonateMarrow,
  config,
  marrowConfig
}: {
  onClose: () => void
  onDonate: (type: 'blood' | 'marrow') => void
  canDonate: boolean
  canDonateMarrow: boolean
  config: BloodBankConfig
  marrowConfig: BloodBankConfig
}) => {
  const { t, i18n } = useTranslation(['ui'])
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus()
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
  }

  return (
    <div
      ref={modalRef}
      className='fixed inset-0 z-50 flex items-center justify-center p-4 outline-none focus-visible:outline-none'
      role='dialog'
      aria-modal='true'
      aria-labelledby='blood-bank-title'
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-30 bg-void-black/90 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      <div className='relative z-50 w-full max-w-4xl border-4 border-blood-red bg-void-black flex flex-col shadow-[0_0_50px_var(--color-blood-red)] overflow-hidden'>
        {/* Background Image */}
        <div
          className='absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-screen pointer-events-none'
          style={{
            backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.BLOOD_BANK_BG)}")`
          }}
        />

        <div className='relative z-10 flex flex-col h-full'>
          {/* Header */}
          <div className='flex justify-between items-center p-6 border-b-4 border-blood-red bg-void-black/80'>
            <div>
              <h2
                id='blood-bank-title'
                className="text-4xl text-blood-red font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--color-blood-red)] uppercase"
              >
                {t('ui:blood_bank.title', { defaultValue: 'THE VOID CLINIC' })}
              </h2>
              <p className='text-ash-gray text-sm font-mono uppercase tracking-widest mt-1'>
                {t('ui:blood_bank.subtitle', {
                  defaultValue: 'BLOOD FOR CASH'
                })}
              </p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border-2 border-blood-red text-blood-red font-bold hover:bg-blood-red hover:text-void-black transition-colors uppercase font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
            >
              {t('ui:hq.leave', { defaultValue: 'LEAVE [ESC]' })}
            </button>
          </div>

          {/* Content */}
          <div className='flex-1 p-6 flex flex-col gap-6 bg-void-black/60'>
            <div className='border border-blood-red/50 p-4 bg-void-black/80'>
              <p className='text-ash-gray font-mono leading-relaxed text-sm'>
                {t('ui:blood_bank.description', {
                  defaultValue:
                    'Desperate times call for desperate measures. Sell your blood to the underground clinic. It pays well, but the physical and mental toll on the band is severe.'
                })}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <DonationCard
                variant='blood'
                config={config}
                canDonate={canDonate}
                onDonate={() => onDonate('blood')}
                t={t}
                language={i18n?.language ?? 'en'}
              />
              <DonationCard
                variant='marrow'
                config={marrowConfig}
                canDonate={canDonateMarrow}
                onDonate={() => onDonate('marrow')}
                t={t}
                language={i18n?.language ?? 'en'}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className='p-6 border-t-4 border-blood-red bg-void-black/80 flex justify-end gap-4'>
            <ActionButton
              onClick={onClose}
              className='min-w-[120px] border-ash-gray text-ash-gray hover:text-void-black hover:bg-ash-gray'
            >
              {t('ui:cancel', { defaultValue: 'CANCEL' })}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
