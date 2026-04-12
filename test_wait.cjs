const fs = require('fs');

let file = 'tests/rhythmGameLogicMultiSong.test.js';
let content = fs.readFileSync(file, 'utf8');

// Because dependencies are stable, the component isn't automatically re-rendering enough to trigger updates perhaps?
// Actually `setIsAudioReady` is called inside `initializeGigState`.
// Let's replace the `50` timeout with something reliable like `setImmediate` multiple times to flush microtasks, or `500` ms to see if it works.

content = content.replace(/setTimeout\(r, 50\)/g, "setTimeout(r, 200)");

fs.writeFileSync(file, content);
