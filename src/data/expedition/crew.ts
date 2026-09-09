import type { ExpeditionCrewDefinition } from '../../types/expedition'

export const EXPEDITION_CREW = [
  { id: 'mika', role: 'technician', displayNameKey: 'ui:expedition.crew.mika' },
  { id: 'tom', role: 'roadie', displayNameKey: 'ui:expedition.crew.tom' },
  { id: 'ines', role: 'driver', displayNameKey: 'ui:expedition.crew.ines' },
  { id: 'yara', role: 'manager', displayNameKey: 'ui:expedition.crew.yara' },
  { id: 'noah', role: 'scout', displayNameKey: 'ui:expedition.crew.noah' },
  {
    id: 'samira',
    role: 'security',
    displayNameKey: 'ui:expedition.crew.samira'
  }
] as const satisfies readonly ExpeditionCrewDefinition[]

export const EXPEDITION_CREW_BY_ID = Object.fromEntries(
  EXPEDITION_CREW.map(crew => [crew.id, crew])
) as Readonly<Record<string, ExpeditionCrewDefinition>>
