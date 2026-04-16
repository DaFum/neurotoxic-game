// @ts-nocheck
/*
 * (#1) Actual Updates: Added PropTypes.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { useGameState } from '../context/GameState'
import { formatCurrency } from '../utils/numberUtils'
import PropTypes from 'prop-types'

/**
 * Pirate Radio Broadcast Interface
 * Brutalist UI to trigger illegal radio hacks for fame and zealotry.
 * Uses Tailwind v4 syntax and handles `contentClassName`.
 */
export const PirateRadioModal = ({
  onClose,
  onBroadcast,
  canBroadcast,
  hasBroadcastedToday,
  config,
  contentClassName = ''
}) => {
  const { t, i18n } = useTranslation(['ui'])
  const { player, band } = useGameState()

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/90 backdrop-blur-sm'>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`bg-void-black border-2 border-toxic-green p-4 sm:p-6 max-w-lg w-full max-h-[85vh] shadow-[0_0_30px_var(--color-toxic-green-20)] flex flex-col ${contentClassName}`}
      >
        <div className='flex justify-between items-start border-b-2 border-toxic-green/50 pb-4 shrink-0'>
          <h2
            className='text-2xl sm:text-3xl font-[Metal_Mania] text-toxic-green glitch-text'
            data-text={t('ui:pirate_radio.title', {
              defaultValue: 'PIRATE RADIO BROADCAST'
            })}
          >
            {t('ui:pirate_radio.title', {
              defaultValue: 'PIRATE RADIO BROADCAST'
            })}
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-toxic-green hover:text-star-white hover:bg-toxic-green px-2 border border-transparent hover:border-toxic-green transition-colors font-mono'
            title={t('ui:button.close', { defaultValue: 'Close' })}
            aria-label={t('ui:button.close', { defaultValue: 'Close' })}
          >
            [X]
          </button>
        </div>

        <div className='text-ash-gray font-mono text-sm leading-relaxed space-y-4 flex-1 min-h-0 overflow-y-auto py-4 sm:py-6 pr-2'>
          <p>
            {t('ui:pirate_radio.description', {
              defaultValue:
                'Hack local frequencies and broadcast your rawest tracks. The signal will reach the desperate and the disillusioned, boosting your fame and feeding the cult.'
            })}
          </p>

          <div className='bg-void-black/50 border border-toxic-green/30 p-4 space-y-2'>
            <div className='flex justify-between'>
              <span>
                {t('ui:pirate_radio.fame_gain', { defaultValue: 'FAME GAIN' })}
              </span>
              <span className='text-toxic-green'>+{config.FAME_GAIN}</span>
            </div>
            <div className='flex justify-between'>
              <span>
                {t('ui:pirate_radio.zealotry_gain', {
                  defaultValue: 'ZEALOTRY GAIN'
                })}
              </span>
              <span className='text-warning-yellow'>
                +{config.ZEALOTRY_GAIN}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>
                {t('ui:pirate_radio.controversy_gain', {
                  defaultValue: 'CONTROVERSY'
                })}
              </span>
              <span className='text-blood-red'>+{config.CONTROVERSY_GAIN}</span>
            </div>
          </div>

          <div className='bg-void-black/50 border border-blood-red/30 p-4 space-y-2'>
            <h3 className='text-blood-red font-bold mb-2'>
              {t('ui:pirate_radio.required_offering', {
                defaultValue: '[ REQUIRED OFFERING ]'
              })}
            </h3>
            <div className='flex justify-between'>
              <span>
                {t('ui:pirate_radio.cost', {
                  defaultValue: 'COST (BRIBES/TECH)'
                })}
              </span>
              <span
                className={
                  player.money >= config.COST
                    ? 'text-ash-gray'
                    : 'text-blood-red'
                }
              >
                {formatCurrency(config.COST, i18n?.language)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>
                {t('ui:pirate_radio.harmony_cost', {
                  defaultValue: 'HARMONY DRAIN'
                })}
              </span>
              <span
                className={
                  band.harmony >= config.HARMONY_COST
                    ? 'text-ash-gray'
                    : 'text-blood-red'
                }
              >
                -{config.HARMONY_COST}
              </span>
            </div>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-toxic-green/50 shrink-0'>
          <GlitchButton variant='primary' onClick={onClose} className='flex-1'>
            [ {t('ui:button.cancel', { defaultValue: 'CANCEL' })} ]
          </GlitchButton>
          <GlitchButton
            variant='primary'
            onClick={onBroadcast}
            disabled={!canBroadcast}
            className='flex-1'
          >
            {hasBroadcastedToday
              ? `[ ${t('ui:pirate_radio.cooldown', { defaultValue: 'ON COOLDOWN' })} ]`
              : `[ ${t('ui:button.transmit', { defaultValue: 'TRANSMIT' })} ]`}
          </GlitchButton>
        </div>
      </motion.div>
    </div>
  )
}

PirateRadioModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onBroadcast: PropTypes.func.isRequired,
  canBroadcast: PropTypes.bool.isRequired,
  hasBroadcastedToday: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    FAME_GAIN: PropTypes.number.isRequired,
    ZEALOTRY_GAIN: PropTypes.number.isRequired,
    CONTROVERSY_GAIN: PropTypes.number.isRequired,
    COST: PropTypes.number.isRequired,
    HARMONY_COST: PropTypes.number.isRequired
  }).isRequired,
  contentClassName: PropTypes.string
}
