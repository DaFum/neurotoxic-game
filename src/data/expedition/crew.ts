import type { ExpeditionCrewDefinition } from '../../types/expedition'

/**
 * A static collection of all available expedition crew members and their baseline attributes.
 *
 * @remarks
 * This array serves as the primary source of truth for the crew roster available
 * during expeditions. It enforces strict type satisfaction against the definition schema
 * to ensure all required fields, such as identifiers, roles, and localization keys, are present.
 */
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

/**
 * A pre-computed lookup dictionary mapping expedition crew identifiers to their full definitions.
 *
 * @remarks
 * This dictionary optimizes access to crew definitions during runtime operations,
 * avoiding repeated linear searches over the main array when processing crew-related
 * state transitions or rendering UI components.
 */
export const EXPEDITION_CREW_BY_ID = Object.fromEntries(
  EXPEDITION_CREW.map(crew => [crew.id, crew])
) as Readonly<Record<string, ExpeditionCrewDefinition>>
