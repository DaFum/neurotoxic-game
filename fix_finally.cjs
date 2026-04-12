const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

hookContent = hookContent.replace(
  "      hasInitializedRef.current = false\n    } finally {\n      }\n  }, [",
  "      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, ["
);

fs.writeFileSync(hookFile, hookContent);
