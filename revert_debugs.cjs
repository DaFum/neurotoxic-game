const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// The reviewer mentioned:
// 1. `console.log('initializeGigState started'...` should be removed.
// 2. `console.log('isAborted 1');` should be removed.
// 3. `console.log('hasInitializedRef set to true');` should be removed.
// 4. `isInitializingRef.current = false` before return in the Harmony Guard branch (which happens BEFORE try/finally).
//    "isInitializingRef.current is set to true before the harmony guard, but the try/finally (which releases the lock) starts after the guard. If harmony is too low... the function returns with the lock still held... Move the try/finally to wrap all code after setting the lock".
// 5. The dependency list includes `band?.id` and `gameMap?.id`, but neither has an ID in the state shape. "Consider removing them or replacing with real primitives... e.g. band.members.length, Object.keys(gameMap.nodes).length, or a dedicated mapVersion".
// Wait, `gigModifiers` is still included directly in the dependency array.

// Okay, let's fix all of this.

// A. Move the try/finally to encompass the harmony guard and stopMusic
hookContent = hookContent.replace(
  "    const isAborted = () =>\n      signal.aborted || abortControllerRef.current !== controller\n\n    // Mute ambient radio to prevent audio overlap\n    audioManager.stopMusic()\n\n    const currentHarmony = clampBandHarmony(band?.harmony)\n\n    // Harmony Guard\n    if (currentHarmony <= 1) {\n      logger.warn('RhythmGame', 'Band harmony too low to start gig.')\n      setIsAudioReady(false)\n      return\n    }\n\n    try {\n      const audioUnlocked = await audioManager.ensureAudioContext()",
  "    const isAborted = () =>\n      signal.aborted || abortControllerRef.current !== controller\n\n    try {\n      // Mute ambient radio to prevent audio overlap\n      audioManager.stopMusic()\n\n      const currentHarmony = clampBandHarmony(band?.harmony)\n\n      // Harmony Guard\n      if (currentHarmony <= 1) {\n        logger.warn('RhythmGame', 'Band harmony too low to start gig.')\n        setIsAudioReady(false)\n        return\n      }\n\n      const audioUnlocked = await audioManager.ensureAudioContext()"
);

// B. Remove debug logs
hookContent = hookContent.replace(
  "  const initializeGigState = useCallback(async () => {\n    console.log('initializeGigState started', { hasInit: hasInitializedRef.current, isInit: isInitializingRef.current });\n    // Prevent double initialization",
  "  const initializeGigState = useCallback(async () => {\n    // Prevent double initialization"
);

hookContent = hookContent.replace(
  "      if (isAborted()) {\n        console.log('isAborted 1');\n        return\n      }",
  "      if (isAborted()) {\n        return\n      }"
);

hookContent = hookContent.replace(
  "      setIsAudioReady(true)\n      hasInitializedRef.current = true\n      console.log('hasInitializedRef set to true');\n\n      // Reset cross-song tracking state for a new gig",
  "      setIsAudioReady(true)\n      hasInitializedRef.current = true\n\n      // Reset cross-song tracking state for a new gig"
);

// C. Fix dependencies
hookContent = hookContent.replace(
  "    band?.id,\n    band?.harmony,\n    gameMap?.id,\n    player?.currentNodeId,\n    setlist?.length,\n    currentGig?.songId,\n    gigModifiers,\n    addToast,\n    t,\n    gameStateRef,\n    setIsAudioReady",
  "    band?.members?.length,\n    band?.harmony,\n    gameMap?.nodes ? Object.keys(gameMap.nodes).length : 0,\n    player?.currentNodeId,\n    setlist?.length,\n    currentGig?.songId,\n    // Stringify gigModifiers to ensure referential stability\n    JSON.stringify(gigModifiers),\n    addToast,\n    t,\n    gameStateRef,\n    setIsAudioReady"
);

fs.writeFileSync(hookFile, hookContent);

let boltFile = '.jules/bolt.md';
let boltContent = fs.readFileSync(boltFile, 'utf8');

boltContent = boltContent.replace(
  "Furthermore, the test suite (`rhythmGameLogicMultiSong.test.js`) was secretly relying on this infinite re-render loop to advance its own asynchronous microtask queue, which caused it to fail once the hook was stabilized.",
  "Furthermore, the test suite (`rhythmGameLogicMultiSong.test.js`) advanced due to repeated re-invocation from this infinite re-render loop, so it failed once the hook was stabilized."
);

fs.writeFileSync(boltFile, boltContent);
