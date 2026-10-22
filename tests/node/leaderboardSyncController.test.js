import test from 'node:test'
import assert from 'node:assert/strict'
import { getEventListeners } from 'node:events'
import {
  createLeaderboardSyncController,
  snapshotKey,
  MIN_SYNC_INTERVAL_MS
} from '../../src/utils/leaderboardSyncController'

// The whole sync state machine runs here with a fake clock, fake timers, an
// in-memory storage and a scripted fetch: no React, no real time.

const LAST_KEY = id => `neurotoxic_last_synced_snapshot:${id}`
const REVISION_KEY = id => `neurotoxic_stats_revision:${id}`

const okResponse = () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => ({ success: true })
})
const failResponse = status => ({
  ok: false,
  status,
  statusText: `HTTP ${status}`,
  json: async () => ({})
})
const staleResponse = revision => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => ({ success: true, stale: true, revision })
})
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const snap = (money, playerId = 'p') => ({
  playerId,
  playerName: 'Player1',
  money,
  day: 5,
  fame: 100,
  followers: 1000,
  distance: 120,
  conflicts: 3,
  stageDives: 10
})

const flush = () => new Promise(resolve => setImmediate(resolve))

/**
 * Builds a controller around a fake environment. `script` entries are
 * consumed one per request: a response, or a function returning a response
 * (or a promise of one, or throwing). Once empty, requests answer ok.
 */
const setup = ({
  startMs = 1_000_000,
  script = [],
  enabled = true,
  requestTimeoutMs
} = {}) => {
  let nowMs = startMs
  let nextTimerId = 1
  const timers = []
  const storage = new Map()
  const bodies = []
  const signals = []
  const logs = { info: [], warn: [] }
  const queue = [...script]
  const env = { enabled }

  const clock = { now: () => nowMs, today: () => new Date(nowMs) }
  const controller = createLeaderboardSyncController({
    ...(requestTimeoutMs === undefined ? {} : { requestTimeoutMs }),
    fetch: async (url, init) => {
      assert.equal(url, '/api/leaderboard/stats')
      bodies.push(JSON.parse(init.body))
      signals.push(init.signal)
      const next = queue.length > 0 ? queue.shift() : okResponse()
      return typeof next === 'function' ? next() : next
    },
    clock,
    storage: {
      read: key => storage.get(key),
      write: (key, value) => storage.set(key, value)
    },
    timers: {
      setTimeout: (fn, ms) => {
        const id = nextTimerId++
        timers.push({ id, at: nowMs + ms, fn })
        return id
      },
      clearTimeout: id => {
        const index = timers.findIndex(t => t.id === id)
        if (index >= 0) timers.splice(index, 1)
      }
    },
    logger: {
      info: (...args) => logs.info.push(args),
      warn: (...args) => logs.warn.push(args)
    },
    isEnabled: () => env.enabled
  })

  const submit = async payload => {
    controller.submit(payload)
    await flush()
  }
  const advance = async ms => {
    const target = nowMs + ms
    for (;;) {
      const due = timers
        .filter(t => t.at <= target)
        .sort((a, b) => a.at - b.at)[0]
      if (!due) break
      timers.splice(timers.indexOf(due), 1)
      nowMs = due.at
      due.fn()
      await flush()
    }
    nowMs = target
    await flush()
  }

  return {
    controller,
    submit,
    advance,
    storage,
    bodies,
    signals,
    logs,
    env,
    timers
  }
}

const TIMEOUT_MS = 10_000
const never = () => new Promise(() => {})

test('sends the first snapshot at once, with a revision, and records it', async () => {
  const t = setup()
  await t.submit(snap(500))

  assert.equal(t.bodies.length, 1)
  assert.equal(t.bodies[0].money, 500)
  assert.equal(t.bodies[0].playerId, 'p')
  assert.ok(Number.isSafeInteger(t.bodies[0].revision))
  assert.ok(t.bodies[0].revision > 0)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
  assert.equal(t.storage.get(REVISION_KEY('p')), t.bodies[0].revision)
})

test('skips a snapshot equal to the last synced one', async () => {
  const t = setup()
  t.storage.set(LAST_KEY('p'), snapshotKey(snap(500)))
  await t.submit(snap(500))
  assert.equal(t.bodies.length, 0)
})

test('ignores a non-string last-synced marker from storage', async () => {
  const t = setup()
  t.storage.set(LAST_KEY('p'), { not: 'a string' })
  await t.submit(snap(500))
  assert.equal(t.bodies.length, 1)
})

test('holds a same-day change, decreases included, for the rate-limit window', async () => {
  const t = setup()
  await t.submit(snap(500))
  await t.submit(snap(300))
  assert.equal(t.bodies.length, 1)

  await t.advance(MIN_SYNC_INTERVAL_MS - 1)
  assert.equal(t.bodies.length, 1)
  await t.advance(1)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.bodies[1].money, 300)
})

