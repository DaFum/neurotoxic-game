import test, { describe } from 'node:test'
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

test('never derives the API-rejected MAX_SAFE_INTEGER revision (#3475)', async () => {
  const t = setup({ startMs: 5000 })
  t.storage.set(REVISION_KEY('p'), Number.MAX_SAFE_INTEGER - 2)
  await t.submit(snap(500))
  // The last valid send: one below the API ceiling.
  assert.equal(t.bodies[0].revision, Number.MAX_SAFE_INTEGER - 1)
  assert.equal(t.storage.get(REVISION_KEY('p')), Number.MAX_SAFE_INTEGER - 1)
})

describe('a stored ceiling revision after an operator reset (#3494)', () => {
  // A server that, like the API, drops any revision not above what it holds.
  const resetServer = (getTest, held) => {
    const respond = () => {
      const { revision } = getTest().bodies.at(-1)
      if (revision <= held.value) return staleResponse(held.value)
      held.value = revision
      return okResponse()
    }
    return Array.from({ length: 20 }, () => respond)
  }

  const syncSeveral = async (t, held) => {
    const revisions = []
    for (const money of [600, 700, 800]) {
      await t.submit(snap(money))
      await t.advance(MIN_SYNC_INTERVAL_MS)
      revisions.push(t.bodies.at(-1).revision)
    }
    assert.equal(held.value, revisions.at(-1))
    assert.ok(revisions.every((r, i) => i === 0 || r > revisions[i - 1]))
    assert.ok(revisions.every(r => r < Number.MAX_SAFE_INTEGER - 1))
    assert.equal(t.controller.getSyncStatus('p').exhausted, false)
  }

  test('a stored MAX-1 falls back to the clock so the player recovers', async () => {
    let t
    const held = { value: 15_000 } // the operator reset to epoch ms
    t = setup({ startMs: 20_000, script: resetServer(() => t, held) })
    t.storage.set(REVISION_KEY('p'), Number.MAX_SAFE_INTEGER - 1)

    await syncSeveral(t, held)
  })

  test('a ceiling this client generated is not resent after the reset', async () => {
    // Stored MAX-2 makes the next request MAX-1, which is persisted.
    const first = setup({ startMs: 5000 })
    first.storage.set(REVISION_KEY('p'), Number.MAX_SAFE_INTEGER - 2)
    await first.submit(snap(500))
    assert.equal(
      first.storage.get(REVISION_KEY('p')),
      Number.MAX_SAFE_INTEGER - 1
    )
    first.controller.dispose()

    let t
    const held = { value: 15_000 }
    t = setup({ startMs: 20_000, script: resetServer(() => t, held) })
    for (const [key, value] of first.storage) t.storage.set(key, value)

    await syncSeveral(t, held)
  })
})

test('does not record a failed request as synced', async () => {
  const t = setup({ script: [failResponse(500)] })
  await t.submit(snap(500))
  assert.ok(!t.storage.get(LAST_KEY('p'))) // no confirmed snapshot (a dispatched write clears it)
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

test('clears the stored confirmed-snapshot marker when a stale response arrives', async () => {
  const t = setup({ script: [okResponse(), staleResponse(9e12)] })
  await t.submit(snap(500)) // X confirmed and stored
  assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))

  await t.submit(snap(400))
  await t.advance(MIN_SYNC_INTERVAL_MS) // Y answered stale: another tab wrote

  // The server holds a snapshot this tab never confirmed, so a reload must not
  // treat X as still stored and skip it.
  assert.equal(t.storage.get(LAST_KEY('p')), '')
})

