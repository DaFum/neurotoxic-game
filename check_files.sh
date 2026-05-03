#!/bin/bash

echo "Checking imageGen.ts..."
cat src/utils/imageGen.ts | grep -n -A 5 "export const isImageGenerationAvailable"

echo "Checking useGigVisuals.ts..."
cat src/hooks/useGigVisuals.ts | grep -n -A 5 "isImageGenerationAvailable"

echo "Checking MainMenu.tsx..."
cat src/ui/mainmenu/MainMenu.tsx | grep -n -B 2 -A 2 "isImageGenerationAvailable" || echo "Not found in MainMenu.tsx"
cat src/scenes/mainmenu/MainMenu.tsx | grep -n -B 2 -A 2 "isImageGenerationAvailable" || echo "Not found in src/scenes/mainmenu/MainMenu.tsx"

echo "Checking BandHQ.tsx..."
cat src/ui/bandhq/BandHQ.tsx | grep -n -B 2 -A 2 "isImageGenerationAvailable" || echo "Not found in BandHQ.tsx"

echo "Checking ShopItem.tsx..."
cat src/ui/shop/ShopItem.tsx | grep -n -B 2 -A 2 "isImageGenerationAvailable" || echo "Not found in ShopItem.tsx"

echo "Checking ContrabandStash.tsx..."
cat src/ui/shop/ContrabandStash.tsx | grep -n -B 2 -A 2 "isImageGenerationAvailable" || echo "Not found in ContrabandStash.tsx"

echo "Checking kabelsalatUtils.ts..."
cat src/scenes/kabelsalat/kabelsalatUtils.ts | grep -n -A 5 "import" || echo "Not found in kabelsalatUtils.ts"

echo "Checking useMainMenu.ts..."
cat src/scenes/mainmenu/useMainMenu.ts | grep -n -A 15 "handleStartTour" || echo "Not found in useMainMenu.ts"

echo "Checking audioProceduralPlayNote.test.js..."
cat tests/node/audioProceduralPlayNote.test.js | grep -n -A 15 "beforeEach" || echo "Not found in audioProceduralPlayNote.test.js"

echo "Checking eventEngine.test.js..."
cat tests/node/eventEngine.test.js | grep -n -A 10 "applyResult" || echo "Not found in eventEngine.test.js"

echo "Checking minigameReducer.test.js..."
cat tests/node/minigameReducer.test.js | grep -n -A 10 "handleCompleteKabelsalatMinigame" || echo "Not found in minigameReducer.test.js"

echo "Checking PixiStageController.test.js..."
cat tests/node/PixiStageController.test.js | grep -n -B 5 -A 10 "slowLoad" || echo "Not found in PixiStageController.test.js"

echo "Checking rhythmGameLogicMultiSong.test.js..."
cat tests/node/rhythmGameLogicMultiSong.test.js | grep -n -A 5 "mock.module" | head -n 20 || echo "Not found in rhythmGameLogicMultiSong.test.js"

echo "Checking imageGen.test.js..."
cat tests/node/imageGen.test.js | grep -n -A 10 "fetchGenImageAsObjectUrl returns offline fallback" || echo "Not found in imageGen.test.js"

echo "Checking rhythmGameScoringGameOver.test.js..."
cat tests/node/rhythmGameScoringGameOver.test.js | grep -n -A 5 "renderHook" || echo "Not found in rhythmGameScoringGameOver.test.js"

echo "Checking useGigInput.test.js..."
cat tests/node/useGigInput.test.js | grep -n -A 10 "mock.module" | head -n 20 || echo "Not found in useGigInput.test.js"
