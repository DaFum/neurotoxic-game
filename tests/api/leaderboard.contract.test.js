import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'
import { toPublicPlayerRef } from '../../lib/apiUtils.js'
import { RATE_LIMIT_SCRIPT } from '../../lib/leaderboard.js'
import { SET_NAME_IF_UNVERSIONED_SCRIPT } from '../../api/leaderboard/song.js'

const mockClient = vi.hoisted(() => ({
  isOpen: true,
  connect: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  eval: vi.fn(),
  hSet: vi.fn(),
  multi: vi.fn(),
  zRangeWithScores: vi.fn(),
  hmGet: vi.fn()
}))

vi.mock('../../lib/redis.js', () => ({ default: mockClient }))

const songId = '01_kranker_schrank'
const endpoints = [
  {
    name: 'song',
    load: () => import('../../api/leaderboard/song.js'),
    query: { songId },
    payload: { songId, score: 100 },
    key: `lb:song:${songId}`
  },
  {
    name: 'stats',
    load: () => import('../../api/leaderboard/stats.js'),
    query: { stat: 'balance' },
    payload: { money: 100 },
    key: 'lb:balance'
  }
]

describe.each(endpoints)('$name leaderboard contracts', endpoint => {
  let handler

  beforeEach(async () => {
    vi.resetAllMocks()
    mockClient.isOpen = true
    // The rate-limit script answers with a count, the stats write script with
    // { applied, stored revision }.
    mockClient.eval.mockImplementation(script =>
      Promise.resolve(script === RATE_LIMIT_SCRIPT ? 1 : [1, 0])
    )
    mockClient.zRangeWithScores.mockResolvedValue([])
    mockClient.multi.mockReturnValue({ zAdd: vi.fn(), exec: vi.fn() })
    handler = (await endpoint.load()).default
  })

  test.each([
    [undefined, 100],
    ['', 100],
    ['invalid', 100],
    [['2'], 100],
    ['0', 1],
    ['-10', 1],
    ['9999', 100],
    ['2.9', 2],
    ['3suffix', 3]
  ])('GET parses limit %j as %i', async (limit, expected) => {
    const { res } = createApiRouteMocks()
    await handler({ method: 'GET', query: { ...endpoint.query, limit } }, res)

    expect(mockClient.zRangeWithScores).toHaveBeenCalledWith(
      endpoint.key,
      0,
      expected - 1,
      { REV: true }
    )
    expect(res.json).toHaveBeenCalledWith([])
    expect(mockClient.hmGet).not.toHaveBeenCalled()
  })

  test('GET aligns names and publishes only opaque player references', async () => {
    mockClient.zRangeWithScores.mockResolvedValue([
      { value: 'player1', score: 200 },
      { value: 'player2', score: 100 },
      { value: 'player3', score: 50 }
    ])
    mockClient.hmGet.mockResolvedValue(['First', null, ''])
    const { res } = createApiRouteMocks()

    await handler({ method: 'GET', query: endpoint.query }, res)

    expect(mockClient.hmGet).toHaveBeenCalledWith('players', [
      'player1',
      'player2',
      'player3'
    ])
    expect(res.json).toHaveBeenCalledWith([
      {
        rank: 1,
        playerRef: toPublicPlayerRef('player1'),
        playerName: 'First',
        score: 200
      },
      {
        rank: 2,
        playerRef: toPublicPlayerRef('player2'),
        playerName: 'Unknown',
        score: 100
      },
      {
        rank: 3,
        playerRef: toPublicPlayerRef('player3'),
        playerName: 'Unknown',
        score: 50
      }
    ])
  })

  test('POST sanitizes names before validating their persisted length', async () => {
    const { res } = createApiRouteMocks()
    await handler(
      {
        method: 'POST',
        body: {
          ...endpoint.payload,
          playerId: 'player1',
          playerName: `  ${'A'.repeat(100)}\u0000\u0080\u202e  `
        }
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(200)
    if (endpoint.name === 'stats') {
      // The stats write is one script: name first, then the scores.
      const [, options] = mockClient.eval.mock.calls.find(
        ([script]) => script !== RATE_LIMIT_SCRIPT
      )
      expect(options.arguments.slice(0, 2)).toEqual([
        'player1',
        'A'.repeat(100)
      ])
      return
    }
    const [, nameOptions] = mockClient.eval.mock.calls.find(
      ([script]) => script === SET_NAME_IF_UNVERSIONED_SCRIPT
    )
    expect(nameOptions.arguments).toEqual(['player1', 'A'.repeat(100)])
    for (const call of mockClient.multi.mock.results[0].value.zAdd.mock.calls) {
      expect(call[2]).toEqual({ GT: true })
    }
  })

  test.each([
    ['bad id!', '\u0000 \u202e', 'Invalid playerName length'],
    ['bad id!', 'Player', 'Invalid playerId format']
  ])(
    'POST validates player %j / %j before writes',
    async (playerId, playerName, error) => {
      const { res } = createApiRouteMocks()
      await handler(
        { method: 'POST', body: { ...endpoint.payload, playerId, playerName } },
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error })
      expect(mockClient.hSet).not.toHaveBeenCalled()
      expect(mockClient.multi).not.toHaveBeenCalled()
    }
  )

  test('POST counts each request in one atomic script and blocks the sixth before writes', async () => {
    const counts = [1, 5, 6]
    let counted = 0
    mockClient.eval.mockImplementation(script =>
      Promise.resolve(script === RATE_LIMIT_SCRIPT ? counts[counted++] : [1, 0])
    )
    const req = {
      method: 'POST',
      socket: { remoteAddress: '127.0.0.1' },
      body: { ...endpoint.payload, playerId: 'player1', playerName: 'Player' }
    }
    const { res } = createApiRouteMocks()

    for (let i = 0; i < 3; i++) await handler(req, res)

    const rateLimitOptions = {
      keys: [`rate_limit:${endpoint.name}:127.0.0.1`],
      arguments: ['60']
    }
    const evalCalls = mockClient.eval.mock.calls
    expect(
      evalCalls.filter(([script]) => script === RATE_LIMIT_SCRIPT)
    ).toEqual([
      [RATE_LIMIT_SCRIPT, rateLimitOptions],
      [RATE_LIMIT_SCRIPT, rateLimitOptions],
      [RATE_LIMIT_SCRIPT, rateLimitOptions]
    ])
    // Two requests got through to a write, the third was blocked before it.
    const writes =
      endpoint.name === 'stats'
        ? evalCalls.filter(([script]) => script !== RATE_LIMIT_SCRIPT).length
        : evalCalls.filter(
            ([script]) => script === SET_NAME_IF_UNVERSIONED_SCRIPT
          ).length
    expect(writes).toBe(2)
    expect(res.status.mock.lastCall).toEqual([429])
    expect(res.json.mock.lastCall).toEqual([{ error: 'Too many requests' }])
  })

  test('the rate-limit script repairs a counter that has no expiry', () => {
    expect(RATE_LIMIT_SCRIPT).toMatch(/INCR/)
    expect(RATE_LIMIT_SCRIPT).toMatch(/TTL.*< 0/)
    expect(RATE_LIMIT_SCRIPT).toMatch(/EXPIRE/)
  })

  test('POST preserves endpoint-specific errors before player validation', async () => {
    const { res } = createApiRouteMocks()
    await handler(
      {
        method: 'POST',
        body: { playerId: 'bad id!', playerName: '', money: -1 }
      },
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error:
        endpoint.name === 'song'
          ? 'Missing required fields'
          : 'Invalid money value'
    })
    expect(mockClient.hSet).not.toHaveBeenCalled()
  })
})
