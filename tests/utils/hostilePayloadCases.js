/**
 * Shared hostile-payload fixture for the structural fuzz harness.
 *
 * Runner-agnostic on purpose: the `node:test` and Vitest fuzz suites both
 * import this module, so it must not pull in a test runner.
 */

/**
 * Hostile primitive values injected into individual payload fields.
 *
 * `wrong type` is represented twice on purpose — a container field that expects
 * an array and a scalar field that expects a number fail differently.
 */
export const HOSTILE_VALUES = [
  { label: 'null', value: null },
  { label: 'undefined', value: undefined },
  { label: 'wrong type (object)', value: { nested: true } },
  { label: 'wrong type (array)', value: ['nope'] },
  { label: 'empty string', value: '' },
  { label: 'MAX_SAFE_INTEGER', value: Number.MAX_SAFE_INTEGER },
  { label: 'NaN', value: Number.NaN },
  { label: 'Infinity', value: Number.POSITIVE_INFINITY },
  { label: '-Infinity', value: Number.NEGATIVE_INFINITY }
]

/**
 * Prototype-polluting probes. Built from raw JSON so the hostile key is a real
 * own property rather than a prototype write, per `tests/security/AGENTS.md`.
 */
export const POLLUTION_PROBES = [
  { label: '__proto__', json: '{"__proto__":{"polluted":true}}' },
  {
    label: 'constructor',
    json: '{"constructor":{"prototype":{"polluted":true}}}'
  },
  { label: 'prototype', json: '{"prototype":{"polluted":true}}' },
  { label: 'toString', json: '{"toString":"polluted"}' },
  {
    label: 'nested __proto__',
    json: '{"nested":{"__proto__":{"polluted":true}}}'
  },
  {
    label: 'array-nested __proto__',
    json: '[{"__proto__":{"polluted":true}}]'
  }
]

/**
 * Parses a pollution probe into a fresh object with the hostile key as an own
 * property.
 *
 * @param {string} json - Raw JSON source of the probe.
 * @returns {unknown} Parsed probe value.
 */
export const parseProbe = json => JSON.parse(json)

/**
 * Substitutes each hostile value into one field of a base payload.
 *
 * @param {object} basePayload - Valid payload to mutate a copy of.
 * @param {string} field - Own key of `basePayload` to poison.
 * @param {string} boundary - Boundary tag routed by the driver.
 * @param {string} [namePrefix] - Prefix for generated case names.
 * @returns {Array<{name: string, boundary: string, payload: object}>} Cases.
 */
export const generateFieldCases = (
  basePayload,
  field,
  boundary,
  namePrefix = ''
) =>
  HOSTILE_VALUES.map(({ label, value }) => ({
    name: `${namePrefix}${field} = ${label}`,
    boundary,
    field,
    payload: { ...basePayload, [field]: value }
  }))

/**
 * Substitutes each hostile value into one nested field of a payload section.
 *
 * @param {object} basePayload - Valid payload to mutate a copy of.
 * @param {string} section - Top-level section key (e.g. `flags`).
 * @param {string} field - Key inside the section to poison.
 * @param {string} boundary - Boundary tag routed by the driver.
 * @returns {Array<{name: string, boundary: string, payload: object}>} Cases.
 */
export const generateNestedFieldCases = (
  basePayload,
  section,
  field,
  boundary
) =>
  HOSTILE_VALUES.map(({ label, value }) => ({
    name: `${section}.${field} = ${label}`,
    boundary,
    field: `${section}.${field}`,
    payload: {
      ...basePayload,
      [section]: { ...basePayload[section], [field]: value }
    }
  }))

const BASE_EVENT_DELTA = {
  score: 0,
  player: {},
  band: {},
  social: {},
  flags: {}
}

const BASE_QUEST = {
  id: 'fuzz_quest',
  kind: 'side',
  status: 'active',
  repeatPolicy: 'never',
  label: 'Fuzz quest',
  description: 'Fuzz quest',
  required: 3,
  progress: 0,
  progressSource: 'gig_completed',
  progressRules: [{ event: 'gig_completed', amount: 1 }],
  rewards: [],
  startedOnDay: 1
}