describe('ambiguous writes after a confirmed snapshot (#3408)', () => {
  const lostOutcomes = {
    'a timeout': () => never,
    'a network error': () => () => {
      throw new Error('network down')
    },
    'a server error': () => failResponse(500)
  }

  for (const [name, makeOutcome] of Object.entries(lostOutcomes)) {
    test(`returning to the confirmed snapshot after ${name} resends it`, async () => {
      const t = setup({
        requestTimeoutMs: TIMEOUT_MS,
        script: [okResponse(), makeOutcome()]
      })
      await t.submit(snap(500)) // A confirmed
      await t.submit(snap(400)) // B: the server may apply it, the reply is lost
      await t.advance(MIN_SYNC_INTERVAL_MS)
      assert.equal(t.bodies.length, 2)
      assert.equal(t.storage.get(LAST_KEY('p')), '') // marker dropped in flight

      await t.submit(snap(500)) // back to A while B's outcome is unknown
      await t.advance(TIMEOUT_MS)
      await t.advance(MIN_SYNC_INTERVAL_MS)

      const last = t.bodies.at(-1)
      assert.equal(last.money, 500)
      assert.ok(last.revision > t.bodies[1].revision)
      assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
      assert.equal(t.bodies.filter(b => b.money === 400).length, 1)
    })
  }

  test('returning to A during B retry backoff sends A, not B', async () => {
    const t = setup({ script: [okResponse(), failResponse(500)] })
    await t.submit(snap(500)) // A confirmed
    await t.submit(snap(400))
    await t.advance(MIN_SYNC_INTERVAL_MS) // B failed; its retry is backing off
    assert.equal(t.bodies.length, 2)

    await t.submit(snap(500)) // back to A
    await t.advance(60 * 60 * 1000)

    assert.deepEqual(
      t.bodies.map(b => b.money),
      [500, 400, 500]
    )
    assert.ok(t.bodies[2].revision > t.bodies[1].revision)
    assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
  })

  test('a recreated controller still sends A after B was lost', async () => {
    const first = setup({
      requestTimeoutMs: TIMEOUT_MS,
      script: [okResponse(), never]
    })
    await first.submit(snap(500))
    await first.submit(snap(400))
    await first.advance(MIN_SYNC_INTERVAL_MS)
    await first.advance(TIMEOUT_MS)

    // A reload: same storage, new controller.
    const second = setup()
    for (const [key, value] of first.storage) second.storage.set(key, value)
    await second.submit(snap(500))

    assert.equal(second.bodies.length, 1)
    assert.equal(second.bodies[0].money, 500)
    assert.ok(second.bodies[0].revision > first.bodies[1].revision)
  })

  test('a recreated controller still skips a snapshot that was confirmed', async () => {
    const first = setup()
    await first.submit(snap(500))

    const second = setup()
    for (const [key, value] of first.storage) second.storage.set(key, value)
    await second.submit(snap(500))

    assert.equal(second.bodies.length, 0)
  })
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

for (const serverRevision of [
  Number.MAX_SAFE_INTEGER - 1,
  Number.MAX_SAFE_INTEGER
]) {
  test(`stops syncing a player whose server revision ${serverRevision} cannot be overtaken (#3475)`, async () => {
    // The server would answer stale to every resend for this player.
    const t = setup({
      script: Array.from({ length: 50 }, () => staleResponse(serverRevision))
    })
    await t.submit(snap(500))
    await t.advance(60 * 60 * 1000)
    assert.equal(t.bodies.length, 1)
    assert.equal(t.timers.length, 0)
    assert.deepEqual(t.logs.warn, [
      [
        'Leaderboard',
        'Stats revision exhausted on the server. Disabling stat sync for this player.'
      ]
    ])

    // Later stat changes for that player are ignored without a request or log.
    await t.submit(snap(900))
    await t.advance(60 * 60 * 1000)
    assert.equal(t.bodies.length, 1)
    assert.equal(t.logs.warn.length, 1)

    // Other players still send.
    await t.submit(snap(500, 'q'))
    assert.equal(t.bodies.length, 2)
    assert.equal(t.bodies[1].playerId, 'q')
  })
}

describe('a server revision at the ceiling (#3475)', () => {
  const CEILINGS = [Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]

  test('does not stop adopting a server revision just below it', async () => {
    const belowCeiling = Number.MAX_SAFE_INTEGER - 2
    const t = setup({ startMs: 5000, script: [staleResponse(belowCeiling)] })
    await t.submit(snap(500))
    assert.equal(t.storage.get(REVISION_KEY('p')), belowCeiling)
    await t.advance(MIN_SYNC_INTERVAL_MS)
    assert.equal(t.bodies[1].revision, belowCeiling + 1)
  })

  for (const serverRevision of CEILINGS) {
    test(`is never persisted from a stale response (${serverRevision})`, async () => {
      const t = setup({
        startMs: 5000,
        script: [staleResponse(serverRevision)]
      })
      t.storage.set(REVISION_KEY('p'), 4000)
      await t.submit(snap(500))

      assert.equal(t.bodies[0].revision, 5000)
      assert.equal(t.storage.get(REVISION_KEY('p')), 5000)
    })

    describe(`a recreated controller after exhaustion at ${serverRevision}`, () => {
      const exhaustThenRecreate = async secondScript => {
        const first = setup({
          startMs: 5000,
          script: [staleResponse(serverRevision)]
        })
        await first.submit(snap(500))
        assert.equal(first.controller.getSyncStatus('p').exhausted, true)
        first.controller.dispose()

        const second = setup({ startMs: 20_000, script: secondScript })
        for (const [key, value] of first.storage) second.storage.set(key, value)
        return second
      }

      test('does not carry the exhaustion over and probes once with a clock revision', async () => {
        const t = await exhaustThenRecreate([staleResponse(serverRevision)])
        assert.equal(t.controller.getSyncStatus('p').exhausted, false)

        await t.submit(snap(500))
        await t.submit(snap(900))
        await t.advance(60 * 60 * 1000)

        assert.equal(t.bodies.length, 1)
        assert.equal(t.bodies[0].revision, 20_000)
        assert.equal(t.controller.getSyncStatus('p').exhausted, true)
      })

      test('syncs normally when the server accepts the probe (operator reset)', async () => {
        const t = await exhaustThenRecreate([okResponse(), okResponse()])

        await t.submit(snap(500))
        assert.equal(t.bodies[0].revision, 20_000)
        assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(500)))
        assert.equal(t.controller.getSyncStatus('p').exhausted, false)

        await t.advance(MIN_SYNC_INTERVAL_MS)
        await t.submit(snap(900))
        assert.equal(t.bodies.length, 2)
        assert.equal(t.bodies[1].revision, 20_000 + MIN_SYNC_INTERVAL_MS)
        assert.equal(t.storage.get(LAST_KEY('p')), snapshotKey(snap(900)))
      })
    })
  }
})

