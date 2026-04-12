const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// The `catch` block has duplicate `hasInitializedRef.current = false` and missing properly formatted finally.
hookContent = hookContent.replace(
  "      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, [",
  "      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, ["
);
// Wait, I see "isInitializingRef.current = false" inside catch block that I missed before:
hookContent = hookContent.replace(
  "      setIsAudioReady(false)\n      isInitializingRef.current = false\n      hasInitializedRef.current = false",
  "      setIsAudioReady(false)\n      hasInitializedRef.current = false"
);

fs.writeFileSync(hookFile, hookContent);
