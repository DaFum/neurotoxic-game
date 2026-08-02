import { memo } from 'react'
import { StatMiniBar } from '../shared/index'
import { Tooltip } from '../shared/index'
import type { BandMember } from '../../types/band'
import { finiteNumberOr } from '../../utils/gameState'
import { AlertCircle } from 'lucide-react'

interface BandMemberRowProps {
  m: BandMember
  t: (key: string, options?: Record<string, unknown>) => string
}

// ⚡ BOLT OPTIMIZATION: Wrapped component in React.memo to prevent unnecessary re-renders in lists.
export const BandMemberRow = memo(({ m, t }: BandMemberRowProps) => {
  const safeName =
    m.name?.trim() || t('ui:hud.unnamedMember', { defaultValue: 'Member' })
  const mood = finiteNumberOr(m.mood, 0)
  const stamina = finiteNumberOr(m.stamina, 0)

  const isMoodLow = mood < 50
  const isStaminaLow = stamina < 35
  const isWarning = isMoodLow || isStaminaLow

  return (
    <div className='flex items-center justify-between w-full mb-1.5 last:mb-0 group'>
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
        <StatMiniBar
          variant='inline'
          value={mood}
          threshold={50}
          color='bg-mood-pink'
          warnColor='bg-warning-yellow'
          label={t('ui:hud.mood', { defaultValue: 'Mood' })}
          ariaLabel={t('ui:hud.memberMood', {
            name: safeName,
            defaultValue: safeName + ' Mood'
          })}
        />
        <StatMiniBar
          variant='inline'
          value={stamina}
          threshold={35}
          color='bg-stamina-green'
          warnColor='bg-blood-red'
          label={t('ui:hud.stamina', { defaultValue: 'Stamina' })}
          ariaLabel={t('ui:hud.memberStamina', {
            name: safeName,
            defaultValue: safeName + ' Stamina'
          })}
        />
      </div>
    </div>
  )
})