describe('sync status', () => {
  const MAX = Number.MAX_SAFE_INTEGER

  test('reports a player as active until the server revision is exhausted', async () => {
    const t = setup({ script: [okResponse(), staleResponse(MAX)] })
    assert.equal(t.controller.getSyncStatus('p').exhausted, false)

    await t.submit(snap(500))
    assert.equal(t.controller.getSyncStatus('p').exhausted, false)

    await t.advance(MIN_SYNC_INTERVAL_MS)
    await t.submit(snap(900))
    assert.equal(t.controller.getSyncStatus('p').exhausted, true)
    assert.equal(t.controller.getSyncStatus('q').exhausted, false)
    // Stable snapshots for `useSyncExternalStore`.
    assert.equal(
      t.controller.getSyncStatus('p'),
      t.controller.getSyncStatus('p')
    )
    assert.equal(
      t.controller.getSyncStatus('q'),
      t.controller.getSyncStatus('r')
    )
  })

  test('notifies subscribers on exhaustion until they unsubscribe', async () => {
    const t = setup({
      script: [okResponse(), staleResponse(MAX), staleResponse(MAX)]
    })
    const seen = []
    const unsubscribe = t.controller.subscribe(() => {
      seen.push(t.controller.getSyncStatus('p').exhausted)
    })

    await t.submit(snap(500))
    assert.deepEqual(seen, []) // a plain sync changes no status

    await t.advance(MIN_SYNC_INTERVAL_MS)
    await t.submit(snap(900))
    assert.deepEqual(seen, [true])

    unsubscribe()
    await t.submit(snap(500, 'q'))
    assert.equal(t.controller.getSyncStatus('q').exhausted, true)
    assert.deepEqual(seen, [true])
  })

  test('a throwing listener neither starves others nor triggers a resend', async () => {
    const t = setup({ script: [staleResponse(MAX)] })
    let calls = 0
    t.controller.subscribe(() => {
      throw new Error('listener boom')
    })
    t.controller.subscribe(() => {
      calls += 1
    })

    await t.submit(snap(500))
    await t.advance(60 * 60 * 1000)

    assert.equal(calls, 1)
    assert.equal(t.bodies.length, 1)
    assert.deepEqual(
      t.logs.warn.map(entry => entry[1]),
      [
        'Stats revision exhausted on the server. Disabling stat sync for this player.',
        'Sync status listener failed'
      ]
    )
  })
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
  assert.ok(!t.storage.get(LAST_KEY('p'))) // no confirmed snapshot (a dispatched write clears it)
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
  assert.ok(!t.storage.get(LAST_KEY('p'))) // no confirmed snapshot (a dispatched write clears it)

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
  assert.ok(!t.storage.get(LAST_KEY('p'))) // no confirmed snapshot (a dispatched write clears it)

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

describe('shared-IP contention, 429 backoff, and recovery', () => {
  // Server rate limit constants copied from lib/leaderboard.js (isLeaderboardRateLimited):
  // RATE_LIMIT_MAX_REQUESTS = 5 (max 5 requests per window per IP)
  // RATE_LIMIT_WINDOW_MS = 60_000 (60 seconds fixed window)
  // Maintainers: update these constants if the Lua rate-limit script or limit in lib/leaderboard.js changes.
  const RATE_LIMIT_MAX_REQUESTS = 5
  const RATE_LIMIT_WINDOW_MS = 60_000

  const setupSharedCluster = ({ startMs = 1_000_000 } = {}) => {
    let nowMs = startMs
    let nextTimerId = 1
    const timers = []
    const storage = new Map()
    const requestLog = []
    const logs = { info: [], warn: [] }

    // Shared rate limit bucket state matching Redis Lua script in lib/leaderboard.js:
    // Fixed 60-second window starting at first request.
    // Counter increments for EVERY request attempt, including denied 429 requests.
    let windowStartMs = null
    let requestCount = 0

    const clock = { now: () => nowMs, today: () => new Date(nowMs) }

    const sharedFetch = async (url, init) => {
      assert.equal(url, '/api/leaderboard/stats')
      const body = JSON.parse(init.body)

      if (
        windowStartMs === null ||
        nowMs >= windowStartMs + RATE_LIMIT_WINDOW_MS
      ) {
        windowStartMs = nowMs
        requestCount = 0
      }

      // Counter increments on every request (including 429 denied requests)
      requestCount++
      const status = requestCount <= RATE_LIMIT_MAX_REQUESTS ? 200 : 429

      requestLog.push({
        playerId: body.playerId,
        key: snapshotKey(body),
        time: nowMs,
        status,
        windowCount: requestCount
      })

      if (status === 200) {
        return okResponse()
      }
      return failResponse(429)
    }

    const timerControls = {
      setTimeout: (fn, ms) => {
        const id = nextTimerId++
        timers.push({ id, at: nowMs + ms, fn })
        return id
      },
      clearTimeout: id => {
        const index = timers.findIndex(t => t.id === id)
        if (index >= 0) timers.splice(index, 1)
      }
    }

    const createController = () => {
      return createLeaderboardSyncController({
        fetch: sharedFetch,
        clock,
        storage: {
          read: key => storage.get(key),
          write: (key, value) => storage.set(key, value)
        },
        timers: timerControls,
        logger: {
          info: (...args) => logs.info.push(args),
          warn: (...args) => logs.warn.push(args)
        },
        isEnabled: () => true
      })
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
      clock,
      createController,
      advance,
      storage,
      requestLog,
      logs,
      timers,
      getNow: () => nowMs
    }
  }

  test('contention across >5 players: 5 acceptances, 429 for remaining, backoff, recovery after window expiry', async () => {
    const cluster = setupSharedCluster({ startMs: 1_000_000 })

    // Instantiate 3 controllers representing separate tabs/devices sharing 1 IP.
    // Controller 1: Player 1
    // Controller 2: Player 2
    // Controller 3 (Multi-player tab/device): Players 3, 4, 5, 6, 7 (Total 7 players > 5)
    const ctrl1 = cluster.createController()
    const ctrl2 = cluster.createController()
    const ctrl3 = cluster.createController()

    const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']

    // Submit initial snapshots at time 0
    ctrl1.submit(snap(100, 'p1'))
    ctrl2.submit(snap(100, 'p2'))
    ctrl3.submit(snap(100, 'p3'))
    ctrl3.submit(snap(100, 'p4'))
    ctrl3.submit(snap(100, 'p5'))
    ctrl3.submit(snap(100, 'p6'))
    ctrl3.submit(snap(100, 'p7'))
    await flush()

    // Assert exactly 7 requests logged at time 0
    assert.equal(cluster.requestLog.length, 7)

    // Assert first 5 requests received 200 OK
    for (let i = 0; i < 5; i++) {
      assert.equal(
        cluster.requestLog[i].status,
        200,
        `Request ${i + 1} should be 200`
      )
      const pid = cluster.requestLog[i].playerId
      assert.equal(
        cluster.storage.get(LAST_KEY(pid)),
        snapshotKey(snap(100, pid))
      )
    }

    // Assert remaining 2 requests (6th and 7th) received 429 Too Many Requests
    assert.equal(cluster.requestLog[5].status, 429, '6th request should be 429')
    assert.equal(cluster.requestLog[6].status, 429, '7th request should be 429')
    assert.ok(!cluster.storage.get(LAST_KEY('p6'))) // no confirmed snapshot (a dispatched write clears it)
    assert.ok(!cluster.storage.get(LAST_KEY('p7'))) // no confirmed snapshot (a dispatched write clears it)

    // Advance 15,000 ms: backoff for 1st failure is 30,000 ms (min(300s, 15s * 2^1)), so no early retry
    await cluster.advance(15_000)
    assert.equal(
      cluster.requestLog.length,
      7,
      'No early retries before 30s backoff timer'
    )

    await cluster.advance(14_999)
    assert.equal(cluster.requestLog.length, 7, 'No early retries at 29,999 ms')

    // At t = 30,000 ms: retries for p6 and p7 fire.
    // Note: Identical timing produces identical retry times because the controller has no jitter.
    await cluster.advance(1)
    assert.equal(cluster.requestLog.length, 9, '2 retries sent at 30,000 ms')

    // Still within active window [0, 60000ms), so retries receive 429 and increase backoff duration
    assert.equal(cluster.requestLog[7].status, 429)
    assert.equal(cluster.requestLog[8].status, 429)
    // Failures count is now 2, so backoff doubles to 60,000 ms (next retry at t = 30,000 + 60,000 = 90,000 ms)

    // Advance to t = 60,000 ms: window expires on server
    await cluster.advance(30_000)
    assert.equal(cluster.requestLog.length, 9, 'No retries between 30s and 60s')

    // Advance to t = 89,999 ms: still waiting for 60s backoff timer from t = 30,000 ms
    await cluster.advance(29_999)
    assert.equal(cluster.requestLog.length, 9)

    // At t = 90,000 ms: backoff timers fire. Server window reset at t = 60,000 ms, so request count resets.
    await cluster.advance(1)
    assert.equal(cluster.requestLog.length, 11, 'Retries sent at 90,000 ms')
    assert.equal(
      cluster.requestLog[9].status,
      200,
      'p6 retry after window expiry succeeds with 200'
    )
    assert.equal(
      cluster.requestLog[10].status,
      200,
      'p7 retry after window expiry succeeds with 200'
    )

    // Assert all players' newest snapshots are confirmed and stored under neurotoxic_last_synced_snapshot:${playerId}
    for (const pid of players) {
      assert.equal(
        cluster.storage.get(LAST_KEY(pid)),
        snapshotKey(snap(100, pid)),
        `Player ${pid} snapshot confirmed in storage`
      )
    }

    // Verify 429 did NOT disable sync (unlike 404): no 404 endpoint unavailable log was recorded
    assert.equal(
      cluster.logs.info.some(args =>
        args[1]?.includes('endpoint unavailable (404)')
      ),
      false,
      '429 response must not disable stat sync'
    )

    ctrl1.dispose()
    ctrl2.dispose()
    ctrl3.dispose()
  })

  test('pending-snapshot replacement, base pacing, upper bound proof, and denied request cap', async () => {
    const cluster = setupSharedCluster({ startMs: 1_000_000 })
    const ctrl1 = cluster.createController()
    const ctrl2 = cluster.createController()

    // Submit 6 players at t = 0 to fill 5 slots and force p6 into 429 backoff
    for (let i = 1; i <= 5; i++) {
      ctrl1.submit(snap(100, `p${i}`))
    }
    ctrl2.submit(snap(100, 'p6'))
    await flush()

    assert.equal(cluster.requestLog.length, 6)
    assert.equal(
      cluster.requestLog[5].status,
      429,
      'p6 gets 429 and enters backoff'
    )

    // At t = 10,000 ms: Submit a NEW snapshot for p6 during backoff
    await cluster.advance(10_000)
    ctrl2.submit(snap(999, 'p6'))
    await flush()

    // Assert pending-snapshot replacement and base pacing:
    // A newer snapshot with a different key resets retrying state and schedules at base pacing (MIN_SYNC_INTERVAL_MS = 15s).
    // Elapsed since lastSentAt (t=0) is 10s, so wait is max(0, 15s - 10s) = 5s (scheduled at t = 15,000 ms).
    await cluster.advance(4_999)
    assert.equal(
      cluster.requestLog.length,
      6,
      'p6 new snapshot does not fire before 15s base interval'
    )

    await cluster.advance(1)
    assert.equal(
      cluster.requestLog.length,
      7,
      'p6 new snapshot fires at 15s base interval'
    )
    assert.equal(cluster.requestLog[6].key, snapshotKey(snap(999, 'p6')))
    assert.equal(
      cluster.requestLog[6].status,
      429,
      'p6 new snapshot at t=15s gets 429 as window is still full'
    )

    // Stop state changes at t = 15,000 ms
    // Derivation of Explicit Upper Bound for Confirmation after State Changes Stop:
    // 1. Backoff interval cap = MAX_RETRY_INTERVAL_MS = 300 seconds (300,000 ms).
    // 2. Server rate-limit window = 60 seconds (60,000 ms).
    // 3. For a client with no continuing contention (e.g. 1 backing-off player remaining),
    //    confirmation occurs within Backoff Cap (300s) + Window Duration (60s) = 360 seconds (360,000 ms).
    // 4. Note: Multi-client recovery under arbitrary contention lacks an admission fairness guarantee
    //    because uncoordinated exponential retries do not form a FIFO fair queue.

    // Advance time and verify confirmation occurs within 360,000 ms upper bound for this uncontended client
    await cluster.advance(360_000)

    // Check that p6's newest snapshot snap(999, 'p6') was confirmed and stored
    assert.equal(
      cluster.storage.get(LAST_KEY('p6')),
      snapshotKey(snap(999, 'p6')),
      'Newest snapshot confirmed within 360s bound'
    )

    // Assert Upper Limit on Denied Requests Per Window from Backoff Cap:
    // Derivation: When N_b players are backing off at cap (retry interval I >= 30s up to 300s),
    // each player issues at most 1 retry per 60s window once I >= 60s.
    // In any 60-second window, the number of denied 429 requests across backing-off players
    // is strictly upper-bounded by N_b (the count of backing-off players).
    const requestsInSecondWindow = cluster.requestLog.filter(
      r => r.time >= 1_060_000 && r.time < 1_120_000
    )
    const deniedInSecondWindow = requestsInSecondWindow.filter(
      r => r.status === 429
    )
    assert.ok(
      deniedInSecondWindow.length <= 1,
      `Denied requests in window (${deniedInSecondWindow.length}) <= 1 backing-off player`
    )

    ctrl1.dispose()
    ctrl2.dispose()
  })
})
