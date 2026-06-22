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

    // Check if there are any runtime traits to merge
    let hasRuntime = false
    for (const key in memberTraits) {
      if (Object.hasOwn(memberTraits, key)) {
        hasRuntime = true
        break
      }
    }

    // ⚡ BOLT OPTIMIZATION: Removed temporary array allocation and Set instantiation when not needed
    // Why: baseTraits.map creates an intermediate array, and allocating a Set and copied array is unnecessary when there are no dynamic traits to merge.
    // Impact: Completely bypasses array copying, Set allocations, and loops for members without dynamic traits.
    if (!hasRuntime) {
      return baseTraits
    }

    // Otherwise, perform the merge
    const merged = [...baseTraits]
    const seen = new Set<string>()
    for (let i = 0; i < baseTraits.length; i++) {
      const bt = baseTraits[i]
      if (bt) {
        seen.add(bt.id)
      }
    }

    for (const key in memberTraits) {
      if (Object.hasOwn(memberTraits, key)) {
        const rt = memberTraits[key]
        if (
          rt &&
          typeof rt === 'object' &&
          Object.hasOwn(rt, 'id') &&
          typeof (rt as Record<string, unknown>).id === 'string' &&
          Object.hasOwn(rt, 'name') &&
          typeof (rt as Record<string, unknown>).name === 'string' &&
          Object.hasOwn(rt, 'desc') &&
          typeof (rt as Record<string, unknown>).desc === 'string' &&
          Object.hasOwn(rt, 'unlockHint') &&
          typeof (rt as Record<string, unknown>).unlockHint === 'string'
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
          className={`w-full text-xs flex justify-between items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-abyss-black ${isTraitActive ? 'text-toxic-green' : 'text-ash-gray opacity-50'}`}
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
