import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const LANES = [
  { id: 'guitar', key: '←' },
  { id: 'drums', key: '↓' },
  { id: 'bass', key: '→' }
] as const

/**
 * Properties for the {@link ControlsHint} component.
 */
interface ControlsHintProps {
  /**
   * Whether toxic mode is active. The crowd-energy strip grows a warning row
   * while it is, which claims the space this hint occupies.
   */
  isToxicMode?: boolean
}

/**
 * Displays desktop keyboard hints for the rhythm-game lane controls.
 *
 * @remarks
 * The hint row is hidden below the `md` breakpoint because touch controls are
 * presented elsewhere, and while toxic mode is active because the crowd-energy
 * strip's warning row occupies the same band.
 */
export const ControlsHint = memo(function ControlsHint({
  isToxicMode = false
}: ControlsHintProps) {
  const { t } = useTranslation(['ui'])

  // Below the hit line there are only ~38px, which the hint row and the
  // crowd-energy strip fill exactly. Toxic mode adds a warning row to that
  // strip, so yield rather than let the strip paint over this one: the key
  // mapping is static reference, the alarm is not.
  if (isToxicMode) return null

  return (
    <div
      /* bottom-5 stacks this row between the hit targets and the crowd-energy
         strip now pinned to the bottom edge. */
      className='absolute bottom-5 w-full justify-center gap-3 sm:gap-8 z-(--z-stage-bg) pointer-events-none hidden md:flex'
      role='group'
      aria-label={t('ui:gig.controlsHint', { defaultValue: 'Game Controls' })}
    >
      {LANES.map(({ id, key }) => (
        <div
          key={id}
          className='flex items-center gap-1 sm:gap-1.5 font-mono text-xs sm:text-xs text-ash-gray'
        >
          <kbd className='border px-1.5 py-0.5 text-xs font-sans border-ash-gray/30'>
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
