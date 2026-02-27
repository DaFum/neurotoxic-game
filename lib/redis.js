/* eslint-disable no-undef */
import { createClient } from 'redis'

if (!process.env.neurotoxic_REDIS_URL) {
  throw new Error('Missing required environment variable: neurotoxic_REDIS_URL')
}

const client = createClient({
  url: process.env.neurotoxic_REDIS_URL
})

client.on('error', err => console.error('Redis Client Error', err))

export default client
