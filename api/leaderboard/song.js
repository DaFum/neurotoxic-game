import { redis } from '../../lib/redis.js'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { playerId, playerName, songId, score } = req.body

      if (!playerId || !playerName || !songId || typeof score !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Basic sanitization/validation for songId key
      if (!/^[a-zA-Z0-9_-]+$/.test(songId)) {
        return res.status(400).json({ error: 'Invalid songId format' })
      }

      await redis.hset('players', { [playerId]: playerName })

      // Update score only if new score is greater (GT)
      await redis.zadd(`lb:song:${songId}`, { gt: true }, { score, member: playerId })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Song score update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { songId } = req.query
      if (!songId) return res.status(400).json({ error: 'Missing songId' })

      if (!/^[a-zA-Z0-9_-]+$/.test(songId)) {
        return res.status(400).json({ error: 'Invalid songId format' })
      }

      let limit = parseInt(req.query.limit, 10)
      if (isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      const range = await redis.zrange(`lb:song:${songId}`, 0, limit - 1, {
        rev: true,
        withScores: true
      })

      if (!range.length) return res.status(200).json([])

      const playerIds = range.map(r => r.member)
      const names = await redis.hmget('players', ...playerIds)

      const leaderboard = range.map((entry, index) => ({
        rank: index + 1,
        playerId: entry.member,
        playerName: names?.[entry.member] || 'Unknown',
        score: entry.score
      }))

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Song leaderboard fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