test('a return to the last confirmed snapshot before it is sent cancels the pending one', async () => {
  const t = setup()
  await t.submit(snap(500))
  await t.submit(snap(400))
  await t.submit(snap(500))
  await t.advance(MIN_SYNC_INTERVAL_MS * 2)
  assert.equal(t.bodies.length, 1)
})

test('coalesces changes during an in-flight request into one trailing snapshot', async () => {
  const first = deferred()
  const t = setup({ script: [() => first.promise] })
  await t.submit(snap(500))
  await t.submit(snap(600))
  await t.submit(snap(700))
  assert.equal(t.bodies.length, 1) // no overlapping requests

  first.resolve(okResponse())
  await flush()
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.bodies[1].money, 700) // 600 was never sent
})

test('queues a return to the previously synced snapshot while another is in flight', async () => {
  const inFlight = deferred()
  const t = setup({ script: [okResponse(), () => inFlight.promise] })
  await t.submit(snap(500)) // X is on the server
  await t.submit(snap(400))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2) // A (400) is on the wire

  await t.submit(snap(500)) // back to X while A is in flight
  inFlight.resolve(okResponse())
  await flush()
  await t.advance(MIN_SYNC_INTERVAL_MS)

  assert.equal(t.bodies.length, 3)
  assert.equal(t.bodies[2].money, 500)
})

test('keeps players independent', async () => {
  const t = setup()
  await t.submit(snap(500, 'a'))
  await t.submit(snap(700, 'b'))
  assert.deepEqual(
    t.bodies.map(body => [body.playerId, body.money]),
    [
      ['a', 500],
      ['b', 700]
    ]
  )
})

test('sends strictly increasing revisions even if the clock goes backwards', async () => {
  const t = setup({ startMs: 1000 })
  t.storage.set(REVISION_KEY('p'), 9_999_999_999_999)
  await t.submit(snap(500))
  await t.submit(snap(400))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.deepEqual(
    t.bodies.map(body => body.revision),
    [10_000_000_000_000, 10_000_000_000_001]
  )
})

test('falls back to the clock for a stored revision the API would reject', async () => {
  for (const bad of [
    1e20,
    -5,
    0,
    Number.NaN,
    'abc',
    {},
    Number.MAX_SAFE_INTEGER
  ]) {
    const t = setup({ startMs: 5000 })
    t.storage.set(REVISION_KEY('p'), bad)
    await t.submit(snap(500))
    assert.equal(t.bodies[0].revision, 5000, String(bad))
  }
})

test('does not record a failed request as synced', async () => {
  const t = setup({ script: [failResponse(500)] })
  await t.submit(snap(500))
  assert.equal(t.storage.has(LAST_KEY('p')), false)
  assert.equal(t.logs.warn.length, 1)
})

test('retries a recoverable failure after the backoff, not before', async () => {
  const t = setup({ script: [failResponse(500)] })
  await t.submit(snap(500))
  assert.equal(t.bodies.length, 1)

  await t.advance(29_999)
  assert.equal(t.bodies.length, 1)
  await t.advance(1)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.bodies[1].money, 500)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
})

test('retries after a network error', async () => {
  const t = setup({
    script: [
      () => {
        throw new Error('network down')
      }
    ]
  })
  await t.submit(snap(500))
  await t.advance(30_000)
  assert.equal(t.bodies.length, 2)
})

test('doubles the backoff after each failure and caps it at five minutes', async () => {
  const script = Array.from({ length: 10 }, () => failResponse(429))
  const t = setup({ script })
  await t.submit(snap(500))

  const waitsSeconds = [30, 60, 120, 240, 300, 300]
  for (let i = 0; i < waitsSeconds.length; i++) {
    await t.advance(waitsSeconds[i] * 1000 - 1)
    assert.equal(t.bodies.length, i + 1, `wait ${i}: sent too early`)
    await t.advance(1)
    assert.equal(t.bodies.length, i + 2, `wait ${i}: not sent`)
  }
})

test('never re-sends a rejected payload (a permanent 4xx)', async () => {
  const script = Array.from({ length: 5 }, () => failResponse(400))
  const t = setup({ script })
  await t.submit(snap(500))
  await t.advance(60 * 60 * 1000)
  assert.equal(t.bodies.length, 1)
})

test('a newer snapshot goes out at the base interval while an older one backs off', async () => {
  const t = setup({ script: [failResponse(500), failResponse(500)] })
  await t.submit(snap(500))
  await t.advance(30_000) // retry of 500 fails too: next retry would wait 60 s
  assert.equal(t.bodies.length, 2)

  await t.submit(snap(800))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 3)
  assert.equal(t.bodies[2].money, 800)
})

