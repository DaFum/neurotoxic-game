/**
 * (#1) Actual Updates: Extracted GigModifiersBlock from PreGig scene
 * (#2) Next Steps: Extract remaining logic

 */
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import GigModifierButton from '../../ui/GigModifierButton'
import type { TFunction } from 'i18next'
import type { ModifierOption } from '../../hooks/usePreGigLogic'
import type { ActiveEffectEntry } from '../../types/components'

type GigModifiersBlockProps = {
  t: TFunction
  gigModifierOptions: ModifierOption[]
  gigModifiers: Record<string, boolean>
  toggleModifier: (key: string) => void
  handleBandMeeting: () => void
  bandMeetingCost: number
  currentModifiers: { activeEffects: ActiveEffectEntry[] }
}

const sanitizeEffectOptions = (
  options: Record<string, unknown> | undefined
): Record<string, string | number | boolean | null> => {
  if (!options) return {}
  const sanitized: Record<string, string | number | boolean | null> = {}
  const entries = Object.entries(options)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry) continue
    const [key, value] = entry
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const GigModifiersBlock = ({
  t,
  gigModifierOptions,
  gigModifiers,
  toggleModifier,
  handleBandMeeting,
  bandMeetingCost,
  currentModifiers
}: GigModifiersBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm overflow-y-auto max-h-[38vh] sm:max-h-[42vh] lg:max-h-none'
    >
      <h3 className='text-sm text-toxic-green mb-3 tracking-widest font-mono border-b border-toxic-green/30 pb-2'>
        {t('ui:pregig.allocation')}
      </h3>
      <div className='flex flex-col gap-2.5'>
        {gigModifierOptions.map((item: ModifierOption) => (
          <GigModifierButton
            key={item.key}
            item={item}
            isActive={!!gigModifiers[item.key]}
            onClick={toggleModifier}
          />
        ))}

        <div className='border-t border-ash-gray/20 pt-2.5'>
          <button
            type='button'
            onClick={handleBandMeeting}
            className='w-full flex justify-between items-center p-3 border-2 border-warning-yellow/30 hover:border-warning-yellow text-warning-yellow/70 hover:text-warning-yellow transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          >
            <span className='flex flex-col text-left'>
              <span className='font-bold text-sm'>
                {t('ui:pregig.bandMeeting.label')}
              </span>
              <span className='text-[10px] opacity-70'>
                {t('ui:pregig.bandMeeting.desc')}
              </span>
            </span>
            <span className='font-mono text-sm font-bold tabular-nums'>
              {t('ui:cost', { cost: bandMeetingCost })}
            </span>
          </button>
        </div>
      </div>

      {/* Active Modifiers Display */}
      <div className='mt-3 p-3 bg-toxic-green/5 border border-toxic-green/30'>
        <h4 className='text-[10px] font-bold text-toxic-green mb-2 tracking-widest'>
          {t('ui:pregig.activeModifiers')}
        </h4>
        {currentModifiers.activeEffects.length > 0 ? (
          <ul className='text-xs space-y-1'>
            {currentModifiers.activeEffects.map((eff: ActiveEffectEntry) => (
              <li
                key={typeof eff === 'string' ? eff : eff.key}
                className='text-star-white/60 flex items-center gap-1.5'
              >
                <span className='w-1 h-1 bg-toxic-green inline-block' />
                {typeof eff === 'string'
                  ? t(eff, { defaultValue: eff })
                  : t(eff.key, {
                      ...sanitizeEffectOptions(eff.options),
                      defaultValue: eff.fallback
                    })}
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-[10px] text-ash-gray/50 italic'>
            {t('ui:pregig.noModifiers')}
          </div>
        )}
      </div>
    </motion.div>
  )
}

GigModifiersBlock.propTypes = {
  t: PropTypes.func.isRequired,
  gigModifierOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  gigModifiers: PropTypes.object.isRequired,
  toggleModifier: PropTypes.func.isRequired,
  handleBandMeeting: PropTypes.func.isRequired,
  bandMeetingCost: PropTypes.number.isRequired,
  currentModifiers: PropTypes.shape({
    activeEffects: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          key: PropTypes.string.isRequired,
          fallback: PropTypes.string,
          options: PropTypes.object
        })
      ])
    ).isRequired
  }).isRequired
}
