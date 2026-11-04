import { after, before, it } from 'node:test'
import assert from 'node:assert/strict'
import net from 'node:net'
import { createClient } from 'redis'

let server
let handler
let createRedisRequest
let withRedisDeadline
const sockets = []
let commandSeen
const firstCommand = new Promise(resolve => {
  commandSeen = resolve
})

// Parse only the RESP arrays used by node-redis's handshake and leaderboard read.
function consume(buffer) {
  const end = buffer.indexOf('\r\n')
  if (end < 0) return null
  const count = Number(buffer.subarray(1, end).toString())
  let offset = end + 2
  const parts = []
  for (let i = 0; i < count; i++) {
    const lineEnd = buffer.indexOf('\r\n', offset)
    if (lineEnd < 0) return null
    const length = Number(buffer.subarray(offset + 1, lineEnd).toString())
    if (buffer.length < lineEnd + 2 + length + 2) return null
    parts.push(buffer.subarray(lineEnd + 2, lineEnd + 2 + length).toString())
    offset = lineEnd + 2 + length + 2
  }
  return { parts, offset }
}

before(async () => {
  server = net.createServer(socket => {
    const entry = { socket, closed: false, whenClosed: null }
    entry.whenClosed = new Promise(resolve =>
      socket.once('close', () => {
        entry.closed = true
        resolve()
      })
    )
    sockets.push(entry)
    let buffer = Buffer.alloc(0)
    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk])
      let parsed
      while ((parsed = consume(buffer))) {
        buffer = buffer.subarray(parsed.offset)
        if (parsed.parts[0].toUpperCase() === 'ZRANGE') {
          if (sockets.indexOf(entry) === 0) commandSeen()
          else socket.write('*0\r\n')
        } else socket.write('+OK\r\n')
      }
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  process.env.neurotoxic1_REDIS_URL = `redis://127.0.0.1:${server.address().port}`
  ;({ default: handler } = await import('../../api/leaderboard/stats.js'))
  ;({ createRedisRequest, withRedisDeadline } =
    await import('../../lib/redisDeadline.js'))
})
after(async () => {
  for (const { socket } of sockets) socket.destroy()
  await new Promise(resolve => server.close(resolve))
})

const response = () => ({
  statusCode: 0,
  status(code) {
    this.statusCode = code
    return this
  },
  json(body) {
    this.body = body
    return this
  }
})

it('closes a stalled request socket while a concurrent request succeeds', async () => {
  const first = response()
  const stalled = handler({ method: 'GET', query: { stat: 'balance' } }, first)
  await firstCommand
  const second = response()
  await handler({ method: 'GET', query: { stat: 'balance' } }, second)
  assert.equal(second.statusCode, 200)
  assert.deepEqual(second.body, [])
  await stalled
  assert.equal(first.statusCode, 500)
  await Promise.race([
    sockets[0].whenClosed,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('socket did not close')), 1000)
    )
  ])
  assert.equal(sockets[0].closed, true)
})

it('destroys a connection that finishes after its deadline during DNS', async () => {
  const count = sockets.length
  const shared = createClient({
    maintNotifications: 'disabled',
    socket: {
      host: 'delayed.test',
      port: server.address().port,
      connectTimeout: 2000,
      reconnectStrategy: false,
      lookup(_host, options, callback) {
        setTimeout(
          () =>
            options.all
              ? callback(null, [{ address: '127.0.0.1', family: 4 }])
              : callback(null, '127.0.0.1', 4),
          1200
        )
      }
    }
  })
  shared.on('error', () => {})
  const request = createRedisRequest(shared)
  const connecting = request.connect()
  await assert.rejects(
    withRedisDeadline(request.client, () => connecting),
    /deadline exceeded/
  )
  request.close()
  await connecting
  assert.equal(request.client.isOpen, false)
  assert.equal(request.client.isReady, false)
  assert.equal(sockets.length, count + 1)
  await Promise.race([
    sockets[count].whenClosed,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('late socket did not close')), 1000)
    )
  ])
  assert.equal(sockets[count].closed, true)
})
