import { processProjectiles } from './src/utils/hecklerLogic.js';
const screenHeight = 2000;
const projectiles = [{ id: 1, y: 1100, vy: 0, vx: 0, vr: 0 }];
const result = processProjectiles(projectiles, 0, screenHeight);
console.log('Result:', result);
