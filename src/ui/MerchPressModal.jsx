import { Fragment, createElement } from 'react'
import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { ProgressBar, Tooltip } from './shared/index.jsx'
import { useGameState } from '../context/GameState'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'

export const MerchPressModal = ({
  onClose,
  onPress,
  canPress,
  config
}) => {
  const { t } = useTranslation(['ui'])
  const { player, band } = useGameState()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--color-void-black)] border-2 border-[var(--color-toxic-green)] shadow-[0_0_30px_var(--color-toxic-green-20)] overflow-hidden"
        >
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url('${getGenImageUrl(IMG_PROMPTS.MERCH_PRESS_BG)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mixBlendMode: 'screen'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-void-black)] via-[var(--color-void-black)]/80 to-transparent z-0 pointer-events-none" />

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-[var(--color-toxic-green-30)] pb-4">
            <div>
              <h2 className="text-2xl font-display text-[var(--color-toxic-green)] tracking-widest uppercase glitch-text" data-text={t('ui:merch_press.title', { defaultValue: 'UNDERGROUND MERCH PRESS' })}>
                {t('ui:merch_press.title', { defaultValue: 'UNDERGROUND MERCH PRESS' })}
              </h2>
              <p className="text-sm text-[var(--color-terminal-gray)] mt-1 uppercase tracking-wider">
                {t('ui:merch_press.subtitle', { defaultValue: 'BOOTLEG OPERATION' })}
              </p>
            </div>
            <Tooltip content={t('ui:menu.close')}>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--color-toxic-green)] hover:text-white transition-colors p-2"
                aria-label={t('ui:menu.close')}
              >
                [X]
              </button>
            </Tooltip>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-[var(--color-terminal-gray)] text-sm leading-relaxed border-l-2 border-[var(--color-toxic-green-50)] pl-4 py-1">
              {t('ui:merch_press.description', { defaultValue: 'Print bootleg shirts and press illegal vinyls in the basement. High risk, high reward.' })}
            </p>

            {/* Costs and Gains */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-void-black)] border border-[var(--color-critical-red-50)] p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[var(--color-critical-red-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-[var(--color-critical-red)] mb-1 uppercase tracking-widest">
                  {t('ui:merch_press.cost_label', { defaultValue: 'COST' })}
                </span>
                <span className="text-xl font-display text-[var(--color-critical-red)]">
                  €{config.cost}
                </span>
              </div>
              <div className="bg-[var(--color-void-black)] border border-[var(--color-toxic-green-30)] p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[var(--color-toxic-green-10)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-[var(--color-toxic-green)] mb-1 uppercase tracking-widest">
                  {t('ui:merch_press.gain_label', { defaultValue: 'GAINS' })}
                </span>
                <span className="text-xl font-display text-[var(--color-toxic-green)] text-center">
                  +{config.loyaltyGain} {t('ui:stats.loyalty', { defaultValue: 'LOYALTY' })}
                  <br />
                  +{config.controversyGain} {t('ui:stats.controversy', { defaultValue: 'CONTROVERSY' })}
                </span>
              </div>
            </div>

            <div className="bg-[var(--color-critical-red-20)] border border-[var(--color-critical-red-50)] p-4 mt-4">
                <p className="text-[var(--color-critical-red)] text-sm text-center font-bold">
                    {t('ui:merch_press.risk_warning', { risk: config.failChance * 100, defaultValue: `WARNING: ${config.failChance * 100}% CHANCE OF EQUIPMENT FAILURE (-${config.harmonyCostOnFail} HARMONY)` })}
                </p>
            </div>

            {/* Current Stats */}
            <div className="border border-[var(--color-toxic-green-20)] p-4 space-y-4">
              <h3 className="text-[var(--color-toxic-green)] text-sm uppercase tracking-widest mb-2">
                {t('ui:merch_press.current_stats', { defaultValue: 'CURRENT RESOURCES' })}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-terminal-gray)] uppercase">{t('ui:stats.money', { defaultValue: 'FUNDS' })}</span>
                      <span className={`${canPress ? 'text-[var(--color-toxic-green)]' : 'text-[var(--color-critical-red)]'}`}>
                        €{player?.money || 0} / €{config.cost}
                      </span>
                    </div>
                    <ProgressBar
                      value={Math.min(100, ((player?.money || 0) / config.cost) * 100)}
                      color={canPress ? 'var(--color-toxic-green)' : 'var(--color-critical-red)'}
                    />
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-terminal-gray)] uppercase">{t('ui:stats.harmony', { defaultValue: 'HARMONY' })}</span>
                      <span className="text-[var(--color-toxic-green)]">{band?.harmony || 0}%</span>
                    </div>
                    <ProgressBar value={band?.harmony || 0} color="var(--color-toxic-green)" />
                 </div>
              </div>
            </div>
          </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-4">
              <GlitchButton
                variant="secondary"
                onClick={onClose}
                className="uppercase"
              >
                [ {t('ui:button.cancel', { defaultValue: 'CANCEL' })} ]
              </GlitchButton>
              {createElement(
                !canPress ? 'span' : Fragment,
                !canPress ? { tabIndex: 0 } : {},
                <GlitchButton
                  variant={canPress ? "warning" : "danger"}
                  onClick={onPress}
                  disabled={!canPress}
                  className="uppercase"
                >
                  [ {t('ui:merch_press.confirm', { defaultValue: 'START PRESS' })} ]
                </GlitchButton>
              )}
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-toxic-green)] pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-toxic-green)] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-toxic-green)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-toxic-green)] pointer-events-none" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

MerchPressModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPress: PropTypes.func.isRequired,
  canPress: PropTypes.bool.isRequired,
  config: PropTypes.shape({
    cost: PropTypes.number.isRequired,
    loyaltyGain: PropTypes.number.isRequired,
    controversyGain: PropTypes.number.isRequired,
    failChance: PropTypes.number.isRequired,
    harmonyCostOnFail: PropTypes.number.isRequired
  }).isRequired
}
