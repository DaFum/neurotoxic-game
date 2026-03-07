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
  // Health < 60 branch gives 0.0005 + 0.001 = 0.0015
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
    assert.equal(typeof projectile.id, 'string')
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

test('trySpawnProjectile - health boundary (29 vs 30)', () => {
  const mockRandom = () => 0.002 // Between 0.0015 and 0.0035

  // Health 29: chance 0.0035 (0.0005 + 0.003), should spawn
  assert.ok(trySpawnProjectile({ health: 29, combo: 0 }, mockRandom))

  // Health 30: chance 0.0015 (0.0005 + 0.001), should not spawn
  assert.equal(trySpawnProjectile({ health: 30, combo: 0 }, mockRandom), null)
})

test('trySpawnProjectile - combo boundary (20 vs 21)', () => {
  const mockRandom = () => 0.001 // Between 0.0005 and 0.0015

  // Combo 21: chance 0.0015 (0.0005 + 0.001), should spawn
  assert.ok(trySpawnProjectile({ health: 100, combo: 21 }, mockRandom))

  // Combo 20: chance 0.0005, should not spawn
  assert.equal(trySpawnProjectile({ health: 100, combo: 20 }, mockRandom), null)
})

test('trySpawnProjectile - screenWidth influence on x', () => {
  const stats = { health: 100, combo: 0 }
  const values = [0, 0.5, 0.5, 0.5, 0.5, 0.5] // spawn, x, vx, vy, vr, type
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
    assert.ok(p1, 'p1 should be defined')
    assert.equal(p1.x, 500)

    i = 0
    const p2 = trySpawnProjectile(stats, mockRandom, 2000)
    assert.ok(p2, 'p2 should be defined')
    assert.equal(p2.x, 1000)
  } finally {
    Date.now = originalNow
  }
})

