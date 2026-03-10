import assert from 'assert';
import { processProjectiles } from './src/utils/hecklerLogic.js';

const projectiles = [{ id: 1, y: 1000 }];
processProjectiles(projectiles, 0, 1000, undefined);
console.log(projectiles.length);
assert.equal(projectiles.length, 1);
