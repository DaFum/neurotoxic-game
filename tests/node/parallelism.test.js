import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeProcessWorkerCount } from '../../scripts/utils/parallelism.mjs'

describe('computeProcessWorkerCount', () => {
  it('oversubscribes process-isolated tests to hide startup latency', () => {
    assert.equal(computeProcessWorkerCount(2), 8)
  })

  it('caps process concurrency to bound memory use', () => {
    assert.equal(computeProcessWorkerCount(8), 16)
  })
})