test('trySpawnProjectile - combined chance (low health AND high combo)', () => {
  const stats = { health: 20, combo: 60 }
  // 0.0005 + 0.003 + 0.002 = 0.0055
  const mockRandom = () => 0.005 // Should spawn

  assert.ok(trySpawnProjectile(stats, mockRandom))

  const mockRandomNo = () => 0.006 // Should not spawn
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

test('checkCollisions - handles empty array', () => {
  const projectiles = []
  checkCollisions(projectiles, 1000, () => {})
  assert.equal(projectiles.length, 0)
})

test('checkCollisions - mutates array in-place', () => {
  const screenHeight = 1000
  const projectiles = [{ id: 1, y: 800 }]
  const result = checkCollisions(projectiles, screenHeight, () => {})
  assert.equal(result, projectiles)
})

test('checkCollisions - handles missing onHit callback', () => {
  const screenHeight = 1000
  const projectiles = [{ id: 1, y: 900 }]
  checkCollisions(projectiles, screenHeight)
  assert.equal(projectiles.length, 0) // Should still remove hit projectile
})

test('checkCollisions - exact hitY boundary', () => {
  const screenHeight = 1000
  // hitY = 850
  const projectiles = [
    { id: 1, y: 850 }, // Exactly at boundary, should NOT hit (y > hitY is false)
    { id: 2, y: 851 } // Just past boundary, should hit
  ]
  const hits = []
  checkCollisions(projectiles, screenHeight, p => hits.push(p.id))

  assert.equal(projectiles.length, 1)
  assert.equal(projectiles[0].id, 1)
  assert.deepEqual(hits, [2])
})

test('updateProjectiles - exact limit boundary', () => {
  const screenHeight = 1000
  // limit = 1100
  const projectiles = [
    { x: 0, y: 1099, vx: 0, vy: 0, vr: 0, rotation: 0 }, // Should stay (y < limit)
    { x: 0, y: 1100, vx: 0, vy: 0, vr: 0, rotation: 0 } // Should be removed (y >= limit)
  ]

  updateProjectiles(projectiles, 0, screenHeight)

  assert.equal(projectiles.length, 1)
  assert.equal(projectiles[0].y, 1099)
})

test('updateProjectiles - updates only when below limit', () => {
  const screenHeight = 1000
  const projectiles = [
    { x: 0, y: 1200, vx: 1, vy: 1, vr: 1, rotation: 0 } // Above limit
  ]

  updateProjectiles(projectiles, 100, screenHeight)

  // Projectile is removed before x, rotation update happens
  assert.equal(projectiles.length, 0)
})

test('updateProjectiles - large deltaMS values', () => {
  const projectiles = [
    { x: 100, y: 100, vx: 0.1, vy: 0.2, vr: 0.05, rotation: 0 }
  ]
  const deltaMS = 10000 // 10 seconds

  updateProjectiles(projectiles, deltaMS, 10000)

  // Should handle large time deltas without issues
  assert.equal(projectiles[0].y, 2100) // 100 + 0.2 * 10000
  assert.equal(projectiles[0].x, 1100) // 100 + 0.1 * 10000
  assert.equal(projectiles[0].rotation, 500) // 0 + 0.05 * 10000
})

test('updateProjectiles - negative velocity values', () => {
  const projectiles = [
    { x: 1000, y: 500, vx: -0.1, vy: 0.2, vr: -0.05, rotation: 10 }
  ]
  const deltaMS = 1000

  updateProjectiles(projectiles, deltaMS, 1000)

  assert.equal(projectiles[0].y, 700) // 500 + 0.2 * 1000
  assert.equal(projectiles[0].x, 900) // 1000 + (-0.1) * 1000
  assert.equal(projectiles[0].rotation, -40) // 10 + (-0.05) * 1000
})

test('trySpawnProjectile - health exactly at low threshold', () => {
  const mockRandom = () => 0.0034 // Between 0.0005 + 0.003 = 0.0035

  // Health exactly at 30 (HEALTH_LOW_THRESHOLD), should use MEDIUM bonus
  const result30 = trySpawnProjectile({ health: 30, combo: 0 }, mockRandom)
  assert.equal(result30, null) // Chance is 0.0015, random is 0.0034

  // Health at 29 (below threshold), should use LOW bonus
  const result29 = trySpawnProjectile({ health: 29, combo: 0 }, mockRandom)
  assert.ok(result29) // Chance is 0.0035, random is 0.0034
})

test('trySpawnProjectile - health exactly at medium threshold', () => {
  const mockRandom = () => 0.0014 // Between 0.0005 and 0.0015

  // Health exactly at 60 (HEALTH_MEDIUM_THRESHOLD), should not get bonus
  const result60 = trySpawnProjectile({ health: 60, combo: 0 }, mockRandom)
  assert.equal(result60, null) // Chance is 0.0005, random is 0.0014

  // Health at 59 (below threshold), should get MEDIUM bonus
  const result59 = trySpawnProjectile({ health: 59, combo: 0 }, mockRandom)
  assert.ok(result59) // Chance is 0.0015, random is 0.0014
})

test('trySpawnProjectile - combo exactly at medium threshold', () => {
  const mockRandom = () => 0.0014 // Between 0.0005 and 0.0015

  // Combo exactly at 20 (COMBO_MEDIUM_THRESHOLD), should not get bonus
  const result20 = trySpawnProjectile({ health: 100, combo: 20 }, mockRandom)
  assert.equal(result20, null) // Chance is 0.0005, random is 0.0014

  // Combo at 21 (above threshold), should get MEDIUM bonus
  const result21 = trySpawnProjectile({ health: 100, combo: 21 }, mockRandom)
  assert.ok(result21) // Chance is 0.0015, random is 0.0014
})

test('trySpawnProjectile - combo exactly at high threshold', () => {
  const mockRandom = () => 0.0024 // Between 0.0015 and 0.0025

  // Combo exactly at 50 (COMBO_HIGH_THRESHOLD), should not get HIGH bonus
  const result50 = trySpawnProjectile({ health: 100, combo: 50 }, mockRandom)
  assert.equal(result50, null) // Chance is 0.0015, random is 0.0024

  // Combo at 51 (above threshold), should get HIGH bonus
  const result51 = trySpawnProjectile({ health: 100, combo: 51 }, mockRandom)
  assert.ok(result51) // Chance is 0.0025, random is 0.0024
})

test('trySpawnProjectile - maximum combined bonuses', () => {
  // Health < 30, Combo > 50 = 0.0005 + 0.003 + 0.002 = 0.0055
  const stats = { health: 10, combo: 100 }
  const mockRandom = () => 0.0054

  const projectile = trySpawnProjectile(stats, mockRandom)
  assert.ok(projectile)
})

test('trySpawnProjectile - verifies type distribution', () => {
  const stats = { health: 100, combo: 0 }
  const values = [
    0, // Spawn
    0.5, // x
    0.4, // vx
    0.5, // vy
    0.5, // vr
    0.3 // type (0.3 <= 0.5, so 'tomato')
  ]
  let i = 0
  const mockRandom = () => values[i++]

  const originalNow = Date.now
  Date.now = () => 1234567890

  try {
    const projectile = trySpawnProjectile(stats, mockRandom, 1920)
    assert.equal(projectile.type, 'tomato')
  } finally {
    Date.now = originalNow
  }
})

test('trySpawnProjectile - verifies rotation velocities', () => {
  const stats = { health: 100, combo: 0 }
  const values = [
    0, // Spawn
    0.5, // x
    0.5, // vx (0.5 - 0.5) * 0.5 = 0
    0.5, // vy
    0.1, // vr (0.1 - 0.5) * 0.2 = -0.08
    0.6 // type
  ]
  let i = 0
  const mockRandom = () => values[i++]

  const originalNow = Date.now
  Date.now = () => 1234567890

  try {
    const projectile = trySpawnProjectile(stats, mockRandom, 1920)
    assert.ok(Math.abs(projectile.vr - (-0.08)) < 0.0001)
  } finally {
    Date.now = originalNow
  }
})

test('trySpawnProjectile - spawn with zero health', () => {
  // Health = 0 gives max bonus
  const stats = { health: 0, combo: 0 }
  const mockRandom = () => 0.003 // Should spawn with 0.0035 chance

  const projectile = trySpawnProjectile(stats, mockRandom)
  assert.ok(projectile)
})

test('trySpawnProjectile - no spawn with perfect stats', () => {
  const stats = { health: 100, combo: 0 }
  const mockRandom = () => 0.001 // Much higher than base 0.0005

  const projectile = trySpawnProjectile(stats, mockRandom)
  assert.equal(projectile, null)
})

test('checkCollisions - large number of projectiles', () => {
  const screenHeight = 1000
  const projectiles = []
  for (let i = 0; i < 100; i++) {
    projectiles.push({ id: i, y: 800 + i * 2 }) // Some will hit, some won't
  }

  let hitCount = 0
  checkCollisions(projectiles, screenHeight, () => hitCount++)

  // hitY = 850, so projectiles with y > 850 should hit
  // y ranges from 800 to 998, so roughly 26-50 should hit
  assert.ok(hitCount > 0)
  assert.ok(projectiles.length > 0)
  assert.equal(projectiles.length + hitCount, 100)
})

test('updateProjectiles - maintains correct order after removal', () => {
  const screenHeight = 1000
  const projectiles = [
    { id: 1, x: 0, y: 100, vx: 0, vy: 0, vr: 0, rotation: 0 },
    { id: 2, x: 0, y: 2000, vx: 0, vy: 0, vr: 0, rotation: 0 }, // Will be removed
    { id: 3, x: 0, y: 200, vx: 0, vy: 0, vr: 0, rotation: 0 }
  ]

  updateProjectiles(projectiles, 0, screenHeight)

  assert.equal(projectiles.length, 2)
  assert.equal(projectiles[0].id, 1)
  assert.equal(projectiles[1].id, 3)
})