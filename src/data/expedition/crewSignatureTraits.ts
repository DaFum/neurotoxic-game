/**
 * Maps crew roles to their respective signature trait identifiers.
 *
 * @remarks
 * This mapping acts as an identifier registry for acquisition and sanitization of crew signature traits.
 * It does not implement actual specialized abilities (which are defined separately in getCrewRuleContribution and getExpeditionIntelCapability).
 * It simply defines the canonical trait ID assigned when deploying a crew member with a specific role.
 */
export const EXPEDITION_CREW_SIGNATURE_BY_ROLE = {
  technician: 'signature_field_surgeon',
  roadie: 'signature_load_master',
  driver: 'signature_night_driver',
  manager: 'signature_dealmaker',
  scout: 'signature_pathfinder',
  security: 'signature_cool_head'
} as const
