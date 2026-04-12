const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// The `catch` block has duplicate `hasInitializedRef.current = false` and missing properly formatted finally.
hookContent = hookContent.replace(
  "      hasInitializedRef.current = false\n      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, [",
  "      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, ["
);

fs.writeFileSync(hookFile, hookContent);
