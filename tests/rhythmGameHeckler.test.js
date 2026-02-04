import assert from 'assert'
import { test } from 'node:test'
import { updateProjectiles, trySpawnProjectile } from '../src/utils/hecklerLogic.js'

test('trySpawnProjectile respects spawn chance', () => {
  // Force spawn
  const alwaysSpawn = () => 0.0
  const projectile = trySpawnProjectile({ health: 100 }, alwaysSpawn, 1000)

  assert.ok(projectile, 'Should spawn when random value is low')
  assert.strictEqual(typeof projectile.id, 'number')
  assert.strictEqual(projectile.y, -100)
  assert.ok(projectile.type === 'bottle' || projectile.type === 'tomato')
})

test('trySpawnProjectile respects no spawn', () => {
  // Force no spawn
  const neverSpawn = () => 0.99
  const projectile = trySpawnProjectile({ health: 100 }, neverSpawn, 1000)

  assert.strictEqual(projectile, null, 'Should not spawn when random value is high')
})

test('trySpawnProjectile increases chance on low health', () => {
  // Threshold for normal health is 0.0005
  // Threshold for low health (<50) is 0.002

  const marginalRandom = () => 0.001 // Between 0.0005 and 0.002

  const normalHealth = trySpawnProjectile({ health: 80 }, marginalRandom)
  assert.strictEqual(normalHealth, null, 'Should NOT spawn at 80 health with 0.001 roll')

  const lowHealth = trySpawnProjectile({ health: 40 }, marginalRandom)
  assert.ok(lowHealth, 'Should spawn at 40 health with 0.001 roll')
})

test('updateProjectiles moves items correctly', () => {
  const projectiles = [
    { x: 100, y: 100, vx: 0.1, vy: 0.2, rotation: 0, vr: 0.01 }
  ]
  const deltaMS = 100

  const updated = updateProjectiles(projectiles, deltaMS, 1000)

  assert.strictEqual(updated.length, 1)
  const p = updated[0]

  // x = 100 + 0.1 * 100 = 110
  // y = 100 + 0.2 * 100 = 120
  assert.strictEqual(p.x, 110)
  assert.strictEqual(p.y, 120)
  assert.strictEqual(p.rotation, 1) // 0 + 0.01 * 100
})

test('updateProjectiles removes off-screen items', () => {
  const screenHeight = 500
  const projectiles = [
    { x: 100, y: 400, vx: 0, vy: 0, rotation: 0, vr: 0 }, // On screen
    { x: 100, y: 700, vx: 0, vy: 0, rotation: 0, vr: 0 }  // Off screen (500 + 100 buffer = 600 max)
  ]

  const updated = updateProjectiles(projectiles, 0, screenHeight)

  assert.strictEqual(updated.length, 1)
  assert.strictEqual(updated[0].y, 400)
})

test('updateProjectiles handles empty input', () => {
  const updated = updateProjectiles([], 16, 1000)
  assert.deepStrictEqual(updated, [])
})

test('updateProjectiles handles large delta (lag spike)', () => {
  const projectiles = [
    { x: 100, y: 100, vx: 0, vy: 1.0, rotation: 0, vr: 0 } // Falling fast
  ]
  // 5 seconds lag
  const updated = updateProjectiles(projectiles, 5000, 1000)
  // y = 100 + 1.0 * 5000 = 5100 -> Off screen
  assert.strictEqual(updated.length, 0)
})
