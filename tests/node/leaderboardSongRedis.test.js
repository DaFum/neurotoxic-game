import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'

const hasRedisServer = spawnSync('redis-server', ['--version']).status === 0
const songA = '01_kranker_schrank'
const songB = '02_the_lost_scriptures_of_the_elder_gods_akoasma_and_golgatha'

const freePort = () =>
  new Promise(resolve => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })

describe('leaderboard writes against Redis', { skip: !hasRedisServer }, () => {
  let server
  let client
  let handler
  let stats
  let versionedWrite

  before(async () => {
    const port = await freePort()
    server = spawn(
      'redis-server',
      [
        '--port',
        String(port),
        '--bind',
        '127.0.0.1',
        '--save',
        '',
        '--appendonly',
        'no'
      ],
      { stdio: 'ignore' }
    )
    process.env.neurotoxic1_REDIS_URL = `redis://127.0.0.1:${port}`
    ;({ default: client } = await import('../../lib/redis.js'))
    ;({ default: handler } = await import('../../api/leaderboard/song.js'))
    ;({ default: stats, WRITE_IF_NEWER_SCRIPT: versionedWrite } =
      await import('../../api/leaderboard/stats.js'))
    for (let attempt = 0; ; attempt++) {
      try {
        await client.connect()
        break
      } catch (error) {
        if (attempt >= 50) throw error
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  })
  after(async () => {
    if (client?.isOpen) await client.quit()
    server?.kill()
  })

  const submit = async scores => {
    const response = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(body) {
        this.body = body
        return this
      }
    }
    await handler(
      {
        method: 'POST',
        socket: { remoteAddress: '127.0.0.1' },
        body: { playerId: 'player1', playerName: 'Player', scores }
      },
      response
    )
    return response.statusCode
  }

  it('writes multiple boards and only raises scores', async () => {
    assert.equal(
      await submit([
        { songId: songA, score: 10 },
        { songId: songB, score: 20 }
      ]),
      200
    )
    assert.equal(
      await submit([
        { songId: songA, score: 5 },
        { songId: songB, score: 25 }
      ]),
      200
    )
    assert.equal(await client.zScore(`lb:song:${songA}`, 'player1'), 10)
    assert.equal(await client.zScore(`lb:song:${songB}`, 'player1'), 25)
  })

  it('a write released after its deadline cannot overwrite a newer revision', async t => {
    const accepted = Promise.withResolvers()
    const late = Promise.withResolvers()
    const duplicate = client.duplicate
    t.mock.method(client, 'duplicate', () => {
      const isolated = duplicate.call(client)
      const evaluate = isolated.eval.bind(isolated)
      isolated.eval = (script, options) => {
        if (script === versionedWrite && options.arguments[1] === '1') {
          // Simulate server-side work already accepted before the socket closed.
          // Execute the real Lua later, independently of that request's client.
          accepted.resolve({ script, options })
          return late.promise
        }
        return evaluate(script, options)
      }
      return isolated
    })
    const response = () => ({
      statusCode: 0,
      status(code) {
        this.statusCode = code
        return this
      },
      json(body) {
        this.body = body
        return this
      }
    })
    const request = (revision, money, playerName) => ({
      method: 'POST',
      socket: { remoteAddress: '127.0.0.2' },
      body: { playerId: 'late-player', revision, money, playerName }
    })
    const older = response()
    const pending = stats(request(1, 100, 'Old name'), older)
    const held = await Promise.race([
      accepted.promise,
      pending.then(() => {
        throw new Error(
          'Handler completed before accepting the versioned write'
        )
      })
    ])
    await pending
    assert.equal(older.statusCode, 500)

    const newer = response()
    await stats(request(2, 200, 'New name'), newer)
    assert.equal(newer.statusCode, 200)
    assert.equal(await client.zScore('lb:balance', 'late-player'), 200)

    const result = await client.eval(held.script, held.options)
    late.resolve(result)
    assert.deepEqual(
      result,
      [0, 2],
      'the late revision must be rejected as stale'
    )
    assert.equal(await client.hGet('lb:revision', 'late-player'), '2')
    assert.equal(await client.hGet('players', 'late-player'), 'New name')
    assert.equal(await client.zScore('lb:balance', 'late-player'), 200)
    assert.equal(older.statusCode, 500)
  })

  it('continues the batch after a wrong-type board and reports failure', async () => {
    await client.del(`lb:song:${songA}`)
    await client.set(`lb:song:${songA}`, 'wrong type')
    const baseline = client.multi()
    baseline.zAdd(
      `lb:song:${songA}`,
      { score: 30, value: 'player1' },
      { GT: true }
    )
    baseline.zAdd(
      `lb:song:${songB}`,
      { score: 35, value: 'player1' },
      { GT: true }
    )
    await assert.rejects(baseline.exec())
    assert.equal(await client.zScore(`lb:song:${songB}`, 'player1'), 35)
    await client.zAdd(`lb:song:${songB}`, { score: 25, value: 'player1' })
    assert.equal(
      await submit([
        { songId: songA, score: 30 },
        { songId: songB, score: 35 }
      ]),
      500
    )
    assert.equal(await client.zScore(`lb:song:${songB}`, 'player1'), 35)
  })
})