test('counts the backoff per snapshot, not across different ones', async () => {
  const t = setup({ script: [failResponse(500), failResponse(500)] })
  await t.submit(snap(500)) // K1 fails
  await t.submit(snap(800))
  await t.advance(MIN_SYNC_INTERVAL_MS) // K2 goes out at the base interval, fails
  assert.equal(t.bodies.length, 2)

  // K2's first retry waits 30 s, not the 60 s a carried-over count would give.
  await t.advance(29_999)
  assert.equal(t.bodies.length, 2)
  await t.advance(1)
  assert.equal(t.bodies.length, 3)
  assert.equal(t.bodies[2].money, 800)
})

test('does not retry an old snapshot over a newer pending one', async () => {
  const first = deferred()
  const t = setup({ script: [() => first.promise] })
  await t.submit(snap(500))
  await t.submit(snap(900)) // newer, waits behind the request on the wire

  first.resolve(failResponse(500))
  await flush()
  await t.advance(MIN_SYNC_INTERVAL_MS * 4)
  assert.deepEqual(
    t.bodies.map(body => body.money),
    [500, 900]
  )
})

test('adopts the revision from a stale response and resends', async () => {
  const t = setup({ startMs: 1000, script: [staleResponse(9e12)] })
  await t.submit(snap(500))
  await t.advance(MIN_SYNC_INTERVAL_MS)

  assert.deepEqual(
    t.bodies.map(body => body.revision),
    [1000, 9e12 + 1]
  )
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
})

test('resends a snapshot equal to the last confirmed one after a stale response', async () => {
  const y = deferred()
  const t = setup({ script: [okResponse(), () => y.promise] })
  await t.submit(snap(500)) // X confirmed
  await t.submit(snap(400))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2) // Y in flight

  await t.submit(snap(500)) // back to X; another tab then wrote Z
  y.resolve(staleResponse(9e12))
  await flush()
  await t.advance(MIN_SYNC_INTERVAL_MS)

  assert.equal(t.bodies.length, 3)
  assert.equal(t.bodies[2].money, 500)
  assert.ok(t.bodies[2].revision > 9e12)
})

test('backs off when the server keeps answering stale', async () => {
  const t = setup({ script: [staleResponse(5e12), staleResponse(6e12)] })
  await t.submit(snap(500))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2) // first catch-up: base interval

  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2) // second stale: now backing off
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 3)
})

test('allocates no revision for a flush that is skipped', async () => {
  const t = setup({ script: [failResponse(404)] })
  await t.submit(snap(500))
  const stored = t.storage.get(REVISION_KEY('p'))
  assert.ok(stored)

  // The endpoint is now known to be missing: later flushes send nothing.
  await t.submit(snap(900))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 1)
  assert.equal(t.storage.get(REVISION_KEY('p')), stored)
})

test('logs concurrent 404 responses once and stops sending for the session', async () => {
  const a = deferred()
  const b = deferred()
  const t = setup({ script: [() => a.promise, () => b.promise] })
  await t.submit(snap(500, 'a'))
  await t.submit(snap(500, 'b'))
  assert.equal(t.bodies.length, 2) // two players, two requests in flight

  a.resolve(failResponse(404))
  b.resolve(failResponse(404))
  await flush()
  assert.deepEqual(t.logs.info, [
    [
      'Leaderboard',
      'Stats endpoint unavailable (404). Disabling stat sync for this session.'
    ]
  ])
  assert.equal(t.logs.warn.length, 0)

  await t.submit(snap(600, 'a'))
  await t.advance(MIN_SYNC_INTERVAL_MS)
  assert.equal(t.bodies.length, 2)
})

test('sends nothing, and burns no revision, while sync is disabled', async () => {
  const t = setup({ enabled: false })
  await t.submit(snap(500))
  assert.equal(t.bodies.length, 0)
  assert.equal(t.storage.has(REVISION_KEY('p')), false)
  assert.equal(t.storage.has(LAST_KEY('p')), false)
})

test('dispose cancels a pending timer and forgets all state', async () => {
  const t = setup()
  await t.submit(snap(500))
  await t.submit(snap(400))
  assert.equal(t.timers.length, 1)

  t.controller.dispose()
  assert.equal(t.timers.length, 0)
  await t.advance(60 * 60 * 1000)
  assert.equal(t.bodies.length, 1)
})

test('a request that never answers expires, frees the slot and is retried', async () => {
  const t = setup({ requestTimeoutMs: TIMEOUT_MS, script: [never] })
  await t.submit(snap(500))
  assert.equal(t.bodies.length, 1)
  assert.equal(t.signals[0].aborted, false)

  await t.advance(TIMEOUT_MS - 1)
  assert.equal(t.logs.warn.length, 0)
  await t.advance(1)
  // The deadline aborts the request and counts as a failure that can clear up.
  assert.equal(t.signals[0].aborted, true)
  assert.equal(t.logs.warn.length, 1)
  assert.equal(t.storage.has(LAST_KEY('p')), false)

  // First retry after the 30 s backoff, counted from the send.
  await t.advance(30_000 - TIMEOUT_MS - 1)
  assert.equal(t.bodies.length, 1)
  await t.advance(1)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.bodies[1].money, 500)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
})

