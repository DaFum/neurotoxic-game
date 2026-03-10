const assert = require('assert');
// wait, the error message in the test output actually says `0 !== 1`.
// But trace2.js outputs `[ { id: 1, y: 849, vy: 0, vx: 0, vr: 0, x: NaN, rotation: NaN } ]`.
// So the length IS 1.
// If the length is 1, why does `assert.equal(projectiles.length, 1)` fail with `Expected 1, actual 0`???
// Let me look at test 19 exactly as it ran.
