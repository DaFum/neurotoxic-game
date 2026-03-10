import assert from 'assert';
import { processProjectiles } from './src/utils/hecklerLogic.js';

function runTest19() {
  const screenHeight = 1000;
  const projectiles = [{ x: 100, y: 849, vx: 0, vy: 0, vr: 0, rotation: 0 }];
  processProjectiles(projectiles, 0, screenHeight);
  console.log('Result length:', projectiles.length);
  assert.equal(projectiles.length, 1);
}

runTest19();
