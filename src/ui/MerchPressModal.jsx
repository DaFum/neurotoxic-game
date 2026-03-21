import React from 'react'
import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from './GlitchButton'
import { useGameState } from '../context/GameState'

const ProgressBar = ({ value, color }) => (
  <div className="h-2 w-full bg-void-black border border-gray-800 rounded-sm overflow-hidden">
    <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${value}%` }} />
  </div>
)

export const MerchPressModal = ({
  onClose,
  onPress,
  canPress,
  config
}) => {
  const { t } = useTranslation(['ui'])
  const { player, band, social } = useGameState()

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
          className="relative w-full max-w-lg bg-void-black border-2 border-toxic-green p-6 shadow-[0_0_30px_var(--color-toxic-green-20)]"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b border-toxic-green/30 pb-4">
            <div>
              <h2 className="text-2xl font-display text-toxic-green tracking-widest uppercase glitch-text" data-text={t('ui:merch_press.title', { defaultValue: 'UNDERGROUND MERCH PRESS' })}>
                {t('ui:merch_press.title', { defaultValue: 'UNDERGROUND MERCH PRESS' })}
              </h2>
              <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider">
                {t('ui:merch_press.subtitle', { defaultValue: 'BOOTLEG OPERATION' })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-toxic-green hover:text-white transition-colors p-2"
              aria-label={t('ui:menu.close')}
            >
              [X]
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-toxic-green/50 pl-4 py-1">
              {t('ui:merch_press.description', { defaultValue: 'Print bootleg shirts and press illegal vinyls in the basement. High risk, high reward.' })}
            </p>

            {/* Costs and Gains */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-void-black border border-red-900/50 p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-red-400 mb-1 uppercase tracking-widest">
                  {t('ui:merch_press.cost_label', { defaultValue: 'COST' })}
                </span>
                <span className="text-xl font-display text-red-500">
                  €{config.cost}
                </span>
              </div>
              <div className="bg-void-black border border-toxic-green/30 p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-toxic-green/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-toxic-green mb-1 uppercase tracking-widest">
                  {t('ui:merch_press.gain_label', { defaultValue: 'GAINS' })}
                </span>
                <span className="text-xl font-display text-toxic-green text-center">
                  +{config.loyaltyGain} {t('ui:stats.loyalty', { defaultValue: 'LOYALTY' })}
                  <br />
                  +{config.controversyGain} {t('ui:stats.controversy', { defaultValue: 'CONTROVERSY' })}
                </span>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/50 p-4 mt-4">
                <p className="text-red-400 text-sm text-center font-bold">
                    {t('ui:merch_press.risk_warning', { defaultValue: `WARNING: ${config.failChance * 100}% CHANCE OF EQUIPMENT FAILURE (-${config.harmonyCostOnFail} HARMONY)` })}
                </p>
            </div>

            {/* Current Stats */}
            <div className="border border-toxic-green/20 p-4 space-y-4">
              <h3 className="text-toxic-green text-sm uppercase tracking-widest mb-2">
                {t('ui:merch_press.current_stats', { defaultValue: 'CURRENT RESOURCES' })}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 uppercase">{t('ui:stats.money', { defaultValue: 'FUNDS' })}</span>
                      <span className={`${canPress ? 'text-toxic-green' : 'text-red-500'}`}>
                        €{player?.money || 0} / €{config.cost}
                      </span>
                    </div>
                    <ProgressBar
                      value={Math.min(100, ((player?.money || 0) / config.cost) * 100)}
                      color={canPress ? 'bg-toxic-green' : 'bg-red-500'}
                    />
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 uppercase">{t('ui:stats.harmony', { defaultValue: 'HARMONY' })}</span>
                      <span className="text-toxic-green">{band?.harmony || 0}%</span>
                    </div>
                    <ProgressBar value={band?.harmony || 0} color="bg-toxic-green" />
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
            <GlitchButton
              variant={canPress ? "warning" : "danger"}
              onClick={onPress}
              disabled={!canPress}
              className="uppercase"
            >
              [ {t('ui:merch_press.confirm', { defaultValue: 'START PRESS' })} ]
            </GlitchButton>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-toxic-green pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-toxic-green pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-toxic-green pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-toxic-green pointer-events-none" />
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
