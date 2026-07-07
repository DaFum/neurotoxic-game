import { ProgressBar } from './index'
import { Tooltip } from './Tooltip'
import type { BandMember } from '../../types/band'

interface BandMemberRowProps {
  m: BandMember
  idx?: number
  t: (key: string, options?: any) => string
}

export const BandMemberRow = ({ m, idx, t }: BandMemberRowProps) => {
  const safeName =
    m.name?.trim() || t('ui:hud.unnamedMember', { defaultValue: 'Member' })

  return (
    <div
      key={m.id ?? m.name ?? `member-${idx}`}
      className='flex items-center justify-between w-full mb-1.5 last:mb-0'
    >
      <span className='text-star-white/80 text-xs'>{safeName}</span>
      <div className='flex items-center gap-1.5'>
        <Tooltip
          content={t('ui:hud.mood', { defaultValue: 'Mood' })}
          position='bottom'
        >
          <div className='flex items-center gap-1 pointer-events-auto'>
            <div className='w-12'>
              <ProgressBar
                value={m.mood}
                max={100}
                color='bg-mood-pink'
                size='mini'
                aria-label={t('ui:hud.memberMood', {
                  name: safeName,
                  defaultValue: `${safeName} Mood`
                })}
              />
            </div>
            <span className='text-xxs text-mood-pink w-7 text-right tabular-nums'>
              {m.mood}%
            </span>
          </div>
        </Tooltip>
        <Tooltip
          content={t('ui:hud.stamina', { defaultValue: 'Stamina' })}
          position='bottom'
        >
          <div className='flex items-center gap-1 pointer-events-auto'>
            <div className='w-12'>
              <ProgressBar
                value={m.stamina}
                max={100}
                color='bg-stamina-green'
                size='mini'
                aria-label={t('ui:hud.memberStamina', {
                  name: safeName,
                  defaultValue: `${safeName} Stamina`
                })}
              />
            </div>
            <span className='text-xxs text-stamina-green w-7 text-right tabular-nums'>
              {m.stamina}%
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
