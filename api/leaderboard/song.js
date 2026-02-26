import { redis } from '../../lib/redis.js'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { playerId, playerName, songId, score } = req.body

      if (!playerId || !playerName || !songId || typeof score !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      await redis.hset('players', { [playerId]: playerName })

      // Update score only if new score is greater (GT)
      await redis.zadd(`lb:song:${songId}`, { score, member: playerId }, { gt: true })

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Song score update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { songId } = req.query
      if (!songId) return res.status(400).json({ error: 'Missing songId' })

      const limit = Math.min(Math.max(1, parseInt(req.query.limit || '100', 10)), 100)

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
        playerName: names[index] || 'Unknown',
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
