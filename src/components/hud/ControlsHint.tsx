// @ts-nocheck
// TODO: Review this file
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const LANE_NAMES = ['Guitar', 'Drums', 'Bass']
const LANE_KEYS = ['←', '↓', '→']

export const ControlsHint = memo(function ControlsHint() {
  const { t } = useTranslation(['ui'])

  return (
    <div
      className='absolute bottom-3 w-full flex justify-center gap-8 z-10 pointer-events-none'
      role='group'
      aria-label={t('ui:gig.controlsHint', { defaultValue: 'Game Controls' })}
    >
      {LANE_NAMES.map((name, i) => (
        <div
          key={name}
          className='flex items-center gap-1.5 text-ash-gray/60 font-mono text-xs'
        >
          <kbd className='border border-ash-gray/30 px-1.5 py-0.5 text-[10px] font-sans'>
            {LANE_KEYS[i]}
          </kbd>
          <span className='uppercase tracking-wider'>{name}</span>
        </div>
      ))}
    </div>
  )
})
