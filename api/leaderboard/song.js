import client from '../../lib/redis.js'

const MAX_SONG_ID_LENGTH = 64

/**
 * Verarbeitet HTTP-Requests zum Speichern von Spieler-Scores (POST) und zum Abrufen der Highscore-Liste eines Songs (GET).
 *
 * POST: Validiert Nutzlast gegen Prototype-Pollution, prüft Felder (playerId, playerName, songId, score), aktualisiert den Spielernamen in der Hash-Map und fügt den Score in die Song-Zeitreihe ein (nur wenn der neue Score größer ist). Gibt bei Erfolg HTTP 200 mit { success: true } zurück; bei Validierungsfehlern entsprechende 400-Antworten; bei internen Fehlern 500.
 *
 * GET: Validiert query.songId und optionales query.limit, liest die Top-N-Einträge der Song-Leaderboard-Zeile und die zugehörigen Spielernamen und liefert ein Array mit Einträgen { rank, playerId, playerName, score }. Gibt 400 für fehlerhafte Abfragen, 200 mit dem Leaderboard oder einem leeren Array bei keinem Eintrag, und 500 bei internen Fehlern.
 */
export default async function handler(req, res) {
  // Ensure connection
  if (!client.isOpen) {
    await client.connect()
  }

  if (req.method === 'POST') {
    try {
      // Rate Limiting (5 requests per 60s)
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      const rateKey = `ratelimit:lb:song:${ip}`
      const current = await client.incr(rateKey)
      if (current === 1) {
        await client.expire(rateKey, 60)
      }
      if (current > 5) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      // Anti-Tamper / Prototype Pollution Check
      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        return res
          .status(400)
          .json({ error: 'Invalid payload structure: expected object' })
      }
      if (
        Object.hasOwn(req.body, '__proto__') ||
        Object.hasOwn(req.body, 'constructor') ||
        Object.hasOwn(req.body, 'prototype')
      ) {
        return res.status(400).json({ error: 'Invalid payload structure' })
      }

      // Rate Limiting
      const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
      const rateLimitKey = `rate_limit:song:${ip}`
      const requests = await client.incr(rateLimitKey)
      if (requests === 1) {
        await client.expire(rateLimitKey, 60)
      }
      if (requests > 5) {
        return res.status(429).json({ error: 'Too many requests' })
      }

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

      if (playerName.length > 100) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }
      const trimmedName = playerName.trim()
      if (trimmedName.length < 1) {
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
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
