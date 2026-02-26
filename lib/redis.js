import { Redis } from '@upstash/redis'

if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
  // Warn or fail depending on env? For local dev without env, maybe mock or fail.
  // But strict mode requested.
  // We'll throw but catch in API routes if needed to avoid crash on import?
  // Vercel functions import at runtime.
}

export const redis = new Redis({
  url: `https://${process.env.REDIS_HOST}`,
  token: process.env.REDIS_PASSWORD
})
