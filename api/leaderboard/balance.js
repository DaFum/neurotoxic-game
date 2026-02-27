import client from '../../lib/redis.js'

export default async function handler(req, res) {
  // Ensure connection
  if (!client.isOpen) {
    await client.connect()
  }

  if (req.method === 'POST') {
    try {
      const { playerId, playerName, money, day: _day } = req.body

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

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: trimmedName })

      // v4: zAdd(key, { score, value })
      // Balance reflects current state, so overwrite is desired (remove gt: true)
      await client.zAdd('lb:balance', { score: money, value: playerId })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Balance update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      let limit = parseInt(req.query.limit, 10)
      if (isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      // v4: zRangeWithScores returns [{ score: number, value: string }]
      // REV: true for descending
      const range = await client.zRangeWithScores('lb:balance', 0, limit - 1, {
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
      console.error('Balance fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
