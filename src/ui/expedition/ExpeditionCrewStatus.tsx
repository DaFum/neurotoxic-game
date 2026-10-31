import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getCrewStressBand } from '../../domain/expedition/crewStress'
import type { ExpeditionCrewDefinition } from '../../types/expedition'

type CrewEntry = readonly [string, ExpeditionCrewDefinition]

const hasCrewDefinition = (
  entry: readonly [string, ExpeditionCrewDefinition | undefined]
): entry is CrewEntry => entry[1] !== undefined

const getGridColumnsClass = (count: number): string => {
  if (count <= 1) return 'sm:grid-cols-1'
  if (count === 2) return 'sm:grid-cols-2'
  return 'sm:grid-cols-3'
}

export const ExpeditionCrewStatus = memo(function ExpeditionCrewStatus() {
  const { t } = useTranslation('ui')
  const expedition = useGameSelector(state => state.expedition)
  if (expedition.status !== 'active' || !expedition.loadout?.crewIds.length)
    return null

  const visibleCrew = expedition.loadout.crewIds
    .map(crewId => [crewId, EXPEDITION_CREW_BY_ID[crewId]] as const)
    .filter(hasCrewDefinition)

  if (visibleCrew.length === 0) return null

  const gridColumnsClass = getGridColumnsClass(visibleCrew.length)

  return (
    <section
      aria-label={t('ui:expedition.crew.status')}
      className={`grid gap-2 border-2 border-steel-gray bg-void-black p-3 ${gridColumnsClass}`}
    >
      {visibleCrew.map(([crewId, crew]) => {
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
