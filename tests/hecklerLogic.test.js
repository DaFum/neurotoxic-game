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
