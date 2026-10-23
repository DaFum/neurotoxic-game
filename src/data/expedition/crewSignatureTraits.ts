/**
 * Maps crew roles to their respective signature trait identifiers.
 *
 * @remarks
 * This mapping defines the specialized abilities each crew role provides during expeditions.
 * These traits are unique to the assigned roles and dictate the exclusive benefits or
 * operational advantages available when a crew member with that role is deployed.
 */
export const EXPEDITION_CREW_SIGNATURE_BY_ROLE = {
  technician: 'signature_field_surgeon',
  roadie: 'signature_load_master',
  driver: 'signature_night_driver',
  manager: 'signature_dealmaker',
  scout: 'signature_pathfinder',
  security: 'signature_cool_head'
} as const
