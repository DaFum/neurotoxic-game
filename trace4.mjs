import assert from 'assert';
import { processProjectiles } from './src/utils/hecklerLogic.js';

function runTest53() {
  const screenHeight = 500
  const projectiles = [
    { x: 100, y: 400, vx: 0, vy: 0, rotation: 0, vr: 0 }, // On screen
    { x: 100, y: 700, vx: 0, vy: 0, rotation: 0, vr: 0 } // Off screen (500 + 100 buffer = 600 max)
  ]

  const updated = processProjectiles(projectiles, 0, screenHeight)

  assert.strictEqual(updated.length, 1)
  assert.strictEqual(updated[0].y, 400)
}
runTest53();
