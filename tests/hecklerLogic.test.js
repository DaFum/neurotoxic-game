import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  updateProjectiles,
  trySpawnProjectile,
  checkCollisions
} from '../src/utils/hecklerLogic.js'

test('updateProjectiles - updates position and rotation', () => {
  const projectiles = [
    { x: 100, y: 100, vx: 0.1, vy: 0.2, vr: 0.05, rotation: 0 }
  ]
  const deltaMS = 1000 // 1 second
  const screenHeight = 1000
  // limit = 1100

  updateProjectiles(projectiles, deltaMS, screenHeight)

  // y += vy * deltaMS -> 100 + 0.2 * 1000 = 300
  assert.equal(projectiles[0].y, 300)
  // x += vx * deltaMS -> 100 + 0.1 * 1000 = 200
  assert.equal(projectiles[0].x, 200)
  // rotation += vr * deltaMS -> 0 + 0.05 * 1000 = 50
  assert.equal(projectiles[0].rotation, 50)
})

test('updateProjectiles - removes projectiles below limit', () => {
  const screenHeight = 1000
  // limit = 1100
  const projectiles = [
    { x: 100, y: 100, vx: 0, vy: 0, vr: 0, rotation: 0 }, // Should stay
    { x: 100, y: 1100, vx: 0, vy: 0, vr: 0, rotation: 0 } // Should be removed (y >= limit)
  ]

  // deltaMS = 0 so position doesn't change before check, but check happens after update
  // update adds vy*delta. If delta is 0, y stays same.
  updateProjectiles(projectiles, 0, screenHeight)

  assert.equal(projectiles.length, 1)
  assert.equal(projectiles[0].y, 100)
})

test('updateProjectiles - handles empty array', () => {
  const projectiles = []
  updateProjectiles(projectiles, 10, 1000)
  assert.equal(projectiles.length, 0)
})

test('updateProjectiles - mutates array in-place', () => {
  const projectiles = [{ x: 0, y: 0, vx: 0, vy: 0, vr: 0, rotation: 0 }]
  const result = updateProjectiles(projectiles, 10, 1000)
  assert.equal(result, projectiles)
})

test('trySpawnProjectile - spawns based on chance', () => {
  const stats = { health: 100, combo: 0 }
  // Default chance is 0.0005
  // Mock random to return 0 (guaranteed spawn)
  const mockRandomSpawn = () => 0

  const projectile = trySpawnProjectile(stats, mockRandomSpawn)
  assert.ok(projectile)
  assert.equal(projectile.y, -100)
  assert.ok(projectile.type === 'bottle' || projectile.type === 'tomato')
})

test('trySpawnProjectile - does not spawn if random > chance', () => {
  const stats = { health: 100, combo: 0 }
  // Mock random to return 0.9 (guaranteed no spawn)
  const mockRandomNoSpawn = () => 0.9

  const projectile = trySpawnProjectile(stats, mockRandomNoSpawn)
  assert.equal(projectile, null)
})

test('trySpawnProjectile - higher chance on low health', () => {
  const stats = { health: 40, combo: 0 }
  // Base chance 0.002
  // We want to verify that 0.001 (which is > 0.0005) spawns
  const mockRandom = () => 0.001

  const projectile = trySpawnProjectile(stats, mockRandom)
  assert.ok(projectile)
})

test('trySpawnProjectile - higher chance on high combo', () => {
  const stats = { health: 100, combo: 40 }
  // Base chance 0.0005 + 0.001 = 0.0015
  // We want to verify that 0.001 spawns
  const mockRandom = () => 0.001

  const projectile = trySpawnProjectile(stats, mockRandom)
  assert.ok(projectile)
})

test('trySpawnProjectile - verifies all spawned object properties', () => {
  const stats = { health: 100, combo: 0 } // Chance: 0.0005
  const screenWidth = 2000
  const values = [
    0.0001, // random() < spawnChance (spawns!)
    0.5, // id part
    0.5, // x (0.5 * 2000 = 1000)
    0.7, // vx ((0.7 - 0.5) * 0.5 = 0.1)
    0.5, // vy (0.3 + 0.5 * 0.4 = 0.5)
    0.8, // vr ((0.8 - 0.5) * 0.2 = 0.06)
    0.6 // type (0.6 > 0.5 -> 'bottle')
  ]
  let i = 0
  const mockRandom = () => {
    if (i >= values.length) {
      assert.fail('Unexpected extra random() call in test')
    }
    return values[i++]
  }

  const originalNow = Date.now
  Date.now = () => 1234567890

  try {
    const projectile = trySpawnProjectile(stats, mockRandom, screenWidth)

    assert.ok(projectile)
    assert.equal(typeof projectile.id, 'number')
    assert.equal(projectile.id, 1234567890.5)
    assert.equal(projectile.x, 1000)
    assert.equal(projectile.y, -100)
    // use approximate equality for floats
    assert.ok(Math.abs(projectile.vx - 0.1) < 0.0001)
    assert.ok(Math.abs(projectile.vy - 0.5) < 0.0001)
    assert.equal(projectile.rotation, 0)
    assert.ok(Math.abs(projectile.vr - 0.06) < 0.0001)
    assert.equal(projectile.type, 'bottle')
  } finally {
    Date.now = originalNow
  }
})

