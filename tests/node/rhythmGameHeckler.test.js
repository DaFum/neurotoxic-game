import assert from 'node:assert'
import { test } from 'node:test'
import {
  processProjectiles,
  trySpawnProjectile,
  createHecklerSession
} from '../../src/utils/hecklerLogic.js'

test('trySpawnProjectile respects spawn chance', () => {
  const session = createHecklerSession()
  // Force spawn
  const alwaysSpawn = () => 0.0
  const projectile = trySpawnProjectile(
    session,
    { health: 100 },
    alwaysSpawn,
    1000
  )

  assert.ok(projectile, 'Should spawn when random value is low')
  assert.strictEqual(typeof projectile.id, 'number')
  assert.strictEqual(projectile.y, -100)
  assert.ok(projectile.type === 'bottle' || projectile.type === 'tomato')
})

test('trySpawnProjectile respects no spawn', () => {
  const session = createHecklerSession()
  // Force no spawn
  const neverSpawn = () => 0.99
  const projectile = trySpawnProjectile(
    session,
    { health: 100 },
    neverSpawn,
    1000
  )

  assert.strictEqual(
    projectile,
    null,
    'Should not spawn when random value is high'
  )
})

test('trySpawnProjectile increases chance on low health', () => {
  const session = createHecklerSession()
  // Threshold for normal health is 0.0005
  // Threshold for low health (<50) is 0.002

  const marginalRandom = () => 0.001 // Between 0.0005 and 0.002

  const normalHealth = trySpawnProjectile(
    session,
    { health: 80 },
    marginalRandom
  )
  assert.strictEqual(
    normalHealth,
    null,
    'Should NOT spawn at 80 health with 0.001 roll'
  )

  const lowHealth = trySpawnProjectile(session, { health: 40 }, marginalRandom)
  assert.ok(lowHealth, 'Should spawn at 40 health with 0.001 roll')
})

test('trySpawnProjectile increases chance on high combo', () => {
  const session = createHecklerSession()
  // Threshold for normal health/combo is 0.0005
  // Threshold for high combo (>30) is 0.0015 (0.0005 + 0.001)

  const marginalRandom = () => 0.001 // Between 0.0005 and 0.0015

  const normalCombo = trySpawnProjectile(
    session,
    { health: 100, combo: 10 },
    marginalRandom
  )
  assert.strictEqual(
    normalCombo,
    null,
    'Should NOT spawn at 10 combo with 0.001 roll'
  )

  const highCombo = trySpawnProjectile(
    session,
    { health: 100, combo: 50 },
    marginalRandom
  )
  assert.ok(highCombo, 'Should spawn at 50 combo with 0.001 roll')
})

test('processProjectiles moves items correctly', () => {
  const session = createHecklerSession()
  const projectiles = [
    { x: 100, y: 100, vx: 0.1, vy: 0.2, rotation: 0, vr: 0.01 }
  ]
  const deltaMS = 100

  const updated = processProjectiles(session, projectiles, deltaMS, 1000)

  assert.strictEqual(updated.length, 1)
  const p = updated[0]

  // x = 100 + 0.1 * 100 = 110
  // y = 100 + 0.2 * 100 = 120
  assert.strictEqual(p.x, 110)
  assert.strictEqual(p.y, 120)
  assert.strictEqual(p.rotation, 1) // 0 + 0.01 * 100
})

test('processProjectiles removes off-screen items', () => {
  const session = createHecklerSession()
  const screenHeight = 500
  const projectiles = [
    { x: 100, y: 100, vx: 0, vy: 0, rotation: 0, vr: 0 }, // Safely < hitY (350)
    { x: 100, y: 700, vx: 0, vy: 0, rotation: 0, vr: 0 } // Off screen (500 + 100 buffer = 600 max)
  ]

  const updated = processProjectiles(session, projectiles, 0, screenHeight)

  assert.strictEqual(updated.length, 1)
  assert.strictEqual(updated[0].y, 100)
})

test('processProjectiles handles empty input', () => {
  const session = createHecklerSession()
  const updated = processProjectiles(session, [], 16, 1000)
  assert.deepStrictEqual(updated, [])
})

test('processProjectiles handles large delta (lag spike)', () => {
  const session = createHecklerSession()
  const projectiles = [
    { x: 100, y: 100, vx: 0, vy: 1.0, rotation: 0, vr: 0 } // Falling fast
  ]
  // 5 seconds lag
  const updated = processProjectiles(session, projectiles, 5000, 1000)
  // y = 100 + 1.0 * 5000 = 5100 -> Off screen
  assert.strictEqual(updated.length, 0)
})

test('processProjectiles detects hits and removes items', () => {
  const session = createHecklerSession()
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 800 }, // No hit (800 < 850)
    { id: 2, y: 900 }, // Hit (900 > 850)
    { id: 3, y: 849 }, // No hit
    { id: 4, y: 850 } // Boundary (850 == 850) -> No hit
  ]

  let hits = 0
  const onHit = p => {
    hits++
    assert.strictEqual(p.id, 2)
  }

  processProjectiles(session, projectiles, 0, screenHeight, onHit)

  assert.strictEqual(hits, 1, 'Should trigger callback once')
  assert.strictEqual(
    projectiles.length,
    3,
    'Should remove ONLY the hitting projectile'
  )
  assert.strictEqual(projectiles[0].id, 1)
  assert.strictEqual(projectiles[1].id, 3)
  assert.strictEqual(projectiles[2].id, 4)
})

test('processProjectiles handles multiple simultaneous hits', () => {
  const session = createHecklerSession()
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 900 }, // Hit
    { id: 2, y: 800 }, // No hit
    { id: 3, y: 950 } // Hit
  ]

  const hitIds = []
  const onHit = p => hitIds.push(p.id)

  processProjectiles(session, projectiles, 0, screenHeight, onHit)

  assert.strictEqual(hitIds.length, 2)
  assert.ok(hitIds.includes(1))
  assert.ok(hitIds.includes(3))
  assert.strictEqual(projectiles.length, 1)
  assert.strictEqual(projectiles[0].id, 2)
})

test('processProjectiles handles all items hitting', () => {
  const session = createHecklerSession()
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 900 },
    { id: 2, y: 950 }
  ]

  let hits = 0
  const onHit = () => hits++

  processProjectiles(session, projectiles, 0, screenHeight, onHit)

  assert.strictEqual(hits, 2)
  assert.strictEqual(projectiles.length, 0)
})

test('processProjectiles handles no hits', () => {
  const session = createHecklerSession()
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 800 },
    { id: 2, y: 840 }
  ]

  let hits = 0
  const onHit = () => hits++

  processProjectiles(session, projectiles, 0, screenHeight, onHit)

  assert.strictEqual(hits, 0)
  assert.strictEqual(projectiles.length, 2)
  assert.strictEqual(projectiles[0].id, 1)
  assert.strictEqual(projectiles[1].id, 2)
})

test('processProjectiles handles missing onHit callback', () => {
  const session = createHecklerSession()
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 900 }, // Hit
    { id: 2, y: 800 } // No hit
  ]

  // Should not throw, keeps both if no onHit provided and y < despawnLimit
  processProjectiles(session, projectiles, 0, screenHeight)

  assert.strictEqual(projectiles.length, 2)
})
