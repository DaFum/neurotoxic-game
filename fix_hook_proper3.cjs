const fs = require('fs');
let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// "0 !== 1" means `startGigPlayback` is never being called.
// Why?
// In the hook:
// const audioUnlocked = await audioManager.ensureAudioContext()
// If `isAborted()` is true, it returns.
// The `abortControllerRef` is set up:
// const controller = new AbortController()
// abortControllerRef.current = controller
// const isAborted = () => signal.aborted || abortControllerRef.current !== controller

// BUT the hook dependency array now has PRMITIVES ONLY.
// Is it rerendering and aborting?
// `addToast` and `t` and `setIsAudioReady` are from context / props.
// `gameStateRef` is a ref.

// Let's add a console.log to `useRhythmGameAudio.js` to see WHY it's returning early in the test!

hookContent = hookContent.replace(
  "const initializeGigState = useCallback(async () => {",
  "const initializeGigState = useCallback(async () => {\n    // console.log('initializeGigState started', { hasInit: hasInitializedRef.current, isInit: isInitializingRef.current });"
);

hookContent = hookContent.replace(
  "      hasInitializedRef.current = true",
  "      hasInitializedRef.current = true\n      // console.log('hasInitializedRef set to true');"
);

hookContent = hookContent.replace(
  "      if (isAborted()) {\n        return\n      }",
  "      if (isAborted()) {\n        // console.log('isAborted 1');\n        return\n      }"
);

fs.writeFileSync(hookFile, hookContent);
