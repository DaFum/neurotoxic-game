/**
 * @fileoverview Runtime and Playtest Duration Evidence Collector (G6 Task 14).
 *
 * Implements real wall-clock runtime capture for Roguelite Expedition runs.
 * In accordance with G6 Task 14:
 * - Uses repository clock conventions (IClock / systemClock).
 * - NEVER infers real minutes from simulator steps.
 * - Computes median, p25, and p75 real duration metrics.
 * - Evaluates the 20-30 minute target as a product corridor, not a synthetic hard gate.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

import { systemClock } from '../src/utils/clock.ts'

/**
 * @typedef {'extracted' | 'completed' | 'failed'} ExpeditionTerminalOutcome
 */

/**
 * @typedef {Object} ExpeditionRuntimeSample
 * @property {string} buildProfileId
 * @property {number} startedAtMs
 * @property {number} finalizedAtMs
 * @property {number} realDurationMs
 * @property {ExpeditionTerminalOutcome} outcome
 * @property {number} meaningfulNodes
 */

/**
 * @typedef {Object} RuntimeDurationSummary
 * @property {number} count
 * @property {number} minMs
 * @property {number} maxMs
 * @property {number} medianMs
 * @property {number} p25Ms
 * @property {number} p75Ms
 * @property {number} medianMinutes
 * @property {number} p25Minutes
 * @property {number} p75Minutes
 * @property {boolean} inTargetCorridor
 * @property {string} corridorStatus
 */

/**
 * Valid captured samples a release pacing claim needs.
 *
 * @remarks
 * The master plan holds the real-duration target soft "until at least 20 valid
 * runtime samples exist", so a cohort below this is reported but never counted
 * as release evidence. The loader deliberately accepts smaller cohorts - a
 * partial capture is still worth summarizing - and the release gate is what
 * enforces the floor.
 */
export const MIN_RUNTIME_SAMPLES = 20

/** Target product corridor in minutes: 20-30 minutes */
export const TARGET_CORRIDOR_MIN_MINUTES = 20
export const TARGET_CORRIDOR_MAX_MINUTES = 30

/**
 * Validates an ExpeditionRuntimeSample object.
 *
 * @param {unknown} sample
 * @returns {sample is ExpeditionRuntimeSample}
 */
export function isValidRuntimeSample(sample) {
  if (!sample || typeof sample !== 'object') return false
  const s = /** @type {Record<string, unknown>} */ (sample)
  if (typeof s.buildProfileId !== 'string' || s.buildProfileId.length === 0)
    return false
  if (
    typeof s.startedAtMs !== 'number' ||
    !Number.isFinite(s.startedAtMs) ||
    s.startedAtMs < 0
  )
    return false
  if (
    typeof s.finalizedAtMs !== 'number' ||
    !Number.isFinite(s.finalizedAtMs) ||
    s.finalizedAtMs < s.startedAtMs
  )
    return false
  if (
    typeof s.realDurationMs !== 'number' ||
    !Number.isFinite(s.realDurationMs) ||
    s.realDurationMs !== s.finalizedAtMs - s.startedAtMs
  )
    return false
  if (
    s.outcome !== 'extracted' &&
    s.outcome !== 'completed' &&
    s.outcome !== 'failed'
  )
    return false
  if (
    typeof s.meaningfulNodes !== 'number' ||
    !Number.isFinite(s.meaningfulNodes) ||
    s.meaningfulNodes < 0
  )
    return false
  return true
}

/**
 * Creates and validates a real runtime sample using an injectable IClock.
 *
 * @param {{
 *   buildProfileId: string,
 *   startedAtMs: number,
 *   finalizedAtMs?: number,
 *   outcome: ExpeditionTerminalOutcome,
 *   meaningfulNodes: number
 * }} params
 * @param {import('../src/utils/clock.ts').IClock} [clock=systemClock]
 * @returns {ExpeditionRuntimeSample}
 */
export function createExpeditionRuntimeSample(params, clock = systemClock) {
  const finalizedAtMs = params.finalizedAtMs ?? clock.now()
  const startedAtMs = params.startedAtMs
  const realDurationMs = finalizedAtMs - startedAtMs

  /** @type {ExpeditionRuntimeSample} */
  const sample = {
    buildProfileId: params.buildProfileId,
    startedAtMs,
    finalizedAtMs,
    realDurationMs,
    outcome: params.outcome,
    meaningfulNodes: params.meaningfulNodes
  }

  if (!isValidRuntimeSample(sample)) {
    throw new Error(
      `[RuntimeSample] Invalid runtime sample parameters: ${JSON.stringify(sample)}`
    )
  }

  return sample
}

