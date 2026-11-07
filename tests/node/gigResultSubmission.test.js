import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { claimGigResultSubmission } from '../../src/utils/rhythmGameLoopUtils.ts'

describe('claimGigResultSubmission (#3574)', () => {
  test('the first caller claims and publishes one snapshot, built once', () => {
    const target = { hasSubmittedResults: false }
    const published = []
    let builds = 0
    const snapshot = { score: 1, failed: false }

    const submit = claimGigResultSubmission(target, s => published.push(s))
    assert.equal(typeof submit, 'function')
    assert.equal(target.hasSubmittedResults, true)

    const build = () => {
      builds++
      return snapshot
    }
    assert.equal(submit(build), snapshot)
    assert.equal(submit(build), null)
    assert.equal(builds, 1)
    assert.deepEqual(published, [snapshot])
  })

  test('a later caller gets no publisher and runs no callback', () => {
    const target = { hasSubmittedResults: false }
    const publish = () => assert.fail('loser must not publish')
    assert.ok(claimGigResultSubmission(target, () => {}))
    assert.equal(claimGigResultSubmission(target, publish), null)
  })

  test('the claim is visible to a publisher that re-enters arbitration', () => {
    const target = { hasSubmittedResults: false }
    let reentrant
    const submit = claimGigResultSubmission(target, () => {
      reentrant = claimGigResultSubmission(target, () => {})
    })
    submit(() => ({}))
    assert.equal(reentrant, null)
  })

  test('a failed submission keeps the claim and cannot be retried', () => {
    const target = { hasSubmittedResults: false }
    let publishes = 0
    const submit = claimGigResultSubmission(target, () => {
      publishes++
      throw new Error('publish failed')
    })
    assert.throws(() => submit(() => ({})), /publish failed/)
    assert.equal(target.hasSubmittedResults, true)
    assert.equal(
      submit(() => ({})),
      null
    )
    assert.equal(
      claimGigResultSubmission(target, () => {}),
      null,
      'no other path may resubmit after a failed submission'
    )
    assert.equal(publishes, 1)
  })

  test('a throwing builder publishes nothing and keeps the claim', () => {
    const target = { hasSubmittedResults: false }
    let publishes = 0
    const submit = claimGigResultSubmission(target, () => publishes++)
    assert.throws(() =>
      submit(() => {
        throw new Error('build failed')
      })
    )
    assert.equal(publishes, 0)
    assert.equal(target.hasSubmittedResults, true)
  })
})
