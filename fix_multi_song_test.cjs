const fs = require('fs');

// We are fixing the timers for real now that the hook infinite loop is gone.
let file = 'tests/rhythmGameLogicMultiSong.test.js';
let content = fs.readFileSync(file, 'utf8');

// Replace standard act-awaits with advanceTimersByTime or just explicit long timeouts.
// Wait, `act(async () => { await new Promise(r => setTimeout(r, 10)) })` might not be enough because `setupGigPhysics` is mocked?
// Actually `audioManager.ensureAudioContext()` is an async promise.
// Let's use `await new Promise(r => setTimeout(r, 50))` to make sure microtasks flush.
content = content.replace(/setTimeout\(r, 10\)/g, "setTimeout(r, 50)");

// Check why `startGigPlayback` is 0.
// Is `ensureAudioContext` mocked to return false? No, `ensureAudioContext: mock.fn(async () => true)`.

fs.writeFileSync(file, content);
