import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import type { GameState } from '../../types/game'
import { useMemo } from 'react'

interface GlossaryEntry {
  termKey: string
  descriptionKey: string
  liveValueSelector: (state: GameState) => string | null
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    termKey: 'ui:glossary.terms.harmony',
    descriptionKey: 'ui:glossary.desc.harmony',
    liveValueSelector: (state: GameState) => {
      const harmony = state.band.harmony
      return typeof harmony === 'number' ? `${harmony}/100` : null
    }
  },
  {
    termKey: 'ui:glossary.terms.hype',
    descriptionKey: 'ui:glossary.desc.hype',
    liveValueSelector: (state: GameState) => {
      // Hype often reflects fame or loyalty, we will show Fame and Loyalty here as proxies since hype is an event effect
      return `Fame: ${state.player.fame} | Loyalty: ${state.social.loyalty ?? 0}`
    }
  },
  {
    termKey: 'ui:glossary.terms.zealotry',
    descriptionKey: 'ui:glossary.desc.zealotry',
    liveValueSelector: (state: GameState) => {
      const zealotry = state.social.zealotry
      return typeof zealotry === 'number' ? `${zealotry}/100` : null
    }
  }
]

export const GlossaryTab = () => {
  const { t } = useTranslation(['ui'])

  // Extract slices to avoid rendering jitter
  const band = useGameSelector(state => state.band)
  const player = useGameSelector(state => state.player)
  const social = useGameSelector(state => state.social)

  // Memoize the state to be passed to the selectors
  const mockState = useMemo(
    () =>
      ({
        band,
        player,
        social
      }) as unknown as GameState,
    [band, player, social]
  )

  return (
    <div className='space-y-6'>
      <div className='bg-void-black/40 border-2 border-ash-gray p-4'>
        <h3 className='text-toxic-green text-lg font-bold mb-4 border-b border-ash-gray pb-2 font-mono'>
          {t('ui:tabs.glossary', { defaultValue: 'GLOSSARY' })}
        </h3>
        <div className='space-y-4'>
          {GLOSSARY_ENTRIES.map((entry, index) => {
            const liveValue = entry.liveValueSelector(mockState)
            return (
              <div key={index} className='border-b border-ash-gray/20 pb-4'>
                <h4 className='text-star-white font-bold font-mono text-lg flex items-center gap-2'>
                  {t(entry.termKey)}
                  {liveValue !== null && (
                    <span className='text-toxic-green text-sm px-2 py-1 bg-toxic-green/10 rounded'>
                      [{t('ui:glossary.liveValue', { defaultValue: 'Live' })}:{' '}
                      {liveValue}]
                    </span>
                  )}
                </h4>
                <p className='text-ash-gray mt-2 whitespace-pre-line'>
                  {t(entry.descriptionKey)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