/**
 * Calculates percentile value from a sorted array of numbers.
 *
 * @param {number[]} sortedValues
 * @param {number} p (0 to 1)
 * @returns {number}
 */
function quantile(sortedValues, p) {
  if (sortedValues.length === 0) return 0
  const index = (sortedValues.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  const v1 = sortedValues[lower] ?? 0
  const v2 = sortedValues[upper] ?? 0
  return v1 * (1 - weight) + v2 * weight
}

/**
 * Summarizes runtime duration distribution for a cohort of samples.
 *
 * @param {ExpeditionRuntimeSample[]} samples
 * @returns {RuntimeDurationSummary}
 */
export function summarizeRuntimeDurations(samples) {
  if (samples.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      medianMs: 0,
      p25Ms: 0,
      p75Ms: 0,
      medianMinutes: 0,
      p25Minutes: 0,
      p75Minutes: 0,
      inTargetCorridor: false,
      corridorStatus: 'no_samples'
    }
  }

  const durations = samples.map(s => s.realDurationMs).sort((a, b) => a - b)
  const minMs = durations[0] ?? 0
  const maxMs = durations[durations.length - 1] ?? 0
  const medianMs = quantile(durations, 0.5)
  const p25Ms = quantile(durations, 0.25)
  const p75Ms = quantile(durations, 0.75)

  const toMinutes = (/** @type {number} */ ms) =>
    Math.round((ms / 60000) * 10) / 10
  const medianMinutes = toMinutes(medianMs)
  const p25Minutes = toMinutes(p25Ms)
  const p75Minutes = toMinutes(p75Ms)

  const inTargetCorridor =
    medianMinutes >= TARGET_CORRIDOR_MIN_MINUTES &&
    medianMinutes <= TARGET_CORRIDOR_MAX_MINUTES
  let corridorStatus = 'on_target'
  if (medianMinutes < TARGET_CORRIDOR_MIN_MINUTES) {
    corridorStatus = 'fast'
  } else if (medianMinutes > TARGET_CORRIDOR_MAX_MINUTES) {
    corridorStatus = 'slow'
  }

  return {
    count: samples.length,
    minMs,
    maxMs,
    medianMs,
    p25Ms,
    p75Ms,
    medianMinutes,
    p25Minutes,
    p75Minutes,
    inTargetCorridor,
    corridorStatus
  }
}

/**
 * Synthetic samples, for unit tests only.
 *
 * @remarks
 * These are hand-written literals, not captured playtests: the timestamps are
 * round numbers and the durations are whole minutes. They exercise the
 * summarizer's percentile maths and nothing else.
 *
 * The release report must never be fed from here. Pacing evidence has to come
 * from {@link loadCapturedRuntimeEvidence}, which reads samples actually
 * captured against a known build; summarizing these literals produced a
 * confident median for a build nobody had played.
 *
 * @type {ExpeditionRuntimeSample[]}
 */
export const SYNTHETIC_RUNTIME_FIXTURE_SAMPLES = [
  {
    buildProfileId: 'baseline_roadtested',
    startedAtMs: 1700000000000,
    finalizedAtMs: 1700001500000, // 25.0 min
    realDurationMs: 1500000,
    outcome: 'completed',
    meaningfulNodes: 14
  },
  {
    buildProfileId: 'baseline_roadtested',
    startedAtMs: 1700002000000,
    finalizedAtMs: 1700003320000, // 22.0 min
    realDurationMs: 1320000,
    outcome: 'completed',
    meaningfulNodes: 13
  },
  {
    buildProfileId: 'baseline_roadtested',
    startedAtMs: 1700004000000,
    finalizedAtMs: 1700005680000, // 28.0 min
    realDurationMs: 1680000,
    outcome: 'completed',
    meaningfulNodes: 15
  },
  {
    buildProfileId: 'scout_intel',
    startedAtMs: 1700006000000,
    finalizedAtMs: 1700007440000, // 24.0 min
    realDurationMs: 1440000,
    outcome: 'completed',
    meaningfulNodes: 14
  },
  {
    buildProfileId: 'scout_intel',
    startedAtMs: 1700008000000,
    finalizedAtMs: 1700008980000, // 16.3 min (voluntary extraction)
    realDurationMs: 980000,
    outcome: 'extracted',
    meaningfulNodes: 9
  },
  {
    buildProfileId: 'underground_specialist',
    startedAtMs: 1700010000000,
    finalizedAtMs: 1700011620000, // 27.0 min
    realDurationMs: 1620000,
    outcome: 'completed',
    meaningfulNodes: 15
  },
  {
    buildProfileId: 'rival_hunter',
    startedAtMs: 1700012000000,
    finalizedAtMs: 1700013560000, // 26.0 min
    realDurationMs: 1560000,
    outcome: 'completed',
    meaningfulNodes: 14
  },
  {
    buildProfileId: 'heavy_production',
    startedAtMs: 1700014000000,
    finalizedAtMs: 1700015740000, // 29.0 min
    realDurationMs: 1740000,
    outcome: 'completed',
    meaningfulNodes: 16
  },
  {
    buildProfileId: 'authority_dancer',
    startedAtMs: 1700016000000,
    finalizedAtMs: 1700017380000, // 23.0 min
    realDurationMs: 1380000,
    outcome: 'completed',
    meaningfulNodes: 13
  },
  {
    buildProfileId: 'authority_dancer',
    startedAtMs: 1700018000000,
    finalizedAtMs: 1700018720000, // 12.0 min (early failure)
    realDurationMs: 720000,
    outcome: 'failed',
    meaningfulNodes: 6
  }
]

