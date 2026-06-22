import { IconClose } from './shared/Icons'

import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { ProgressBar, Tooltip } from './shared/index.tsx'
import { useGameSelector } from '../context/GameState'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { PlayerState, BandState } from '../types'
import { formatCurrency } from '../utils/numberUtils'

type MerchPressConfig = {
  cost: number
  loyaltyGain: number
  controversyGain: number
  fameGain: number
  failChance: number
  harmonyCostOnFail: number
}

type MerchPressModalProps = {
  onClose: () => void
  onPress: () => void
  canPress: boolean
  config: MerchPressConfig
}

/**
 * Shows merch-press costs, rewards, availability, and confirmation actions.
 * @param props - Press availability, press action, close handler, and merch-press configuration.
 */
export const MerchPressModal = ({
  onClose,
  onPress,
  canPress,
  config
}: MerchPressModalProps) => {
  const { t, i18n } = useTranslation(['ui'])
  const player = useGameSelector(state => state.player)
  const band = useGameSelector(state => state.band)

  const isAffordable = (player?.money ?? 0) >= (config.cost ?? 0)
  const hasEnoughHarmony =
    (band?.harmony ?? 0) >= (config.harmonyCostOnFail ?? 0)

  const disabledReason = !isAffordable
    ? t('ui:merch_press.not_enough_money', { defaultValue: 'Not enough money' })
    : !hasEnoughHarmony
      ? t('ui:merch_press.not_enough_harmony', {
          defaultValue: 'Not enough harmony'
        })
      : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-(--z-modal) flex items-center justify-center p-4 bg-void-black/90 backdrop-blur-sm'
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className='relative w-full max-w-4xl border-4 border-toxic-green p-3 sm:p-6 bg-void-black shadow-[4px_4px_0px_theme(colors.toxic-green)] sm:shadow-[8px_8px_0px_theme(colors.toxic-green)] max-h-[calc(100svh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar'
        >
          {/* Background Image with Overlay */}
          <div
            className='absolute inset-0 z-0 opacity-20 pointer-events-none'
            style={{
              backgroundImage: `url('${resolveGenImageUrl(IMG_PROMPTS.MERCH_PRESS_BG)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mixBlendMode: 'screen'
            }}
          />
          <div className='absolute inset-0 bg-gradient-to-t from-void-black via-void-black/80 to-transparent z-0 pointer-events-none' />

          <div className='relative z-10 p-6'>
            <MerchPressHeader onClose={onClose} t={t} />

            {/* Content */}
            <div className='space-y-6'>
              <p className='text-ash-gray text-sm leading-relaxed border-l-2 border-toxic-green-50 pl-4 py-1'>
                {t('ui:merch_press.description', {
                  defaultValue:
                    'Print bootleg shirts and press illegal vinyls in the basement. High risk, high reward.'
                })}
              </p>

              <MerchPressCostsAndGains config={config} t={t} i18n={i18n} />

              <MerchPressRiskWarning config={config} t={t} />

              <MerchPressCurrentStats
                config={config}
                t={t}
                i18n={i18n}
                player={player}
                band={band}
                isAffordable={isAffordable}
                hasEnoughHarmony={hasEnoughHarmony}
              />
            </div>

            <MerchPressActions
              onClose={onClose}
              onPress={onPress}
              canPress={canPress}
              disabledReason={disabledReason}
              t={t}
            />

            {/* Corner Decorations */}
            <div className='absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-toxic-green pointer-events-none' />
            <div className='absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-toxic-green pointer-events-none' />
            <div className='absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-toxic-green pointer-events-none' />
            <div className='absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-toxic-green pointer-events-none' />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

type MerchPressHeaderProps = {
  onClose: () => void
  t: ReturnType<typeof useTranslation>['t']
}

function MerchPressHeader({ onClose, t }: MerchPressHeaderProps) {
  return (
    <div className='flex justify-between items-start mb-6 border-b border-toxic-green-20 pb-4'>
      <div>
        <h2
          className='text-2xl font-display text-toxic-green tracking-widest uppercase glitch-text'
          data-text={t('ui:merch_press.title', {
            defaultValue: 'UNDERGROUND MERCH PRESS'
          })}
        >
          {t('ui:merch_press.title', {
            defaultValue: 'UNDERGROUND MERCH PRESS'
          })}
        </h2>
        <p className='text-sm text-ash-gray mt-1 uppercase tracking-wider'>
          {t('ui:merch_press.subtitle', {
            defaultValue: 'BOOTLEG OPERATION'
          })}
        </p>
      </div>
      <Tooltip content={t('ui:menu.close')}>
        <button
          type='button'
          onClick={onClose}
          className='text-toxic-green hover:text-star-white transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          aria-label={t('ui:menu.close')}
        >
          <IconClose />
        </button>
      </Tooltip>
    </div>
  )
}

type MerchPressCostsAndGainsProps = {
  config: MerchPressConfig
  t: ReturnType<typeof useTranslation>['t']
  i18n: ReturnType<typeof useTranslation>['i18n']
}

function MerchPressCostsAndGains({
  config,
  t,
  i18n
}: MerchPressCostsAndGainsProps) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='bg-void-black border border-error-red/20 p-3 flex flex-col items-center justify-center relative overflow-hidden group'>
        <div className='absolute inset-0 bg-error-red/20 opacity-0 group-hover:opacity-100 transition-opacity' />
        <span className='text-xs text-error-red mb-1 uppercase tracking-widest'>
          {t('ui:merch_press.cost_label', { defaultValue: 'COST' })}
        </span>
        <span className='text-xl font-display text-error-red'>
          {formatCurrency(config.cost, i18n.language)}
        </span>
      </div>
      <div className='bg-void-black border border-toxic-green-20 p-3 flex flex-col items-center justify-center relative overflow-hidden group'>
        <div className='absolute inset-0 bg-toxic-green-10 opacity-0 group-hover:opacity-100 transition-opacity' />
        <span className='text-xs text-toxic-green mb-1 uppercase tracking-widest'>
          {t('ui:merch_press.gain_label', { defaultValue: 'GAINS' })}
        </span>
        <span className='text-xl font-display text-toxic-green text-center'>
          +{config.loyaltyGain}{' '}
          {t('ui:stats.loyalty', { defaultValue: 'LOYALTY' })}
          <br />+{config.controversyGain}{' '}
          {t('ui:stats.controversy', { defaultValue: 'CONTROVERSY' })}
          <br />+{config.fameGain}{' '}
          {t('ui:stats.fame', { defaultValue: 'FAME' })}
        </span>
      </div>
    </div>
  )
}

type MerchPressRiskWarningProps = {
  config: MerchPressConfig
  t: ReturnType<typeof useTranslation>['t']
}

function MerchPressRiskWarning({ config, t }: MerchPressRiskWarningProps) {
  return (
    <div className='bg-error-red/20 border border-error-red/20 p-4 mt-4'>
      <p className='text-error-red text-sm text-center font-bold'>
        {t('ui:merch_press.risk_warning', {
          risk: config.failChance * 100,
          harmonyCostOnFail: config.harmonyCostOnFail,
          defaultValue: `WARNING: ${config.failChance * 100}% CHANCE OF EQUIPMENT FAILURE (-${config.harmonyCostOnFail} HARMONY)`
        })}
      </p>
    </div>
  )
}

type MerchPressCurrentStatsProps = {
  config: MerchPressConfig
  t: ReturnType<typeof useTranslation>['t']
  i18n: ReturnType<typeof useTranslation>['i18n']
  player: PlayerState | null
  band: BandState | null
  isAffordable: boolean
  hasEnoughHarmony: boolean
}

function MerchPressCurrentStats({
  config,
  t,
  i18n,
  player,
  band,
  isAffordable,
  hasEnoughHarmony
}: MerchPressCurrentStatsProps) {
  return (
    <div className='border border-toxic-green-20 p-4 space-y-4'>
      <h3 className='text-toxic-green text-sm uppercase tracking-widest mb-2'>
        {t('ui:merch_press.current_stats', {
          defaultValue: 'CURRENT RESOURCES'
        })}
      </h3>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <div className='flex justify-between text-xs mb-1'>
            <span className='text-ash-gray uppercase'>
              {t('ui:stats.money', { defaultValue: 'FUNDS' })}
            </span>
            <span
              className={`${isAffordable ? 'text-toxic-green' : 'text-error-red'}`}
            >
              {formatCurrency(player?.money ?? 0, i18n.language)} /{' '}
              {formatCurrency(config.cost, i18n.language)}
            </span>
          </div>
          <ProgressBar
            value={
              config.cost > 0
                ? Math.min(100, ((player?.money ?? 0) / config.cost) * 100)
                : 0
            }
            max={100}
            showValue={false}
            color={isAffordable ? 'bg-toxic-green' : 'bg-error-red'}
          />
        </div>
        <div>
          <div className='flex justify-between text-xs mb-1'>
            <span className='text-ash-gray uppercase'>
              {t('ui:stats.harmony', { defaultValue: 'HARMONY' })}
            </span>
            <span
              className={`${hasEnoughHarmony ? 'text-toxic-green' : 'text-error-red'}`}
            >
              {band?.harmony ?? 0}%
            </span>
          </div>
          <ProgressBar
            value={band?.harmony ?? 0}
            max={100}
            showValue={false}
            color={hasEnoughHarmony ? 'bg-toxic-green' : 'bg-error-red'}
          />
        </div>
      </div>
    </div>
  )
}

type MerchPressActionsProps = {
  onClose: () => void
  onPress: () => void
  canPress: boolean
  disabledReason: string | null
  t: ReturnType<typeof useTranslation>['t']
}

function MerchPressActions({
  onClose,
  onPress,
  canPress,
  disabledReason,
  t
}: MerchPressActionsProps) {
  return (
    <div className='mt-8 flex flex-col sm:flex-row justify-end gap-4'>
      <GlitchButton
        variant='primary'
        onClick={onClose}
        className='w-full sm:w-auto uppercase'
      >
        [ {t('ui:button.cancel', { defaultValue: 'CANCEL' })} ]
      </GlitchButton>
      {!canPress ? (
        <Tooltip content={disabledReason}>
          <GlitchButton
            variant='danger'
            onClick={onPress}
            disabled={true}
            aria-disabled='true'
            tabIndex={-1}
            className='w-full sm:w-auto uppercase'
          >
            [{' '}
            {t('ui:merch_press.confirm', {
              defaultValue: 'START PRESS'
            })}{' '}
            ]
          </GlitchButton>
        </Tooltip>
      ) : (
        <GlitchButton
          variant='warning'
          onClick={onPress}
          disabled={false}
          className='w-full sm:w-auto uppercase'
        >
          [ {t('ui:merch_press.confirm', { defaultValue: 'START PRESS' })} ]
        </GlitchButton>
      )}
    </div>
  )
}
