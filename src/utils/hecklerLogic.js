/**
 * Updates the state of active projectiles.
 * @param {Array} projectiles - Current list of projectiles.
 * @param {number} deltaMS - Time elapsed in milliseconds.
 * @param {number} screenHeight - Height of the screen (to determine despawn).
 * @returns {Array} Updated list of projectiles.
 */
// Adaptive difficulty AI tuning based on stats
export const createHecklerSession = () => ({
  pool: [],
  nextId: 0
});

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

export const processProjectiles = (session, projectiles, deltaMS, screenHeight = 1080, onHit) => {
  const despawnY = screenHeight + 100;
  const hitY = screenHeight - 150;
  let writeIdx = 0;

  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];

    if (p.x === undefined) p.x = 0;
    if (p.rotation === undefined) p.rotation = 0;

    // 1. Apply Physics
    if (p.vy !== undefined) p.y += p.vy * deltaMS;
    if (p.vx !== undefined) p.x += p.vx * deltaMS;
    if (p.vr !== undefined) p.rotation += p.vr * deltaMS;

    // 2. Check Collision & Despawn
    let hit = false;
    // We check if the projectile crossed the hitY threshold in this tick.
    // If it also crossed despawnY due to a lag spike, it skips the hit penalty.
    if (onHit && p.y > hitY && p.y < despawnY) {
      onHit(p);
      hit = true;
    }

    // 3. Keep if not hit AND above despawn limit
    if (!hit && p.y < despawnY) {
      if (i !== writeIdx) projectiles[writeIdx] = p;
      writeIdx++;
    } else {
      if (session.pool.length < MAX_PROJECTILE_POOL_SIZE) {
        // Strip custom properties to prevent leaks
        const cleanP = {
          id: p.id,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          rotation: p.rotation,
          vr: p.vr,
          type: p.type
        };
        session.pool.push(cleanP);
      }
    }
  }

  if (writeIdx < projectiles.length) projectiles.length = writeIdx;
  return projectiles;
}

/**
 * Determines if a new projectile should be spawned and generates it.
 * @param {object} stats - Game stats (health, combo).
 * @param {Function} [random=Math.random] - Random number generator.
 * @param {number} [screenWidth=1920] - Width of screen for random X position.
 * @returns {object|null} New projectile object or null.
 */
const MAX_PROJECTILE_POOL_SIZE = 64;

export const trySpawnProjectile = (
  session,
  stats,
  random = Math.random,
  screenWidth = 1920
) => {
  // Adaptive difficulty AI tuning based on stats
  let spawnChance = SPAWN_CHANCE_CONFIG.BASE

  // Jealousy from high combo
  if (stats.combo > SPAWN_CHANCE_CONFIG.COMBO_HIGH_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.COMBO_HIGH_BONUS
  } else if (stats.combo > SPAWN_CHANCE_CONFIG.COMBO_MEDIUM_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.COMBO_MEDIUM_BONUS
  }

  // Desperation when health is low (piling on)
  if (stats.health < SPAWN_CHANCE_CONFIG.HEALTH_LOW_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.HEALTH_LOW_BONUS
  } else if (stats.health < SPAWN_CHANCE_CONFIG.HEALTH_MEDIUM_THRESHOLD) {
    spawnChance += SPAWN_CHANCE_CONFIG.HEALTH_MEDIUM_BONUS
  }

  if (random() < spawnChance) {
    let p;
    if (session.pool.length > 0) {
      p = session.pool.pop();
      p.id = session.nextId++;
      p.x = random() * screenWidth;
      p.y = -100;
      p.vx = (random() - 0.5) * 0.5;
      p.vy = 0.3 + random() * 0.4;
      p.rotation = 0;
      p.vr = (random() - 0.5) * 0.2;
      p.type = random() > 0.5 ? 'bottle' : 'tomato';
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
      };
    }
    return p;
  }
  return null
}




