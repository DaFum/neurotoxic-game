import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const LANES = [
  { id: 'guitar', key: '←' },
  { id: 'drums', key: '↓' },
  { id: 'bass', key: '→' }
] as const

export const ControlsHint = memo(function ControlsHint() {
  const { t } = useTranslation(['ui'])

  return (
    <div
      className='absolute bottom-3 w-full flex justify-center gap-8 z-10 pointer-events-none'
      role='group'
      aria-label={t('ui:gig.controlsHint', { defaultValue: 'Game Controls' })}
    >
      {LANES.map(({ id, key }) => (
        <div
          key={id}
          className='flex items-center gap-1.5 text-ash-gray/60 font-mono text-xs'
        >
          <kbd className='border border-ash-gray/30 px-1.5 py-0.5 text-[10px] font-sans'>
            {key}
          </kbd>
          <span className='uppercase tracking-wider'>
            {t(`ui:rhythm.lane_${id}`)}
          </span>
        </div>
      ))}
    </div>
  )
})
