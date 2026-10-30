import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RHYTHM_LANES } from '../../utils/rhythmGameScoringUtils'
import { InputHint } from '../gamepad/InputHint'

/** Desktop arrow key bound to each lane. */
const LANE_KEYS = {
  guitar: '←',
  drums: '↓',
  bass: '→'
} as const satisfies Record<(typeof RHYTHM_LANES)[number]['id'], string>

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
 *
 * @param props - The properties for the {@link ControlsHint} component.
 * @returns The rendered controls hint component, or null if toxic mode is active.
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
      {RHYTHM_LANES.map(({ id }) => (
        <div
          key={id}
          className='flex items-center gap-1 sm:gap-1.5 font-mono text-xs sm:text-xs text-ash-gray'
        >
          <kbd className='border px-1.5 py-0.5 text-xs font-sans border-ash-gray/30'>
            {LANE_KEYS[id]}
          </kbd>
          <InputHint
            action={id === 'guitar' ? 'lane0' : id === 'drums' ? 'lane1' : 'lane2'}
          />
          <span className='uppercase tracking-wider'>
            {t(`ui:rhythm.lane_${id}`)}
          </span>
        </div>
      ))}
    </div>
  )
})
