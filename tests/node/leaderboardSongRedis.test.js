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

describe('song score writes against Redis', { skip: !hasRedisServer }, () => {
  let server
  let client
  let handler

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
