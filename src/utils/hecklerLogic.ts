import { getSafeRandom } from './crypto'

/**
 * Updates the state of active projectiles.
 * @param {Array} projectiles - Current list of projectiles.
 * @param {number} deltaMS - Time elapsed in milliseconds.
 * @param {number} screenHeight - Height of the screen (to determine despawn).
 * @returns {Array} Updated list of projectiles.
 */
// Adaptive difficulty AI tuning based on stats
export type Projectile = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vr: number
  type: 'bottle' | 'tomato'
} & Record<string, unknown>
export type HecklerSession = { pool: Projectile[]; nextId: number }

export const createHecklerSession = (): HecklerSession => ({
  pool: [],
  nextId: 0
})

const SPAWN_CHANCE_CONFIG = {
  BASE: 0.0005,
  COMBO_HIGH_THRESHOLD: 50,
  COMBO_HIGH_BONUS: 0.002,
  COMBO_MEDIUM_THRESHOLD: 20,
  COMBO_MEDIUM_BONUS: 0.001,
  HEALTH_LOW_THRESHOLD: 30,
  HEALTH_LOW_BONUS: 0.003,
  HEALTH_MEDIUM_THRESHOLD: 60,
  HEALTH_MEDIUM_BONUS: 0.001
}

export const processProjectiles = (
  session: HecklerSession,
  projectiles: Projectile[],
  deltaMS: number,
  screenHeight = 1080,
  onHit?: (p: Projectile) => void
): Projectile[] => {
  const despawnY = screenHeight + 100
  const hitY = screenHeight - 150
  let writeIdx = 0

  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i]
    if (!p) continue

    if (p.x === undefined) p.x = 0
    if (p.rotation === undefined) p.rotation = 0

    // 1. Apply Physics
    if (p.vy !== undefined) p.y += p.vy * deltaMS
    if (p.vx !== undefined) p.x += p.vx * deltaMS
    if (p.vr !== undefined) p.rotation += p.vr * deltaMS

    // 2. Check Collision & Despawn
    let hit = false
    // We check if the projectile crossed the hitY threshold in this tick.
    // If it also crossed despawnY due to a lag spike, it skips the hit penalty.
    if (onHit && p.y > hitY && p.y < despawnY) {
      onHit(p)
      hit = true
    }

    // 3. Keep if not hit AND above despawn limit
    if (!hit && p.y < despawnY) {
      if (i !== writeIdx) projectiles[writeIdx] = p
      writeIdx++
    } else {
      if (session.pool.length < MAX_PROJECTILE_POOL_SIZE) {
        // Remove any dynamically added properties to prevent leaks without allocating a new object
        for (const key in p) {
          if (
            key !== 'id' &&
            key !== 'x' &&
            key !== 'y' &&
            key !== 'vx' &&
            key !== 'vy' &&
            key !== 'rotation' &&
            key !== 'vr' &&
            key !== 'type'
          ) {
            delete p[key]
          }
        }
        session.pool.push(p)
      }
    }
  }

  if (writeIdx < projectiles.length) projectiles.length = writeIdx
  return projectiles
}

/**
 * Determines if a new projectile should be spawned and generates it.
 * @param {object} stats - Game stats (health, combo).
 * @param {Function} [random=getSafeRandom] - Random number generator.
 * @param {number} [screenWidth=1920] - Width of screen for random X position.
 * @returns {object|null} New projectile object or null.
 */
const MAX_PROJECTILE_POOL_SIZE = 64

export const trySpawnProjectile = (
  session: HecklerSession,
  stats: { combo?: number; health?: number },
  random: () => number = getSafeRandom,
  screenWidth = 1920
): Projectile | null => {
  // Adaptive difficulty AI tuning based on stats
  let spawnChance = SPAWN_CHANCE_CONFIG.BASE
  // Normalize optional stats
  const combo = typeof stats.combo === 'number' ? stats.combo : 0
  const health = typeof stats.health === 'number' ? stats.health : 100

  // Jealousy from high combo
  if (combo > SPAWN_CHANCE_CONFIG.COMBO_HIGH_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.COMBO_HIGH_BONUS
  } else if (combo > SPAWN_CHANCE_CONFIG.COMBO_MEDIUM_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.COMBO_MEDIUM_BONUS
  }

  // Desperation when health is low (piling on)
  if (health < SPAWN_CHANCE_CONFIG.HEALTH_LOW_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.HEALTH_LOW_BONUS
  } else if (health < SPAWN_CHANCE_CONFIG.HEALTH_MEDIUM_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.HEALTH_MEDIUM_BONUS
  }

  if (random() < spawnChance) {
    let p: Projectile
    if (session.pool.length > 0) {
      const pooled = session.pool.pop()
      if (!pooled) return null
      p = pooled
      p.id = session.nextId++
      p.x = random() * screenWidth
      p.y = -100
      p.vx = (random() - 0.5) * 0.5
      p.vy = 0.3 + random() * 0.4
      p.rotation = 0
      p.vr = (random() - 0.5) * 0.2
      p.type = random() > 0.5 ? 'bottle' : 'tomato'
    } else {
      p = {
        id: session.nextId++,
        x: random() * screenWidth,
        y: -100, // Start above screen
        vx: (random() - 0.5) * 0.5, // Drift left/right
        vy: 0.3 + random() * 0.4, // Fall speed
        rotation: 0,
        vr: (random() - 0.5) * 0.2, // Rotation speed
        type: random() > 0.5 ? 'bottle' : 'tomato'
      }
    }
    return p
  }
  return null
}
