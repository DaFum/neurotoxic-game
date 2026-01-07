import assert from 'node:assert';
import { test, before } from 'node:test';

// Mock localStorage and window before import
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.window = {};

// Now import
// Note: Dynamic import might be needed if the module is evaluated immediately,
// but since we are in ESM, top-level import happens before execution of this file's body?
// Actually in Node ESM, imports are hoisted and evaluated.
// So we need to mock BEFORE import.
// But we can't do that with static imports easily in the same file if the mock needs to be global.
// However, since we are running 'node --test', we can rely on the fact that we can't easily mock globals before static import without a loader or separate setup file.
// BUT, we can use dynamic import() inside the test or a setup block?
// No, top level await is available.

test('AudioManager setup', async (t) => {
    // Setup mocks
    global.localStorage = {
        getItem: () => '0.5',
        setItem: () => {},
        removeItem: () => {}
    };

    // Dynamic import to ensure globals are present
    const { audioManager } = await import('../src/utils/AudioManager.js');

    await t.test('audioManager singleton exists', () => {
        assert.ok(audioManager);
    });

    await t.test('audioManager has expected methods', () => {
        assert.equal(typeof audioManager.playMusic, 'function');
        assert.equal(typeof audioManager.playSFX, 'function');
        assert.equal(typeof audioManager.stopMusic, 'function');
    });
});
