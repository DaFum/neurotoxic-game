import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useGameSelector } from '../../context/GameState'
import type { GameState } from '../../types'

interface GlossaryEntry {
  termKey: string
  descriptionKey: string
  selector: (state: GameState) => string | number | null
  formatValue: (
    value: string | number | null,
    t: TFunction<['ui'], undefined>
  ) => string | null
}

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    termKey: 'ui:glossary.terms.harmony',
    descriptionKey: 'ui:glossary.desc.harmony',
    selector: (state: GameState) => state.band.harmony,
    formatValue: value => (typeof value === 'number' ? `${value}/100` : null)
  },
  {
    termKey: 'ui:glossary.terms.hype',
    descriptionKey: 'ui:glossary.desc.hype',
    selector: (state: GameState) => state.player.fame,
    formatValue: (value, t) => {
      if (value === null) return null
      const fameLabel = t('ui:stats.fame', { defaultValue: 'Fame' })
      return `${fameLabel}: ${value}`
    }
  },
  {
    termKey: 'ui:glossary.terms.zealotry',
    descriptionKey: 'ui:glossary.desc.zealotry',
    selector: (state: GameState) => state.social.zealotry,
    formatValue: value => (typeof value === 'number' ? `${value}/100` : null)
  }
]

const GlossaryItem = memo(({ entry }: { entry: GlossaryEntry }) => {
  const { t } = useTranslation(['ui'])
  const rawValue = useGameSelector(entry.selector)
  const liveValue = entry.formatValue(rawValue, t)

  return (
    <div className='border-b border-ash-gray/20 pb-4'>
      <h4 className='text-star-white font-bold font-mono text-lg flex items-center gap-2'>
        {t(entry.termKey)}
        {liveValue !== null && (
          <span className='text-toxic-green text-sm px-2 py-1 bg-toxic-green/10 '>
            {'[' +
              t('ui:glossary.liveValue', { defaultValue: 'Live' }) +
              ': ' +
              liveValue +
              ']'}
          </span>
        )}
      </h4>
      <p className='text-ash-gray mt-2 whitespace-pre-line'>
        {t(entry.descriptionKey)}
      </p>
    </div>
  )
})
GlossaryItem.displayName = 'GlossaryItem'

/**
 * Displays the Band HQ glossary reference.
 */
export const GlossaryTab = () => {
  const { t } = useTranslation(['ui'])

  return (
    <div className='space-y-6'>
      <div className='bg-void-black/40 border-2 border-ash-gray p-4'>
        <h3 className='text-toxic-green text-lg font-bold mb-4 border-b border-ash-gray pb-2 font-mono'>
          {t('ui:tabs.glossary', { defaultValue: 'GLOSSARY' })}
        </h3>
        <div className='space-y-4'>
          {GLOSSARY_ENTRIES.map(entry => (
            <GlossaryItem key={entry.termKey} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
