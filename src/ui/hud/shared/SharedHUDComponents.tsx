import { memo } from 'react'
import { Fuel, Wrench } from 'lucide-react'
import { ProgressBar, StatMiniBar } from '../../shared/index'
import { BandMemberRow } from '../BandMemberRow'
import type { BandMember, BandState } from '../../../types/band'
import type { TFunction } from 'i18next'
import { finiteNumberOr } from '../../../utils/gameState'

export const VanStatusMiniBars = memo(
  ({
    fuel,
    condition,
    t
  }: {
    fuel?: number | null
    condition?: number | null
    t: TFunction
  }) => {
    const safeFuel = finiteNumberOr(fuel, 0)
    const safeCondition = finiteNumberOr(condition, 0)

    return (
      <div className='border-t border-toxic-green/20 pt-2 grid grid-cols-2 gap-x-4'>
        <StatMiniBar
          variant='stacked'
          value={safeFuel}
          threshold={20}
          color='bg-warning-yellow'
          icon={
            <Fuel size={12} className='text-warning-yellow shrink-0 mb-0.5' />
          }
          label={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
          ariaLabel={t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })}
        />
        <StatMiniBar
          variant='stacked'
          value={safeCondition}
          threshold={25}
          color='bg-condition-blue'
          icon={
            <Wrench size={12} className='text-condition-blue shrink-0 mb-0.5' />
          }
          label={t('ui:hud.vanCondition', { defaultValue: 'Van Condition' })}
          ariaLabel={t('ui:hud.vanCondition', {
            defaultValue: 'Van Condition'
          })}
        />
      </div>
    )
  }
)

interface BandStatusPanelVariantConfig {
  wrapperClassName: string
  titleClassName: string
  membersWrapperClassName: string
  harmonyLabelClassName: string
  harmonyValueClassName: string
  barWrapperClassName: string
  barSize: 'mini' | 'sm' | 'md'
}

const BAND_STATUS_PANEL_VARIANTS = {
  hud: {
    wrapperClassName:
      'pointer-events-auto bg-void-black/95 border-2 border-toxic-green p-3 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)] backdrop-blur-sm transition-transform hover:translate-y-1 hover:translate-x-1 hover:shadow-none max-sm:w-full',
    titleClassName:
      'text-right border-b border-toxic-green/40 mb-3 pb-1.5 text-xs font-bold tracking-widest text-ash-gray/90 max-sm:text-left',
    membersWrapperClassName: 'w-56 space-y-0.5 max-sm:w-full',
    harmonyLabelClassName: 'text-xs font-bold text-ash-gray/90 mb-0.5',
    harmonyValueClassName: 'text-xs font-bold tabular-nums mb-0.5 leading-none',
    barWrapperClassName: 'w-24',
    barSize: 'sm' as const
  },
  compact: {
    wrapperClassName:
      'pointer-events-auto bg-void-black border-2 border-toxic-green p-2.5 text-toxic-green shadow-[4px_4px_0px_var(--color-toxic-green)]',
    titleClassName:
      'text-right border-b border-toxic-green/30 mb-2 pb-1 text-xs tracking-widest text-ash-gray',
    // Matches the `hud` variant: both variants render the same BandMemberRow,
    // and the two inline stat bars claim a fixed 166px of it. At w-52 the name
    // column was left with ~42px and truncated "Marius" to "Mari…" on pre-gig
    // and post-gig while the overworld panel showed it in full.
    membersWrapperClassName: 'w-56',
    harmonyLabelClassName: 'text-xs text-ash-gray mb-0.5',
    harmonyValueClassName: 'text-xs tabular-nums mb-0.5 leading-none',
    barWrapperClassName: 'w-20',
    barSize: 'mini' as const
  }
} as const satisfies Record<'hud' | 'compact', BandStatusPanelVariantConfig>

interface BandStatusPanelProps {
  band?: Pick<BandState, 'harmony' | 'members'>
  t: TFunction
  variant?: 'hud' | 'compact'
}

export const BandStatusPanel = memo(
  ({ band, t, variant = 'compact' }: BandStatusPanelProps) => {
    const safeHarmony = finiteNumberOr(band?.harmony, 0)
    const {
      wrapperClassName,
      titleClassName,
      membersWrapperClassName,
      harmonyLabelClassName,
      harmonyValueClassName,
      barWrapperClassName,
      barSize
    } = BAND_STATUS_PANEL_VARIANTS[variant]

    return (
      <div className={wrapperClassName}>
        <div className={titleClassName}>
          {t('ui:bandStatus', { defaultValue: 'BAND STATUS' })}
        </div>
        <div className={membersWrapperClassName}>
          {(band?.members ?? []).map((m: BandMember, idx: number) => (
            <BandMemberRow
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={m?.id ?? m?.name ?? `member-${idx}`}
              m={m}
              t={t}
            />
          ))}
        </div>
        <div className='mt-2 pt-1.5 border-t border-toxic-green/20 flex items-end justify-between'>
          <span className={harmonyLabelClassName}>
            {t('ui:harmony', { defaultValue: 'HARMONY' })}
          </span>
          <div className={barWrapperClassName}>
            <div
              className={`${harmonyValueClassName} ${safeHarmony < 40 ? 'text-blood-red' : 'text-toxic-green'}`}
            >
              {Math.floor(safeHarmony)}%
            </div>
            <ProgressBar
              value={safeHarmony}
              max={100}
              color={safeHarmony < 40 ? 'bg-blood-red' : 'bg-toxic-green'}
              size={barSize}
              showValue={false}
              aria-label={t('ui:hud.bandHarmony', {
                defaultValue: 'Band Harmony'
              })}
            />
          </div>
        </div>
      </div>
    )
  }
)