/**
 * Where a captured pacing run writes its evidence.
 *
 * @remarks
 * Not generated by `balance:expedition`. A playtest harness writes it, and the
 * release report only reads it, so the report can never invent its own
 * evidence.
 */
export const RUNTIME_EVIDENCE_RELATIVE_PATH =
  'docs/superpowers/reports/roguelite-expedition-runtime-evidence.json'

/** Schema version of the captured runtime evidence artifact. */
export const RUNTIME_EVIDENCE_SCHEMA_VERSION = 1

/**
 * Reads captured pacing evidence and refuses anything it cannot vouch for.
 *
 * @param {string} root - Repository root.
 * @param {string} expectedSourceFingerprint - Fingerprint of the sources this
 * report is being generated from.
 * @returns {Promise<{
 *   ok: boolean,
 *   reason: string | null,
 *   samples: ExpeditionRuntimeSample[],
 *   capturedAt: string | null,
 *   sourceFingerprint: string | null
 * }>}
 *
 * @remarks
 * Missing, malformed and stale evidence are all rejections rather than
 * fallbacks. A pacing conclusion that silently survives a source change is
 * worse than no conclusion: the corridor it reports would describe a build
 * that no longer exists.
 */
export const loadCapturedRuntimeEvidence = async (
  root,
  expectedSourceFingerprint
) => {
  const fail = reason => ({
    ok: false,
    reason,
    samples: [],
    capturedAt: null,
    sourceFingerprint: null
  })

  const evidencePath = path.join(root, RUNTIME_EVIDENCE_RELATIVE_PATH)
  let raw
  try {
    raw = await fs.readFile(evidencePath, 'utf8')
  } catch {
    return fail(
      `no captured playtest evidence at ${RUNTIME_EVIDENCE_RELATIVE_PATH}`
    )
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fail(`captured playtest evidence is not valid JSON`)
  }
  if (!parsed || typeof parsed !== 'object') {
    return fail('captured playtest evidence is not an object')
  }
  if (parsed.schemaVersion !== RUNTIME_EVIDENCE_SCHEMA_VERSION) {
    return fail(
      `captured playtest evidence schemaVersion ${parsed.schemaVersion} is not the supported ${RUNTIME_EVIDENCE_SCHEMA_VERSION}`
    )
  }
  if (typeof parsed.sourceFingerprint !== 'string') {
    return fail('captured playtest evidence records no sourceFingerprint')
  }
  if (parsed.sourceFingerprint !== expectedSourceFingerprint) {
    return fail(
      `captured playtest evidence is stale: it was captured against source ${parsed.sourceFingerprint.slice(0, 12)}, this report is being generated from ${expectedSourceFingerprint.slice(0, 12)}`
    )
  }
  if (!Array.isArray(parsed.samples) || parsed.samples.length === 0) {
    return fail('captured playtest evidence contains no samples')
  }
  const invalid = parsed.samples.filter(sample => !isValidRuntimeSample(sample))
  if (invalid.length > 0) {
    return fail(
      `${invalid.length} of ${parsed.samples.length} captured runtime samples are malformed`
    )
  }

  return {
    ok: true,
    reason: null,
    samples: parsed.samples,
    capturedAt:
      typeof parsed.capturedAt === 'string' ? parsed.capturedAt : null,
    sourceFingerprint: parsed.sourceFingerprint
  }
}
