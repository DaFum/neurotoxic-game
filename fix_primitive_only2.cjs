const fs = require('fs');

let hookFile = 'src/hooks/rhythmGame/useRhythmGameAudio.js';
let hookContent = fs.readFileSync(hookFile, 'utf8');

// Replace the dependency array!
hookContent = hookContent.replace(
  "      hasInitializedRef.current = false\n    } finally {\n      isInitializingRef.current = false\n    }\n  }, [\n    band,\n    gameMap,\n    player.currentNodeId,\n    setlist,\n    gigModifiers,\n    addToast,\n    t,\n    gameStateRef,\n    setIsAudioReady,\n    currentGig?.songId\n  ])",
  `      hasInitializedRef.current = false
    } finally {
      isInitializingRef.current = false
    }
  }, [
    band?.id,
    band?.harmony,
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

fs.writeFileSync(hookFile, hookContent);

let testFile = 'tests/rhythmGameLogicMultiSong.test.js';
let testContent = fs.readFileSync(testFile, 'utf8');

testContent = testContent.replace(
  /await act\(async \(\) => \{\n\s*await new Promise\(resolve => setTimeout\(resolve, [0-9]+\)\)\n\s*\}\)/g,
  "await act(async () => { await new Promise(r => setTimeout(r, 10)) })"
);
testContent = testContent.replace(
  /await act\(async \(\) => \{\n\s*await new Promise\(r => setTimeout\(r, [0-9]+\)\)\n\s*\}\)/g,
  "await act(async () => { await new Promise(r => setTimeout(r, 10)) })"
);
testContent = testContent.replace(
  /await act\(async \(\) => \{ await new Promise\(r => setTimeout\(r, [0-9]+\)\) \}\)/g,
  "await act(async () => { await new Promise(r => setTimeout(r, 10)) })"
);
testContent = testContent.replace(
  /await act\(async \(\) => \{ await new Promise\(resolve => setTimeout\(resolve, [0-9]+\)\) \}\)/g,
  "await act(async () => { await new Promise(r => setTimeout(r, 10)) })"
);
testContent = testContent.replace(
  /await promise;\n\s*await new Promise\(r => setTimeout\(r, [0-9]+\)\);/g,
  "await promise;\n      await new Promise(r => setTimeout(r, 10));"
);
testContent = testContent.replace(
  /await onSong2Ended\(\);\n\s*await new Promise\(r => setTimeout\(r, [0-9]+\)\);/g,
  "await onSong2Ended();\n      await new Promise(r => setTimeout(r, 10));"
);
testContent = testContent.replace(
  /await act\(async \(\) => \{\n\s*await new Promise\(\(r\) => setImmediate\(r\)\)\n\s*\}\)/g,
  "await act(async () => { await new Promise(r => setTimeout(r, 10)) })"
);
fs.writeFileSync(testFile, testContent);
