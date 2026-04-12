const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// Just add try finally!
if (!hookContent.includes("try {")) {
  hookContent = hookContent.replace(
    "const isAborted = () => signal.aborted || abortControllerRef.current !== controller\n\n    const currentHarmony = clampBandHarmony(band?.harmony)",
    "const isAborted = () => signal.aborted || abortControllerRef.current !== controller\n\n    try {\n      const currentHarmony = clampBandHarmony(band?.harmony)"
  );
}

hookContent = hookContent.replace(
  "      hasInitializedRef.current = false\n    }\n  }, [\n    band,\n    gameMap,\n    player.currentNodeId,\n    setlist,\n    gigModifiers,\n    addToast,\n    t,\n    gameStateRef,\n    setIsAudioReady,\n    currentGig?.songId\n  ])",
  `      hasInitializedRef.current = false
    } finally {
      isInitializingRef.current = false
    }
  }, [
    band?.id,
    band?.harmony,
    gameMap?.id,
    player?.currentNodeId,
    setlist?.length,
    currentGig?.songId,
    gigModifiers,
    addToast,
    t,
    gameStateRef,
    setIsAudioReady
  ])`
);

hookContent = hookContent.replace(/isInitializingRef\.current = false\n\s*return/g, "return");
hookContent = hookContent.replace(/isInitializingRef\.current = false\n\s*\}/g, "}");

fs.writeFileSync(hookFile, hookContent);
