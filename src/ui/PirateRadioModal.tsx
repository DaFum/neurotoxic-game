import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { useGameSelector } from '../context/GameState'
import { formatCurrency } from '../utils/numberUtils'
import type { PirateBroadcastPayload } from '../types'

type PirateRadioConfig = {
  COST: PirateBroadcastPayload['cost']
  FAME_GAIN: PirateBroadcastPayload['fameGain']
  ZEALOTRY_GAIN: PirateBroadcastPayload['zealotryGain']
  CONTROVERSY_GAIN: PirateBroadcastPayload['controversyGain']
  HARMONY_COST: PirateBroadcastPayload['harmonyCost']
}

type PirateRadioModalProps = {
  onClose: () => void
  onBroadcast: () => void
  canBroadcast: boolean
  hasBroadcastedToday: boolean
  config: PirateRadioConfig
  contentClassName?: string
}

const StatRow = ({
  label,
  value,
  valueClass
}: {
  label: string
  value: string
  valueClass: string
}) => (
  <div className='flex justify-between'>
    <span>{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
)

/**
 * Pirate Radio Broadcast Interface
 * Uses Tailwind v4 syntax and handles `contentClassName`.
 */
export const PirateRadioModal = memo(
  ({
    onClose,
    onBroadcast,
    canBroadcast,
    hasBroadcastedToday,
    config,
    contentClassName = ''
  }: PirateRadioModalProps) => {
    const { t, i18n } = useTranslation(['ui'])
    const player = useGameSelector(state => state.player)
    const band = useGameSelector(state => state.band)

    return (
      <div className='fixed inset-0 z-(--z-modal) flex items-center justify-center p-4 bg-void-black/90 backdrop-blur-sm'>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`border-4 border-toxic-green p-3 sm:p-6 bg-void-black shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)] max-w-lg w-full max-h-[calc(100svh-4rem)] flex flex-col ${contentClassName}`}
        >
          <div className='flex justify-between items-start border-b-2 border-toxic-green/50 pb-4 shrink-0'>
            <h2
              className='text-2xl sm:text-3xl font-display text-toxic-green glitch-text'
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
              className='text-toxic-green hover:text-star-white hover:bg-toxic-green px-2 border border-transparent hover:border-toxic-green transition-colors font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
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
              <StatRow
                label={t('ui:pirate_radio.fame_gain', {
                  defaultValue: 'FAME GAIN'
                })}
                value={`+${config.FAME_GAIN}`}
                valueClass='text-toxic-green'
              />
              <StatRow
                label={t('ui:pirate_radio.zealotry_gain', {
                  defaultValue: 'ZEALOTRY GAIN'
                })}
                value={`+${config.ZEALOTRY_GAIN}`}
                valueClass='text-warning-yellow'
              />
              <StatRow
                label={t('ui:pirate_radio.controversy_gain', {
                  defaultValue: 'CONTROVERSY'
                })}
                value={`+${config.CONTROVERSY_GAIN}`}
                valueClass='text-blood-red'
              />
            </div>

            <div className='bg-void-black/50 border border-blood-red/30 p-4 space-y-2'>
              <h3 className='text-blood-red font-bold mb-2'>
                {t('ui:pirate_radio.required_offering', {
                  defaultValue: '[ REQUIRED OFFERING ]'
                })}
              </h3>
              <StatRow
                label={t('ui:pirate_radio.cost', {
                  defaultValue: 'COST (BRIBES/TECH)'
                })}
                value={formatCurrency(config.COST, i18n.language)}
                valueClass={
                  (player?.money ?? 0) >= config.COST
                    ? 'text-ash-gray'
                    : 'text-blood-red'
                }
              />
              <StatRow
                label={t('ui:pirate_radio.harmony_cost', {
                  defaultValue: 'HARMONY DRAIN'
                })}
                value={`-${config.HARMONY_COST}`}
                valueClass={
                  (band?.harmony ?? 0) >= config.HARMONY_COST
                    ? 'text-ash-gray'
                    : 'text-blood-red'
                }
              />
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-toxic-green/50 shrink-0'>
            <GlitchButton
              variant='primary'
              onClick={onClose}
              className='flex-1'
            >
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
)
