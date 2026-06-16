import type { BandMember } from '../types'
import { CHAR_MAP } from '../helpers'
import type { BasicTProps } from '../types'
import { useMemo } from 'react'
import { Tooltip } from '../../../shared'
import type { CharacterTrait } from '../../../../types'

export const MemberTraits = ({
  member,
  t
}: { member: BandMember } & BasicTProps) => {
  const def = member.name ? CHAR_MAP[member.name] : undefined

  const potentialTraits = useMemo(() => {
    // Combine static defining traits with any dynamically grafted traits (e.g. clinic)
    const baseTraits = def?.traits || []
    const memberTraits = member?.traits ?? {}

    if (baseTraits.length === 0) {
      let hasRuntime = false
      for (const key in memberTraits) {
        if (Object.hasOwn(memberTraits, key)) {
          hasRuntime = true
          break
        }
      }
      if (!hasRuntime) return []
    }

    const merged = [...baseTraits]
    const seen = new Set(baseTraits.map((bt: CharacterTrait) => bt.id))

    for (const key in memberTraits) {
      if (Object.hasOwn(memberTraits, key)) {
        const rt = memberTraits[key]
        if (
          rt &&
          typeof rt === 'object' &&
          'id' in rt &&
          typeof (rt as Record<string, unknown>).id === 'string'
        ) {
          const validRt = rt as unknown as CharacterTrait
          if (!seen.has(validRt.id)) {
            merged.push(validRt)
            seen.add(validRt.id)
          }
        }
      }
    }
    return merged
  }, [def, member.traits])

  if (potentialTraits.length === 0)
    return (
      <div className='text-xs text-ash-gray'>
        {t('ui:detailedStats.none', { defaultValue: 'None' })}
      </div>
    )

  return potentialTraits.map(trait => {
    const isTraitActive = member.traits
      ? Object.hasOwn(member.traits, trait.id) && !!member.traits[trait.id]
      : false
    return (
      <Tooltip
        key={trait.id}
        className='w-full'
        content={
          <div className='text-left'>
            <div className='font-bold mb-1'>{t(trait.name)}</div>
            <div className='mb-2'>{t(trait.desc)}</div>
            {!isTraitActive && (
              <div className='text-ash-gray italic border-t border-ash-gray/30 pt-1'>
                {t('ui:detailedStats.toUnlock', {
                  defaultValue: 'To Unlock'
                })}
                : {t(trait.unlockHint)}
              </div>
            )}
          </div>
        }
      >
        <button
          type='button'
          className={`w-full text-xs flex justify-between items-center ${isTraitActive ? 'text-toxic-green' : 'text-ash-gray opacity-50'}`}
        >
          <span className='underline decoration-dotted decoration-ash-gray/50 cursor-help'>
            {t(trait.name)}
          </span>
          {isTraitActive ? (
            <span className='text-xs uppercase border border-toxic-green px-1 rounded'>
              {t('ui:detailedStats.active', { defaultValue: 'Active' })}
            </span>
          ) : (
            <span className='text-xs uppercase'>
              {t('ui:detailedStats.locked', { defaultValue: 'Locked' })}
            </span>
          )}
        </button>
      </Tooltip>
    )
  })
}
