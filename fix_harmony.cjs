const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// I also need to put `try` to wrap the Harmony Guard.
if (!hookContent.includes("try {\n      // Mute ambient radio to prevent audio overlap\n      audioManager.stopMusic()")) {
  hookContent = hookContent.replace(
    "    const isAborted = () =>\n      signal.aborted || abortControllerRef.current !== controller\n\n    // Mute ambient radio to prevent audio overlap\n    audioManager.stopMusic()\n\n    const currentHarmony = clampBandHarmony(band.harmony)\n\n    // Harmony Guard\n    if (currentHarmony <= 1) {\n      logger.warn('RhythmGame', 'Band harmony too low to start gig.')\n      setIsAudioReady(false)\n      return\n    }\n\n    try {",
    "    const isAborted = () =>\n      signal.aborted || abortControllerRef.current !== controller\n\n    try {\n      // Mute ambient radio to prevent audio overlap\n      audioManager.stopMusic()\n\n      const currentHarmony = clampBandHarmony(band?.harmony)\n\n      // Harmony Guard\n      if (currentHarmony <= 1) {\n        logger.warn('RhythmGame', 'Band harmony too low to start gig.')\n        setIsAudioReady(false)\n        return\n      }\n"
  );
}

fs.writeFileSync(hookFile, hookContent);
