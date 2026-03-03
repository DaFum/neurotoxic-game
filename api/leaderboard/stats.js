import client from '../../lib/redis.js'

export default async function handler(req, res) {
  // Ensure connection
  if (!client.isOpen) {
    await client.connect()
  }

  if (req.method === 'POST') {
    try {
      const {
        playerId, playerName, money, fame,
        followers, distance, conflicts, stageDives
      } = req.body

      // Basic Type Checks
      if (
        typeof playerId !== 'string' ||
        typeof playerName !== 'string' ||
        typeof money !== 'number'
      ) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Detailed Validation
      if (!Number.isFinite(money) || money < 0 || money > 10000000) {
        return res.status(400).json({ error: 'Invalid money value' })
      }

      const trimmedName = playerName.trim()
      if (trimmedName.length < 1 || trimmedName.length > 100) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }

      // Basic sanitization/validation for playerId key
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(playerId)) {
        return res.status(400).json({ error: 'Invalid playerId format' })
      }

      // Safe numbers for stats
      const safeFame = Number.isFinite(fame) ? fame : 0
      const safeFollowers = Number.isFinite(followers) ? followers : 0
      const safeDistance = Number.isFinite(distance) ? distance : 0
      const safeConflicts = Number.isFinite(conflicts) ? conflicts : 0
      const safeStageDives = Number.isFinite(stageDives) ? stageDives : 0

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: trimmedName })

      // v4: zAdd(key, { score, value })
      // Update multiple sorted sets
      const multi = client.multi()
      multi.zAdd('lb:balance', { score: money, value: playerId })
      multi.zAdd('lb:fame', { score: safeFame, value: playerId })
      multi.zAdd('lb:followers', { score: safeFollowers, value: playerId })
      multi.zAdd('lb:distance', { score: safeDistance, value: playerId })
      multi.zAdd('lb:conflicts', { score: safeConflicts, value: playerId })
      multi.zAdd('lb:stage_dives', { score: safeStageDives, value: playerId })

      await multi.exec()

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Stats update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      let limit = parseInt(req.query.limit, 10)
      if (isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      const stat = req.query.stat || 'balance'
      const validStats = ['balance', 'fame', 'followers', 'distance', 'conflicts', 'stage_dives']
      if (!validStats.includes(stat)) {
        return res.status(400).json({ error: 'Invalid stat requested' })
      }

      const sortedSetKey = `lb:${stat}`

      // v4: zRangeWithScores returns [{ score: number, value: string }]
      // REV: true for descending
      const range = await client.zRangeWithScores(sortedSetKey, 0, limit - 1, {
        REV: true
      })

      if (!range.length) return res.status(200).json([])

      // range is [{ value: 'id', score: 100 }, ...]
      const playerIds = range.map(r => r.value)

      // v4: hmGet returns string[] (aligned with keys)
      const names = await client.hmGet('players', playerIds)

      // hmGet returns array of values corresponding to keys
      const leaderboard = range.map((entry, index) => ({
        rank: index + 1,
        playerId: entry.value, // 'value' not 'member' in node-redis v4
        playerName: names[index] || 'Unknown',
        score: entry.score
      }))

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Stats fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
