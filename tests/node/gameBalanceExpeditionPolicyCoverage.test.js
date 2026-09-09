/**
 * @fileoverview Every shipped decision policy must have its own branch.
 *
 * `clean_sponsor` shipped with `decisionPolicy: 'safe_value'` while the
 * runner's extraction switch named `'clean_sponsor'`. The case never matched,
 * so the profile ran on the default branch for the whole of G6 while the
 * report and the commit messages quoted the branch it never took. Nothing
 * failed - a `default` case is a silent catch-all - and the mismatch survived
 * until a probe printed the thresholds side by side.
 *
 * The route scorer above it had already been taught both spellings, which is
 * exactly how one table drifts from another: each is edited on its own.
 * These assertions make a policy without a branch a test failure instead.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  VALID_DECISION_POLICIES,
  EXPEDITION_BALANCE_PROFILES
} from '../../scripts/game-balance-expedition-profiles.mjs'
import {
  EXTRACTION_POLICY_WEIGHTS,
  PRESSURE_EVENT_OPTION_PREFERENCE,
  SOCIAL_RESULT_PREFERENCE
} from '../../scripts/game-balance-expedition-runner.mjs'

/** The per-policy tables a profile's behaviour is read out of. */
const POLICY_TABLES = [
  ['EXTRACTION_POLICY_WEIGHTS', EXTRACTION_POLICY_WEIGHTS],
  ['PRESSURE_EVENT_OPTION_PREFERENCE', PRESSURE_EVENT_OPTION_PREFERENCE],
  ['SOCIAL_RESULT_PREFERENCE', SOCIAL_RESULT_PREFERENCE]
]

for (const [tableName, table] of POLICY_TABLES) {
  test(`${tableName} declares every valid decision policy`, () => {
    for (const policy of VALID_DECISION_POLICIES) {
      assert.ok(
        Object.hasOwn(table, policy),
        `${tableName} has no entry for '${policy}', so profiles using it fall through to the default`
      )
    }
  })

  test(`${tableName} declares no policy the profiles cannot ship`, () => {
    for (const key of Object.keys(table)) {
      assert.ok(
        VALID_DECISION_POLICIES.includes(key),
        `${tableName} declares '${key}', which is not a valid decision policy - a dead branch, or a misspelling of a live one`
      )
    }
  })
}

test('every shipped profile names a policy with its own branch', () => {
  for (const profile of EXPEDITION_BALANCE_PROFILES) {
    for (const [tableName, table] of POLICY_TABLES) {
      assert.ok(
        Object.hasOwn(table, profile.decisionPolicy),
        `profile '${profile.id}' declares decisionPolicy '${profile.decisionPolicy}', which ${tableName} does not cover`
      )
    }
  }
})

test('each extraction policy declares a weight for every pressure dimension', () => {
  // A missing dimension is not a type error - the lookup yields `undefined`,
  // `finiteNumberOr` turns it into 0 and the dimension is silently dropped
  // from that persona's decision. Pinning the key set makes a new dimension
  // fail here rather than quietly apply to five profiles out of six.
  const dimensions = Object.keys(
    EXTRACTION_POLICY_WEIGHTS[VALID_DECISION_POLICIES[0]]
  )
  assert.ok(dimensions.includes('tolerance'))
  for (const policy of VALID_DECISION_POLICIES) {
    assert.deepEqual(
      Object.keys(EXTRACTION_POLICY_WEIGHTS[policy]).sort(),
      [...dimensions].sort(),
      `policy '${policy}' does not weigh the same dimensions as the others`
    )
    for (const dimension of dimensions) {
      assert.ok(
        Number.isFinite(EXTRACTION_POLICY_WEIGHTS[policy][dimension]),
        `policy '${policy}' has a non-finite weight for '${dimension}'`
      )
    }
  }
})
