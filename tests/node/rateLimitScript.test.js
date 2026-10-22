/**
 * Runs the leaderboard rate-limit Lua script against a real, disposable Redis
 * server. The mocked API tests only assert the arguments passed to `eval`; this
 * proves the script itself: the count, the expiry on a fresh counter, the
 * repair of a counter that has no expiry, and that an existing expiry is kept.
 *
 * Skipped when no `redis-server` binary is on the PATH, so the default run
 * stays hermetic.
 */
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'

const hasRedisServer = spawnSync('redis-server', ['--version']).status === 0

/** @returns {Promise<number>} A free local TCP port. */
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(() => resolve(port))
    })
  })

describe(
  'RATE_LIMIT_SCRIPT against a real Redis',
  { skip: !hasRedisServer },
  () => {
    let server
    let client
    let isLeaderboardRateLimited

    const requestFrom = ip => ({
      method: 'POST',
      socket: { remoteAddress: ip }
    })
    const keyFor = ip => `rate_limit:stats:${ip}`

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
      // The modules read the URL on import, so they load only after it is set.
      ;({ default: client } = await import('../../lib/redis.js'))
      ;({ isLeaderboardRateLimited } = await import('../../lib/leaderboard.js'))

      // The server needs a moment to accept connections.
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

    it('counts requests and sets a 60 second expiry on the first one', async () => {
      const ip = '10.0.0.1'
      assert.equal(
        await isLeaderboardRateLimited(requestFrom(ip), 'stats'),
        false
      )
      assert.equal(await client.get(keyFor(ip)), '1')
      const ttl = await client.ttl(keyFor(ip))
      assert.ok(ttl > 0 && ttl <= 60, `expected a TTL in (0, 60], got ${ttl}`)
    })

    it('limits the sixth request in the window', async () => {
      const ip = '10.0.0.2'
      const results = []
      for (let i = 0; i < 6; i++) {
        results.push(await isLeaderboardRateLimited(requestFrom(ip), 'stats'))
      }
      assert.deepEqual(results, [false, false, false, false, false, true])
    })

    it('repairs a counter that has no expiry', async () => {
      const ip = '10.0.0.3'
      // The state a failed EXPIRE would leave behind: a counter without a TTL.
      await client.set(keyFor(ip), '2')
      assert.equal(await client.ttl(keyFor(ip)), -1)

      assert.equal(
        await isLeaderboardRateLimited(requestFrom(ip), 'stats'),
        false
      )

      assert.equal(await client.get(keyFor(ip)), '3')
      const ttl = await client.ttl(keyFor(ip))
      assert.ok(ttl > 0 && ttl <= 60, `expected a repaired TTL, got ${ttl}`)
    })

    it('keeps an existing positive expiry instead of resetting it', async () => {
      const ip = '10.0.0.4'
      await client.set(keyFor(ip), '1', { EX: 20 })

      await isLeaderboardRateLimited(requestFrom(ip), 'stats')

      assert.equal(await client.get(keyFor(ip)), '2')
      const ttl = await client.ttl(keyFor(ip))
      assert.ok(
        ttl > 0 && ttl <= 20,
        `expected the TTL to stay <= 20, got ${ttl}`
      )
    })
  }
)