// Event-delta cases — the audit names `flags` as the thinnest surface, so every
// flag field gets the full hostile-value sweep before the numeric sections.
const EVENT_DELTA_CASES = [
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'queueEvent',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'unlock',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'gameOver',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'addStoryFlag',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'addCooldown',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'flags',
    'addQuest',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'player',
    'money',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'player',
    'fame',
    'event-delta'
  ),
  ...generateNestedFieldCases(BASE_EVENT_DELTA, 'player', 'day', 'event-delta'),
  ...generateNestedFieldCases(BASE_EVENT_DELTA, 'player', 'van', 'event-delta'),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'band',
    'harmony',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'band',
    'members',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'band',
    'stashRemove',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'social',
    'controversyLevel',
    'event-delta'
  ),
  ...generateNestedFieldCases(
    BASE_EVENT_DELTA,
    'social',
    'viral',
    'event-delta'
  ),
  ...generateFieldCases(BASE_EVENT_DELTA, 'score', 'event-delta'),
  ...generateFieldCases(BASE_EVENT_DELTA, 'player', 'event-delta'),
  ...generateFieldCases(BASE_EVENT_DELTA, 'band', 'event-delta'),
  ...generateFieldCases(BASE_EVENT_DELTA, 'social', 'event-delta'),
  ...generateFieldCases(BASE_EVENT_DELTA, 'flags', 'event-delta'),
  ...POLLUTION_PROBES.map(({ label, json }) => ({
    name: `flags carries ${label}`,
    boundary: 'event-delta',
    field: 'flags',
    pollution: true,
    payload: { ...BASE_EVENT_DELTA, flags: parseProbe(json) }
  })),
  ...POLLUTION_PROBES.map(({ label, json }) => ({
    name: `player carries ${label}`,
    boundary: 'event-delta',
    field: 'player',
    pollution: true,
    payload: { ...BASE_EVENT_DELTA, player: parseProbe(json) }
  }))
]

// Quest cases — one sweep per field class enforced by `isQuestStateLike`.
const QUEST_CASES = [
  ...generateFieldCases(BASE_QUEST, 'id', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'kind', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'status', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'repeatPolicy', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'progressRules', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'rewards', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'required', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'progress', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'deadline', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'moneyReward', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'label', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'scopeKey', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'offer', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'rewardData', 'quest'),
  ...generateFieldCases(BASE_QUEST, 'failurePenalty', 'quest'),
  ...POLLUTION_PROBES.map(({ label, json }) => ({
    name: `quest carries ${label}`,
    boundary: 'quest',
    field: 'root',
    pollution: true,
    payload: { ...BASE_QUEST, ...parseProbe(json) }
  })),
  ...HOSTILE_VALUES.map(({ label, value }) => ({
    name: `advance amount = ${label}`,
    boundary: 'quest-advance',
    field: 'amount',
    payload: { questId: BASE_QUEST.id, amount: value }
  })),
  ...HOSTILE_VALUES.map(({ label, value }) => ({
    name: `advance questId = ${label}`,
    boundary: 'quest-advance',
    field: 'questId',
    payload: { questId: value, amount: 1 }
  })),
  ...HOSTILE_VALUES.map(({ label, value }) => ({
    name: `setProgress progress = ${label}`,
    boundary: 'quest-progress',
    field: 'progress',
    payload: { questId: BASE_QUEST.id, progress: value }
  }))
]

/**
 * Every hostile payload shape driven by the fuzz suites.
 */
export const HOSTILE_PAYLOAD_CASES = [...EVENT_DELTA_CASES, ...QUEST_CASES]

/**
 * Valid quest used as the baseline for quest cases and as the seed quest for
 * the advance/progress boundaries.
 */
export const VALID_QUEST = BASE_QUEST
