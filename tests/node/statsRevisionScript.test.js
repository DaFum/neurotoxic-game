/**
 * Runs the two leaderboard stats Lua scripts against a real, disposable Redis
 * server. The mocked API tests only assert the arguments passed to `eval`; this
 * proves the scripts: that a revision-protected player cannot be rolled back by
 * an unversioned write (the audit R01 probe), that the versioned script still
 * accepts only a strictly newer revision, and that a player who never sent a
 * revision stays last-write-wins.
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

const BOARDS = [
  'lb:balance',
  'lb:fame',
  'lb:followers',
  'lb:distance',
  'lb:conflicts',
  'lb:stage_dives'
]

describe(
  'stats write scripts against a real Redis',
  { skip: !hasRedisServer },
  () => {
    let server
    let client
    let WRITE_IF_NEWER_SCRIPT
    let WRITE_IF_UNVERSIONED_SCRIPT

    const keys = ['lb:revision', 'players', ...BOARDS]
    const versioned = (id, revision, name, balance) =>
      client.eval(WRITE_IF_NEWER_SCRIPT, {
        keys,
        arguments: [
          id,
          String(revision),
          name,
          String(balance),
          '1',
          '1',
          '1',
          '1',
          '1'
        ]
      })
    const unversioned = (id, name, balance) =>
      client.eval(WRITE_IF_UNVERSIONED_SCRIPT, {
        keys,
        arguments: [id, name, String(balance), '1', '1', '1', '1', '1']
      })
    const snapshot = async id => ({
      name: await client.hGet('players', id),
      revision: await client.hGet('lb:revision', id),
      balance: await client.zScore('lb:balance', id)
    })

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
      ;({ WRITE_IF_NEWER_SCRIPT, WRITE_IF_UNVERSIONED_SCRIPT } =
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

    it('writes a new unversioned player without creating a revision', async () => {
      assert.deepEqual(await unversioned('legacy-new', 'Legacy', 50), [1, 0])
      assert.deepEqual(await snapshot('legacy-new'), {
        name: 'Legacy',
        revision: null,
        balance: 50
      })
    })

    it('keeps an unversioned player last-write-wins', async () => {
      await unversioned('legacy-lww', 'First', 50)
      assert.deepEqual(await unversioned('legacy-lww', 'Second', 10), [1, 0])
      assert.deepEqual(await snapshot('legacy-lww'), {
        name: 'Second',
        revision: null,
        balance: 10
      })
    })

    it('refuses an unversioned write once a revision is stored (audit R01)', async () => {
      assert.deepEqual(
        await versioned('protected', 7, 'Versioned', 900),
        [1, 7]
      )

      assert.deepEqual(await unversioned('protected', 'Rollback', 1), [0, 7])

      assert.deepEqual(await snapshot('protected'), {
        name: 'Versioned',
        revision: '7',
        balance: 900
      })
    })

    it('still accepts only a strictly newer revision', async () => {
      await versioned('versioned', 5, 'Five', 500)
      assert.deepEqual(await versioned('versioned', 5, 'Equal', 1), [0, 5])
      assert.deepEqual(await versioned('versioned', 4, 'Older', 1), [0, 5])
      assert.deepEqual(await versioned('versioned', 6, 'Six', 600), [1, 6])
      assert.deepEqual(await snapshot('versioned'), {
        name: 'Six',
        revision: '6',
        balance: 600
      })
    })

    it('accepts a versioned write after unversioned ones', async () => {
      await unversioned('upgrade', 'Old client', 20)
      assert.deepEqual(await versioned('upgrade', 1, 'New client', 30), [1, 1])
      assert.deepEqual(await snapshot('upgrade'), {
        name: 'New client',
        revision: '1',
        balance: 30
      })
    })

    it('keeps refusing when the stored revision is malformed', async () => {
      await client.hSet('lb:revision', 'malformed', 'not-a-number')
      assert.deepEqual(await unversioned('malformed', 'Nope', 1), [0, 0])
      assert.equal(await client.hGet('players', 'malformed'), null)
    })
  }
)
