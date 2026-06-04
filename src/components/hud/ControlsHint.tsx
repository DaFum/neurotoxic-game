import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const LANES = [
  { id: 'guitar', key: '←' },
  { id: 'drums', key: '↓' },
  { id: 'bass', key: '→' }
] as const

/**
 * Displays desktop keyboard hints for the rhythm-game lane controls.
 *
 * @remarks
 * The hint row is hidden below the `md` breakpoint because touch controls are
 * presented elsewhere.
 */
export const ControlsHint = memo(function ControlsHint() {
  const { t } = useTranslation(['ui'])

  return (
    <div
      className='absolute bottom-2 sm:bottom-3 w-full justify-center gap-3 sm:gap-8 z-(--z-stage-bg) pointer-events-none hidden md:flex'
      role='group'
      aria-label={t('ui:gig.controlsHint', { defaultValue: 'Game Controls' })}
    >
      {LANES.map(({ id, key }) => (
        <div
          key={id}
          className='flex items-center gap-1 sm:gap-1.5 font-mono text-xs sm:text-xs'
          style={{ color: 'var(--color-ash-gray)' }}
        >
          <kbd
            className='border px-1.5 py-0.5 text-xs font-sans'
            style={{
              borderColor: 'rgb(var(--color-ash-gray-rgb) / 30%)'
            }}
          >
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
