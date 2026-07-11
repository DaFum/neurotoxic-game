import { ProgressBar } from '../shared/index'
import { Tooltip } from '../shared/index'
import type { BandMember } from '../../types/band'
import { finiteNumberOr } from '../../utils/gameState'
import { AlertCircle } from 'lucide-react'

interface BandMemberRowProps {
  m: BandMember
  idx?: number
  t: (key: string, options?: Record<string, unknown>) => string
}

export const BandMemberRow = ({ m, idx, t }: BandMemberRowProps) => {
  const safeName =
    m?.name?.trim() || t('ui:hud.unnamedMember', { defaultValue: 'Member' })
  const mood = finiteNumberOr(m?.mood, 0)
  const stamina = finiteNumberOr(m?.stamina, 0)

  const isMoodLow = mood < 50
  const isStaminaLow = stamina < 35
  const isWarning = isMoodLow || isStaminaLow

  return (
    <div
      key={m?.id ?? m?.name ?? `member-${idx}`}
      className='flex items-center justify-between w-full mb-1.5 last:mb-0 group'
    >
      <div className='flex items-center gap-1.5 min-w-0'>
        {isWarning && (
          <Tooltip
            content={t('ui:overworld.memberWarning', {
              defaultValue: 'Member needs attention'
            })}
            position='bottom'
          >
            <AlertCircle
              size={12}
              className={`shrink-0 pointer-events-auto ${isStaminaLow ? 'text-blood-red' : 'text-warning-yellow'}`}
              role='img'
              aria-label={t('ui:overworld.memberWarning', {
                defaultValue: 'Member needs attention'
              })}
            />
          </Tooltip>
        )}
        <span
          className={`text-xs truncate ${isWarning ? (isStaminaLow ? 'text-blood-red' : 'text-warning-yellow') : 'text-star-white/80'}`}
        >
          {safeName}
        </span>
      </div>
      <div className='flex items-center gap-1.5 shrink-0'>
        <Tooltip
          content={t('ui:hud.mood', { defaultValue: 'Mood' })}
          position='bottom'
        >
          <div className='flex items-center gap-1 pointer-events-auto'>
            <div className='w-12'>
              <ProgressBar
                value={mood}
                max={100}
                color={isMoodLow ? 'bg-warning-yellow' : 'bg-mood-pink'}
                size='mini'
                aria-label={t('ui:hud.memberMood', {
                  name: safeName,
                  defaultValue: safeName + ' Mood'
                })}
              />
            </div>
            <span
              className={`text-xxs w-7 text-right tabular-nums ${isMoodLow ? 'text-warning-yellow font-bold' : 'text-mood-pink'}`}
            >
              {mood}%
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
                value={stamina}
                max={100}
                color={isStaminaLow ? 'bg-blood-red' : 'bg-stamina-green'}
                size='mini'
                aria-label={t('ui:hud.memberStamina', {
                  name: safeName,
                  defaultValue: safeName + ' Stamina'
                })}
              />
            </div>
            <span
              className={`text-xxs w-7 text-right tabular-nums ${isStaminaLow ? 'text-blood-red font-bold' : 'text-stamina-green'}`}
            >
              {stamina}%
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  )
}
