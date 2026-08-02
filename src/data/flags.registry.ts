/**
 * Single source of truth for story-flag identifiers.
 *
 * @remarks
 * Flags used to be written and read as free strings: a typo in a writer, or a
 * reader pointing at a flag no one sets, failed silently and showed up only as
 * a quest or event that never fired. Every writer and reader references
 * `FLAGS.*` instead, and `tests/node/flagRegistry.test.js` diffs
 * `Object.values(FLAGS)` against the flags actually referenced in source so
 * neither side can drift.
 *
 * Flags are grouped by the system that writes them. Quest-lifecycle flags come
 * in `_ACTIVE` / `_COMPLETE` / `_FAILED` triples that mirror the declarative
 * `startFlags` / `completionFlags` / `failureFlags` quest fields.
 */
export const FLAGS = {
  // Quest lifecycle — apology tour
  APOLOGY_TOUR_COMPLETE: 'apology_tour_complete',
  APOLOGY_TOUR_FAILED: 'apology_tour_failed',
  CANCEL_QUEST_ACTIVE: 'cancel_quest_active',

  // Quest lifecycle — ego management / band breakup
  BREAKUP_QUEST_ACTIVE: 'breakup_quest_active',
  EGO_CRISIS_FAILED: 'ego_crisis_failed',
  EGO_CRISIS_RESOLVED: 'ego_crisis_resolved',

  // Quest lifecycle — band pact
  BAND_PACT_COMPLETE: 'band_pact_complete',
  BAND_PACT_FAILED: 'band_pact_failed',

  // Quest lifecycle — back from the pit
  BACK_FROM_PIT_COMPLETE: 'back_from_pit_complete',
  BACK_FROM_PIT_FAILED: 'back_from_pit_failed',

  // Quest lifecycle — sincere redemption
  SINCERE_REDEMPTION_COMPLETE: 'sincere_redemption_complete',
  SINCERE_REDEMPTION_FAILED: 'sincere_redemption_failed',

  // Quest lifecycle — prove yourself
  PROVE_YOURSELF_ACTIVE: 'prove_yourself_active',
  PROVE_YOURSELF_COMPLETE: 'prove_yourself_complete',
  PROVE_YOURSELF_FAILED: 'prove_yourself_failed',

  // Event consequences
  COMEBACK_TRIGGERED: 'comeback_triggered',
  DISCOUNTED_TICKETS_ACTIVE: 'discounted_tickets_active',

  // Crisis notices — one per severity threshold, so each fires only once
  SAW_CRISIS_50: 'saw_crisis_50',
  SAW_CRISIS_80: 'saw_crisis_80',
  SAW_CRISIS_100: 'saw_crisis_100',

  // Band story beats that unlock HQ modules
  FOUND_RECORD_COLLECTION: 'found_record_collection',
  OLD_BASEMENT_SECRET: 'old_basement_secret',
  SAVED_LOCAL_VENUE: 'saved_local_venue',
  TAPE_CULTURE_REVIVAL: 'tape_culture_revival',
  UNDERGROUND_SHOW: 'underground_show'
} as const

/**
 * Any registered story flag.
 *
 * @remarks
 * A typed union rather than a template-built key: dynamically composed flags
 * (a template literal splicing a quest id into the flag name) escape static
 * analysis entirely, so the registry stays exhaustive by construction.
 */
export type StoryFlag = (typeof FLAGS)[keyof typeof FLAGS]

const FLAG_VALUES: ReadonlySet<string> = new Set(Object.values(FLAGS))

/**
 * Narrows an untrusted string to a registered story flag.
 *
 * @param value - Candidate flag, typically from a save file or event payload.
 * @returns `true` when the value is a member of {@link FLAGS}.
 */
export const isStoryFlag = (value: unknown): value is StoryFlag =>
  typeof value === 'string' && FLAG_VALUES.has(value)
