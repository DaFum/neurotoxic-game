/* eslint-disable no-undef */
import { Redis } from '@upstash/redis'

if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
  throw new Error('Missing required environment variables: REDIS_HOST and REDIS_PASSWORD must be set.')
}

export const redis = new Redis({
  url: `https://${process.env.REDIS_HOST}`,
  token: process.env.REDIS_PASSWORD
})
