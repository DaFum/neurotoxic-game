import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ActionButton } from './shared/ActionButton'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'

import { useEffect, useRef } from 'react'

export const BloodBankModal = ({ onClose, onDonate, canDonate, config }) => {
  const { t } = useTranslation(['ui'])
  const modalRef = useRef(null)

  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus()
    }
  }, [])

  const handleKeyDown = e => {
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

      <div className='relative z-50 w-full max-w-2xl border-4 border-blood-red bg-void-black flex flex-col shadow-[0_0_50px_var(--color-blood-red)] overflow-hidden'>
        {/* Background Image */}
        <div
          className='absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-screen pointer-events-none'
          style={{
            backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.BLOOD_BANK_BG)}")`
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
              className='px-4 py-2 border-2 border-blood-red text-blood-red font-bold hover:bg-blood-red hover:text-void-black transition-colors uppercase font-mono'
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

            <div className='grid grid-cols-2 gap-6'>
              {/* Rewards */}
              <div className='border-2 border-toxic-green p-4 bg-void-black flex flex-col justify-center items-center text-center group hover:bg-toxic-green/5 transition-colors'>
                <h3 className='text-toxic-green font-bold font-mono uppercase tracking-widest mb-2'>
                  {t('ui:blood_bank.gain', { defaultValue: 'PROFIT' })}
                </h3>
                <p className='text-4xl font-bold text-toxic-green drop-shadow-[0_0_8px_var(--color-toxic-green)]'>
                  +€{config.moneyGain}
                </p>
              </div>

              {/* Costs */}
              <div className='border-2 border-blood-red p-4 bg-void-black flex flex-col gap-2 justify-center group hover:bg-blood-red/5 transition-colors'>
                <h3 className='text-blood-red font-bold font-mono uppercase tracking-widest text-center mb-1'>
                  {t('ui:blood_bank.cost', { defaultValue: 'THE TOLL' })}
                </h3>
                <div className='flex justify-between items-center text-sm font-mono'>
                  <span className='text-ash-gray'>
                    {t('ui:blood_bank.cost_harmony', {
                      defaultValue: 'BAND HARMONY'
                    })}
                  </span>
                  <span className='text-blood-red font-bold'>
                    -{config.harmonyCost}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm font-mono'>
                  <span className='text-ash-gray'>
                    {t('ui:blood_bank.cost_stamina', {
                      defaultValue: 'STAMINA (ALL)'
                    })}
                  </span>
                  <span className='text-blood-red font-bold'>
                    -{config.staminaCost}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm font-mono'>
                  <span className='text-ash-gray'>
                    {t('ui:blood_bank.cost_controversy', {
                      defaultValue: 'CONTROVERSY'
                    })}
                  </span>
                  <span className='text-blood-red font-bold'>
                    +{config.controversyGain}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message if cannot donate */}
            {!canDonate && (
              <div className='mt-2 p-3 border border-blood-red/50 bg-blood-red/10 text-center'>
                <p className='text-blood-red text-xs font-mono uppercase tracking-wider animate-pulse'>
                  {t('ui:blood_bank.warning', {
                    defaultValue:
                      'WARNING: BAND IS TOO WEAK TO SURVIVE DONATION.'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className='p-6 border-t-4 border-blood-red bg-void-black/80 flex justify-end gap-4'>
            <ActionButton onClick={onClose} className='min-w-[120px]'>
              {t('ui:cancel', { defaultValue: 'CANCEL' })}
            </ActionButton>
            <ActionButton
              onClick={onDonate}
              disabled={!canDonate}
              className={`min-w-[160px] ${canDonate ? 'bg-blood-red text-void-black border-blood-red hover:bg-void-black hover:text-blood-red shadow-[0_0_15px_var(--color-blood-red)]' : ''}`}
            >
              {t('ui:blood_bank.action', { defaultValue: 'DONATE BLOOD' })}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}

BloodBankModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onDonate: PropTypes.func.isRequired,
  canDonate: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    moneyGain: PropTypes.number.isRequired,
    harmonyCost: PropTypes.number.isRequired,
    staminaCost: PropTypes.number.isRequired,
    controversyGain: PropTypes.number.isRequired
  }).isRequired
}