test('a response body that never finishes expires the same way', async () => {
  const t = setup({
    requestTimeoutMs: TIMEOUT_MS,
    script: [{ ok: true, status: 200, statusText: 'OK', json: never }]
  })
  await t.submit(snap(500))
  await t.advance(TIMEOUT_MS)
  assert.equal(t.signals[0].aborted, true)
  assert.equal(t.logs.warn.length, 1)
  assert.equal(t.storage.has(LAST_KEY('p')), false)

  await t.advance(30_000)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
})

test('after a timeout only the newest pending snapshot goes out, at the base interval', async () => {
  const t = setup({ requestTimeoutMs: TIMEOUT_MS, script: [never] })
  await t.submit(snap(500))
  await t.submit(snap(600))
  await t.submit(snap(700)) // newest, waits behind the stalled request
  await t.advance(TIMEOUT_MS)

  await t.advance(MIN_SYNC_INTERVAL_MS - TIMEOUT_MS - 1)
  assert.equal(t.bodies.length, 1)
  await t.advance(1)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.bodies[1].money, 700)

  await t.advance(60 * 60 * 1000)
  assert.deepEqual(
    t.bodies.map(body => body.money),
    [500, 700]
  )
})

test('a timed-out request that completes late cannot overwrite accepted state', async () => {
  const late = deferred()
  const t = setup({
    requestTimeoutMs: TIMEOUT_MS,
    script: [() => late.promise]
  })
  await t.submit(snap(500))
  await t.submit(snap(700))
  await t.advance(MIN_SYNC_INTERVAL_MS) // 500 expires, 700 goes out and lands
  assert.equal(t.bodies.length, 2)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(700)))
  const infoCount = t.logs.info.length

  late.resolve(okResponse())
  await flush()
  await t.advance(60 * 60 * 1000)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(700)))
  assert.equal(t.logs.info.length, infoCount)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.timers.length, 0)
})

test('a late 404 from a timed-out request does not disable the sync', async () => {
  const late = deferred()
  const t = setup({
    requestTimeoutMs: TIMEOUT_MS,
    script: [() => late.promise]
  })
  await t.submit(snap(500))
  await t.advance(TIMEOUT_MS)
  late.resolve(failResponse(404))
  await flush()

  await t.advance(30_000)
  assert.equal(t.bodies.length, 2)
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
})

// Disposal is terminal: a disposed controller is never reused. In-flight work
// is aborted and its outcome ignored, and later submits are dropped.
for (const [outcome, settle] of [
  ['resolves', d => d.resolve(okResponse())],
  ['rejects', d => d.reject(new Error('network down'))]
]) {
  test(`an in-flight request that ${outcome} after dispose changes nothing`, async () => {
    const inFlight = deferred()
    const t = setup({
      requestTimeoutMs: TIMEOUT_MS,
      script: [() => inFlight.promise]
    })
    await t.submit(snap(500))
    await t.submit(snap(700)) // would be scheduled once the request settles
    const stored = new Map(t.storage)
    const logs = { info: t.logs.info.length, warn: t.logs.warn.length }

    t.controller.dispose()
    assert.equal(t.signals[0].aborted, true)
    settle(inFlight)
    await flush()
    await t.advance(60 * 60 * 1000)

    assert.deepEqual(t.storage, stored)
    assert.equal(t.timers.length, 0)
    assert.equal(t.bodies.length, 1)
    assert.deepEqual(
      { info: t.logs.info.length, warn: t.logs.warn.length },
      logs
    )
  })
}

test('a settled request leaves no abort listener, and a later dispose no rejection', async () => {
  const unhandled = []
  const onUnhandled = reason => unhandled.push(reason)
  process.on('unhandledRejection', onUnhandled)
  try {
    const t = setup({ requestTimeoutMs: TIMEOUT_MS })
    await t.submit(snap(500))
    assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
    // The race against the abort signal is over: its listener must go with it.
    assert.equal(getEventListeners(t.signals[0], 'abort').length, 0)

    t.controller.dispose()
    await flush()
    assert.deepEqual(unhandled, [])
  } finally {
    process.off('unhandledRejection', onUnhandled)
  }
})

test('a disposed controller ignores later submits', async () => {
  const t = setup()
  t.controller.dispose()
  await t.submit(snap(500))
  await t.advance(60 * 60 * 1000)
  assert.equal(t.bodies.length, 0)
  assert.equal(t.storage.size, 0)
  assert.equal(t.timers.length, 0)
})
