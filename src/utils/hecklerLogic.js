/**
 * Updates the state of active projectiles.
 * @param {Array} projectiles - Current list of projectiles.
 * @param {number} deltaMS - Time elapsed in milliseconds.
 * @param {number} screenHeight - Height of the screen (to determine despawn).
 * @returns {Array} Updated list of projectiles.
 */
export const updateProjectiles = (
  projectiles,
  deltaMS,
  screenHeight = 1080
) => {
  return projectiles
    .map(p => ({
      ...p,
      x: p.x + p.vx * deltaMS,
      y: p.y + p.vy * deltaMS,
      rotation: p.rotation + p.vr * deltaMS
    }))
    .filter(p => p.y < screenHeight + 100)
}

/**
 * Determines if a new projectile should be spawned and generates it.
 * @param {object} stats - Game stats (health, combo).
 * @param {Function} [random=Math.random] - Random number generator.
 * @param {number} [screenWidth=1920] - Width of screen for random X position.
 * @returns {object|null} New projectile object or null.
 */
export const trySpawnProjectile = (
  stats,
  random = Math.random,
  screenWidth = 1920
) => {
  // Higher chance if health is low or combo is high (jealousy)
  let spawnChance = stats.health < 50 ? 0.002 : 0.0005
  if (stats.combo > 30) spawnChance += 0.001

  if (random() < spawnChance) {
    return {
      id: Date.now() + random(),
      x: random() * screenWidth,
      y: -100, // Start above screen
      vx: (random() - 0.5) * 0.5, // Drift left/right
      vy: 0.3 + random() * 0.4, // Fall speed
      rotation: 0,
      vr: (random() - 0.5) * 0.2, // Rotation speed
      type: random() > 0.5 ? 'bottle' : 'tomato'
    }
  }
  return null
}