test('trySpawnProjectile - health boundary (49 vs 50)', () => {
  const mockRandom = () => 0.001 // Between 0.0005 and 0.002

  // Health 49: chance 0.002, should spawn
  assert.ok(trySpawnProjectile({ health: 49, combo: 0 }, mockRandom))

  // Health 50: chance 0.0005, should not spawn
  assert.equal(trySpawnProjectile({ health: 50, combo: 0 }, mockRandom), null)
})

test('trySpawnProjectile - combo boundary (30 vs 31)', () => {
  const mockRandom = () => 0.001 // Between 0.0005 and 0.0015

  // Combo 30: chance 0.0005, should not spawn
  assert.equal(trySpawnProjectile({ health: 100, combo: 30 }, mockRandom), null)

  // Combo 31: chance 0.0005 + 0.001 = 0.0015, should spawn
  assert.ok(trySpawnProjectile({ health: 100, combo: 31 }, mockRandom))
})

test('trySpawnProjectile - screenWidth influence on x', () => {
  const stats = { health: 100, combo: 0 }
  const values = [0, 0, 0.5, 0.5, 0.5, 0.5, 0.5] // spawn, id, x, vx, vy, vr, type
  let i = 0
  const mockRandom = () => {
    if (i >= values.length) {
      assert.fail('Unexpected random() call in test')
    }
    return values[i++]
  }

  const originalNow = Date.now
  Date.now = () => 1234567890

  try {
    const p1 = trySpawnProjectile(stats, mockRandom, 1000)
    assert.equal(p1.x, 500)

    i = 0
    const p2 = trySpawnProjectile(stats, mockRandom, 2000)
    assert.equal(p2.x, 1000)
  } finally {
    Date.now = originalNow
  }
})

test('trySpawnProjectile - combined chance (low health AND high combo)', () => {
  const stats = { health: 40, combo: 40 }
  // 0.002 + 0.001 = 0.003
  const mockRandom = () => 0.0025 // Should spawn

  assert.ok(trySpawnProjectile(stats, mockRandom))

  const mockRandomNo = () => 0.0035 // Should not spawn
  assert.equal(trySpawnProjectile(stats, mockRandomNo), null)
})

test('checkCollisions - detects collision and calls onHit', () => {
  const screenHeight = 1000
  // hitY = 1000 - 150 = 850
  const projectiles = [
    { id: 1, y: 800 }, // No hit
    { id: 2, y: 900 } // Hit
  ]

  let hitCount = 0
  const onHit = p => {
    hitCount++
    assert.equal(p.id, 2)
  }

  checkCollisions(projectiles, screenHeight, onHit)

  assert.equal(hitCount, 1)
  assert.equal(projectiles.length, 1)
  assert.equal(projectiles[0].id, 1)
})

test('checkCollisions - handles no collisions', () => {
  const screenHeight = 1000
  const projectiles = [{ id: 1, y: 800 }]
  checkCollisions(projectiles, screenHeight, () => {})
  assert.equal(projectiles.length, 1)
})

test('checkCollisions - handles all collisions', () => {
  const screenHeight = 1000
  const projectiles = [
    { id: 1, y: 900 },
    { id: 2, y: 950 }
  ]
  checkCollisions(projectiles, screenHeight, () => {})
  assert.equal(projectiles.length, 0)
})

test('checkCollisions - handles mixed collisions order', () => {
  const screenHeight = 1000
  // hitY = 850
  const projectiles = [
    { id: 1, y: 900 }, // Hit
    { id: 2, y: 800 }, // No hit
    { id: 3, y: 950 } // Hit
  ]
  const hits = []
  checkCollisions(projectiles, screenHeight, p => hits.push(p.id))

  assert.equal(projectiles.length, 1)
  assert.equal(projectiles[0].id, 2)
  assert.deepEqual(hits, [1, 3])
})
