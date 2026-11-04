/* eslint-disable no-undef */
import { createClient } from 'redis'
import { REDIS_DEADLINE_MS } from './redisDeadline.js'

if (!process.env.neurotoxic1_REDIS_URL) {
  throw new Error(
    'Missing required environment variable: neurotoxic1_REDIS_URL'
  )
}

const client = createClient({
  url: process.env.neurotoxic1_REDIS_URL,
  socket: {
    connectTimeout: REDIS_DEADLINE_MS,
    reconnectStrategy: false
  },
  disableOfflineQueue: true,
  commandOptions: { timeout: REDIS_DEADLINE_MS }
})

client.on('error', err => console.error('Redis Client Error', err))

export default client
