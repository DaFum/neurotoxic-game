import { processProjectiles } from './src/utils/hecklerLogic.js';

let projectiles = [{ id: 1, y: 849, vy: 0, vx: 0, vr: 0 }];
console.log('Before 19:', projectiles);
processProjectiles(projectiles, 0, 1000);
console.log('After 19:', projectiles);

projectiles = [
  { id: 1, y: 100, vy: 0, vx: 0, vr: 0, rotation: 0 },
  { id: 2, y: 900, vy: 0, vx: 0, vr: 0, rotation: 0 }
];
console.log('Before 53:', projectiles);
processProjectiles(projectiles, 0, 1000);
console.log('After 53:', projectiles);
