import { updateProjectiles } from '../../src/utils/hecklerLogic.js';

const RUNS = 1000;
const PROJECTILES_COUNT = 10000;
const DELTA_MS = 16.6; // ~60fps
const SCREEN_HEIGHT = 1080;

// Create random projectiles
const createProjectiles = () => Array.from({ length: PROJECTILES_COUNT }, (_, i) => ({
  x: Math.random() * 1920,
  y: Math.random() * 1200, // Some on screen, some off (height is 1080, buffer is 100)
  vx: (Math.random() - 0.5) * 0.5,
  vy: 0.3 + Math.random() * 0.4,
  rotation: 0,
  vr: (Math.random() - 0.5) * 0.2
}));

const projectiles = createProjectiles();

console.log(`Running benchmark with ${PROJECTILES_COUNT} projectiles over ${RUNS} iterations...`);

const start = performance.now();

for (let i = 0; i < RUNS; i++) {
  // Use a fresh copy if mutation was happening, but here map/filter creates new arrays
  // so we can reuse the input. However, the logic is purely functional, so it's fine.
  updateProjectiles(projectiles, DELTA_MS, SCREEN_HEIGHT);
}

const end = performance.now();
const totalTime = end - start;
const avgTime = totalTime / RUNS;

console.log(`Total time: ${totalTime.toFixed(2)}ms`);
console.log(`Average time per run: ${avgTime.toFixed(4)}ms`);
