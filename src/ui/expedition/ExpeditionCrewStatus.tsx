import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getCrewStressBand } from '../../domain/expedition/crewStress'

export const ExpeditionCrewStatus = memo(function ExpeditionCrewStatus() {
  const { t } = useTranslation('ui')
  const expedition = useGameSelector(state => state.expedition)
  if (expedition.status !== 'active' || !expedition.loadout?.crewIds.length)
    return null
  return (
    <section
      aria-label={t('ui:expedition.crew.status')}
      className='grid gap-2 border-2 border-steel-gray bg-void-black p-3 sm:grid-cols-3'
    >
      {expedition.loadout.crewIds.map(crewId => {
        const crew = EXPEDITION_CREW_BY_ID[crewId]
        if (!crew) return null
        const stress = expedition.crew?.stressByCrewId[crewId] ?? 0
        const injury = expedition.crew?.injuryByCrewId[crewId] ?? 'none'
        return (
          <article key={crewId} className='border-2 border-steel-gray p-2'>
            <strong className='font-mono uppercase text-star-white'>
              {t(crew.displayNameKey)}
            </strong>
            <p className='text-xs uppercase text-toxic-green'>
              {t(`ui:expedition.crew.stress.${getCrewStressBand(stress)}`)}
            </p>
            <p className='text-xs uppercase text-ash-gray'>
              {t(`ui:expedition.crew.injury.${injury}`)}
            </p>
          </article>
        )
      })}
    </section>
  )
})
