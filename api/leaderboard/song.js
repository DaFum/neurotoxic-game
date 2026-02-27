import client from '../../lib/redis.js'

const MAX_SONG_ID_LENGTH = 64

export default async function handler(req, res) {
  // Ensure connection
  if (!client.isOpen) {
    await client.connect()
  }

  if (req.method === 'POST') {
    try {
      const { playerId, playerName, songId, score } = req.body

      // Basic Type Checks
      if (
        typeof playerId !== 'string' ||
        typeof playerName !== 'string' ||
        typeof songId !== 'string' ||
        typeof score !== 'number'
      ) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Detailed Validation
      if (!Number.isFinite(score) || score < 0 || score > 10000000) {
        return res.status(400).json({ error: 'Invalid score value' })
      }

      const trimmedName = playerName.trim()
      if (trimmedName.length < 1 || trimmedName.length > 100) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }

      // Validation for keys
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(playerId)) {
        return res.status(400).json({ error: 'Invalid playerId format' })
      }

      if (
        !/^[a-zA-Z0-9_-]+$/.test(songId) ||
        songId.length > MAX_SONG_ID_LENGTH
      ) {
        return res.status(400).json({ error: 'Invalid songId format' })
      }

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: trimmedName })

      // Update score only if new score is greater (GT)
      // v4: zAdd(key, { score, value }, { GT: true })
      await client.zAdd(
        `lb:song:${songId}`,
        { score, value: playerId },
        { GT: true }
      )

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Song score update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { songId } = req.query
      if (!songId) return res.status(400).json({ error: 'Missing songId' })

      if (
        !/^[a-zA-Z0-9_-]+$/.test(songId) ||
        songId.length > MAX_SONG_ID_LENGTH
      ) {
        return res.status(400).json({ error: 'Invalid songId format' })
      }

      let limit = parseInt(req.query.limit, 10)
      if (isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      // v4: zRangeWithScores(key, min, max, options)
      const range = await client.zRangeWithScores(
        `lb:song:${songId}`,
        0,
        limit - 1,
        {
          REV: true
        }
      )

      if (!range.length) return res.status(200).json([])

      const playerIds = range.map(r => r.value) // value not member
      const names = await client.hmGet('players', playerIds)

      const leaderboard = range.map((entry, index) => ({
        rank: index + 1,
        playerId: entry.value,
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
